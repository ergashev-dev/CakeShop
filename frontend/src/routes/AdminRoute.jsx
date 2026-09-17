import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

const AdminRoute = ({ children, allowedRoles = ['superadmin', 'super_admin', 'admin', 'confectioner', 'courier'] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] dark:bg-[#0F1012]">
        <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in -> Redirect to home
  if (!user) {
    return <Navigate to="/" state={{ from: location, needLogin: true }} replace />;
  }

  // Role not allowed -> 403 Access Denied
  const userRole = user.role;
  const isAllowed = allowedRoles.includes(userRole);

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] dark:bg-[#0F1012] px-4 py-12">
        <div className="max-w-md w-full text-center bg-white dark:bg-[#16181D] border border-[#E7E9ED] dark:border-[#272A30] rounded-2xl p-8 shadow-card">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-[#17181A] dark:text-[#F3F4F6] mb-2">
            Ruxsat berilmadi (403)
          </h2>

          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mb-6 leading-relaxed">
            Kechirasiz, ushbu bo‘limga kirish uchun sizning hisobingizda yetarli vakolat yo‘q. Faqat belgilangan ma'murlar va xodimlar kirishi mumkin.
          </p>

          <Link to="/">
            <Button variant="primary" icon={ArrowLeft} className="w-full">
              Bosh sahifaga qaytish
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
