import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  setLogLevel,
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection,
  getDocs,
  serverTimestamp, 
  Firestore 
} from 'firebase/firestore';
import { User } from '../types';
import { FF_IMAGES } from '../assets/freeFireAssets';

// Import generated config json
// @ts-ignore
import configJson from '../../firebase-applet-config.json';

const getFirebaseConfig = () => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || configJson.apiKey || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || configJson.authDomain || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || configJson.projectId || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || configJson.storageBucket || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || configJson.messagingSenderId || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || configJson.appId || "",
    firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || configJson.firestoreDatabaseId || "",
  };
};

export const firebaseConfig = getFirebaseConfig();

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.startsWith('AIza') &&
  !firebaseConfig.apiKey.includes('placeholder') && 
  !firebaseConfig.apiKey.includes('demo') &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);

    // Suppress noisy network reconnection logs in browser console
    try {
      setLogLevel('error');
    } catch {
      // Ignore if not supported in current environment
    }

    const firestoreSettings = {
      experimentalForceLongPolling: true,
    };

    try {
      dbInstance = firebaseConfig.firestoreDatabaseId 
        ? initializeFirestore(app, firestoreSettings, firebaseConfig.firestoreDatabaseId)
        : initializeFirestore(app, firestoreSettings);
    } catch {
      // Fallback if already initialized
      dbInstance = firebaseConfig.firestoreDatabaseId 
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);
    }
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;

/**
 * PERSIST USER DIAMONDS & PROFILE DATA TO FIRESTORE & LOCAL STORAGE
 */
export async function persistUserDiamonds(userId: string, newDiamonds: number, totalEarnings?: number): Promise<void> {
  try {
    localStorage.setItem(`sq_diamonds_${userId}`, String(newDiamonds));
    if (totalEarnings !== undefined) {
      localStorage.setItem(`sq_earnings_${userId}`, String(totalEarnings));
    }
  } catch (e) {
    console.warn('localStorage save warning:', e);
  }

  if (db) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const updatePayload: Record<string, any> = {
        diamonds: newDiamonds,
        updatedAt: serverTimestamp()
      };
      if (totalEarnings !== undefined) {
        updatePayload.totalEarnings = totalEarnings;
      }
      await updateDoc(userDocRef, updatePayload);
    } catch (e) {
      console.warn('Firestore diamonds update warning:', e);
    }
  }
}

export async function persistUserProfile(userId: string, updates: Partial<User>): Promise<void> {
  try {
    if (updates.diamonds !== undefined) {
      localStorage.setItem(`sq_diamonds_${userId}`, String(updates.diamonds));
    }
    if (updates.totalEarnings !== undefined) {
      localStorage.setItem(`sq_earnings_${userId}`, String(updates.totalEarnings));
    }
    if (updates.avatar !== undefined) {
      localStorage.setItem(`sq_avatar_${userId}`, updates.avatar);
    }
    if (updates.name !== undefined) {
      localStorage.setItem(`sq_name_${userId}`, updates.name);
    }
    if (updates.inGameId !== undefined) {
      localStorage.setItem(`sq_ingameid_${userId}`, updates.inGameId);
    }
  } catch (e) {
    console.warn('localStorage save warning:', e);
  }

  if (db) {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Firestore profile update warning:', e);
    }
  }
}

/**
 * RESET USER ACCOUNT TO BRAND NEW (30 Welcome Diamonds, 0 Earnings, Fresh Streak & Wheel)
 */
export async function resetAccountToFresh(userId: string): Promise<Partial<User>> {
  // 1. Clear all user persistent keys
  try {
    localStorage.removeItem(`sq_diamonds_${userId}`);
    localStorage.removeItem(`sq_earnings_${userId}`);
    localStorage.removeItem(`shadowx_weekly_spin_${userId}`);
    localStorage.removeItem(`shadowx_streak_data_${userId}`);
    localStorage.setItem(`sq_diamonds_${userId}`, '30');
    localStorage.setItem(`sq_earnings_${userId}`, '0');
  } catch (e) {
    console.warn('LocalStorage clear error on reset:', e);
  }

  const freshData: Partial<User> = {
    diamonds: 30,
    totalEarnings: 0,
    matchesPlayed: 0,
    wins: 0,
    kdRatio: 4.2,
    tier: 'Grandmaster',
  };

  // 2. Clear / reset Firestore user document
  if (db) {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        diamonds: 30,
        totalEarnings: 0,
        matchesPlayed: 0,
        wins: 0,
        kdRatio: 4.2,
        tier: 'Grandmaster',
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Firestore reset account error:', e);
    }
  }

  return freshData;
}

/**
 * Fetch or create Firestore user profile document 'users/{uid}'
 */
export async function syncUserProfile(fbUser: FirebaseUser): Promise<User> {
  // Check if auto-reset is needed for this user session
  const isTargetUser = fbUser.email?.toLowerCase() === 'benkarrohan80@gmail.com' || fbUser.email?.toLowerCase() === 'shadowyesports1@gmail.com';
  const autoResetKey = `shadowx_auto_reset_v2_${fbUser.uid}`;
  if (isTargetUser && localStorage.getItem(autoResetKey) !== 'completed') {
    localStorage.setItem(autoResetKey, 'completed');
    await resetAccountToFresh(fbUser.uid);
  }

  // Check local storage for persistent profile info
  let cachedDiamonds: number | null = null;
  let cachedEarnings: number | null = null;
  let cachedAvatar: string | null = null;
  let cachedName: string | null = null;
  let cachedInGameId: string | null = null;
  try {
    const rawD = localStorage.getItem(`sq_diamonds_${fbUser.uid}`);
    if (rawD !== null && !isNaN(Number(rawD))) {
      cachedDiamonds = Number(rawD);
    }
    const rawE = localStorage.getItem(`sq_earnings_${fbUser.uid}`);
    if (rawE !== null && !isNaN(Number(rawE))) {
      cachedEarnings = Number(rawE);
    }
    cachedAvatar = localStorage.getItem(`sq_avatar_${fbUser.uid}`);
    cachedName = localStorage.getItem(`sq_name_${fbUser.uid}`);
    cachedInGameId = localStorage.getItem(`sq_ingameid_${fbUser.uid}`);
  } catch {
    // Ignore localStorage errors
  }

  const fallbackAvatar = cachedAvatar || FF_IMAGES.characterKelly;
  const fallbackName = cachedName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Gamer';
  const fallbackInGameId = cachedInGameId || 'SQ_' + Math.floor(100000 + Math.random() * 900000);

  if (!db) {
    return {
      id: fbUser.uid,
      name: fallbackName,
      email: fbUser.email || '',
      avatar: fallbackAvatar,
      role: (fbUser.email?.toLowerCase() === 'benkarrohan80@gmail.com' || fbUser.email?.toLowerCase() === 'admin@shadowx.com' || fbUser.email?.toLowerCase() === 'shadowyesports1@gmail.com') ? 'admin' : 'user',
      diamonds: cachedDiamonds !== null ? cachedDiamonds : 30,
      inGameId: fallbackInGameId,
      totalEarnings: cachedEarnings !== null ? cachedEarnings : 0,
      matchesPlayed: 0,
      wins: 0,
      kdRatio: 4.2,
      tier: 'Grandmaster',
      createdAt: new Date().toISOString().split('T')[0],
      isVerified: fbUser.emailVerified
    };
  }

  const userDocRef = doc(db, 'users', fbUser.uid);
  
  try {
    // Wrap with timeout to guarantee immediate, non-blocking UI response during offline / reconnecting state
    const fetchDoc = getDoc(userDocRef);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore connection timeout')), 3500)
    );
    const userSnap = await Promise.race([fetchDoc, timeout]);
    if (userSnap.exists()) {
      const data = userSnap.data();
      let userDiamonds = typeof data.diamonds === 'number' ? data.diamonds : 30;
      let userEarnings = typeof data.totalEarnings === 'number' ? data.totalEarnings : 0;
      let userAvatar = data.avatar || fallbackAvatar;
      let userName = data.name || fallbackName;
      let userInGameId = data.inGameId || fallbackInGameId;

      // Preserve any claimed/earned diamonds from user's wallet
      if (cachedDiamonds !== null && cachedDiamonds > userDiamonds) {
        userDiamonds = cachedDiamonds;
        updateDoc(userDocRef, { diamonds: userDiamonds }).catch(() => {});
      } else {
        try {
          localStorage.setItem(`sq_diamonds_${fbUser.uid}`, String(userDiamonds));
        } catch {}
      }

      if (cachedEarnings !== null && cachedEarnings > userEarnings) {
        userEarnings = cachedEarnings;
        updateDoc(userDocRef, { totalEarnings: userEarnings }).catch(() => {});
      } else {
        try {
          localStorage.setItem(`sq_earnings_${fbUser.uid}`, String(userEarnings));
        } catch {}
      }

      // Sync custom profile details back into localStorage
      try {
        localStorage.setItem(`sq_avatar_${fbUser.uid}`, userAvatar);
        localStorage.setItem(`sq_name_${fbUser.uid}`, userName);
        localStorage.setItem(`sq_ingameid_${fbUser.uid}`, userInGameId);
      } catch {}

      return {
        id: fbUser.uid,
        name: userName,
        email: fbUser.email || '',
        avatar: userAvatar,
        role: (fbUser.email?.toLowerCase() === 'benkarrohan80@gmail.com' || fbUser.email?.toLowerCase() === 'admin@shadowx.com' || data.role === 'admin') ? 'admin' : 'user',
        diamonds: userDiamonds,
        inGameId: userInGameId,
        totalEarnings: userEarnings,
        matchesPlayed: data.matchesPlayed ?? 0,
        wins: data.wins ?? 0,
        kdRatio: data.kdRatio ?? 4.2,
        tier: data.tier || 'Grandmaster',
        createdAt: data.createdAt || new Date().toISOString().split('T')[0],
        isVerified: fbUser.emailVerified
      };
    } else {
      // First-time profile creation: 30 welcome diamonds
      const userRole: 'admin' | 'user' = (fbUser.email?.toLowerCase() === 'benkarrohan80@gmail.com' || fbUser.email?.toLowerCase() === 'admin@shadowx.com' || fbUser.email?.toLowerCase() === 'shadowyesports1@gmail.com') ? 'admin' : 'user';
      const initialDiamonds = cachedDiamonds !== null ? cachedDiamonds : 30;
      const initialProfile = {
        name: fallbackName,
        email: fbUser.email || '',
        avatar: fallbackAvatar,
        role: userRole,
        diamonds: initialDiamonds,
        inGameId: fallbackInGameId,
        totalEarnings: cachedEarnings !== null ? cachedEarnings : 0,
        matchesPlayed: 0,
        wins: 0,
        kdRatio: 4.2,
        tier: 'Grandmaster' as const,
        createdAt: new Date().toISOString().split('T')[0],
      };
      await setDoc(userDocRef, { ...initialProfile, updatedAt: serverTimestamp() }).catch(() => {});
      try {
        localStorage.setItem(`sq_diamonds_${fbUser.uid}`, String(initialDiamonds));
        localStorage.setItem(`sq_avatar_${fbUser.uid}`, fallbackAvatar);
        localStorage.setItem(`sq_name_${fbUser.uid}`, fallbackName);
        localStorage.setItem(`sq_ingameid_${fbUser.uid}`, fallbackInGameId);
      } catch {}

      return {
        id: fbUser.uid,
        ...initialProfile,
        isVerified: fbUser.emailVerified
      };
    }
  } catch (err) {
    console.warn('Firestore user fetch error (using fallback auth data):', err);
  }

  const fallbackDiamonds = cachedDiamonds !== null ? cachedDiamonds : 30;
  return {
    id: fbUser.uid,
    name: fallbackName,
    email: fbUser.email || '',
    avatar: fallbackAvatar,
    role: (fbUser.email?.toLowerCase() === 'benkarrohan80@gmail.com' || fbUser.email?.toLowerCase() === 'admin@shadowx.com' || fbUser.email?.toLowerCase() === 'shadowyesports1@gmail.com') ? 'admin' : 'user',
    diamonds: fallbackDiamonds,
    inGameId: fallbackInGameId,
    totalEarnings: cachedEarnings !== null ? cachedEarnings : 0,
    matchesPlayed: 0,
    wins: 0,
    kdRatio: 4.2,
    tier: 'Grandmaster',
    createdAt: new Date().toISOString().split('T')[0],
    isVerified: fbUser.emailVerified
  };
}

/**
 * REAL SIGNUP WITH FIREBASE AUTHENTICATION
 */
export async function signUpWithFirebase(
  email: string, 
  pass: string, 
  fullName: string, 
  inGameId?: string
): Promise<FirebaseUser> {
  if (!auth) {
    throw new Error('Firebase Authentication is not initialized. Please check your Firebase credentials.');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const fbUser = userCredential.user;

  // Update Display Name
  await updateProfile(fbUser, { displayName: fullName });

  // Automatically Send Email Verification via Firebase
  await sendEmailVerification(fbUser);

  // Save profile doc to Firestore
  if (db) {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      await setDoc(userDocRef, {
        name: fullName,
        email: fbUser.email,
        role: (email.toLowerCase() === 'benkarrohan80@gmail.com' || email.toLowerCase() === 'admin@shadowx.com' || email.toLowerCase() === 'shadowyesports1@gmail.com') ? 'admin' : 'user',
        diamonds: 30,
        inGameId: inGameId || 'SQ_' + Math.floor(100000 + Math.random() * 900000),
        totalEarnings: 0,
        matchesPlayed: 0,
        wins: 0,
        kdRatio: 4.2,
        tier: 'Grandmaster',
        avatar: FF_IMAGES.characterKelly,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Firestore user save warning:', e);
    }
  }

  return fbUser;
}

/**
 * REAL LOGIN WITH FIREBASE AUTHENTICATION
 */
export async function signInWithFirebase(email: string, pass: string): Promise<FirebaseUser> {
  if (!auth) {
    throw new Error('Firebase Authentication is not initialized. Please check your Firebase credentials.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

/**
 * RESEND FIREBASE EMAIL VERIFICATION
 */
export async function resendVerificationEmail(): Promise<void> {
  if (!auth || !auth.currentUser) {
    throw new Error('No user is currently signed in.');
  }
  await sendEmailVerification(auth.currentUser);
}

/**
 * FIREBASE FORGOT PASSWORD RESET EMAIL
 */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Authentication is not initialized. Please check your Firebase credentials.');
  }
  await sendPasswordResetEmail(auth, email);
}

/**
 * FIREBASE LOGOUT
 */
export async function logoutFirebase(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth);
  }
}

/**
 * FETCH ALL REGISTERED USERS FROM FIRESTORE (For Admin Portal)
 */
export async function fetchAllUsers(): Promise<User[]> {
  if (!db) {
    return [];
  }
  try {
    const usersColl = collection(db, 'users');
    const snap = await getDocs(usersColl);
    const usersList: User[] = [];
    snap.forEach((d) => {
      const data = d.data();
      usersList.push({
        id: d.id,
        name: data.name || 'Gamer',
        email: data.email || '',
        avatar: data.avatar || FF_IMAGES.characterKelly,
        role: data.role || 'user',
        diamonds: typeof data.diamonds === 'number' ? data.diamonds : 30,
        inGameId: data.inGameId || '',
        totalEarnings: typeof data.totalEarnings === 'number' ? data.totalEarnings : 0,
        matchesPlayed: data.matchesPlayed || 0,
        wins: data.wins || 0,
        kdRatio: data.kdRatio || 4.2,
        tier: data.tier || 'Grandmaster',
        createdAt: data.createdAt || '',
        isVerified: data.isVerified || false
      });
    });
    return usersList;
  } catch (e) {
    console.error('Error fetching all users from Firestore:', e);
    return [];
  }
}

/**
 * Convert Firebase Auth Error codes into user-friendly message
 */
export function getFirebaseErrorMessage(error: any): string {
  if (!error?.code) return error?.message || 'Authentication failed. Please try again.';
  
  switch (error.code) {
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Invalid Firebase API Key. Please verify your Netlify VITE_FIREBASE_API_KEY environment variable.';
    case 'auth/user-not-found':
      return 'Account not found. Please sign up first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return error.message?.replace('Firebase: ', '') || 'Authentication error occurred.';
  }
}
