from django.contrib import admin

from .models import LLMInstructionLog, UploadedFile


@admin.register(UploadedFile)
class UploadedFileAdmin(admin.ModelAdmin):
    list_display = ["name", "file_type", "file_size", "uploaded_at"]


@admin.register(LLMInstructionLog)
class LLMInstructionLogAdmin(admin.ModelAdmin):
    list_display = ["id", "file", "success", "user_instruction", "created_at"]
    search_fields = ["user_instruction"]
