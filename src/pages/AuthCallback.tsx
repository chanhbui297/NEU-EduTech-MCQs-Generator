import { useEffect } from 'react';
import { createClient } from '@metagptx/web-sdk';

const client = createClient();

export default function AuthCallback() {
  useEffect(() => {
    client.auth.login().then(() => {
      window.location.href = '/';
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-lg text-gray-600">Đang xác thực...</p>
      </div>
    </div>
  );
}