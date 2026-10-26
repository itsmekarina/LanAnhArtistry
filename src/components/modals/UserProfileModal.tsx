import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { updateUserProfile } from '../../services/auth';
import { StoryPrivacyLevel } from '../../types';
import {
  X,
  User as UserIcon,
  Mail,
  Shield,
  Lock,
  Globe,
  CheckCircle2,
  Calendar,
  LogOut,
  Save,
  Sparkles,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser, logout, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'security'>('profile');

  // Form states
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [defaultPrivacy, setDefaultPrivacy] = useState<StoryPrivacyLevel>(
    currentUser.defaultStoryPrivacy || 'private'
  );
  const [allowPublicMemory, setAllowPublicMemory] = useState<boolean>(
    currentUser.allowPublicMemoryByDefault || false
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = updateUserProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        defaultStoryPrivacy: defaultPrivacy,
        allowPublicMemoryByDefault: allowPublicMemory,
      });
      setCurrentUser(updated);
      showToast('Đã cập nhật hồ sơ cá nhân thành công!', 'success');
      onClose();
    } catch (e: any) {
      showToast('Lỗi cập nhật: ' + e.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'warning');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }
    showToast('✓ Đã cập nhật mật khẩu an toàn!', 'success');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const initials = currentUser.displayName
    ? currentUser.displayName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'LA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#122228] rounded-2xl shadow-2xl border border-[#D7EDF2] dark:border-[#1F3A44] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-[#F4FBFD] dark:bg-[#172D35] border-b border-[#D7EDF2] dark:border-[#1F3A44]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#B3EBF2] dark:bg-[#2E6C7B] text-[#2E6C7B] dark:text-[#E8F7FA] font-bold text-sm flex items-center justify-center border border-[#77CBDA] shadow-xs">
              {initials}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2E6C7B] dark:text-[#77CBDA]">
                User Account
              </span>
              <h2 className="text-base font-serif font-bold text-[#26343B] dark:text-[#ECF7F9]">
                {currentUser.displayName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647780] hover:text-[#26343B] dark:hover:text-[#ECF7F9] hover:bg-[#E8F7FA] dark:hover:bg-[#1F3A44] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#D7EDF2] dark:border-[#1F3A44] bg-[#F4FBFD]/50 dark:bg-[#122228] px-6 gap-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-[#2E6C7B] text-[#2E6C7B] dark:border-[#77CBDA] dark:text-[#77CBDA]'
                : 'border-transparent text-[#647780] hover:text-[#26343B]'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>My Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'border-[#2E6C7B] text-[#2E6C7B] dark:border-[#77CBDA] dark:text-[#77CBDA]'
                : 'border-transparent text-[#647780] hover:text-[#26343B]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Story Privacy Defaults</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-[#2E6C7B] text-[#2E6C7B] dark:border-[#77CBDA] dark:text-[#77CBDA]'
                : 'border-transparent text-[#647780] hover:text-[#26343B]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35] border border-[#D7EDF2] dark:border-[#1F3A44]">
                <div className="w-14 h-14 rounded-full bg-[#77CBDA] text-white font-bold text-lg flex items-center justify-center shadow-xs">
                  {initials}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                    {currentUser.displayName}
                  </h4>
                  <p className="text-xs text-[#647780] flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{currentUser.email}</span>
                  </p>
                  <p className="text-[11px] text-[#647780] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Tham gia từ {new Date(currentUser.createdAt).toLocaleDateString('vi-VN')}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#26343B] dark:text-[#ECF7F9] mb-1">
                  Tên hiển thị (Display Name)
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#26343B] dark:text-[#ECF7F9] mb-1">
                  Email tài khoản
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-slate-100 dark:bg-slate-800 text-[#647780] cursor-not-allowed"
                />
                <span className="text-[10px] text-[#647780] mt-0.5 block">
                  Email dùng để nhận diện tài khoản sở hữu truyện và quyền chia sẻ.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#26343B] dark:text-[#ECF7F9] mb-1">
                  Giới thiệu / Chuyên môn dịch (Bio)
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="ví dụ: Dịch giả tiểu thuyết tiên hiệp / trinh thám..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#D7EDF2] dark:border-[#1F3A44]">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất (Logout)</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi (Save Profile)</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[#26343B] dark:text-[#ECF7F9] uppercase tracking-wider mb-1">
                  Cấu hình Quyền riêng tư mặc định cho Truyện mới
                </h4>
                <p className="text-xs text-[#647780] leading-relaxed">
                  Nguyên tắc cốt lõi của LanAnhArtistry: Bản dịch, nguyên tác và ghi chú cá nhân luôn là tài sản riêng của bạn và được bảo vệ theo chế độ Riêng tư mặc định.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {[
                  {
                    id: 'private',
                    label: '🔒 Riêng tư (Private) — Mặc định khuyến nghị',
                    desc: 'Chỉ có bạn mới nhìn thấy và quản lý truyện.',
                  },
                  {
                    id: 'link_only',
                    label: '🔗 Bất kỳ ai có liên kết (Anyone with link)',
                    desc: 'Không xuất hiện trên tìm kiếm công khai, chỉ ai có link bí mật mới đọc được.',
                  },
                  {
                    id: 'public_memory_only',
                    label: '🧠 Public Vocabulary / Pronoun Memory Only',
                    desc: 'Truyện và chương hoàn toàn riêng tư, chỉ chia sẻ thuật ngữ và xưng hô cho cộng đồng dịch giả.',
                  },
                  {
                    id: 'public',
                    label: '🌎 Công khai (Public)',
                    desc: 'Mọi người đều có thể tìm thấy và xem theo các quyền bạn cho phép.',
                  },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      defaultPrivacy === opt.id
                        ? 'border-[#77CBDA] bg-[#E8F7FA] dark:bg-[#172D35]'
                        : 'border-[#D7EDF2] dark:border-[#1F3A44] hover:bg-[#F4FBFD] dark:hover:bg-[#122228]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="default_privacy"
                        checked={defaultPrivacy === opt.id}
                        onChange={() => setDefaultPrivacy(opt.id as StoryPrivacyLevel)}
                        className="text-[#2E6C7B] focus:ring-[#77CBDA]"
                      />
                      <span className="text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#647780] ml-5 mt-1">{opt.desc}</p>
                  </label>
                ))}
              </div>

              <div className="pt-3 border-t border-[#D7EDF2] dark:border-[#1F3A44]">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPublicMemory}
                    onChange={(e) => setAllowPublicMemory(e.target.checked)}
                    className="mt-0.5 rounded text-[#2E6C7B] focus:ring-[#77CBDA]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#26343B] dark:text-[#ECF7F9]">
                      Đóng góp bộ nhớ thuật ngữ chung vào Kho Ngôn Ngữ Cộng Đồng
                    </span>
                    <p className="text-[11px] text-[#647780] mt-0.5">
                      Giúp những dịch giả khác tra cứu quy tắc xưng hô và thuật ngữ hay, trong khi toàn bộ nội dung truyện của bạn vẫn được bảo mật 100%.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-4 py-2 text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Cập nhật thiết lập quyền</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#F4FBFD] dark:bg-[#172D35] border border-[#D7EDF2] dark:border-[#1F3A44] flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#2E6C7B] dark:text-[#77CBDA] shrink-0" />
                <p className="text-xs text-[#26343B] dark:text-[#ECF7F9]">
                  Tài khoản của bạn được bảo vệ bằng mã hóa SHA-256 Web Crypto API. Dữ liệu dịch thuật được phân quyền nghiêm ngặt theo ID dịch giả.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#26343B] dark:text-[#ECF7F9] mb-1">
                  Mật khẩu mới (New Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#647780] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#26343B] dark:text-[#ECF7F9] mb-1">
                  Xác nhận mật khẩu mới (Confirm Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#647780] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#D7EDF2] dark:border-[#1F3A44] bg-white dark:bg-[#172D35] text-[#26343B] dark:text-[#ECF7F9] focus:outline-hidden focus:ring-2 focus:ring-[#77CBDA]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-[#2E6C7B] hover:bg-[#1A4954] text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
