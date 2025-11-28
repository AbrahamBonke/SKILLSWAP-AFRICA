import { collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const REPUTATION_TIERS = {
  'Poor': { min: 0, max: 1, emoji: '😞', description: 'Needs improvement' },
  'Fair': { min: 1, max: 2, emoji: '😐', description: 'Acceptable' },
  'Good': { min: 2, max: 3, emoji: '😊', description: 'Reliable' },
  'Great': { min: 3, max: 4, emoji: '😄', description: 'Excellent' },
  'Excellent': { min: 4, max: 5, emoji: '⭐', description: 'Outstanding' }
};

export function getReputationTier(avgRating) {
  if (avgRating >= 4.0) return 'Excellent';
  if (avgRating >= 3.0) return 'Great';
  if (avgRating >= 2.0) return 'Good';
  if (avgRating >= 1.0) return 'Fair';
  return 'Poor';
}

export async function addReview(sessionId, reviewerUid, revieweeUid, rating, comment, skillQuality, communication, punctuality) {
  try {
    const reviewId = await addDoc(collection(db, 'reviews'), {
      sessionId,
      reviewerUid,
      revieweeUid,
      overallRating: rating,
      skillQuality,
      communication,
      punctuality,
      comment,
      createdAt: new Date(),
      helpful: 0
    });

    await updateUserReputation(revieweeUid, rating);
    return reviewId.id;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function submitSimpleReview(sessionId, fromUserId, toUserId, rating, comment = '') {
  try {
    const reviewDoc = await addDoc(collection(db, 'reviews'), {
      sessionId,
      reviewerUid: fromUserId,
      revieweeUid: toUserId,
      overallRating: rating,
      comment,
      createdAt: new Date()
    });

    // Update user's average rating and reputation
    await updateUserReputation(toUserId, rating);

    return reviewDoc.id;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getUserReviews(userId) {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('revieweeUid', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getSessionReview(sessionId, reviewerUid) {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('sessionId', '==', sessionId),
      where('reviewerUid', '==', reviewerUid)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0 ? snapshot.docs[0].data() : null;
  } catch (error) {
    console.error('Error checking review:', error);
    return null;
  }
}

export async function updateUserReputation(userId, newRating) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const currentTotal = (userData.averageRating || 0) * (userData.reviewCount || 0);
    const newCount = (userData.reviewCount || 0) + 1;
    const newAverage = newCount > 0 ? (currentTotal + newRating) / newCount : 0;
    const reputationTier = getReputationTier(newAverage);

    await updateDoc(userRef, {
      reviewCount: newCount,
      averageRating: Math.round(newAverage * 10) / 10,
      reputation: reputationTier
    });
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getTopRatedUsers() {
  try {
    const q = query(
      collection(db, 'users'),
      where('reviewCount', '>=', 5)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 10);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function verifyUser(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    await updateDoc(userRef, {
      isVerified: true,
      badges: [...(userDoc.data().badges || []), 'verified']
    });
  } catch (error) {
    throw new Error(error.message);
  }
}
