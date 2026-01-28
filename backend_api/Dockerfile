# Dùng Python nhẹ
FROM python:3.9-slim

# Tạo thư mục làm việc
WORKDIR /app

# Copy file cài đặt và cài thư viện
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code vào
COPY . .

# Mở cổng 8000
EXPOSE 8000

# Chạy server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]