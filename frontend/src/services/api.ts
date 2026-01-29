export async function exportMCQs(data: any) {
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

  return response.blob(); // giả sử backend trả file
}
