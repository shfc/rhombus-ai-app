from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.urls import reverse

from .models import UploadedFile


class UploadedFileModelTest(TestCase):
    def test_create_uploaded_file(self):
        """Test creating an UploadedFile instance"""
        uploaded_file = UploadedFile.objects.create(
            name="test.csv", file_type="csv", file_size=1024
        )
        self.assertEqual(uploaded_file.name, "test.csv")
        self.assertEqual(uploaded_file.file_type, "csv")
        self.assertEqual(str(uploaded_file), "test.csv (csv)")


class FileUploadAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        self.upload_url = reverse("data_processing:file-upload")
        self.list_url = reverse("data_processing:file-list")

    def test_upload_csv_file(self):
        """Test uploading a valid CSV file"""
        # Create a test CSV content
        csv_content = "name,age,city\nJohn,25,NYC\nJane,30,LA"
        csv_file = SimpleUploadedFile(
            "test.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )

        data = {"file": csv_file, "file_type": "csv"}
        response = self.client.post(self.upload_url, data)

        self.assertEqual(response.status_code, 201)

        # Check if file was created in database
        self.assertEqual(UploadedFile.objects.count(), 1)

        uploaded_file = UploadedFile.objects.first()
        self.assertIsNotNone(uploaded_file)
        self.assertEqual(uploaded_file.name, "test.csv")
        self.assertEqual(uploaded_file.file_type, "csv")

        # Check if headers were parsed
        self.assertIsNotNone(uploaded_file.headers)
        self.assertEqual(uploaded_file.headers, ["name", "age", "city"])
        self.assertEqual(uploaded_file.row_count, 2)

    def test_upload_missing_file_type(self):
        """Test uploading without file_type"""
        csv_file = SimpleUploadedFile(
            "test.csv", b"test,data\n1,2", content_type="text/csv"
        )

        data = {"file": csv_file}  # Missing file_type
        response = self.client.post(self.upload_url, data)

        self.assertEqual(response.status_code, 400)

    def test_upload_invalid_file_type(self):
        """Test uploading with invalid file_type"""
        csv_file = SimpleUploadedFile(
            "test.csv", b"test,data\n1,2", content_type="text/csv"
        )

        data = {"file": csv_file, "file_type": "invalid"}
        response = self.client.post(self.upload_url, data)

        self.assertEqual(response.status_code, 400)

    def test_list_files(self):
        """Test listing uploaded files"""
        # Create test files with actual file objects
        csv_file1 = SimpleUploadedFile(
            "test1.csv", b"test,data\n1,2", content_type="text/csv"
        )
        csv_file2 = SimpleUploadedFile(
            "test2.csv", b"test,data\n3,4", content_type="text/csv"
        )

        UploadedFile.objects.create(
            name="test1.csv", file=csv_file1, file_type="csv", file_size=1024
        )
        UploadedFile.objects.create(
            name="test2.csv", file=csv_file2, file_type="csv", file_size=2048
        )

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)

    def test_file_detail(self):
        """Test retrieving file details"""
        csv_file = SimpleUploadedFile(
            "detail_test.csv", b"test,data\n1,2", content_type="text/csv"
        )
        uploaded_file = UploadedFile.objects.create(
            name="detail_test.csv", file=csv_file, file_type="csv", file_size=1024
        )

        detail_url = reverse("data_processing:file-detail", args=[uploaded_file.pk])
        response = self.client.get(detail_url)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "detail_test.csv")

    def test_delete_file(self):
        """Test deleting a file"""
        csv_file = SimpleUploadedFile(
            "delete_test.csv", b"test,data\n1,2", content_type="text/csv"
        )
        uploaded_file = UploadedFile.objects.create(
            name="delete_test.csv", file=csv_file, file_type="csv", file_size=1024
        )

        detail_url = reverse("data_processing:file-detail", args=[uploaded_file.pk])
        response = self.client.delete(detail_url)

        self.assertEqual(response.status_code, 204)
        self.assertEqual(UploadedFile.objects.count(), 0)


class FilePreviewAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        # Create a test file with more data for preview testing
        csv_content = "name,age,city,email\nJohn,25,NYC,john@test.com\nJane,30,LA,jane@test.com\nBob,35,Chicago,bob@test.com\nAlice,28,Houston,alice@test.com\nCharlie,32,Phoenix,charlie@test.com"
        csv_file = SimpleUploadedFile(
            "preview_test.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )
        self.uploaded_file = UploadedFile.objects.create(
            name="preview_test.csv", file=csv_file, file_type="csv", file_size=1024
        )

    def test_file_preview_default_rows(self):
        """Test file preview with default number of rows"""
        preview_url = reverse(
            "data_processing:file-preview", args=[self.uploaded_file.pk]
        )
        response = self.client.get(preview_url)

        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Check response structure
        self.assertIn("file_info", data)
        self.assertIn("preview_rows", data)
        self.assertIn("data", data)

        # Check file info
        self.assertEqual(data["file_info"]["name"], "preview_test.csv")

        # Check preview data
        self.assertEqual(data["preview_rows"], 5)  # All 5 rows should be returned
        self.assertEqual(len(data["data"]), 5)

        # Check first row structure
        first_row = data["data"][0]
        self.assertIn("name", first_row)
        self.assertIn("age", first_row)
        self.assertIn("city", first_row)
        self.assertIn("email", first_row)

    def test_file_preview_custom_rows(self):
        """Test file preview with custom number of rows"""
        preview_url = reverse(
            "data_processing:file-preview", args=[self.uploaded_file.pk]
        )
        response = self.client.get(f"{preview_url}?rows=3")

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["preview_rows"], 3)
        self.assertEqual(len(data["data"]), 3)

    def test_file_preview_invalid_rows(self):
        """Test file preview with invalid rows parameter"""
        preview_url = reverse(
            "data_processing:file-preview", args=[self.uploaded_file.pk]
        )
        response = self.client.get(f"{preview_url}?rows=invalid")

        self.assertEqual(response.status_code, 400)

    def test_file_preview_not_found(self):
        """Test file preview for non-existent file"""
        preview_url = reverse("data_processing:file-preview", args=[999])
        response = self.client.get(preview_url)

        self.assertEqual(response.status_code, 404)
