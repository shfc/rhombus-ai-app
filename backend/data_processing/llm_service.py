import os
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

import pandas as pd
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

# Import Django models
from .models import LLMInstructionLog, UploadedFile


class RegexModificationOutput(BaseModel):
    column_name: str = Field(description="Target column name for modification")
    regex_pattern: str = Field(description="Python regex pattern to match data")
    replacement: str = Field(description="Replacement value")
    description: str = Field(
        description="Clear description of what this modification does"
    )
    confidence: float = Field(
        ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0"
    )


@dataclass
class RegexModification:
    column_name: str
    regex_pattern: str
    replacement: str
    description: str
    confidence: float


class LLMDataProcessor:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY required")

        base_llm = ChatGoogleGenerativeAI(
            google_api_key=self.api_key,
            model="gemini-2.5-flash",
            temperature=0.1,  # Low temperature for more consistent outputs
        )
        self.llm = base_llm.with_structured_output(RegexModificationOutput)

        self.prompt_template = PromptTemplate(
            input_variables=["instruction", "columns", "sample_data"],
            template="""
You are a data processing expert. Convert the following natural language instruction into a precise regex pattern for data modification.

Available columns: {columns}
Sample data (first few rows):
{sample_data}

User instruction: "{instruction}"

Analyze the instruction and provide:
1. The target column name (must exist in available columns)
2. A precise Python regex pattern to match the data to be modified
3. The replacement value or pattern
4. A clear description of what the modification does
5. Your confidence level (0.0 to 1.0) in this solution

Guidelines:
- Use valid Python regex syntax (single backslashes)
- Be specific with the column name
- Make the regex pattern precise to avoid unintended matches
- Consider edge cases and data variations
- Ensure the pattern will work with Python's re.sub() function

Examples of good regex patterns:
- Email matching: \\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{{2,7}}\\b
- Phone formatting: ^\\+1-(.*)$ (to match numbers starting with +1-)
- Date format conversion: (\\d{{2}})/(\\d{{2}})/(\\d{{4}}) (MM/DD/YYYY pattern)
            """,
        )

    def process_instruction(
        self,
        instruction: str,
        df: pd.DataFrame,
        file_id: Optional[int] = None,
        preview_rows: int = 5,
    ) -> RegexModification:
        start_time = time.time()

        if file_id:
            try:
                file_obj = UploadedFile.objects.get(id=file_id)
            except UploadedFile.DoesNotExist:
                file_obj = None
        else:
            file_obj = None

        columns = list(df.columns)
        sample_data = df.head(preview_rows).to_string(index=False)

        prompt = self.prompt_template.format(
            instruction=instruction, columns=columns, sample_data=sample_data
        )

        processing_time_ms = int((time.time() - start_time) * 1000)

        try:
            structured_response = self.llm.invoke(prompt)
            modification = RegexModification(
                column_name=structured_response.column_name,
                regex_pattern=structured_response.regex_pattern,
                replacement=structured_response.replacement,
                description=structured_response.description,
                confidence=structured_response.confidence,
            )

            if modification.column_name not in columns:
                raise ValueError(f"Column '{modification.column_name}' not found")

            if file_obj:
                LLMInstructionLog.objects.create(
                    file=file_obj,
                    user_instruction=instruction,
                    llm_response=structured_response.model_dump_json(),
                    column_name=modification.column_name,
                    regex_pattern=modification.regex_pattern,
                    replacement=modification.replacement,
                    description=modification.description,
                    confidence=modification.confidence,
                    processing_time_ms=processing_time_ms,
                    success=True,
                )

            return modification

        except Exception as e:
            if file_obj:
                LLMInstructionLog.objects.create(
                    file=file_obj,
                    user_instruction=instruction,
                    llm_response=str(e),
                    parse_error=str(e),
                    processing_time_ms=processing_time_ms,
                    success=False,
                )
            raise ValueError(f"Processing failed: {str(e)}")

    def preview_modification(
        self, modification: RegexModification, df: pd.DataFrame, preview_rows: int = 10
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        preview_df = df.head(preview_rows).copy()
        original_values = preview_df[modification.column_name].copy()

        if modification.regex_pattern:
            preview_df[modification.column_name] = (
                preview_df[modification.column_name]
                .astype(str)
                .str.replace(
                    modification.regex_pattern,
                    modification.replacement,
                    regex=True,
                )
            )
            modified_count = sum(
                original_values.astype(str)
                != preview_df[modification.column_name].astype(str)
            )
        else:
            modified_count = 0

        preview_df = preview_df.fillna("")
        stats = {
            "total_rows": len(preview_df),
            "modified_rows": modified_count,
            "modification_rate": modified_count / len(preview_df)
            if len(preview_df) > 0
            else 0,
            "pattern": modification.regex_pattern,
            "replacement": modification.replacement,
            "success": True,
        }

        return preview_df, stats

    def apply_modification_to_file(
        self, modification: RegexModification, df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        modified_df = df.copy()
        original_values = modified_df[modification.column_name].copy()

        if modification.regex_pattern:
            modified_df[modification.column_name] = (
                modified_df[modification.column_name]
                .astype(str)
                .str.replace(
                    modification.regex_pattern,
                    modification.replacement,
                    regex=True,
                )
            )
            modified_count = sum(
                original_values.astype(str)
                != modified_df[modification.column_name].astype(str)
            )
        else:
            modified_count = 0

        modified_df = modified_df.fillna("")
        stats = {
            "total_rows": len(modified_df),
            "modified_rows": modified_count,
            "modification_rate": modified_count / len(modified_df)
            if len(modified_df) > 0
            else 0,
            "pattern": modification.regex_pattern,
            "replacement": modification.replacement,
            "success": True,
        }

        return modified_df, stats
