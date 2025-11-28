import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function createSkillSession(sessionData) {
  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      ...sessionData,
      createdAt: new Date(),
      status: 'pending',
      credits: typeof sessionData.credits === 'number' ? sessionData.credits : 1,
      startTime: null,
      endTime: null,
      duration: null,
      recording: null,
      chatMessages: []
    });
    return docRef.id;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getUserSessions(uid) {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('participants', 'array-contains', uid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateSessionStatus(sessionId, status, endTime = null, extraUpdates = {}) {
  try {
    const updates = { status, ...extraUpdates };
    if (endTime) {
      updates.endTime = endTime;
    }
    if (status === 'active' && !extraUpdates.startTime) {
      updates.startTime = new Date();
    }
    await updateDoc(doc(db, 'sessions', sessionId), updates);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function addSessionMessage(sessionId, message) {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    const messages = sessionDoc.data().chatMessages || [];
    await updateDoc(sessionRef, {
      chatMessages: [...messages, {
        id: Date.now(),
        ...message,
        timestamp: new Date()
      }]
    });
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function generateQRCode(sessionId, teacherId) {
  try {
    const qrCode = {
      sessionId,
      teacherId,
      timestamp: new Date(),
      verified: false,
      checkInTime: null
    };
    
    await updateDoc(doc(db, 'sessions', sessionId), {
      qrCode: qrCode
    });
    
    return qrCode;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function verifyQRCheckIn(sessionId, learnerId, latitude, longitude) {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    const sessionData = sessionDoc.data();

    const distance = calculateDistance(
      latitude,
      longitude,
      sessionData.location.lat,
      sessionData.location.lng
    );

    if (distance <= 0.05) {
      await updateDoc(sessionRef, {
        'qrCode.verified': true,
        'qrCode.checkInTime': new Date(),
        learnerCheckIn: learnerId
      });
      return true;
    }
    return false;
  } catch (error) {
    throw new Error(error.message);
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function getSessionById(sessionId) {
  try {
    const docRef = doc(db, 'sessions', sessionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    throw new Error(error.message);
  }
}
