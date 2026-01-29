import { useState } from 'react';
import { ChevronLeft, Download, Trash2, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ContentEditor({ data, onBack }: { data: any[], onBack: () => void }) {
  const [questions, setQuestions] = useState(data);

  // Hàm cập nhật nội dung khi bạn gõ chữ vào ô sửa
  const updateQuestion = (index: number, newText: string) => {
    const updated = [...questions];
    updated[index].question = newText;
    setQuestions(updated);
  };

  return (
    <div className="flex h-screen w-full bg-[#050509] text-gray-200 overflow-hidden">
      {/* Cột Trái: Danh sách câu hỏi để sửa */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Review & Edit Content</h1>
            <p className="text-gray-500 text-sm mt-1">Chỉnh sửa nội dung trước khi xuất bản</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack} className="hover:bg-white/5">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to PDF
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <div className="max-w-3xl space-y-6">
          {questions.map((q, idx) => (
            <Card key={idx} className="bg-[#0b0b15] border-gray-800 p-6 relative group">
              <div className="flex justify-between mb-4">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Question {idx + 1}</span>
                <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-all" />
              </div>
              
              <textarea 
                className="w-full bg-[#161625] border border-gray-800 rounded-xl p-4 text-sm focus:border-indigo-500 outline-none mb-4"
                value={q.question}
                onChange={(e) => updateQuestion(idx, e.target.value)}
              />

              <div className="space-y-2">
                {q.options?.map((opt: string, optIdx: number) => (
                  <div key={optIdx} className="flex items-center gap-3 bg-[#161625] p-3 rounded-xl border border-gray-800">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    <input className="bg-transparent border-none text-sm w-full outline-none" defaultValue={opt} />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Cột Phải: Sidebar Summary (Như ảnh mẫu) */}
      <div className="w-80 border-l border-gray-800 bg-[#0b0b15] p-6 hidden lg:block">
        <div className="sticky top-0 space-y-6">
          <Card className="bg-indigo-500/10 border-indigo-500/30 p-4">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
              <Sparkles className="h-4 w-4" /> <span className="text-xs font-bold uppercase">GalaxyBot</span>
            </div>
            <p className="text-xs text-gray-400">Tôi có thể giúp bạn tối ưu hóa câu hỏi này. Bạn có muốn thử không?</p>
          </Card>
          
          <div className="pt-4 border-t border-gray-800">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-4">Export Format</h3>
            <div className="space-y-2">
              {['NEU LMS', 'Quizlet', 'Kahoot'].map(fmt => (
                <div key={fmt} className="flex items-center gap-3 p-3 bg-[#161625] rounded-xl border border-gray-800 text-xs">
                  <div className="w-3 h-3 border border-indigo-500 rounded-full" /> {fmt}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}