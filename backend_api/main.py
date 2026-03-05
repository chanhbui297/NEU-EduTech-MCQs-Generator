from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form, Body
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pandas as pd
import os
import uuid
import shutil
import json
import requests
import html
from fpdf import FPDF
from pypdf import PdfReader 

app = FastAPI()

#  CẤU HÌNH DIFY 
"""
CẤU HÌNH DIFY
- Nên cấu hình qua biến môi trường thay vì hard-code để tránh lộ API key.
- Ví dụ khi chạy Docker: -e DIFY_API_KEY=xxx -e DIFY_API_URL=http://host.docker.internal:5001/v1/chat-messages
"""
# THAY DIFY_API_KEY vào DÒNG SAU:
DIFY_API_KEY = os.getenv("DIFY_API_KEY", "app-u3bLVIBkd0qDSHMlFf8QH4Xc").strip()

# Dùng Dify Local (không bị Cloudflare 504 timeout)
# host.docker.internal = địa chỉ máy host từ bên trong Docker
DIFY_API_URL    = os.getenv("DIFY_API_URL",    "http://host.docker.internal/v1/chat-messages").strip()
DIFY_UPLOAD_URL = os.getenv("DIFY_UPLOAD_URL", "http://host.docker.internal/v1/files/upload").strip()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_exports"
UPLOAD_DIR = "uploaded_files"
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
FONT_PATH = "Arial.ttf"

class QuestionItem(BaseModel):
    id: str = "" 
    type: str = "TRẮC NGHIỆM"
    question: str
    options: List[str]
    correct: int 
    time_limit: int = 30

class ExportRequest(BaseModel):
    platform: str
    questions: List[QuestionItem]

@app.get("/v1/auth/me")
@app.get("/api/v1/auth/me") 
async def fake_auth_me():
    return { "id": "user_123", "email": "demo@neu.edu.vn", "name": "Cường Admin", "role": "admin", "is_active": True }

def extract_text_from_pdf(pdf_path: str) -> str:
    """Dự phòng nếu cần. Hiện tại Dify được dùng để đọc file trực tiếp."""
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text[:10000]
    except: return ""

def upload_file_to_dify(file_path: str) -> str:
    """Upload file PDF lên Dify, trả về upload_file_id hoặc rỗng nếu lỗi."""
    headers = { "Authorization": f"Bearer {DIFY_API_KEY}" }
    try:
        with open(file_path, "rb") as f:
            files = {"file": (os.path.basename(file_path), f, "application/pdf")}
            data  = {"user": "api-user"}
            print(f"🚀 Uploading {file_path} to Dify ({DIFY_UPLOAD_URL})...")
            resp = requests.post(DIFY_UPLOAD_URL, headers=headers, files=files, data=data, timeout=60)
            if resp.status_code in (200, 201):
                file_id = resp.json().get("id", "")
                print(f"Upload OK, file_id={file_id}")
                return file_id
            else:
                print(f"⚠️ Dify Upload Error ({resp.status_code}): {resp.text}")
                return ""
    except Exception as e:
        print(f"⚠️ Upload Exception: {e}")
        return ""

def call_dify_ai(file_path: str, user_prompt: str) -> List[QuestionItem]:
    """
    Luồng: upload file thật lên Dify, lấy file_id,
    rồi gọi Chatflow với file_id trong mảng 'files'.
    Dify sẽ tự dùng SMART DOCUMENT EXTRACT để đọc PDF.
    """
    if not DIFY_API_KEY:
        return [QuestionItem(id="err",
            question="Thiếu DIFY_API_KEY. Vui lòng thiết lập biến môi trường.",
            options=["Kiểm tra docker-compose hoặc lệnh chạy backend"], correct=0)]

    # Bước 1: Upload file lên Dify để lấy ID
    dify_file_id = upload_file_to_dify(file_path)
    if not dify_file_id:
        return [QuestionItem(id="err",
            question="Không upload được file lên Dify. Kiểm tra API Key hoặc URL Dify.",
            options=["Kiểm tra lại DIFY_API_KEY và DIFY_UPLOAD_URL"], correct=0)]

    headers = { "Authorization": f"Bearer {DIFY_API_KEY}", "Content-Type": "application/json" }

    # Bước 2: Gọi Chatflow, đính kèm file_id → Dify tự đọc bằng SMART DOCUMENT EXTRACT
    payload = {
        "inputs": {
            # Các giá trị phải khớp CHÍNH XÁC với enum khai báo trong Dify (lấy từ /v1/parameters)
            "platform":              "NEU LMS",
            "difficulty_level":      "Medium (Understand & Apply)",
            "content_strategy":      "Comprehensive (scan all materials)",
            "output_language":       "Vietnamese",
            "include_explanations":  "No - Answers only",
            # uploaded_files là file-list input trong Node START của Dify
            # Phải truyền dưới dạng list các object file, không phải string
            "uploaded_files": [
                {
                    "type": "document",
                    "transfer_method": "local_file",
                    "upload_file_id": dify_file_id
                }
            ]
        },
        "query": user_prompt,       # bắt buộc với Chatflow
        "response_mode": "blocking",
        "conversation_id": "",      # tạo phiên mới
        "user": "api-user"
        # KHÔNG cần mảng "files" ở cấp ngoài nữa
    }

    try:
        print(f"🚀 Calling Dify Chatflow ({DIFY_API_URL}) with file_id={dify_file_id}...")
        response = requests.post(DIFY_API_URL, headers=headers, json=payload, timeout=180)

        if response.status_code != 200:
            print(f"⚠️ Dify Error ({response.status_code}): {response.text}")
            try:
                err_json = response.json()
            except Exception:
                err_json = {}
            error_code = err_json.get("error") or err_json.get("code")
            details    = (err_json.get("details") or {}).get("detail") if isinstance(err_json.get("details"), dict) else ""

            if error_code == "ERROR_RESOURCE_EXHAUSTED":
                friendly_msg = (
                    "Máy chủ mô hình AI đang quá tải (ERROR_RESOURCE_EXHAUSTED). "
                    "Hãy thử lại sau vài phút, hoặc trong Dify đổi sang model khác."
                )
            else:
                friendly_msg = f"Lỗi từ Dify ({error_code or response.status_code}): {details or response.text[:200]}"

            return [QuestionItem(id="err", question=friendly_msg,
                options=["Mở lại Dify kiểm tra workflow & model", "Thử upload file lại sau ít phút"], correct=0)]

        res_json   = response.json()
        raw_output = res_json.get("answer", "")

        if not raw_output:
            print("⚠️ Dify returned an empty answer.")
            return [QuestionItem(id="err", question="Dify trả về rỗng",
                options=["Kiểm tra Node Kết quả trong Chatflow"], correct=0)]

        print(f"Dify Raw Output: {raw_output[:500]}...") # Log first 500 chars

        # Làm sạch JSON
        clean_json = raw_output.replace("```json", "").replace("```", "").strip()

        try:
            data = json.loads(clean_json)
            print(f"Parsed JSON data: {data}")
        except Exception as e:
            print(f"JSON Parse Error: {e}")
            return [QuestionItem(id="err",
                question=f"Lỗi Format JSON: {clean_json[:50]}...",
                options=["AI trả về sai định dạng"], correct=0)]

        results = []
        # Dify có thể trả về list trực tiếp hoặc dict {"items": [...]}
        items_list = []
        if isinstance(data, list):
            items_list = data
        elif isinstance(data, dict):
            items_list = data.get("items") or data.get("questions") or []

        for idx, item in enumerate(items_list):
            q_text = item.get("question", "Lỗi format")
            options = item.get("options", ["A", "B", "C", "D"])
            
            # Tìm index đáp án đúng (Dify đôi khi trả về string thay vì số)
            correct_idx = item.get("correct", 0)
            if "correct_answer" in item:
                ans_str = str(item["correct_answer"])
                for i, opt in enumerate(options):
                    if ans_str in opt or opt in ans_str:
                        correct_idx = i
                        break

            results.append(QuestionItem(
                id=str(idx),
                type="TRẮC NGHIỆM",
                question=q_text,
                options=options,
                correct=correct_idx,
                time_limit=30
            ))
        
        if not results:
            return [QuestionItem(id="err", question="Không tìm thấy câu hỏi trong dữ liệu AI trả về",
                options=["Hãy thử lại hoặc kiểm tra prompt"], correct=0)]
                
        return results
    except Exception as e:
        print(f"⚠️ Exception: {e}")
        return [QuestionItem(id="err", question=f"Lỗi Backend: {str(e)}",
            options=["Thử lại"], correct=0)]

class QuizExporter:
    def __init__(self, data_list: List[QuestionItem], request_id):
        self.data = data_list
        self.request_id = request_id

    def export_quizizz(self):
        filename = f"Quizizz_{self.request_id}.xlsx"
        filepath = os.path.join(TEMP_DIR, filename)
        rows = []
        for q in self.data:
            opts = q.options + [""] * (5 - len(q.options))
            row = {
                "Question Text": q.question, "Question Type": "Multiple Choice",
                "Option 1": opts[0], "Option 2": opts[1], "Option 3": opts[2], 
                "Option 4": opts[3], "Option 5": opts[4],
                "Correct Answer": q.correct + 1, "Time in seconds": q.time_limit,
            }
            rows.append(row)
        pd.DataFrame(rows).to_excel(filepath, index=False)
        return filepath, filename

    def export_kahoot_pdf(self):
        filename = f"Kahoot_{self.request_id}.pdf"
        filepath = os.path.join(TEMP_DIR, filename)
        pdf = FPDF()
        pdf.add_page()
        if os.path.exists(FONT_PATH): 
            try: pdf.add_font('Arial', '', FONT_PATH, uni=True); pdf.set_font('Arial', '', 12)
            except: pdf.set_font('Arial', '', 12)
        else: pdf.set_font('Arial', '', 12)
        
        pdf.cell(0, 10, 'DANH SÁCH CÂU HỎI', ln=True, align='C')
        for i, q in enumerate(self.data):
            pdf.set_text_color(0, 0, 128); pdf.multi_cell(0, 8, f"Q{i+1}: {q.question}")
            pdf.set_text_color(0, 0, 0)
            for j, opt in enumerate(q.options):
                mark = " (ĐÚNG)" if j == q.correct else ""
                pdf.multi_cell(0, 6, f"  {chr(65+j)}. {opt}{mark}")
            pdf.ln(5)
        pdf.output(filepath)
        return filepath, filename

    def export_lms_xml(self):
        filename = f"NEU_LMS_{self.request_id}.xml"
        filepath = os.path.join(TEMP_DIR, filename)
        xml = ['<?xml version="1.0" encoding="UTF-8"?>\n<quiz>']
        for idx, q in enumerate(self.data):
            q_text = html.escape(q.question)
            xml.append(f'  <question type="multichoice">')
            xml.append(f'    <name><text>Câu {idx+1}</text></name>')
            xml.append(f'    <questiontext format="html"><text><![CDATA[{q_text}]]></text></questiontext>')
            xml.append(f'    <single>true</single><shuffleanswers>true</shuffleanswers>')
            for i, opt in enumerate(q.options):
                grade = "100" if i == q.correct else "0"
                opt_text = html.escape(opt)
                xml.append(f'    <answer fraction="{grade}" format="html"><text><![CDATA[{opt_text}]]></text></answer>')
            xml.append(f'  </question>')
        xml.append("</quiz>")
        with open(filepath, "w", encoding="utf-8") as f: f.write("\n".join(xml))
        return filepath, filename

    def export_quizlet(self):
        filename = f"Quizlet_{self.request_id}.txt"
        filepath = os.path.join(TEMP_DIR, filename)
        lines = []
        for q in self.data:
            clean_q = q.question.replace("\n", " ")
            correct_opt = q.options[q.correct].replace("\n", " ")
            lines.append(f"{clean_q}\t{correct_opt}")
        with open(filepath, "w", encoding="utf-8") as f: f.write("\n".join(lines))
        return filepath, filename

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...), prompt: str = Form("Hãy tạo 10 câu hỏi trắc nghiệm")):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Dify tự đọc file PDF qua SMART DOCUMENT EXTRACT
        # Backend chỉ upload file rồi hỏi Dify
        questions = call_dify_ai(file_path, prompt)

        # Dọn file tạm sau khi gửi xong
        try: os.remove(file_path)
        except: pass

        return [q.dict() for q in questions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_file(request: ExportRequest, background_tasks: BackgroundTasks):
    try:
        req_id = str(uuid.uuid4())[:8]
        exporter = QuizExporter(request.questions, req_id)
        p = request.platform.lower()
        target_url = "https://quizizz.com/"
        
        if "kahoot" in p or "pdf" in p: path, name = exporter.export_kahoot_pdf(); target_url = "https://create.kahoot.it/"
        elif "lms" in p or "moodle" in p: path, name = exporter.export_lms_xml(); target_url = "https://lms.neu.edu.vn/"
        elif "quizlet" in p: path, name = exporter.export_quizlet(); target_url = "https://quizlet.com/create"
        else: path, name = exporter.export_quizizz(); target_url = "https://quizizz.com/admin/quiz/import"

        background_tasks.add_task(lambda p: os.remove(p) if os.path.exists(p) else None, path)
        return FileResponse(path=path, filename=name, headers={"Access-Control-Expose-Headers": "X-Target-Url", "X-Target-Url": target_url})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))