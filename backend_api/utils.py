# FILE: backend_api/utils.py
import pandas as pd
import html
import os
from fpdf import FPDF

# Cấu hình thư mục tạm và Font
TEMP_DIR = "temp_exports"
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

FONT_PATH = "Arial.ttf" 

# Hàm dọn dẹp file
def remove_file(path: str):
    try:
        os.remove(path)
        print(f"🗑️ Đã xóa file tạm: {path}")
    except Exception as e:
        print(f"⚠️ Lỗi xóa file tạm: {e}")

class QuizExporter:
    def __init__(self, data_list, request_id):
        self.data = data_list
        self.request_id = request_id

    # 1. Xuất Excel cho Quizizz / Wayground
    def export_quizizz(self):
        filename = f"Quizizz_{self.request_id}.xlsx"
        filepath = os.path.join(TEMP_DIR, filename)
        
        rows = []
        for q in self.data:
            opts = q.options + [""] * (5 - len(q.options))
            row = {
                "Question Text": q.question,
                "Question Type": "Multiple Choice",
                "Option 1": opts[0], "Option 2": opts[1],
                "Option 3": opts[2], "Option 4": opts[3], "Option 5": opts[4],
                "Correct Answer": q.correct_index + 1,
                "Time in seconds": q.time_limit,
                "Image Link": "", "Answer explanation": ""
            }
            rows.append(row)

        df = pd.DataFrame(rows)
        cols = ["Question Text", "Question Type", "Option 1", "Option 2", 
                "Option 3", "Option 4", "Option 5", "Correct Answer", 
                "Time in seconds", "Image Link", "Answer explanation"]
        df = df.reindex(columns=cols)
        df.to_excel(filepath, index=False)
        return filepath, filename

    # 2. Xuất PDF cho Kahoot
    def export_kahoot_pdf(self):
        filename = f"Kahoot_{self.request_id}.pdf"
        filepath = os.path.join(TEMP_DIR, filename)
        
        pdf = FPDF()
        pdf.add_page()
        
        has_font = False
        if os.path.exists(FONT_PATH):
            try:
                pdf.add_font('Arial', '', FONT_PATH, uni=True)
                pdf.set_font('Arial', '', 12)
                has_font = True
            except: pass
        else: pdf.set_font('Arial', '', 12)

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
                if i == q.correct_index and has_font: pdf.set_font('Arial', 'B', 12)
                pdf.multi_cell(0, 6, f"   {prefix}. {opt_text}{check}")
                if i == q.correct_index and has_font: pdf.set_font('Arial', '', 12)
            pdf.ln(5)

        pdf.output(filepath)
        return filepath, filename

    # 3. Xuất XML cho NEU LMS
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
                grade = "100" if i == q.correct_index else "0"
                opt_text = html.escape(opt)
                xml.append(f'<answer fraction="{grade}" format="html"><text><![CDATA[{opt_text}]]></text></answer>')
            xml.append("</question>")
        xml.append("</quiz>")
        with open(filepath, "w", encoding="utf-8") as f: f.write("\n".join(xml))
        return filepath, filename
    
    # 4. Xuất Text cho Quizlet
    def export_quizlet_txt(self):
        filename = f"Quizlet_{self.request_id}.txt"
        filepath = os.path.join(TEMP_DIR, filename)
        lines = []
        for q in self.data:
            term = q.question.replace("\n", " ").replace("\t", " ")
            definition = q.options[q.correct_index].replace("\n", " ").replace("\t", " ")
            lines.append(f"{term}\t{definition}")
        with open(filepath, "w", encoding="utf-8") as f: f.write("\n".join(lines))
        return filepath, filename
    

