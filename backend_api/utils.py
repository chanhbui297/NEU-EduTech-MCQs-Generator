from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import pandas as pd
import html
import os
import uuid
from fpdf import FPDF

# ======================================================
# CẤU HÌNH SERVER
# ======================================================
app = FastAPI()

# Cấu hình CORS (Cho phép Frontend gọi)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_exports"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)
    
# Font chữ tiếng Việt (Bắt buộc phải có file Arial.ttf cùng thư mục)
FONT_PATH = "Arial.ttf" 

# ======================================================
# DATA MODELS
# ======================================================
class QuestionItem(BaseModel):
    question: str
    options: List[str] = Field(..., min_items=2, description="Danh sách các đáp án")
    correct_index: int = Field(..., description="Vị trí đáp án đúng (bắt đầu từ 0)")
    time_limit: int = 30

class ExportRequest(BaseModel):
    platform: str  # Kahoot, Quizlet, Wayground, NEU LMS
    questions: List[QuestionItem]

# ======================================================
# HÀM DỌN DẸP FILE RÁC
# ======================================================
def remove_file(path: str):
    try:
        os.remove(path)
        print(f"🗑️ Đã xóa file tạm: {path}")
    except Exception as e:
        print(f"⚠️ Lỗi xóa file tạm: {e}")

# ======================================================
# CLASS XỬ LÝ LOGIC XUẤT FILE
# ======================================================
class QuizExporter:
    def __init__(self, data_list, request_id):
        self.data = data_list
        self.request_id = request_id

    def export_quizizz(self):
        filename = f"Quizizz_{self.request_id}.xlsx"
        filepath = os.path.join(TEMP_DIR, filename)
        
        rows = []
        for q in self.data:
            # Quizizz cần 5 options, điền trống nếu thiếu
            opts = q.options + [""] * (5 - len(q.options))
            
            row = {
                "Question Text": q.question,
                "Question Type": "Multiple Choice",
                "Option 1": opts[0],
                "Option 2": opts[1],
                "Option 3": opts[2],
                "Option 4": opts[3],
                "Option 5": opts[4], # Cột bắt buộc
                "Correct Answer": q.correct_index + 1, # Quizizz đếm từ 1
                "Time in seconds": q.time_limit,
                "Image Link": "",
                "Answer explanation": ""
            }
            rows.append(row)

        df = pd.DataFrame(rows)
        cols = ["Question Text", "Question Type", "Option 1", "Option 2", 
                "Option 3", "Option 4", "Option 5", "Correct Answer", 
                "Time in seconds", "Image Link", "Answer explanation"]
        # Chỉ lấy cột tồn tại để tránh lỗi
        df = df.reindex(columns=cols)
        df.to_excel(filepath, index=False)
        return filepath, filename

    def export_kahoot_pdf(self):
        filename = f"Kahoot_{self.request_id}.pdf"
        filepath = os.path.join(TEMP_DIR, filename)
        
        pdf = FPDF()
        pdf.add_page()
        
        # Xử lý Font Tiếng Việt
        has_font = False
        if os.path.exists(FONT_PATH):
            try:
                pdf.add_font('Arial', '', FONT_PATH, uni=True)
                pdf.set_font('Arial', '', 12)
                has_font = True
            except:
                print("⚠️ Lỗi load font Arial, dùng font mặc định.")
                pdf.set_font('Arial', '', 12)
        else:
            pdf.set_font('Arial', '', 12)

        pdf.cell(0, 10, 'DANH SÁCH CÂU HỎI KAHOOT', ln=True, align='C')
        pdf.ln(5)

        for idx, q in enumerate(self.data):
            # Nếu không có font tiếng Việt, phải encode lại để không crash
            q_text = q.question if has_font else q.question.encode('latin-1', 'replace').decode('latin-1')
            
            pdf.set_text_color(0, 0, 128) # Màu xanh
            pdf.multi_cell(0, 8, f"Câu {idx+1}: {q_text}")
            pdf.set_text_color(0, 0, 0)
            
            for i, opt in enumerate(q.options):
                opt_text = opt if has_font else opt.encode('latin-1', 'replace').decode('latin-1')
                prefix = chr(65+i) # A, B, C...
                check = " (ĐÚNG)" if i == q.correct_index else ""
                
                # Highlight đáp án đúng
                if i == q.correct_index:
                    pdf.set_font('Arial', 'B', 12) if not has_font else pdf.set_font('Arial', '', 12) # Đậm nếu được
                
                pdf.multi_cell(0, 6, f"   {prefix}. {opt_text}{check}")
                
                # Reset font
                if i == q.correct_index:
                     pdf.set_font('Arial', '', 12)
            pdf.ln(5)

        pdf.output(filepath)
        return filepath, filename

    def export_lms_xml(self):
        filename = f"NEU_LMS_{self.request_id}.xml"
        filepath = os.path.join(TEMP_DIR, filename)
        
        xml = ['<?xml version="1.0" encoding="UTF-8"?>\n<quiz>']
        for idx, q in enumerate(self.data):
            q_text = html.escape(q.question)
            xml.append(f'<question type="multichoice"><name><text>Câu {idx+1}</text></name>')
            xml.append(f'<questiontext format="html"><text><![CDATA[{q_text}]]></text></questiontext>')
            xml.append('<single>true</single><shuffleanswers>true</shuffleanswers>')
            
            for i, opt in enumerate(q.options):
                # LMS NEU: Đúng = 100%, Sai = 0%
                grade = "100" if i == q.correct_index else "0"
                opt_text = html.escape(opt)
                xml.append(f'<answer fraction="{grade}" format="html"><text><![CDATA[{opt_text}]]></text></answer>')
            
            xml.append("</question>")
        xml.append("</quiz>")
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(xml))
        return filepath, filename
    
    def export_quizlet_txt(self):
        filename = f"Quizlet_{self.request_id}.txt"
        filepath = os.path.join(TEMP_DIR, filename)
        
        lines = []
        for q in self.data:
            # Quizlet format: Term <TAB> Definition
            term = q.question.replace("\n", " ").replace("\t", " ")
            # Giả định đáp án đúng là Definition
            definition = q.options[q.correct_index].replace("\n", " ").replace("\t", " ")
            lines.append(f"{term}\t{definition}")
            
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        return filepath, filename

# ======================================================
# API ENDPOINT
# ======================================================
@app.post("/export")
async def export_data(request: ExportRequest, background_tasks: BackgroundTasks):
    # Tạo ID duy nhất
    req_id = str(uuid.uuid4())[:8]
    exporter = QuizExporter(request.questions, req_id)
    
    file_path = ""
    file_name = ""
    target_url = "" 

    try:
        # 1. Map Platform sang Logic xuất file
        # Lưu ý: Client gửi lên "NEU LMS" nhưng logic có thể map string
        p = request.platform.lower()
        
        if "quizizz" in p or "wayground" in p:
            file_path, file_name = exporter.export_quizizz()
            target_url = "https://quizizz.com/admin/quiz/import"
            
        elif "kahoot" in p:
            file_path, file_name = exporter.export_kahoot_pdf()
            target_url = "https://create.kahoot.it/"
            
        elif "lms" in p:
            file_path, file_name = exporter.export_lms_xml()
            target_url = "https://lms.neu.edu.vn/"
            
        elif "quizlet" in p:
            file_path, file_name = exporter.export_quizlet_txt()
            target_url = "https://quizlet.com/create"
            
        else:
            # Mặc định fallback về Quizizz nếu không khớp
            file_path, file_name = exporter.export_quizizz()
            target_url = "https://quizizz.com/"

        # 2. Đăng ký tác vụ xóa file sau khi gửi xong (Background Task)
        background_tasks.add_task(remove_file, file_path)

        # 3. Trả về file kèm Header điều hướng
        return FileResponse(
            path=file_path, 
            filename=file_name,
            headers={
                "X-Target-Url": target_url,
                "Access-Control-Expose-Headers": "X-Target-Url" # Bắt buộc để Frontend đọc được
            } 
        )

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi xuất file: {str(e)}")