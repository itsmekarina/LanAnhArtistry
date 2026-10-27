import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing Firebase App if already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Use minimum necessary scope: drive.file
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token storage (NEVER store access token in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
} | null = null;

let isSigningIn = false;

// Listeners for auth state changes
type AuthListener = (connected: boolean, user: typeof cachedGoogleUser) => void;
const authListeners = new Set<AuthListener>();

function notifyListeners() {
  const connected = Boolean(cachedAccessToken);
  authListeners.forEach((fn) => fn(connected, cachedGoogleUser));
}

export function subscribeGoogleAuth(listener: AuthListener): () => void {
  authListeners.add(listener);
  listener(Boolean(cachedAccessToken), cachedGoogleUser);
  return () => authListeners.delete(listener);
}

// Initialize Auth listener on application load
export function initGoogleAuth(
  onSuccess?: (user: FirebaseUser, token: string) => void,
  onFailure?: () => void
) {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user && cachedAccessToken) {
      cachedGoogleUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      notifyListeners();
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else if (!user || !isSigningIn) {
      cachedAccessToken = null;
      cachedGoogleUser = null;
      notifyListeners();
      if (onFailure) onFailure();
    }
  });
}

// User-triggered Google sign in popup
export async function signInWithGoogleDrive(): Promise<{
  user: FirebaseUser;
  accessToken: string;
} | null> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Không nhận được Google OAuth Access Token');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    };

    // Store connection metadata (not the secret token) for connection UI persistence
    localStorage.setItem(
      'lananh_gdrive_connected_account',
      JSON.stringify({
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        connectedAt: new Date().toISOString(),
      })
    );

    notifyListeners();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

export async function getGoogleAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

export function isGoogleConnected(): boolean {
  return Boolean(cachedAccessToken);
}

export function getCachedGoogleUser() {
  if (cachedGoogleUser) return cachedGoogleUser;
  try {
    const raw = localStorage.getItem('lananh_gdrive_connected_account');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // quiet catch
  }
  return null;
}

export async function disconnectGoogleDrive() {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Firebase signout error:', e);
  }
  cachedAccessToken = null;
  cachedGoogleUser = null;
  localStorage.removeItem('lananh_gdrive_connected_account');
  localStorage.removeItem('lananh_gdrive_folders');
  notifyListeners();
}
