import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Chatbot from './pages/Chatbot';
import AuthCallback from './pages/AuthCallback';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Xử lý xác thực người dùng */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Bọc trong Layout đã rút gọn (chỉ còn Logo và nút Đăng nhập) */}
          <Route path="/" element={<Layout />}>
            {/* Khi vào trang chủ sẽ hiện ngay Chatbot */}
            <Route index element={<Chatbot />} />
          </Route>

          {/* Trang lỗi 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;