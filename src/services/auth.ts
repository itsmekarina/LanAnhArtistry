import { User, StoryPrivacyLevel } from '../types';

const USERS_STORAGE_KEY = 'lananh_users_v2';
const CURRENT_USER_KEY = 'lananh_current_user_v2';

// Helper: Hash password using Web Crypto API (SHA-256)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'lananh_artistry_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Generate cryptographically secure unguessable share token
export function generateShareToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sh_${hex}`;
}

interface StoredUserAccount extends User {
  passwordHash: string;
}

// A neutral local guest lets the workspace open before an account is created.
const DEFAULT_USER: StoredUserAccount = {
  id: 'local-guest',
  email: 'translator@example.com',
  displayName: 'Translator',
  avatar: '',
  bio: '',
  createdAt: new Date().toISOString(),
  defaultStoryPrivacy: 'PRIVATE',
  allowPublicMemoryByDefault: false,
  passwordHash: '',
};

function getStoredUsers(): StoredUserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      const initial = [DEFAULT_USER];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [DEFAULT_USER];
  } catch {
    return [DEFAULT_USER];
  }
}
function saveStoredUsers(users: StoredUserAccount[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function getCurrentUser(): User {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }

  // Default to Translator if no active session
  const defaultPublicUser: User = {
    id: DEFAULT_USER.id,
    email: DEFAULT_USER.email,
    displayName: DEFAULT_USER.displayName,
    avatar: DEFAULT_USER.avatar,
    bio: DEFAULT_USER.bio,
    createdAt: DEFAULT_USER.createdAt,
    defaultStoryPrivacy: DEFAULT_USER.defaultStoryPrivacy,
    allowPublicMemoryByDefault: DEFAULT_USER.allowPublicMemoryByDefault,
  };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultPublicUser));
  return defaultPublicUser;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    throw new Error('Tài khoản không tồn tại. Vui lòng kiểm tra lại email hoặc Đăng ký.');
  }

  const hash = await hashPassword(password);
  // Require a stored password hash for every sign-in.
  if (!user.passwordHash || user.passwordHash !== hash) {
    throw new Error('Mật khẩu không chính xác.');
  }

  const publicUser: User = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt,
    defaultStoryPrivacy: user.defaultStoryPrivacy || 'private',
    allowPublicMemoryByDefault: user.allowPublicMemoryByDefault || false,
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(publicUser));
  return publicUser;
}

export async function signUpUser(displayName: string, email: string, password: string): Promise<User> {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Email này đã được sử dụng. Vui lòng chọn email khác hoặc Đăng nhập.');
  }

  if (password.length < 6) {
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
  }

  const hash = await hashPassword(password);
  const newUser: StoredUserAccount = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    displayName: displayName.trim() || 'Translator',
    avatar: '',
    bio: 'Dịch giả tại LanAnhArtistry',
    createdAt: new Date().toISOString(),
    defaultStoryPrivacy: 'private',
    allowPublicMemoryByDefault: false,
    passwordHash: hash,
  };

  users.push(newUser);
  saveStoredUsers(users);

  const publicUser: User = {
    id: newUser.id,
    email: newUser.email,
    displayName: newUser.displayName,
    avatar: newUser.avatar,
    bio: newUser.bio,
    createdAt: newUser.createdAt,
    defaultStoryPrivacy: newUser.defaultStoryPrivacy,
    allowPublicMemoryByDefault: newUser.allowPublicMemoryByDefault,
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(publicUser));
  return publicUser;
}

export function logoutUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function updateUserProfile(data: Partial<User>): User {
  const current = getCurrentUser();
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === current.id);

  const updated: User = {
    ...current,
    ...data,
  };

  if (index !== -1) {
    users[index] = {
      ...users[index],
      ...data,
    };
    saveStoredUsers(users);
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
  return updated;
}

export function getAllRegisteredUsers(): User[] {
  return getStoredUsers().map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatar: u.avatar,
    bio: u.bio,
    createdAt: u.createdAt,
    defaultStoryPrivacy: u.defaultStoryPrivacy,
    allowPublicMemoryByDefault: u.allowPublicMemoryByDefault,
  }));
}
