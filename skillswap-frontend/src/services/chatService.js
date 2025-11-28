import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export function listenForChatMessages(sessionId, onUpdate) {
  const messagesRef = collection(db, 'sessions', sessionId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    onUpdate(msgs);
  });
}

export async function sendChatMessage(sessionId, { senderId, senderName, text }) {
  const messagesRef = collection(db, 'sessions', sessionId, 'messages');
  const docRef = await addDoc(messagesRef, {
    senderId,
    senderName: senderName || 'User',
    text: text || '',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Typing indicator: sessions/{sessionId}/typing/{userId}
export async function setTyping(sessionId, userId, isTyping) {
  const ref = doc(db, 'sessions', sessionId, 'typing', userId);
  try {
    await setDoc(ref, { typing: !!isTyping, updatedAt: serverTimestamp() });
  } catch (e) {
    console.error('setTyping error', e);
  }
}

export function listenForTyping(sessionId, onUpdate) {
  const typingRef = collection(db, 'sessions', sessionId, 'typing');
  return onSnapshot(typingRef, (snap) => {
    const map = {};
    snap.docs.forEach(d => {
      const data = d.data();
      map[d.id] = { typing: !!data.typing, updatedAt: data.updatedAt };
    });
    onUpdate(map);
  });
}

// Presence tracking: sessions/{sessionId}/presence/{userId}
export async function setPresence(sessionId, userId, isOnline) {
  const ref = doc(db, 'sessions', sessionId, 'presence', userId);
  try {
    await setDoc(ref, { online: !!isOnline, lastSeen: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.error('setPresence error', e);
  }
}

export function listenForPresence(sessionId, onUpdate) {
  const presenceRef = collection(db, 'sessions', sessionId, 'presence');
  return onSnapshot(presenceRef, (snap) => {
    const map = {};
    snap.docs.forEach(d => {
      map[d.id] = d.data();
    });
    onUpdate(map);
  });
}

// Read receipts: maintain sessions/{id}.lastRead.{userId} = timestamp
export async function markSessionRead(sessionId, userId) {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, { [`lastRead.${userId}`]: serverTimestamp() });
  } catch (e) {
    console.error('markSessionRead error', e);
  }
}

export function listenForSessionMeta(sessionId, onUpdate) {
  const ref = doc(db, 'sessions', sessionId);
  return onSnapshot(ref, (snap) => {
    onUpdate(snap.exists() ? snap.data() : null);
  });
}
