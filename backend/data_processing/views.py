import os

import pandas as pd
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from .models import UploadedFile


def parse_file_headers(file_obj, file_type):
    """Parse file headers and count rows"""
    file_path = file_obj.file.path
    
    try:
        if file_type == "csv":
            # Read CSV to get headers and row count
            df = pd.read_csv(file_path)
            headers = df.columns.tolist()
            row_count = len(df)
        elif file_type == "excel":
            # Read Excel to get headers and row count
            df = pd.read_excel(file_path)
            headers = df.columns.tolist()
            row_count = len(df)
        else:
            return None, None
            
        return headers, row_count
    except Exception:
        # If parsing fails, return None
        return None, None


def get_file_preview(file_obj, file_type, rows=10):
    """Get preview of file data (first N rows)"""
    file_path = file_obj.file.path
    
    try:
        if file_type == "csv":
            df = pd.read_csv(file_path, nrows=rows)
        elif file_type == "excel":
            df = pd.read_excel(file_path, nrows=rows)
        else:
            return None
            
        # Convert DataFrame to list of dictionaries
        return df.to_dict('records')
    except Exception:
        return None


def file_to_dict(file_obj, request):
    """Convert UploadedFile model to dictionary"""
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
    """Simple file upload view"""

    def post(self, request):
        if "file" not in request.FILES:
            return JsonResponse({"error": "No file provided"}, status=400)

        file = request.FILES["file"]
        file_type = request.POST.get("file_type", "")

        if not file_type:
            return JsonResponse({"error": "file_type is required"}, status=400)

        if file_type not in ["csv", "excel"]:
            return JsonResponse({"error": "file_type must be csv or excel"}, status=400)

        # Create the uploaded file
        uploaded_file = UploadedFile.objects.create(
            name=file.name,
            file=file,
            file_type=file_type,
            file_size=file.size,
            uploaded_by=request.user if request.user.is_authenticated else None,
        )

        # Parse headers and row count after file is saved
        headers, row_count = parse_file_headers(uploaded_file, file_type)
        if headers is not None:
            uploaded_file.headers = headers
            uploaded_file.row_count = row_count
            uploaded_file.save()

        return JsonResponse(file_to_dict(uploaded_file, request), status=201)


class FileListView(View):
    """Simple file list view"""

    def get(self, request):
        files = UploadedFile.objects.all()

        # Filter by file type if provided
        file_type = request.GET.get("file_type")
        if file_type:
            files = files.filter(file_type=file_type)

        files_list = [file_to_dict(f, request) for f in files]
        return JsonResponse(files_list, safe=False)


class FileDetailView(View):
    """Simple file detail view"""

    def get(self, request, pk):
        try:
            file_obj = UploadedFile.objects.get(pk=pk)
            return JsonResponse(file_to_dict(file_obj, request))
        except UploadedFile.DoesNotExist:
            return JsonResponse({"error": "File not found"}, status=404)

    def delete(self, request, pk):
        try:
            file_obj = UploadedFile.objects.get(pk=pk)
            # Delete the actual file
            if file_obj.file and os.path.isfile(file_obj.file.path):
                os.remove(file_obj.file.path)
            file_obj.delete()
            return JsonResponse({}, status=204)
        except UploadedFile.DoesNotExist:
            return JsonResponse({"error": "File not found"}, status=404)


class FilePreviewView(View):
    """File preview view - shows first N rows of data"""

    def get(self, request, pk):
        try:
            file_obj = UploadedFile.objects.get(pk=pk)
            
            # Get number of rows to preview (default: 10, max: 100)
            rows = int(request.GET.get("rows", 10))
            rows = min(max(1, rows), 100)  # Ensure rows is between 1 and 100
            
            # Get preview data
            preview_data = get_file_preview(file_obj, file_obj.file_type, rows)
            
            if preview_data is None:
                return JsonResponse({"error": "Could not preview file"}, status=400)
            
            return JsonResponse({
                "file_info": file_to_dict(file_obj, request),
                "preview_rows": len(preview_data),
                "data": preview_data
            })
            
        except UploadedFile.DoesNotExist:
            return JsonResponse({"error": "File not found"}, status=404)
        except ValueError:
            return JsonResponse({"error": "Invalid rows parameter"}, status=400)
