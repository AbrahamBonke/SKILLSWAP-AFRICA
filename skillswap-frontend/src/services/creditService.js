import { collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function addCredits(userId, amount, reason) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentCredits = userDoc.data().credits || 0;

    await updateDoc(userRef, {
      credits: currentCredits + amount
    });

    await addDoc(collection(db, 'creditTransactions'), {
      userId,
      amount,
      reason,
      timestamp: new Date(),
      newBalance: currentCredits + amount
    });

    return currentCredits + amount;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function deductCredits(userId, amount, reason) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentCredits = userDoc.data().credits || 0;

    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }

    await updateDoc(userRef, {
      credits: currentCredits - amount
    });

    await addDoc(collection(db, 'creditTransactions'), {
      userId,
      amount: -amount,
      reason,
      timestamp: new Date(),
      newBalance: currentCredits - amount
    });

    return currentCredits - amount;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getUserCredits(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.data().credits || 0;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getCreditHistory(userId) {
  try {
    const q = query(
      collection(db, 'creditTransactions'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => doc.data())
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function completeSession(sessionId, teacherId, learnerId) {
  try {
    await addCredits(teacherId, 1, `Completed teaching session: ${sessionId}`);
    await deductCredits(learnerId, 1, `Completed learning session: ${sessionId}`);

    // Update teacher's totalSessionsTeaching
    const teacherRef = doc(db, 'users', teacherId);
    const teacherDoc = await getDoc(teacherRef);
    const currentTeachCount = teacherDoc.data().totalSessionsTeaching || 0;
    await updateDoc(teacherRef, {
      totalSessionsTeaching: currentTeachCount + 1
    });

    // Update learner's totalSessionsLearning
    const learnerRef = doc(db, 'users', learnerId);
    const learnerDoc = await getDoc(learnerRef);
    const currentLearnCount = learnerDoc.data().totalSessionsLearning || 0;
    await updateDoc(learnerRef, {
      totalSessionsLearning: currentLearnCount + 1
    });

    await updateDoc(doc(db, 'sessions', sessionId), {
      status: 'completed',
      creditsTransferred: true,
      completedAt: new Date()
    });
  } catch (error) {
    throw new Error(error.message);
  }
}
