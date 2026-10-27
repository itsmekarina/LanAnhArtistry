import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { loginUser, signUpUser } from '../../services/auth';
import { X, Sparkles, User, Lock, Mail, ArrowRight, ShieldCheck, } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { setCurrentUser, refreshStories, showToast } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setErrorMessage('Vui lòng nhập họ và tên của bạn.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('Mật khẩu xác nhận không khớp.');
          setIsLoading(false);
          return;
        }
        const newUser = await signUpUser(name, email, password);
        setCurrentUser(newUser);
        await refreshStories();
        showToast(`Tài khoản "${newUser.displayName}" đã được tạo thành công!`, 'success');
        onClose();
      } else {
        const loggedUser = await loginUser(email, password);
        setCurrentUser(loggedUser);
        await refreshStories();
        showToast(`Đăng nhập thành công: ${loggedUser.displayName}`, 'success');
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-[#122228] rounded-2xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header with Pastel Blue Accent */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#F4FBFD] dark:bg-[#172D35] border-b border-[#D7EDF2] dark:border-[#1F3A44]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#77CBDA] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                LanAnhArtistry Account
              </span>
              <h3 className="font-serif font-bold text-lg text-[#26343B] dark:text-[#ECF7F9]">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#1F3A44] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD]/50 dark:bg-[#122228]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-[#2E6C7B] text-[#2E6C7B] dark:border-[#77CBDA] dark:text-[#77CBDA] bg-white dark:bg-[#122228]'
                : 'border-transparent text-[#647780] hover:text-[#26343B]'
            }`}
          >
            Đăng nhập (Sign In)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors ${
              mode === 'signup'
                ? 'border-[#2E6C7B] text-[#2E6C7B] dark:border-[#77CBDA] dark:text-[#77CBDA] bg-white dark:bg-[#122228]'
                : 'border-transparent text-[#647780] hover:text-[#26343B]'
            }`}
          >
            Đăng ký (Sign Up)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50">
              {errorMessage}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-[#26343B] dark:text-[#ECF7F9] mb-1.5">
                Họ và tên (Name)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#647780] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ví dụ: Translator, Translator..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#26343B] dark:text-[#ECF7F9] mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#647780] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="translator@domain.com"
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-[#26343B] dark:text-[#ECF7F9]">
                Mật khẩu (Password)
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#647780] absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-[#26343B] dark:text-[#ECF7F9] mb-1.5">
                Xác nhận mật khẩu (Confirm Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#647780] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          </form>
      </div>
    </div>
  );
};
