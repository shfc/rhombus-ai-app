import os

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


def upload_to_folder(instance, filename):
    date_path = timezone.now().strftime("%Y/%m/%d")
    return f"uploads/{date_path}/{filename}"


class UploadedFile(models.Model):
    FILE_TYPE_CHOICES = [
        ("csv", "CSV"),
        ("excel", "Excel"),
    ]

    name = models.CharField(max_length=255)
    file = models.FileField(upload_to=upload_to_folder, max_length=500)
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    headers = models.JSONField(null=True, blank=True)
    row_count = models.PositiveIntegerField(
        null=True, blank=True, help_text="Number of data rows (excluding header)"
    )
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


class LLMInstructionLog(models.Model):
    file = models.ForeignKey(
        UploadedFile,
        on_delete=models.CASCADE,
        related_name="instruction_logs",
    )
    user_instruction = models.TextField()
    llm_response = models.TextField()
    parse_error = models.TextField(null=True, blank=True)
    column_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Target column name for modification",
    )
    regex_pattern = models.TextField(null=True, blank=True)
    replacement = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    confidence = models.FloatField(null=True, blank=True)
    processing_time_ms = models.PositiveIntegerField(
        null=True, blank=True, help_text="Processing time in milliseconds"
    )
    success = models.BooleanField(
        default=False, help_text="Whether processing was successful"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        status = "✓" if self.success else "✗"
        return f"{status} {self.file.name}: {self.user_instruction[:50]}..."
