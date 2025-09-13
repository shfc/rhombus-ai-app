from django.urls import path

from .views import (
    ApplyModificationView,
    ColumnModificationView,
    FileDetailView,
    FileListView,
    FilePreviewView,
    FileUploadView,
)

app_name = "data_processing"

urlpatterns = [
    path("upload/", FileUploadView.as_view(), name="file-upload"),
    path("files/", FileListView.as_view(), name="file-list"),
    path("files/<int:pk>/", FileDetailView.as_view(), name="file-detail"),
    path("files/<int:pk>/preview/", FilePreviewView.as_view(), name="file-preview"),
    path(
        "files/<int:pk>/modify/", ColumnModificationView.as_view(), name="column-modify"
    ),
    path(
        "files/<int:pk>/apply/",
        ApplyModificationView.as_view(),
        name="apply-modification",
    ),
]
