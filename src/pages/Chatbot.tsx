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

const ExportOptions = () => {
  const options = [
    { 
      title: "Tài liệu PDF (.pdf)", 
      desc: "Bao gồm tóm tắt & phân tích đầy đủ", 
      icon: <FileText className="h-5 w-5 text-rose-500" />, 
      bg: "bg-rose-500/10" 
    },
    { 
      title: "Microsoft Word (.docx)", 
      desc: "Tài liệu học tập có thể chỉnh sửa", 
      icon: <FileDown className="h-5 w-5 text-blue-500" />, 
      bg: "bg-blue-500/10" 
    },
    { 
      title: "Bảng tính Excel (.xlsx)", 
      desc: "Danh sách câu hỏi & đáp án", 
      icon: <Table className="h-5 w-5 text-emerald-500" />, 
      bg: "bg-emerald-500/10" 
    },
    { 
      title: "Quizlet CSV / TXT", 
      desc: "Nhập trực tiếp vào Quizlet nhanh chóng", 
      icon: <FileType className="h-5 w-5 text-orange-500" />, 
      bg: "bg-orange-500/10" 
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-10 px-6 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
          <Download className="mr-2 h-4 w-4" /> Xuất tệp
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-2 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl"
      >
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
           <Download className="h-3 w-3" /> Tùy chọn xuất bản
        </div>
        {options.map((opt, i) => (
          <DropdownMenuItem 
            key={i} 
            className="flex items-center gap-4 p-3 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 focus:bg-slate-100 dark:focus:bg-white/5 transition-colors outline-none"
          >
            <div className={`w-10 h-10 rounded-xl ${opt.bg} flex items-center justify-center shrink-0`}>
              {opt.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {opt.title}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {opt.desc}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface Question {
  id: string;
  type: 'TRẮC NGHIỆM' | 'ĐÚNG / SAI' | 'TRẢ LỜI NGẮN';
  question: string;
  options: string[];
  correct: number;
}

interface Message { 
  id: string; 
  role: 'user' | 'assistant'; 
  content: string; 
  timestamp: Date; 
}

const platforms = [
  { id: 'NEU LMS', name: 'NEU LMS', description: 'Chế độ Học thuật', icon: '🎓', color: 'border-blue-500/50 bg-blue-500/10 text-blue-400' },
  { id: 'Quizlet', name: 'Quizlet', description: 'Thẻ ghi nhớ', icon: '📝', color: 'border-purple-500/50 bg-purple-500/10 text-purple-400' },
  { id: 'Kahoot', name: 'Kahoot', description: 'Trò chơi tương tác', icon: '🎮', color: 'border-orange-500/50 bg-orange-500/10 text-orange-400' },
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
  const [dataToEdit, setDataToEdit] = useState<Question[]>([
    { 
        id: '1',
        type: 'TRẮC NGHIỆM', 
        question: 'Cơ chế chính mà các ngôi sao dãy chính tạo ra năng lượng là gì?', 
        options: ['Sự co lại do trọng lực', 'Phản ứng nhiệt hạch hydro thành heli', 'Sự cháy hóa học'],
        correct: 1
    },
    {
        id: '2',
        type: 'ĐÚNG / SAI',
        question: 'Sao Khổng lồ đỏ nóng hơn Sao Lùn trắng.',
        options: ['Đúng', 'Sai'],
        correct: 1
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { client.auth.me().then(res => setUser(res.data)).catch(() => {}); }, []);

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
    toast({ title: "Đã xóa câu hỏi", variant: "destructive" });
  };

  const addNewQuestion = () => {
    const newQ: Question = {
      id: Date.now().toString(),
      type: 'TRẮC NGHIỆM',
      question: 'Nhập nội dung câu hỏi mới...',
      options: ['Lựa chọn A', 'Lựa chọn B'],
      correct: 0
    };
    setDataToEdit(prev => [...prev, newQ]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    setTimeout(() => {
        const aiMsg: Message = { 
            id: (Date.now()+1).toString(), 
            role: 'assistant', 
            content: "Tôi đã tạo xong bộ câu hỏi từ tài liệu của bạn. Bạn có thể nhấn vào nút bên dưới để xem lại và chỉnh sửa.",
            timestamp: new Date() 
        };
        setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  const renderContent = (content: string) => {
    if (content.includes("tạo xong") || content.startsWith('[') || content.startsWith('{')) {
      return (
        <div className="space-y-4 mt-2">
          <p className="text-sm text-slate-700 dark:text-gray-300">{content}</p>
          <Button 
            onClick={() => setView('editor')}
            className="w-full bg-indigo-600/20 border border-indigo-500/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-600/40 py-6 group"
          >
            <Sparkles className="mr-2 h-4 w-4 text-yellow-500 group-hover:animate-pulse" /> Xem lại & Chỉnh sửa nội dung
          </Button>
        </div>
      );
    }
    return <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-gray-300">{content}</p>;
  };

  const ThemeToggle = () => (
    <Button 
      variant="ghost" size="icon" 
      onClick={() => setIsDarkMode(!isDarkMode)}
      className="text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
    >
      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="flex flex-col h-screen w-full animate-ocean-wave isolate overflow-hidden transition-colors duration-300 font-sans">
        
        {/* SETTINGS VIEW */}
        {view === 'settings' && (
          <div className="flex h-screen w-full bg-transparent text-slate-900 dark:text-gray-200 overflow-hidden ...">
             <div className="max-w-4xl mx-auto w-full p-8 overflow-y-auto">
                <div className="flex items-center gap-4 mb-8">
                  <Button onClick={() => setView('chat')} variant="ghost" size="icon" className="rounded-full"><ChevronLeft /></Button>
                  <h1 className="text-3xl font-black">Cài đặt hệ thống</h1>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1 space-y-2">
                    {['Chung', 'Bảo mật', 'Thông báo', 'Gói dịch vụ'].map((item: any, i) => (
                      <div 
                        key={i} 
                        onClick={() => setSettingsTab(item)}
                        className={`p-3 rounded-xl cursor-pointer font-bold text-sm transition-all ${settingsTab === item ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-200 dark:hover:bg-white/5'}`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="col-span-2 space-y-6">
                    {/* CHUNG */}
                    {settingsTab === 'Chung' && (
                      <Card className="p-6 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-3xl animate-in fade-in slide-in-from-bottom-2">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" /> Cấu hình AI</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                            <div>
                              <p className="text-sm font-bold">Mô hình mặc định</p>
                              <p className="text-[11px] text-slate-500">Galaxy-4 Turbo (Tốc độ cao)</p>
                            </div>
                            <Button variant="outline" size="sm" className="rounded-lg">Thay đổi</Button>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                            <div>
                              <p className="text-sm font-bold">Ngôn ngữ phản hồi</p>
                              <p className="text-[11px] text-slate-500">Tiếng Việt</p>
                            </div>
                            <div className="flex gap-2">
                               <span className="px-2 py-1 bg-indigo-500/20 text-indigo-500 text-[10px] rounded font-bold">VN</span>
                               <span className="px-2 py-1 bg-slate-500/10 text-slate-500 text-[10px] rounded font-bold">EN</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* BẢO MẬT */}
                    {settingsTab === 'Bảo mật' && (
                      <Card className="p-6 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-3xl animate-in fade-in slide-in-from-bottom-2">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><Lock className="h-4 w-4 text-rose-500" /> Bảo mật tài khoản</h3>
                        <div className="space-y-4">
                           <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-between">
                             <div>
                               <p className="text-sm font-bold">Xác thực 2 lớp (2FA)</p>
                               <p className="text-[11px] text-slate-500">Tăng cường bảo mật cho tài khoản của bạn</p>
                             </div>
                             <div className="w-10 h-5 bg-slate-300 dark:bg-white/10 rounded-full relative cursor-pointer">
                               <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                             </div>
                           </div>
                           <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-between">
                             <div>
                               <p className="text-sm font-bold">Mã hóa dữ liệu</p>
                               <p className="text-[11px] text-slate-500">AES-256 Bit chuẩn quân đội</p>
                             </div>
                             <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                           </div>
                           <Button className="w-full bg-slate-900 dark:bg-indigo-600 text-white rounded-xl h-12">Đổi mật khẩu truy cập</Button>
                        </div>
                      </Card>
                    )}

                    {/* THÔNG BÁO */}
                    {settingsTab === 'Thông báo' && (
                      <Card className="p-6 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-3xl animate-in fade-in slide-in-from-bottom-2">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-orange-500" /> Cài đặt thông báo</h3>
                        <div className="space-y-3">
                          {['Email thông báo khi hoàn thành AI', 'Thông báo đẩy trình duyệt', 'Cập nhật tính năng mới'].map((txt, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                              <span className="text-sm font-medium">{txt}</span>
                              <div className={`w-10 h-5 ${idx === 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/10'} rounded-full relative`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${idx === 0 ? 'right-1' : 'left-1'}`}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* GÓI DỊCH VỤ */}
                    {settingsTab === 'Gói dịch vụ' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <Card className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none rounded-3xl shadow-xl shadow-indigo-500/20">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Gói hiện tại</p>
                              <h2 className="text-3xl font-black mt-1">Premium Plus</h2>
                            </div>
                            <Zap className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                          </div>
                          <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4" /> Không giới hạn file tải lên</div>
                            <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4" /> Ưu tiên xử lý Galaxy-4 Turbo</div>
                          </div>
                          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                            <span className="text-xs text-indigo-100">Hết hạn vào 20/12/2026</span>
                            <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl h-9 px-4">Gia hạn ngay</Button>
                          </div>
                        </Card>
                        <Card className="p-5 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-3xl flex items-center justify-between">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                               <CreditCard className="text-slate-500" />
                             </div>
                             <div>
                               <p className="text-sm font-bold">Phương thức thanh toán</p>
                               <p className="text-[11px] text-slate-500">Visa kết thúc bằng **** 4242</p>
                             </div>
                           </div>
                           <Button variant="ghost" className="text-indigo-500 text-xs font-bold">Quản lý</Button>
                        </Card>
                      </div>
                    )}

                    <Card className="p-6 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-3xl">
                       <h3 className="font-bold mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-500" /> Quyền riêng tư</h3>
                       <p className="text-xs text-slate-500 mb-4">Dữ liệu của bạn được mã hóa đầu cuối và không dùng để huấn luyện AI.</p>
                       <Button className="w-full bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl">Quản lý dữ liệu tải lên</Button>
                    </Card>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && (
          <div className="flex h-screen w-full bg-transparent text-slate-900 dark:text-gray-200 overflow-hidden ...">
             <div className="max-w-2xl mx-auto w-full p-8 flex flex-col items-center">
                <div className="w-full flex justify-start mb-8">
                   <Button onClick={() => setView('chat')} variant="ghost" size="icon" className="rounded-full"><ChevronLeft /></Button>
                </div>
                
                <div className="relative mb-6">
                   <div className="w-32 h-32 rounded-[3rem] bg-gradient-to-tr from-indigo-500 to-pink-500 p-1">
                      <div className="w-full h-full rounded-[2.8rem] bg-white dark:bg-[#0b0c16] flex items-center justify-center">
                         <User className="h-12 w-12 text-indigo-500" />
                      </div>
                   </div>
                   <div className="absolute bottom-0 right-0 bg-emerald-500 p-2 rounded-2xl border-4 border-slate-50 dark:border-[#05060f]">
                      <BadgeCheck className="h-5 w-5 text-white" />
                   </div>
                </div>

                <h1 className="text-2xl font-black mb-1">{user?.name || "Người dùng EduTech"}</h1>
                <p className="text-slate-500 text-sm mb-8">{user?.email || "student@neu.edu.vn"}</p>

                <div className="grid grid-cols-2 gap-4 w-full">
                   <Card className="p-6 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-3xl text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TÀI LIỆU</p>
                      <p className="text-2xl font-black">128</p>
                   </Card>
                   <Card className="p-6 bg-white dark:bg-[#0b0c16] border-slate-200 dark:border-white/10 rounded-3xl text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CÂU HỎI ĐÃ TẠO</p>
                      <p className="text-2xl font-black">1.4k</p>
                   </Card>
                </div>

                <div className="w-full mt-8 space-y-3">
                   <Button className="w-full justify-between h-14 px-6 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                         <CreditCard className="h-5 w-5 text-indigo-500" />
                         <span className="font-bold text-sm">Gói dịch vụ: Premium</span>
                      </div>
                      <ChevronLeft className="h-4 w-4 rotate-180 text-slate-400" />
                   </Button>
                   <Button className="w-full justify-between h-14 px-6 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-none">
                      <div className="flex items-center gap-3">
                         <LogOut className="h-5 w-5" />
                         <span className="font-bold text-sm">Đăng xuất tài khoản</span>
                      </div>
                   </Button>
                </div>
             </div>
          </div>
        )}

        {/* EDITOR VIEW */}
        {view === 'editor' && (
          <div className="flex h-screen w-full bg-slate-50 dark:bg-[#05060f] text-slate-900 dark:text-gray-200 overflow-hidden animate-in fade-in duration-500">
            <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-white/5">
              <div className="px-8 pt-6 pb-4 flex justify-between items-center shrink-0">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    <FileText className="h-3 w-3" /> CHẾ ĐỘ CHỈNH SỬA
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Kiểm tra & Chỉnh sửa</h1>
                  <p className="text-slate-500 dark:text-gray-500 text-[11px] mt-0.5">Được tạo từ 'Introduction to Astrophysics.pdf'</p>
                </div>
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <Button onClick={() => setView('chat')} variant="ghost" className="text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl h-10 px-4">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Quay lại Chat
                  </Button>
                  <ExportOptions />
                </div>
              </div>

              <div className="px-8 mt-2 flex gap-8 border-b border-slate-200 dark:border-white/5 shrink-0">
                <div 
                  onClick={() => setEditorTab('lms')}
                  className={`pb-3 text-[11px] font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${editorTab === 'lms' ? 'border-blue-500 text-blue-600 dark:text-blue-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Bài kiểm tra (LMS) <span className="bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 text-[9px] px-1.5 py-0.5 rounded-md">12</span>
                </div>
                <div 
                  onClick={() => setEditorTab('interactive')}
                  className={`pb-3 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${editorTab === 'interactive' ? 'border-orange-500 text-orange-600 dark:text-orange-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Câu hỏi tương tác
                </div>
                <div 
                  onClick={() => setEditorTab('flashcard')}
                  className={`pb-3 text-[11px] font-bold border-b-2 transition-all cursor-pointer ${editorTab === 'flashcard' ? 'border-purple-500 text-purple-600 dark:text-purple-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  Thẻ ghi nhớ
                </div>
              </div>

              <div className="px-8 py-4 flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-200/50 dark:bg-white/5 p-1 rounded-lg border border-slate-300 dark:border-white/5">
                  <Button onClick={addNewQuestion} size="icon" variant="ghost" className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-900 dark:hover:text-white hover:bg-white/10" title="Thêm câu hỏi"><Plus className="h-4 w-4" /></Button>
                  <Button onClick={() => deleteQuestion(dataToEdit[0]?.id)} size="icon" variant="ghost" className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10" title="Xóa câu hỏi"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="h-6 w-[1px] bg-slate-300 dark:bg-white/10 mx-1" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase">Hỗ trợ AI:</span>
                  <Button size="sm" className="bg-white dark:bg-[#1a1b2e] border border-slate-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[10px] h-8 px-4 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/20 shadow-sm transition-all">Tạo lại bộ câu hỏi</Button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden px-8 pb-8 gap-6">
                <div className="flex-1 bg-slate-200/30 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-3xl flex items-center justify-center flex-col gap-4">
                  <FileText className="h-12 w-12 text-slate-300 dark:text-white/10" />
                  <p className="text-[11px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Khu vực xem trước tài liệu</p>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-6 pr-4">
                    {/* Render according to tabs */}
                    {editorTab === 'lms' && dataToEdit.map((q, idx) => (
                      <div key={q.id} className="bg-white dark:bg-[#0b0c16] border border-slate-200 dark:border-white/5 p-8 rounded-[2rem] relative group shadow-sm dark:shadow-none animate-in fade-in duration-300">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-500">Q{idx + 1}</div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{q.type}</span>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 block tracking-wide">Nội dung câu hỏi</label>
                            <div className="bg-slate-50 dark:bg-[#121320] border border-slate-200 dark:border-white/5 rounded-xl p-5 text-sm text-slate-800 dark:text-white/90 leading-relaxed">
                              {q.question}
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 block tracking-wide">Các phương án trả lời</label>
                            <div className="space-y-2.5">
                              {q.options?.map((opt, j) => (
                                <div key={j} className={`flex items-center p-4 rounded-xl border transition-all ${j === q.correct ? 'bg-blue-50 dark:bg-blue-600/5 border-blue-500/40' : 'bg-slate-50 dark:bg-[#121320] border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}>
                                  <div className={`w-4 h-4 rounded-full border-2 mr-4 flex items-center justify-center ${j === q.correct ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-white/10'}`}>
                                    {j === q.correct && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                  </div>
                                  <span className={`text-[13px] flex-1 ${j === q.correct ? 'text-blue-700 dark:text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>{opt}</span>
                                  {j === q.correct && <CheckCircle2 className="h-4 w-4 text-green-500/80" />}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {editorTab === 'interactive' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <Card className="p-8 bg-orange-500/5 border-orange-500/20 rounded-[2rem]">
                           <div className="flex items-center gap-3 mb-4">
                              <Sparkles className="h-5 w-5 text-orange-500" />
                              <h3 className="font-bold text-orange-600">Giao diện Kahoot/Quizizz</h3>
                           </div>
                           <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Câu hỏi đã được tối ưu hóa với thời gian 20 giây và hình ảnh minh họa sống động.</p>
                           <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">Chạy thử Quiz</Button>
                        </Card>
                      </div>
                    )}

                    {editorTab === 'flashcard' && (
                       <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-right-4">
                          {[1,2,3].map(i => (
                            <div key={i} className="group h-48 [perspective:1000px] cursor-pointer">
                              <div className="relative h-full w-full rounded-3xl shadow-lg transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                                <div className="absolute inset-0 bg-white dark:bg-[#0b0c16] border border-slate-200 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden]">
                                  <span className="text-[10px] font-bold text-indigo-500 mb-2">MẶT TRƯỚC (THUẬT NGỮ)</span>
                                  <p className="text-lg font-bold text-center">Black Hole (Hố đen)</p>
                                </div>
                                <div className="absolute inset-0 h-full w-full rounded-3xl bg-indigo-600 p-6 text-white [transform:rotateY(180deg)] [backface-visibility:hidden]">
                                  <div className="flex flex-col items-center justify-center h-full">
                                    <span className="text-[10px] font-bold text-indigo-200 mb-2">MẶT SAU (ĐỊNH NGHĨA)</span>
                                    <p className="text-sm text-center">Một vùng không-thời gian có trường hấp dẫn mạnh đến mức không có gì có thể thoát ra được.</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                       </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="w-80 p-6 flex flex-col gap-8 shrink-0 bg-slate-50 dark:bg-[#05060f]">
              <div className="bg-white dark:bg-[#0b0c16] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-xl dark:shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 dark:bg-indigo-600/10 blur-[50px] -mr-16 -mt-16 rounded-full" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg"><MessageSquare className="h-4 w-4 text-white" /></div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-none">GalaxyBot</h4>
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tighter">Trợ lý AI</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  Tôi nhận thấy <span className="text-slate-900 dark:text-white font-bold">Câu hỏi 2</span> có vẻ hơi mơ hồ. Bạn có muốn tôi gợi ý cách diễn đạt rõ ràng hơn không?
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] h-9 rounded-lg font-bold">Sửa ngay</Button>
                  <Button variant="ghost" className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-500 text-[10px] h-9 rounded-lg">Bỏ qua</Button>
                </div>
              </div>

              <div className="space-y-4 px-1">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Tóm tắt nội dung</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Tổng số câu hỏi</span>
                    <span className="text-slate-900 dark:text-white font-bold">12</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Thời gian dự kiến</span>
                    <span className="text-slate-900 dark:text-white font-bold">15 phút</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Độ khó</span>
                    <span className="bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase">Trung bình</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-1">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Định dạng xuất</h3>
                <div className="space-y-2">
                  {[
                    { id: 'lms', name: 'NEU LMS (Moodle)', active: editorTab === 'lms' },
                    { id: 'quizlet', name: 'Quizlet (CSV)', active: editorTab === 'flashcard' },
                    { id: 'wayground', name: 'Wayground', active: false }
                  ].map((fmt) => (
                    <div key={fmt.id} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${fmt.active ? 'bg-blue-50 dark:bg-blue-600/5 border-blue-500/40 shadow-sm' : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${fmt.active ? 'border-blue-500' : 'border-slate-300 dark:border-white/10'}`}>
                        {fmt.active && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                      </div>
                      <span className={`text-[11px] font-bold ${fmt.active ? 'text-blue-700 dark:text-white' : 'text-slate-400'}`}>{fmt.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHAT VIEW */}
        {view === 'chat' && (
          <div className="flex flex-col h-screen w-full bg-white dark:bg-[#050509] overflow-hidden text-slate-900 dark:text-white transition-colors duration-300">
             <div className="h-16 w-full border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0b0b15]/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
                  <LayoutGrid className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-lg tracking-tighter leading-none text-slate-900 dark:text-white">EduTech <span className="text-indigo-600 dark:text-indigo-400">AI</span></span>
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
              <div className="w-80 border-r border-slate-200 dark:border-gray-800/50 bg-slate-50 dark:bg-[#0b0b15] p-5 flex flex-col gap-6 shrink-0">
                
                {/* 1. CHỌN NỀN TẢNG */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">NỀN TẢNG MỤC TIÊU</h3>
                  <div className="space-y-2">
                    {platforms.map(p => (
                      <div key={p.id} onClick={() => setSelectedPlatform(p.id)}
                        className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedPlatform === p.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{p.icon}</span>
                          <div>
                            <p className="font-bold text-[10px] text-slate-800 dark:text-white leading-none">{p.name}</p>
                            <p className="text-[9px] text-slate-500 mt-1">{p.description}</p>
                          </div>
                          {selectedPlatform === p.id && <CheckCircle2 className="h-3 w-3 text-indigo-500 ml-auto" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. NÚT TẢI LÊN */}
                <div className="pt-2">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full group cursor-pointer"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative flex flex-col items-center justify-center py-6 px-4 bg-white dark:bg-[#0b0b15] border border-slate-200 dark:border-white/10 rounded-2xl group-hover:border-indigo-500/50 transition-all shadow-sm">
                      <div className="mb-3 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Tải lên tài liệu PDF mới</p>
                        <p className="text-[9px] text-slate-400 mt-1">Hỗ trợ tối đa 50MB</p>
                      </div>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" />
                </div>

                {/* 3. HIỂN THỊ FILE ĐÃ TẢI LÊN */}
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
                            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4 text-rose-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate pr-4">{file.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1 rounded">{file.size}</span>
                                <span className="text-[9px] text-slate-400">{file.date}</span>
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute right-1 top-1 text-slate-400 hover:text-rose-500">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <div className="flex-1 flex flex-col relative"
                style={{
                  background: isDarkMode 
                    ? `radial-gradient(circle at 50% 0%, rgba(67, 43, 107, 0.4) 0%, transparent 50%), #0B0C15` 
                    : `radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.05) 0%, transparent 50%), #F8FAFC`
                }}
              >
                <ScrollArea className="flex-1 px-8 pt-8">
                  <div className="max-w-3xl mx-auto space-y-8">
                    {messages.length === 0 && (
                      <div className="text-center py-32 flex flex-col items-center">
                        <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-6 shadow-2xl ${STYLES.galaxyGradient} animate-bounce`}>
                          <BrainCircuit className="h-12 w-12 text-white" />
                        </div>
                        <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">EduTech <span className="text-indigo-600 dark:text-indigo-400">AI</span></h2>
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
                    <div ref={messagesEndRef} className="h-10" />
                  </div>
                </ScrollArea>

                <div className="p-8">
                  <div className="max-w-3xl mx-auto relative group">
                    <div className={STYLES.inputGlow} />
                    <div className="relative flex gap-4 bg-white dark:bg-[#0b0b15]/90 p-3 rounded-[1.5rem] border border-slate-200 dark:border-gray-800/80 shadow-xl items-center backdrop-blur-xl">
                      <Button size="icon" variant="ghost" className="text-slate-400 ml-2" title="Đính kèm"><Plus className="h-5 w-5" /></Button>
                      <Input 
                        placeholder="Hỏi AI về tài liệu của bạn..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="bg-transparent border-none focus-visible:ring-0 text-slate-900 dark:text-gray-200 py-7 text-sm"
                      />
                      <Button onClick={handleSend} size="icon" className={STYLES.sendButton + " mr-1"} title="Gửi tin nhắn">
                        <Send className="h-4 w-4 text-white" />
                      </Button>
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