import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
  getIdToken,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

export async function registerUser(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName });
    await sendEmailVerification(user);

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      createdAt: new Date(),
      profilePicture: '',
      bio: '',
      skillsOffered: [],
      skillsWanted: [],
      availabilitySchedule: {},
      location: '',
      credits: 0,
      reputation: 0,
      reviewCount: 0,
      averageRating: 0,
      isVerified: false,
      totalSessionsTeaching: 0,
      totalSessionsLearning: 0,
      badges: [],
      emailVerified: false
    });

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Ensure user document exists
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        createdAt: new Date(),
        profilePicture: user.photoURL || '',
        bio: '',
        skillsOffered: [],
        skillsWanted: [],
        availabilitySchedule: {},
        location: '',
        credits: 0,
        reputation: 0,
        reviewCount: 0,
        averageRating: 0,
        isVerified: false,
        totalSessionsTeaching: 0,
        totalSessionsLearning: 0,
        badges: [],
        emailVerified: user.emailVerified || false
      });
    }

    return user;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function updateUserProfile(uid, updates) {
  try {
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function addSkillOffered(uid, skill) {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    const currentSkills = userDoc.data().skillsOffered || [];
    await updateDoc(userRef, {
      skillsOffered: [...currentSkills, {
        id: Date.now(),
        name: skill,
        createdAt: new Date(),
        verified: false
      }]
    });
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function addSkillWanted(uid, skill) {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    const currentSkills = userDoc.data().skillsWanted || [];
    await updateDoc(userRef, {
      skillsWanted: [...currentSkills, {
        id: Date.now(),
        name: skill,
        priority: 'medium',
        createdAt: new Date()
      }]
    });
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getUserToken() {
  try {
    return await getIdToken(auth.currentUser);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(error.message);
  }
}
