from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from django.urls import reverse

from .llm_service import RegexModification
from .models import UploadedFile


class UploadedFileModelTest(TestCase):
    def test_create_uploaded_file(self):
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

    def test_upload_csv_file(self):
        csv_content = "name,age,city\nJohn,25,NYC\nJane,30,LA"
        csv_file = SimpleUploadedFile(
            "test.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )
        data = {"file": csv_file, "file_type": "csv"}
        response = self.client.post(self.upload_url, data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(UploadedFile.objects.count(), 1)
        uploaded_file = UploadedFile.objects.first()
        self.assertEqual(uploaded_file.name, "test.csv")
        self.assertEqual(uploaded_file.file_type, "csv")

    def test_upload_missing_file_type(self):
        csv_file = SimpleUploadedFile(
            "test.csv", b"test,data\n1,2", content_type="text/csv"
        )
        data = {"file": csv_file}
        response = self.client.post(self.upload_url, data)
        self.assertEqual(response.status_code, 400)


class FilePreviewAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        csv_content = (
            "name,age,city,email\nJohn,25,NYC,john@test.com\nJane,30,LA,jane@test.com"
        )
        csv_file = SimpleUploadedFile(
            "preview_test.csv", csv_content.encode("utf-8"), content_type="text/csv"
        )
        self.uploaded_file = UploadedFile.objects.create(
            name="preview_test.csv", file=csv_file, file_type="csv", file_size=1024
        )

    def test_file_preview_default_rows(self):
        preview_url = reverse(
            "data_processing:file-preview", args=[self.uploaded_file.pk]
        )
        response = self.client.get(preview_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("file_info", data)
        self.assertIn("preview_rows", data)
        self.assertIn("data", data)
        self.assertEqual(data["preview_rows"], 2)
        self.assertEqual(len(data["data"]), 2)


class RegexModificationTests(TestCase):
    def test_regex_modification_creation(self):
        modification = RegexModification(
            column_name="test_column",
            regex_pattern="[A-Z]",
            replacement="X",
            description="Test modification",
            confidence=0.85,
        )
        self.assertEqual(modification.column_name, "test_column")
        self.assertEqual(modification.regex_pattern, "[A-Z]")
        self.assertEqual(modification.replacement, "X")
        self.assertEqual(modification.description, "Test modification")
        self.assertEqual(modification.confidence, 0.85)


class LLMViewIntegrationTests(TestCase):
    def setUp(self):
        self.client = Client()
        csv_content = (
            b"name,email,age\nJohn Doe,JOHN@EXAMPLE.COM,25\njane smith,jane@test.org,30"
        )
        self.test_file = SimpleUploadedFile(
            "test.csv", csv_content, content_type="text/csv"
        )
        upload_url = reverse("data_processing:file-upload")
        response = self.client.post(
            upload_url, {"file": self.test_file, "file_type": "csv"}
        )
        self.uploaded_file_id = response.json()["id"]

    def test_column_modification_view(self):
        modify_url = reverse(
            "data_processing:column-modify", args=[self.uploaded_file_id]
        )
        response = self.client.post(
            modify_url,
            data={"instruction": "convert all email addresses to lowercase"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("modification", data)
        self.assertIn("preview", data)
        modification = data["modification"]
        self.assertEqual(modification["column_name"], "email")
        self.assertIn("lowercase", modification["description"])
