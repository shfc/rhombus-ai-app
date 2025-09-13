import json
import os

import pandas as pd
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from .llm_service import LLMDataProcessor
from .models import UploadedFile


def parse_file_headers(file_obj, file_type):
    """Parse file to get headers and row count"""
    file_path = file_obj.file.path
    try:
        if file_type == "csv":
            df = pd.read_csv(file_path)
            headers = df.columns.tolist()
            row_count = len(df)
        elif file_type == "excel":
            if file_path.endswith(".xlsx"):
                df = pd.read_excel(file_path, engine="openpyxl")
            else:
                df = pd.read_excel(file_path, engine="xlrd")
            headers = df.columns.tolist()
            row_count = len(df)
        else:
            return None, None
        return headers, row_count
    except Exception:
        return None, None


def get_file_preview(file_obj, file_type, rows=10):
    """Get preview of file data"""
    file_path = file_obj.file.path
    try:
        if file_type == "csv":
            df = pd.read_csv(file_path, nrows=rows)
        elif file_type == "excel":
            if file_path.endswith(".xlsx"):
                df = pd.read_excel(file_path, nrows=rows, engine="openpyxl")
            else:
                df = pd.read_excel(file_path, nrows=rows, engine="xlrd")
        else:
            return None
        df = df.fillna("")
        return df.to_dict("records")
    except Exception:
        return None


def file_to_dict(file_obj, request):
    """Convert UploadedFile to dict for JSON response"""
    return {
        "id": file_obj.id,
        "name": file_obj.name,
        "file_type": file_obj.file_type,
        "file_size": file_obj.file_size,
        "headers": file_obj.headers,
        "row_count": file_obj.row_count,
        "uploaded_by": file_obj.uploaded_by.username if file_obj.uploaded_by else None,
        "uploaded_at": file_obj.uploaded_at.isoformat(),
        "file_url": request.build_absolute_uri(file_obj.file.url),
    }


@method_decorator(csrf_exempt, name="dispatch")
class FileUploadView(View):
    """Handle file upload"""

    def post(self, request):
        if "file" not in request.FILES:
            return JsonResponse({"error": "No file provided"}, status=400)
        file = request.FILES["file"]
        file_type = request.POST.get("file_type", "")
        if not file_type:
            return JsonResponse({"error": "file_type is required"}, status=400)
        if file_type not in ["csv", "excel"]:
            return JsonResponse({"error": "file_type must be csv or excel"}, status=400)
        # Create file record
        uploaded_file = UploadedFile.objects.create(
            name=file.name,
            file=file,
            file_type=file_type,
            file_size=file.size,
            uploaded_by=request.user if request.user.is_authenticated else None,
        )
        # Parse headers and row count
        headers, row_count = parse_file_headers(uploaded_file, file_type)
        if headers is not None:
            uploaded_file.headers = headers
            uploaded_file.row_count = row_count
            uploaded_file.save()
        return JsonResponse(file_to_dict(uploaded_file, request), status=201)


class FileListView(View):
    """List uploaded files"""

    def get(self, request):
        files = UploadedFile.objects.all()
        file_type = request.GET.get("file_type")
        if file_type:
            files = files.filter(file_type=file_type)
        files_list = [file_to_dict(f, request) for f in files]
        return JsonResponse(files_list, safe=False)


class FileDetailView(View):
    """Get or delete file details"""

    def get(self, request, pk):
        try:
            file_obj = UploadedFile.objects.get(pk=pk)
            return JsonResponse(file_to_dict(file_obj, request))
        except UploadedFile.DoesNotExist:
            return JsonResponse({"error": "File not found"}, status=404)

    def delete(self, request, pk):
        try:
            file_obj = UploadedFile.objects.get(pk=pk)
            if file_obj.file and os.path.isfile(file_obj.file.path):
                os.remove(file_obj.file.path)
            file_obj.delete()
            return JsonResponse({}, status=204)
        except UploadedFile.DoesNotExist:
            return JsonResponse({"error": "File not found"}, status=404)


class FilePreviewView(View):
    """Preview file data"""

    def get(self, request, pk):
        try:
            file_obj = UploadedFile.objects.get(pk=pk)
            rows = int(request.GET.get("rows", 10))
            rows = min(max(1, rows), 100)
            preview_data = get_file_preview(file_obj, file_obj.file_type, rows)
            if preview_data is None:
                return JsonResponse({"error": "Could not preview file"}, status=400)
            return JsonResponse(
                {
                    "file_info": file_to_dict(file_obj, request),
                    "preview_rows": len(preview_data),
                    "data": preview_data,
                    "columns": file_obj.headers,
                }
            )
        except UploadedFile.DoesNotExist:
            return JsonResponse({"error": "File not found"}, status=404)
        except ValueError:
            return JsonResponse({"error": "Invalid rows parameter"}, status=400)


@method_decorator(csrf_exempt, name="dispatch")
class ColumnModificationView(View):
    """Process LLM instruction for data modification"""

    def post(self, request, pk):
        file_obj = UploadedFile.objects.get(pk=pk)
        try:
            data = json.loads(request.body)
            instruction = data.get("instruction", "").strip()
        except json.JSONDecodeError:
            instruction = request.POST.get("instruction", "").strip()
        if not instruction:
            return JsonResponse({"error": "Instruction is required"}, status=400)
        # Load file data
        file_path = file_obj.file.path
        if file_obj.file_type == "csv":
            df = pd.read_csv(file_path)
        elif file_obj.file_type == "excel":
            if file_path.endswith(".xlsx"):
                df = pd.read_excel(file_path, engine="openpyxl")
            else:
                df = pd.read_excel(file_path, engine="xlrd")
        else:
            return JsonResponse({"error": "Unsupported file type"}, status=400)
        # Process with LLM
        llm_processor = LLMDataProcessor()
        try:
            modification = llm_processor.process_instruction(
                instruction, df, file_id=file_obj.pk
            )
        except Exception as e:
            return JsonResponse(
                {
                    "error": "Failed to process instruction. Please try again.",
                    "details": str(e),
                },
                status=500,
            )
        # Generate preview
        preview_df, preview_stats = llm_processor.preview_modification(
            modification, df, preview_rows=10
        )
        preview_df = preview_df.fillna("")
        preview_data = preview_df.to_dict("records")
        return JsonResponse(
            {
                "modification": {
                    "column_name": modification.column_name,
                    "regex_pattern": modification.regex_pattern,
                    "replacement": modification.replacement,
                    "description": modification.description,
                    "confidence": modification.confidence,
                },
                "preview": {
                    "data": preview_data,
                    "stats": preview_stats,
                    "columns": list(preview_df.columns),
                },
                "file_info": file_to_dict(file_obj, request),
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class ApplyModificationView(View):
    """Apply modification to entire file"""

    def post(self, request, pk):
        file_obj = UploadedFile.objects.get(pk=pk)
        data = json.loads(request.body)
        modification_data = data.get("modification", {})
        required_fields = [
            "column_name",
            "regex_pattern",
            "replacement",
            "description",
        ]
        if not all(field in modification_data for field in required_fields):
            return JsonResponse({"error": "Missing modification data"}, status=400)
        # Load file data
        file_path = file_obj.file.path
        if file_obj.file_type == "csv":
            df = pd.read_csv(file_path)
        elif file_obj.file_type == "excel":
            if file_path.endswith(".xlsx"):
                df = pd.read_excel(file_path, engine="openpyxl")
            else:
                df = pd.read_excel(file_path, engine="xlrd")
        else:
            return JsonResponse({"error": "Unsupported file type"}, status=400)
        # Create modification object
        from .llm_service import RegexModification

        modification = RegexModification(
            column_name=modification_data["column_name"],
            regex_pattern=modification_data["regex_pattern"],
            replacement=modification_data["replacement"],
            description=modification_data["description"],
            confidence=modification_data.get("confidence", 1.0),
        )
        # Apply modification
        llm_processor = LLMDataProcessor()
        modified_df, stats = llm_processor.apply_modification_to_file(modification, df)
        # Save processed file
        import tempfile

        from django.core.files.base import ContentFile
        from django.utils import timezone

        base_name = os.path.splitext(file_obj.name)[0]
        extension = ".csv" if file_obj.file_type == "csv" else ".xlsx"
        processed_filename = f"{base_name}_processed_{timezone.now().strftime('%Y%m%d_%H%M%S')}{extension}"
        with tempfile.NamedTemporaryFile(
            mode="w+b", delete=False, suffix=extension
        ) as temp_file:
            if file_obj.file_type == "csv":
                modified_df.to_csv(temp_file.name, index=False)
            else:
                modified_df.to_excel(temp_file.name, index=False)
            temp_file.seek(0)
            with open(temp_file.name, "rb") as f:
                file_content = f.read()
            processed_file = UploadedFile.objects.create(
                name=processed_filename,
                file=ContentFile(file_content, name=processed_filename),
                file_type=file_obj.file_type,
                file_size=len(file_content),
                headers=list(modified_df.columns),
                row_count=len(modified_df),
                uploaded_by=file_obj.uploaded_by,
            )
            os.unlink(temp_file.name)
        return JsonResponse(
            {
                "success": True,
                "processed_file": file_to_dict(processed_file, request),
                "stats": stats,
                "modification": {
                    "column_name": modification.column_name,
                    "regex_pattern": modification.regex_pattern,
                    "replacement": modification.replacement,
                    "description": modification.description,
                },
            }
        )
