import { useState, useRef, useEffect } from 'react';
import {
  Send, Upload, Trash2, FileText, Plus, BrainCircuit,
  Sparkles, ChevronLeft, Download, CheckCircle2,
  MessageSquare, LayoutGrid, Settings, User, Sun, Moon,
  Save, AlertCircle, X, MoreVertical, FileDown, Table, FileType,
  File, HardDrive, UploadCloud, Bell, Shield, Keyboard, LogOut, Lock, Zap,
  Mail, CreditCard, BadgeCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@metagptx/web-sdk';

const client = createClient();

const STYLES = {
  galaxyGradient: "bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-600",
  userMessage: "bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-600 text-white border-white/10 shadow-xl",
  inputGlow: "absolute -inset-0.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500",
  sendButton: "h-10 w-10 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20 rounded-xl transition-all active:scale-95 flex items-center justify-center border-none"
};

// --- ExportOptions ---
const ExportOptions = ({ onExport }: { onExport: (type: string) => void }) => {
  const options = [
    { title: "Tài liệu PDF (.pdf)", desc: "Bao gồm tóm tắt & phân tích đầy đủ", icon: <FileText className="h-5 w-5 text-rose-500" />, bg: "bg-rose-500/10", type: "kahoot" },
    { title: "Microsoft Word (.docx)", desc: "Tài liệu học tập có thể chỉnh sửa", icon: <FileDown className="h-5 w-5 text-blue-500" />, bg: "bg-blue-500/10", type: "word" },
    { title: "Bảng tính Excel (.xlsx)", desc: "Danh sách câu hỏi & đáp án", icon: <Table className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-500/10", type: "quizizz" },
    { title: "Quizlet CSV / TXT", desc: "Nhập trực tiếp vào Quizlet nhanh chóng", icon: <FileType className="h-5 w-5 text-orange-500" />, bg: "bg-orange-500/10", type: "quizlet" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-10 px-6 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
          <Download className="mr-2 h-4 w-4" /> Xuất tệp
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Download className="h-3 w-3" /> Tùy chọn xuất bản
        </div>
        {options.map((opt, i) => (
          <DropdownMenuItem key={i} onClick={() => onExport(opt.type)} className="flex items-center gap-4 p-3 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 focus:bg-slate-100 dark:focus:bg-white/5 transition-colors outline-none">
            <div className={`w-10 h-10 rounded-xl ${opt.bg} flex items-center justify-center shrink-0`}>{opt.icon}</div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{opt.title}</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface Question {
  id: string; type: string; question: string; options: string[]; correct: number;
}
interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; }

const platforms = [
  { id: 'NEU LMS', name: 'NEU LMS', description: 'Chế độ Học thuật', icon: <div className="text-xl">🎓</div> },
  { id: 'Quizlet', name: 'Quizlet', description: 'Thẻ ghi nhớ', icon: <div className="text-xl">📝</div> },
  { id: 'Kahoot', name: 'Kahoot', description: 'Trò chơi tương tác', icon: <div className="text-xl">🎮</div> },
];

const UPLOADED_FILES = [
  { id: '1', name: 'Astrophysics_Intro.pdf', size: '2.4 MB', date: '2 giờ trước' },
  { id: '2', name: 'Macroeconomics_Ch1.pdf', size: '1.8 MB', date: 'Hôm qua' },
];

export default function Chatbot() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('NEU LMS');
  const [user, setUser] = useState<any>({ name: "Nguyễn Văn A", email: "student@neu.edu.vn", plan: "Premium" });
  const [view, setView] = useState<'chat' | 'editor' | 'settings' | 'profile'>('chat');
  const [settingsTab, setSettingsTab] = useState('Chung');
  const [editorTab, setEditorTab] = useState('lms');
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // File đã chọn, chưa upload
  const [isLoading, setIsLoading] = useState(false); // Đang gửi lên Dify

  // Dữ liệu mẫu để giao diện không bị trống khi mới vào
  const [dataToEdit, setDataToEdit] = useState<Question[]>([
    {
      id: '1', type: 'TRẮC NGHIỆM',
      question: 'Câu hỏi mẫu: Thủ đô của Việt Nam là gì?',
      options: ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Huế'], correct: 0
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { client.auth.me().then(res => setUser(res.data)).catch(() => { }); }, []);

  const handleUpdateQuestion = (id: string, field: keyof Question, value: any) => {
    setDataToEdit(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleUpdateOption = (qId: string, optIdx: number, value: string) => {
    setDataToEdit(prev => prev.map(q => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[optIdx] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const deleteQuestion = (id: string) => {
    setDataToEdit(prev => prev.filter(q => q.id !== id));
    toast({ title: "Đã xóa", description: "Đã xóa câu hỏi khỏi danh sách." });
  };

  const addNewQuestion = () => {
    const newQ: Question = {
      id: Date.now().toString(), type: 'TRẮC NGHIỆM',
      question: 'Nhập nội dung câu hỏi mới...', options: ['A', 'B', 'C', 'D'], correct: 0
    };
    setDataToEdit(prev => [...prev, newQ]);
  };

  // Chỉ lưu file vào state, CHƯA upload ngay
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    toast({ title: "📎 Đã chọn file", description: `${file.name} — Nhập yêu cầu rồi bấm Phân tích.`, duration: 3000 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Gửi file + prompt lên server thực sự
  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({ title: "⚠️ Chưa chọn file", description: "Vui lòng chọn file PDF trước.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    toast({ title: "🤖 Đang phân tích...", description: "AI đang đọc tài liệu qua Dify Cloud. Vui lòng chờ 1-3 phút.", duration: 200000 });
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("prompt", input || "Hãy tạo 10 câu hỏi trắc nghiệm từ tài liệu này");

      const response = await fetch("/api/analyze", { method: "POST", body: formData });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lỗi Server (${response.status}): ${errorText}`);
      }

      const resultData = await response.json();
      setDataToEdit(resultData);
      setSelectedFile(null);
      setInput('');
      setView('editor');
      toast({ title: "✅ Hoàn tất!", description: "Đã phân tích xong. Mời bạn chỉnh sửa.", duration: 3000 });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "❌ Thất bại", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalExport = async (platformType: string) => {
    toast({ title: "⏳ Đang xuất file...", description: `Đang tạo file ${platformType}.` });
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platformType, questions: dataToEdit }),
      });

      if (!response.ok) throw new Error("Lỗi khi tạo file");

      const blob = await response.blob();
      const fileName = response.headers.get('Content-Disposition')?.split('filename=')[1] || `export.xlsx`;
      const targetUrl = response.headers.get('X-Target-Url');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName.replace(/['"]/g, '');
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);

      toast({ title: "✅ Tải xuống thành công!", description: "File đã được lưu.", duration: 3000 });

      if (targetUrl) {
        setTimeout(() => {
          if (confirm(`Mở ${platformType} ngay?`)) window.open(targetUrl, '_blank');
        }, 1000);
      }
    } catch (error: any) {
      toast({ title: "❌ Lỗi xuất file", description: error.message, variant: "destructive" });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: "Đã nhận lệnh! Vui lòng tải tài liệu lên.", timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 500);
  };

  const renderContent = (content: string) => {
    if (content.includes("tạo xong") || content.startsWith('[') || content.startsWith('{')) {
      return (
        <div className="space-y-4 mt-2">
          <p className="text-sm text-slate-700 dark:text-gray-300">{content}</p>
          <Button onClick={() => setView('editor')} className="w-full bg-indigo-600/20 border border-indigo-500/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600/40 py-6 group">
            <Sparkles className="mr-2 h-4 w-4 text-yellow-500 group-hover:animate-pulse" /> Xem lại & Chỉnh sửa nội dung
          </Button>
        </div>
      );
    }
    return <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-gray-300">{content}</p>;
  };

  const ThemeToggle = () => (
    <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="flex flex-col h-screen w-full animate-ocean-wave isolate overflow-hidden transition-colors duration-300 font-sans bg-white dark:bg-[#050509] text-slate-900 dark:text-white">

        {/* SETTINGS VIEW */}
        {view === 'settings' && (
          <div className="flex h-screen w-full bg-transparent overflow-hidden ...">
            <div className="max-w-4xl mx-auto w-full p-8 overflow-y-auto">
              <div className="flex items-center gap-4 mb-8">
                <Button onClick={() => setView('chat')} variant="ghost" size="icon" className="rounded-full"><ChevronLeft /></Button>
                <h1 className="text-3xl font-black">Cài đặt hệ thống</h1>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 space-y-2">
                  {['Chung', 'Bảo mật', 'Thông báo', 'Gói dịch vụ'].map((item: any, i) => (
                    <div key={i} onClick={() => setSettingsTab(item)} className={`p-3 rounded-xl cursor-pointer font-bold text-sm transition-all ${settingsTab === item ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-white/5'}`}>{item}</div>
                  ))}
                </div>
                <div className="col-span-2 space-y-6">
                  {settingsTab === 'Chung' && (
                    <Card className="p-6 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-3xl animate-in fade-in slide-in-from-bottom-2">
                      <h3 className="font-bold mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" /> Cấu hình AI</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                          <div><p className="text-sm font-bold">Mô hình mặc định</p><p className="text-[11px] text-slate-500">Galaxy-4 Turbo (Tốc độ cao)</p></div>
                          <Button variant="outline" size="sm" className="rounded-lg">Thay đổi</Button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                          <div><p className="text-sm font-bold">Ngôn ngữ phản hồi</p><p className="text-[11px] text-slate-500">Tiếng Việt</p></div>
                          <div className="flex gap-2"><span className="px-2 py-1 bg-indigo-500/20 text-indigo-500 text-[10px] rounded font-bold">VN</span><span className="px-2 py-1 bg-slate-500/10 text-slate-500 text-[10px] rounded font-bold">EN</span></div>
                        </div>
                      </div>
                    </Card>
                  )}
                  {settingsTab === 'Bảo mật' && (
                    <Card className="p-6 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-3xl animate-in fade-in slide-in-from-bottom-2">
                      <h3 className="font-bold mb-4 flex items-center gap-2"><Lock className="h-4 w-4 text-rose-500" /> Bảo mật tài khoản</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-between">
                          <div><p className="text-sm font-bold">Xác thực 2 lớp (2FA)</p><p className="text-[11px] text-slate-500">Tăng cường bảo mật cho tài khoản của bạn</p></div>
                          <div className="w-10 h-5 bg-slate-300 dark:bg-white/10 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
                        </div>
                        <Button className="w-full bg-slate-900 dark:bg-indigo-600 text-white rounded-xl h-12">Đổi mật khẩu truy cập</Button>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && (
          <div className="flex h-screen w-full bg-transparent overflow-hidden ...">
            <div className="max-w-2xl mx-auto w-full p-8 flex flex-col items-center">
              <div className="w-full flex justify-start mb-8"><Button onClick={() => setView('chat')} variant="ghost" size="icon" className="rounded-full"><ChevronLeft /></Button></div>
              <h1 className="text-2xl font-black mb-1">{user?.name}</h1>
              <p className="text-slate-500 text-sm mb-8">{user?.email}</p>
              <div className="grid grid-cols-2 gap-4 w-full">
                <Card className="p-6 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-3xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TÀI LIỆU</p><p className="text-2xl font-black">128</p>
                </Card>
                <Card className="p-6 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-3xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CÂU HỎI ĐÃ TẠO</p><p className="text-2xl font-black">1.4k</p>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* EDITOR VIEW */}
        {view === 'editor' && (
          <div className="flex h-screen w-full bg-slate-50 dark:bg-[#05060f] overflow-hidden animate-in fade-in duration-500">
            <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-white/5">
              <div className="px-8 pt-6 pb-4 flex justify-between items-center shrink-0">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1"><FileText className="h-3 w-3" /> CHẾ ĐỘ CHỈNH SỬA</div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Kiểm tra & Chỉnh sửa</h1>
                </div>
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <Button onClick={() => setView('chat')} variant="ghost" className="text-slate-500 hover:bg-slate-200 rounded-xl h-10 px-4"><ChevronLeft className="mr-2 h-4 w-4" /> Quay lại Chat</Button>
                  <ExportOptions onExport={handleFinalExport} />
                </div>
              </div>

              <div className="px-8 mt-2 flex gap-8 border-b border-slate-200 dark:border-white/5 shrink-0">
                <div onClick={() => setEditorTab('lms')} className={`pb-3 text-[11px] font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${editorTab === 'lms' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400'}`}>Bài kiểm tra (LMS)</div>
              </div>

              <div className="px-8 py-4 flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-white/5 p-1 rounded-lg border border-slate-300 dark:border-white/5">
                  <Button onClick={addNewQuestion} size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10"><Plus className="h-4 w-4" /></Button>
                  <Button onClick={() => deleteQuestion(dataToEdit[0]?.id)} size="icon" variant="ghost" className="h-8 w-8 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden px-8 pb-8 gap-6">
                <ScrollArea className="flex-1">
                  <div className="space-y-6 pr-4">
                    {dataToEdit.map((q, idx) => (
                      <div key={idx} className="bg-white dark:bg-[#0b0c16] border border-slate-200 dark:border-white/5 p-8 rounded-[2rem]">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-500">Q{idx + 1}</div>
                        </div>
                        <div className="space-y-4">
                          <input className="w-full bg-slate-50 dark:bg-[#121320] border border-slate-200 dark:border-white/5 rounded-xl p-5 text-sm outline-none" value={q.question} onChange={(e) => handleUpdateQuestion(q.id, 'question', e.target.value)} />
                          <div className="space-y-2.5">
                            {q.options?.map((opt, j) => (
                              <div key={j} className={`flex items-center p-2 rounded-xl border transition-all ${j === q.correct ? 'border-blue-500 bg-blue-50 dark:bg-blue-600/5' : 'border-slate-100 dark:border-white/5'}`}>
                                <div onClick={() => handleUpdateQuestion(q.id, 'correct', j)} className={`w-4 h-4 rounded-full border-2 mr-4 flex items-center justify-center cursor-pointer ${j === q.correct ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}></div>
                                <input className="flex-1 bg-transparent outline-none text-[13px]" value={opt} onChange={(e) => handleUpdateOption(q.id, j, e.target.value)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="w-80 p-6 flex flex-col gap-8 shrink-0 bg-slate-50 dark:bg-[#05060f]">
              <div className="bg-white dark:bg-[#0b0c16] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[50px] -mr-16 -mt-16 rounded-full" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg"><MessageSquare className="h-4 w-4 text-white" /></div>
                  <div><h4 className="font-bold text-xs">GalaxyBot</h4><span className="text-[9px] text-blue-600 font-bold">Trợ lý AI</span></div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-6">Bạn có thể chỉnh sửa trực tiếp nội dung câu hỏi bên trái. Sau khi hoàn tất, hãy nhấn nút xuất tệp ở góc trên.</p>
              </div>
            </div>
          </div>
        )}

        {/* CHAT VIEW */}
        {view === 'chat' && (
          <div className="flex flex-col h-screen w-full bg-white dark:bg-[#050509]">
            {/* Header - [ĐÃ KHÔI PHỤC] */}
            <div className="h-16 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><LayoutGrid className="h-4 w-4" /></div>
                <div className="flex flex-col">
                  <span className="font-black text-lg tracking-tighter leading-none">EduTech <span className="text-indigo-600 dark:text-indigo-400">AI</span></span>
                  <span className="text-[9px] font-medium text-slate-400 tracking-widest uppercase mt-1">DAAI Lab</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button onClick={() => setView('settings')} variant="ghost" size="icon" className="text-slate-500 dark:text-gray-400 rounded-xl" title="Cài đặt"><Settings className="h-4 w-4" /></Button>
                <div onClick={() => setView('profile')} className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#161625] flex items-center justify-center text-indigo-600 cursor-pointer hover:ring-2 ring-indigo-500 transition-all"><User className="h-5 w-5" /></div>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-80 border-r border-slate-200 dark:border-white/5 p-5 flex flex-col gap-6">

                {/* 1. Chọn Nền tảng - [ĐÃ KHÔI PHỤC] */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">NỀN TẢNG MỤC TIÊU</h3>
                  <div className="space-y-2">
                    {platforms.map(p => (
                      <div key={p.id} onClick={() => setSelectedPlatform(p.id)} className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedPlatform === p.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/5'}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{p.icon}</span>
                          <div>
                            <p className="font-bold text-[10px] leading-none">{p.name}</p>
                            <p className="text-[9px] text-slate-500 mt-1">{p.description}</p>
                          </div>
                          {selectedPlatform === p.id && <CheckCircle2 className="h-3 w-3 text-indigo-500 ml-auto" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Upload Button */}
                <div className="pt-2">
                  <div onClick={() => fileInputRef.current?.click()} className="relative w-full group cursor-pointer">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative flex flex-col items-center justify-center py-6 px-4 bg-white dark:bg-[#0b0b15] border border-slate-200 dark:border-white/10 rounded-2xl group-hover:border-indigo-500/50 transition-all shadow-sm">
                      <div className="mb-3 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform"><UploadCloud className="h-6 w-6" /></div>
                      <div className="text-center">
                        <p className="text-[11px] font-bold">Tải lên tài liệu PDF mới</p>
                        <p className="text-[9px] text-slate-400 mt-1">Hỗ trợ tối đa 50MB</p>
                      </div>
                    </div>
                  </div>
                  <input id="file-upload-input" name="file-upload" type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />
                </div>

                {/* 3. File đã tải - [ĐÃ KHÔI PHỤC] */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-3 px-1 border-t border-slate-200 dark:border-white/5 pt-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">TÀI LIỆU ĐÃ TẢI</h3>
                    <HardDrive className="h-3 w-3 text-slate-400" />
                  </div>
                  <ScrollArea className="flex-1 -mx-1 px-1">
                    <div className="space-y-2">
                      {UPLOADED_FILES.map(file => (
                        <div key={file.id} className="group p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-indigo-500/50 transition-all cursor-pointer relative overflow-hidden">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0"><FileText className="h-4 w-4 text-rose-500" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold truncate pr-4">{file.name}</p>
                              <div className="flex items-center gap-2 mt-0.5"><span className="text-[9px] font-medium text-indigo-600 bg-indigo-50 px-1 rounded">{file.size}</span><span className="text-[9px] text-slate-400">{file.date}</span></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col relative">
                <ScrollArea className="flex-1 px-8 pt-8">
                  <div className="max-w-3xl mx-auto space-y-8">
                    {/* Welcome Screen - [ĐÃ KHÔI PHỤC] */}
                    {messages.length === 0 && (
                      <div className="text-center py-32 flex flex-col items-center">
                        <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-6 shadow-2xl ${STYLES.galaxyGradient} animate-bounce`}>
                          <BrainCircuit className="h-12 w-12 text-white" />
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter mb-4">EduTech <span className="text-indigo-600 dark:text-indigo-400">AI</span></h2>
                        <p className="text-slate-500 text-sm font-medium">Trợ lý học tập thông minh dành cho sinh viên.</p>
                      </div>
                    )}
                    {messages.map((m) => (
                      <div key={m.id} className={`flex gap-5 animate-in slide-in-from-bottom-2 duration-300 ${m.role === 'user' ? 'justify-end' : ''}`}>
                        {m.role === 'assistant' && (
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#0b0b15] border border-slate-200 dark:border-gray-800 flex items-center justify-center flex-shrink-0"><Sparkles className="h-5 w-5 text-indigo-500" /></div>
                        )}
                        <div className={`max-w-[85%] rounded-[1.5rem] px-6 py-4 border shadow-sm ${m.role === 'user' ? STYLES.userMessage : 'bg-white dark:bg-[#0b0b15]/80 border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-200 backdrop-blur-sm'}`}>
                          {renderContent(m.content)}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef}></div>
                  </div>
                </ScrollArea>
                <div className="p-8">
                  <div className="max-w-3xl mx-auto relative group">
                    <div className={STYLES.inputGlow} />
                    <div className="relative flex flex-col gap-3 bg-white dark:bg-[#0b0b15]/90 p-3 rounded-[1.5rem] border border-slate-200 dark:border-gray-800/80 shadow-xl backdrop-blur-xl">
                      {/* Hiển thị file đã chọn */}
                      {selectedFile && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-300">
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate flex-1">{selectedFile.name}</span>
                          <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-500"><X className="h-3 w-3" /></button>
                        </div>
                      )}
                      <div className="flex gap-4 items-center">
                        <Button size="icon" variant="ghost" className="text-slate-400 ml-2" title="Chọn file" onClick={() => fileInputRef.current?.click()}>
                          <Plus className="h-5 w-5" />
                        </Button>
                        <Input
                          id="chat-message-input"
                          name="chat-message"
                          placeholder={selectedFile ? "Nhập yêu cầu của bạn (ví dụ: Tạo 10 câu hỏi khó)..." : "Hỏi AI về tài liệu của bạn..."}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (selectedFile ? handleAnalyze() : handleSend())}
                          className="bg-transparent border-none focus-visible:ring-0 py-7 text-sm"
                          disabled={isLoading}
                        />
                        {selectedFile ? (
                          <Button onClick={handleAnalyze} disabled={isLoading} className="mr-1 h-10 px-4 bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl text-white text-xs font-bold shadow-lg">
                            {isLoading ? <span className="animate-spin">⏳</span> : <><Sparkles className="h-4 w-4 mr-1" />Phân tích</>}
                          </Button>
                        ) : (
                          <Button onClick={handleSend} size="icon" className={STYLES.sendButton + " mr-1"}><Send className="h-4 w-4 text-white" /></Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}