from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pandas as pd
import os
import uuid
import shutil
from fpdf import FPDF

# ======================================================
# 1. CẤU HÌNH SERVER
# ======================================================
app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tạo thư mục tạm
TEMP_DIR = "temp_exports"
UPLOAD_DIR = "uploaded_files"
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Font chữ (Fallback nếu không có)
FONT_PATH = "Arial.ttf"

# ======================================================
# 2. DATA MODELS & AUTH
# ======================================================
class QuestionItem(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    time_limit: int = 30

@app.get("/v1/auth/me")
async def fake_auth_me():
    return {
        "id": "user_123",
        "email": "demo@neu.edu.vn",
        "name": "Cường Admin",
        "role": "admin"
    }

# ======================================================
# 3. CLASS XỬ LÝ LOGIC XUẤT FILE
# ======================================================
class QuizExporter:
    def __init__(self, data_list: List[QuestionItem], request_id):
        self.data = data_list
        self.request_id = request_id

    def export_quizizz(self):
        filename = f"Quizizz_{self.request_id}.xlsx"
        filepath = os.path.join(TEMP_DIR, filename)
        
        rows = []
        for q in self.data:
            # Quizizz cần 5 options
            opts = q.options + [""] * (5 - len(q.options))
            row = {
                "Question Text": q.question,
                "Question Type": "Multiple Choice",
                "Option 1": opts[0], "Option 2": opts[1], "Option 3": opts[2], 
                "Option 4": opts[3], "Option 5": opts[4],
                "Correct Answer": q.correct_index + 1,
                "Time in seconds": q.time_limit,
            }
            rows.append(row)

        df = pd.DataFrame(rows)
        cols = ["Question Text", "Question Type", "Option 1", "Option 2", "Option 3", 
                "Option 4", "Option 5", "Correct Answer", "Time in seconds", 
                "Image Link", "Answer explanation"]
        
        # Tạo cột thiếu để tránh lỗi
        for c in cols:
            if c not in df.columns: df[c] = ""
            
        df = df[cols]
        df.to_excel(filepath, index=False)
        return filepath, filename

    def export_kahoot_pdf(self):
        filename = f"Kahoot_{self.request_id}.pdf"
        filepath = os.path.join(TEMP_DIR, filename)
        
        pdf = FPDF()
        pdf.add_page()
        
        # Xử lý Font
        has_font = False
        if os.path.exists(FONT_PATH):
            try:
                pdf.add_font('Arial', '', FONT_PATH, uni=True)
                pdf.set_font('Arial', '', 12)
                has_font = True
            except:
                pdf.set_font('Arial', '', 12)
        else:
            pdf.set_font('Arial', '', 12)

        pdf.cell(0, 10, 'DANH SÁCH CÂU HỎI KAHOOT', ln=True, align='C')
        pdf.ln(5)

        for idx, q in enumerate(self.data):
            q_text = q.question if has_font else q.question.encode('latin-1', 'replace').decode('latin-1')
            pdf.set_text_color(0, 0, 128)
            pdf.multi_cell(0, 8, f"Câu {idx+1}: {q_text}")
            pdf.set_text_color(0, 0, 0)
            
            for i, opt in enumerate(q.options):
                opt_text = opt if has_font else opt.encode('latin-1', 'replace').decode('latin-1')
                prefix = chr(65+i)
                check = " (ĐÚNG)" if i == q.correct_index else ""
                pdf.multi_cell(0, 6, f"   {prefix}. {opt_text}{check}")
            pdf.ln(5)

        pdf.output(filepath)
        return filepath, filename

# ======================================================
# 4. HÀM HỖ TRỢ & API CHÍNH
# ======================================================

def remove_file(path: str):
    try:
        os.remove(path)
        print(f"🗑️ Đã xóa file: {path}")
    except Exception:
        pass

def mock_ai_parsing(filename: str) -> List[QuestionItem]:
    # Giả lập AI đọc file
    return [
        QuestionItem(
            question=f"Câu hỏi từ file {filename}: 1 + 1 = ?",
            options=["1", "2", "3", "4"],
            correct_index=1,
            time_limit=20
        ),
        QuestionItem(
            question="Thủ đô của Việt Nam là gì?",
            options=["TP.HCM", "Hà Nội", "Đà Nẵng", "Huế"],
            correct_index=1,
            time_limit=30
        )
    ]

@app.post("/export")
async def export_data(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    platform: str = Form("quizizz")
):
    try:
        # 1. Lưu file
        req_id = str(uuid.uuid4())[:8]
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        print(f"📥 Đã nhận: {file.filename} | Platform: {platform}")

        # 2. AI xử lý
        questions = mock_ai_parsing(file.filename)
        
        # 3. Xuất file
        exporter = QuizExporter(questions, req_id)
        
        p = platform.lower()
        if "kahoot" in p:
            file_path, file_name = exporter.export_kahoot_pdf()
        else:
            file_path, file_name = exporter.export_quizizz()

        # 4. Dọn dẹp
        background_tasks.add_task(remove_file, file_path)

        # 5. Trả về
        return FileResponse(
            path=file_path, 
            filename=file_name,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={"Content-Disposition": f"attachment; filename={file_name}"}
        )

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        # --- ĐÂY LÀ CHỖ ĐÃ SỬA ---
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý: {str(e)}")