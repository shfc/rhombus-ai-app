import io
import os
from typing import Any, Dict

import pandas as pd
from django.core.files.uploadedfile import UploadedFile


class FileProcessor:
    """Utility class for processing uploaded CSV/Excel files"""

    @staticmethod
    def get_file_info(file_path: str, file_type: str) -> Dict[str, Any]:
        """
        Extract basic information from uploaded file
        """
        try:
            if file_type == "csv":
                df = pd.read_csv(file_path)
            else:  # Excel
                df = pd.read_excel(file_path)

            info = {
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": df.columns.tolist(),
                "memory_usage": df.memory_usage(deep=True).sum(),
                "has_null_values": df.isnull().any().any(),
                "dtypes": df.dtypes.astype(str).to_dict(),
            }

            # Sample data (first 5 rows)
            info["sample_data"] = df.head().to_dict("records")

            return info

        except Exception as e:
            raise Exception(f"Error processing file: {str(e)}")

    @staticmethod
    def validate_file_format(uploaded_file: UploadedFile) -> bool:
        """
        Validate if the uploaded file is a valid CSV or Excel file
        """
        try:
            file_extension = uploaded_file.name.lower().split(".")[-1]

            if file_extension == "csv":
                # Try to read first few lines
                uploaded_file.seek(0)
                content = uploaded_file.read(1024)
                uploaded_file.seek(0)
                # Create a StringIO object from the content
                content_str = (
                    content.decode("utf-8") if isinstance(content, bytes) else content
                )
                pd.read_csv(io.StringIO(content_str), nrows=5)
            elif file_extension in ["xlsx", "xls"]:
                uploaded_file.seek(0)
                pd.read_excel(uploaded_file, nrows=5)
            else:
                return False

            uploaded_file.seek(0)  # Reset file pointer
            return True

        except Exception:
            return False

    @staticmethod
    def get_file_stats(file_path: str, file_type: str) -> Dict[str, Any]:
        """
        Get detailed statistics about the file
        """
        try:
            if file_type == "csv":
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)

            stats = {
                "total_rows": len(df),
                "total_columns": len(df.columns),
                "null_counts": df.isnull().sum().to_dict(),
                "data_types": df.dtypes.astype(str).to_dict(),
                "file_size_mb": round(os.path.getsize(file_path) / (1024 * 1024), 2),
            }

            # Numeric columns statistics
            numeric_cols = df.select_dtypes(include=["number"]).columns
            if len(numeric_cols) > 0:
                stats["numeric_stats"] = df[numeric_cols].describe().to_dict()

            return stats

        except Exception as e:
            raise Exception(f"Error getting file stats: {str(e)}")
