from django.urls import path

from .views import FileDetailView, FileListView, FilePreviewView, FileUploadView

app_name = "data_processing"

urlpatterns = [
    path("upload/", FileUploadView.as_view(), name="file-upload"),
    path("files/", FileListView.as_view(), name="file-list"),
    path("files/<int:pk>/", FileDetailView.as_view(), name="file-detail"),
    path("files/<int:pk>/preview/", FilePreviewView.as_view(), name="file-preview"),
]
