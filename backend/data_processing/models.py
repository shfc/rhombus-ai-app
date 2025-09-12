import os

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


def upload_to_folder(instance, filename):
    """Generate file path for uploaded files"""
    # Create a path like: uploads/2025/09/12/filename
    date_path = timezone.now().strftime("%Y/%m/%d")
    return f"uploads/{date_path}/{filename}"


class UploadedFile(models.Model):
    FILE_TYPE_CHOICES = [
        ("csv", "CSV"),
        ("excel", "Excel"),
    ]

    # File information
    name = models.CharField(max_length=255, help_text="Original filename")
    file = models.FileField(upload_to=upload_to_folder, max_length=500)
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")

    # File content information
    headers = models.JSONField(
        null=True, blank=True, help_text="Column headers from the file"
    )
    row_count = models.PositiveIntegerField(
        null=True, blank=True, help_text="Total number of data rows (excluding header)"
    )

    # Metadata
    uploaded_by = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.name} ({self.file_type})"

    def delete(self, *args, **kwargs):
        """Delete the file from filesystem when model instance is deleted"""
        if self.file and os.path.isfile(self.file.path):
            os.remove(self.file.path)
        return super().delete(*args, **kwargs)
