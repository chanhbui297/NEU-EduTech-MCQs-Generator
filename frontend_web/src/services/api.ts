export async function exportMCQs(data: any) {
  // 1. Gọi API (Phần này bạn làm đúng rồi)
  const response = await fetch("/api/export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Export failed");
  }

  // 2. XỬ LÝ FILE TRẢ VỀ (Phần bổ sung quan trọng)
  const blob = await response.blob(); // Lấy cục dữ liệu binary
  
  // Tạo một đường dẫn URL ảo cho cục dữ liệu đó
  const url = window.URL.createObjectURL(blob);
  
  // Tạo một thẻ <a> ẩn
  const a = document.createElement('a');
  a.href = url;
  
  // --- Mẹo: Lấy tên file chuẩn từ Backend gửi về ---
  // Backend của Nghị có gửi header "Content-Disposition" chứa tên file
  const contentDisposition = response.headers.get('Content-Disposition');
  let fileName = 'downloaded_file.xlsx'; // Tên mặc định nếu không tìm thấy
  
  if (contentDisposition) {
    // Cắt chuỗi để lấy tên file: attachment; filename="Kahoot_123.pdf"
    const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (fileNameMatch && fileNameMatch.length === 2)
      fileName = fileNameMatch[1];
  }
  
  a.download = fileName; // Gán tên file
  
  // Gắn vào web, tự bấm click, rồi xóa đi
  document.body.appendChild(a);
  a.click();
  a.remove();
  
  // Dọn dẹp bộ nhớ
  window.URL.revokeObjectURL(url);

  return true; // Báo thành công
}