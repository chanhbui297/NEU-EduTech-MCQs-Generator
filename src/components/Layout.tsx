import { Outlet, Link } from 'react-router-dom';
import { BookOpen, User, LogOut, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const client = createClient();

export default function Layout() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const response = await client.auth.me();
      setUser(response.data);
    } catch (error) {}
  };

  const handleLogout = async () => {
    await client.auth.logout();
    setUser(null);
  };

  return (
    // h-screen và bg-[#050509] để xóa sạch khoảng trắng nền
    <div className="h-screen flex flex-col bg-[#050509] overflow-hidden">
      {/* Navigation Bar - Đổi sang màu đen Galaxy */}
      <nav className="bg-[#0b0b15] border-b border-gray-800 flex-shrink-0 z-50">
        <div className="w-full px-4"> {/* Đổi max-w thành w-full */}
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-indigo-600 p-1.5 rounded-lg shadow-[0_0_10px_rgba(79,70,229,0.5)] group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tighter">EduTech <span className="text-indigo-400">AI</span></span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center border-l border-gray-800 ml-4 pl-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-800">
                      <User className="h-5 w-5 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#161625] border-gray-800 text-gray-200 w-48">
                    <div className="px-3 py-2 text-[10px] text-gray-500 border-b border-gray-800 mb-1 uppercase tracking-widest">
                      {user.email}
                    </div>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer text-xs">
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => client.auth.toLogin()} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs rounded-full px-5">
                  Đăng nhập
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Tràn viền hoàn toàn */}
      <main className="flex-1 relative">
        <Outlet />
      </main>
    </div>
  );
}