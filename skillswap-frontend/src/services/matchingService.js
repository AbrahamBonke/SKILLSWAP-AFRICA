import { collection, getDocs, addDoc, doc, getDoc, query, where, limit } from 'firebase/firestore';
import { db } from './firebase';

const SAFE_LOCATIONS = [
  { id: 1, name: 'Central Library', lat: -1.2843, lng: 36.8172, city: 'Nairobi' },
  { id: 2, name: 'Tech Hub', lat: -1.2810, lng: 36.8177, city: 'Nairobi' },
  { id: 3, name: 'Community Center', lat: -1.2900, lng: 36.8200, city: 'Nairobi' },
  { id: 4, name: 'Café Innovation', lat: -1.2850, lng: 36.8160, city: 'Nairobi' },
  { id: 5, name: 'School Campus', lat: -1.2880, lng: 36.8190, city: 'Nairobi' }
];

export async function getSafeLocations() {
  return SAFE_LOCATIONS;
}

export async function matchUsers(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const user = userDoc.data();

    // Normalize skill arrays (handle objects or plain strings)
    const skillsWanted = Array.isArray(user.skillsWanted) ? user.skillsWanted.map(s => (s && s.name) ? s.name : String(s)) : [];
    const skillsOffered = Array.isArray(user.skillsOffered) ? user.skillsOffered.map(s => (s && s.name) ? s.name : String(s)) : [];

    // Fetch users and compute fuzzy scores client-side (tolerant to case/spelling)
    const snapshot = await getDocs(collection(db, 'users'));
    const potentialMatches = [];

    snapshot.docs.forEach(d => {
      if (d.id === userId) return;
      const potentialUser = d.data();
      const potentialWanted = Array.isArray(potentialUser.skillsWanted) ? potentialUser.skillsWanted.map(s => (s && s.name) ? s.name : String(s)) : [];
      const potentialOffered = Array.isArray(potentialUser.skillsOffered) ? potentialUser.skillsOffered.map(s => (s && s.name) ? s.name : String(s)) : [];

      const matchScore = calculateMatchScore(
        skillsOffered,
        potentialWanted,
        skillsWanted,
        potentialOffered,
        user.location,
        potentialUser.location
      );

      if (matchScore > 0) {
        potentialMatches.push({
          ...potentialUser,
          id: d.id,
          matchScore
        });
      }
    });

    return potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    throw new Error(error.message);
  }
}

function normalize(text) {
  if (!text) return '';
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function levenshtein(a, b) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: an + 1 }, () => new Array(bn + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[i][0] = i;
  for (let j = 0; j <= bn; j++) matrix[0][j] = j;
  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[an][bn];
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na && !nb) return 0;
  if (na === nb) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length) || 1;
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Calculate a match score between two users.
 * - offeredSkills: skills this user offers (strings)
 * - potentialWanted: skills the potential match wants
 * - userWanted: skills this user wants (strings)
 * - potentialOffered: skills the potential match offers
 * - location1/location2: location strings (city or address)
 */
function calculateMatchScore(offeredSkills, potentialWanted, userWanted, potentialOffered, location1, location2) {
  let score = 0;

  // Score for this user's offered skills matching what the potential user wants
  offeredSkills.forEach(skill => {
    let best = 0;
    potentialWanted.forEach(pw => {
      const sim = similarity(skill, pw);
      if (sim > best) best = sim;
    });
    // weight: up to 40 points per offered skill (scaled by similarity)
    score += Math.round(best * 40);
  });

  // Reciprocal: potential user's offered skills matching this user's wanted skills
  potentialOffered.forEach(skill => {
    let best = 0;
    userWanted.forEach(uw => {
      const sim = similarity(skill, uw);
      if (sim > best) best = sim;
    });
    // weight reciprocal matches a bit less
    score += Math.round(best * 25);
  });

  // Location bonus: same city or exact match normalized
  if (location1 && location2) {
    const n1 = normalize(location1);
    const n2 = normalize(location2);
    if (n1 && n2 && n1 === n2) {
      score += 30;
    }
  }

  return score;
}

export async function createMatchSession(matcherId, matcheeId, skillToTeach, skillToLearn, options = {}) {
  try {
    const sessionType = options.sessionType || 'virtual';
    const credits = typeof options.credits === 'number' ? options.credits : 1;
    const scheduledTime = options.scheduledTime || null;
    const location = options.location || null;

    const sessionId = await addDoc(collection(db, 'sessions'), {
      teacher: matcherId,
      learner: matcheeId,
      skillTeaching: skillToTeach,
      skillLearning: skillToLearn,
      sessionType,
      status: 'pending',
      createdAt: new Date(),
      scheduledTime,
      startTime: null,
      endTime: null,
      participants: [matcherId, matcheeId],
      credits,
      location,
      roomId: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    return sessionId.id;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getActiveMatches(userId) {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('participants', 'array-contains', userId),
      where('status', '==', 'active'),
      limit(5)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(error.message);
  }
}
