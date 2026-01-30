# 1. Dùng Node.js
FROM node:18-alpine

# 2. Tạo thư mục làm việc trong Docker
WORKDIR /app

# 3. Copy file package.json (nằm ngay tại chỗ) vào Docker
COPY package*.json ./

# 4. Cài thư viện
RUN npm install

# 5. Copy TOÀN BỘ code (tại chỗ) vào Docker
# (Lệnh cũ sai ở chỗ nó ghi là COPY frontend/ ., sửa thành COPY . .)
COPY . .

# 6. Mở cổng 3000
EXPOSE 3000

# 7. Chạy Web
CMD ["npm", "start"]