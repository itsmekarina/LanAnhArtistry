/**
 * Firestore Data Persistence Service
 * Persists user stories, translation memories, and profiles to Cloud Firestore.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Story, TranslationMemory, User } from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestoreDb: Firestore = getFirestore(app);

export async function saveUserToFirestore(user: User): Promise<void> {
  try {
    const userRef = doc(firestoreDb, 'users', user.id);
    await setDoc(userRef, {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role || 'USER',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore saveUser error:', err);
  }
}

export async function saveStoryToFirestore(story: Story): Promise<void> {
  try {
    const storyRef = doc(firestoreDb, 'stories', story.id);
    await setDoc(storyRef, {
      id: story.id,
      ownerId: story.ownerId || 'anonymous',
      ownerName: story.ownerName || 'Translator',
      title: story.title,
      author: story.author,
      sourceLanguage: story.sourceLanguage,
      targetLanguage: story.targetLanguage,
      privacy: story.privacy,
      totalChapters: story.totalChapters,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore saveStory error:', err);
  }
}

export async function getStoriesFromFirestore(userId: string): Promise<Story[]> {
  try {
    const q = query(collection(firestoreDb, 'stories'), where('ownerId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as Story);
  } catch (err) {
    console.warn('Firestore getStories error:', err);
    return [];
  }
}

export async function saveTMToFirestore(tm: TranslationMemory): Promise<void> {
  try {
    const tmRef = doc(firestoreDb, 'translation_memories', tm.id);
    await setDoc(tmRef, {
      ...tm,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore saveTM error:', err);
  }
}
