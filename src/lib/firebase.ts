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
  query,
  where,
  runTransaction,
  increment,
  onSnapshot,
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
 * PERSIST USER DIAMONDS & PROFILE DATA TO FIRESTORE ONLY (Single Source of Truth)
 */
export async function persistUserDiamonds(userId: string, newDiamonds: number, totalEarnings?: number): Promise<void> {
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

      // Clear existing transactions for user and add initial Welcome Bonus transaction
      const txQuery = query(collection(db, 'diamondTransactions'), where('userId', '==', userId));
      const txSnap = await getDocs(txQuery);
      const batchDelete = writeBatch(db);
      txSnap.forEach((d) => {
        batchDelete.delete(d.ref);
      });
      await batchDelete.commit();

      // Create permanent Welcome Bonus transaction
      const welcomeTxRef = doc(collection(db, 'diamondTransactions'));
      await setDoc(welcomeTxRef, {
        userId,
        userName: 'Gamer',
        type: 'Earn',
        category: 'welcome_bonus',
        amountDiamonds: 30,
        description: 'Welcome Bonus Signup Reward',
        timestamp: new Date().toISOString(),
        status: 'Success'
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
  const autoResetKey = `shadowx_auto_reset_v5_${fbUser.uid}`;
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
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      const userDiamonds = typeof data.diamonds === 'number' ? data.diamonds : 30;
      const userEarnings = typeof data.totalEarnings === 'number' ? data.totalEarnings : 0;
      const userAvatar = data.avatar || fallbackAvatar;
      const userName = data.name || fallbackName;
      const userInGameId = data.inGameId || fallbackInGameId;

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
        isVerified: fbUser.emailVerified,
        referralCode: data.referralCode || 'SQ' + fbUser.uid.substring(0, 6).toUpperCase(),
        hasClaimedReferral: data.hasClaimedReferral || false
      };
    } else {
      // First-time profile creation: 30 welcome diamonds
      const userRole: 'admin' | 'user' = (fbUser.email?.toLowerCase() === 'benkarrohan80@gmail.com' || fbUser.email?.toLowerCase() === 'admin@shadowx.com' || fbUser.email?.toLowerCase() === 'shadowyesports1@gmail.com') ? 'admin' : 'user';
      const initialDiamonds = 30;
      const initialProfile = {
        name: fallbackName,
        email: fbUser.email || '',
        avatar: fallbackAvatar,
        role: userRole,
        diamonds: initialDiamonds,
        inGameId: fallbackInGameId,
        totalEarnings: 0,
        matchesPlayed: 0,
        wins: 0,
        kdRatio: 4.2,
        tier: 'Grandmaster' as const,
        createdAt: new Date().toISOString().split('T')[0],
        referralCode: 'SQ' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        hasClaimedReferral: false
      };
      await setDoc(userDocRef, { ...initialProfile, updatedAt: serverTimestamp() }).catch(() => {});

      // Create initial welcome transaction
      const welcomeTxRef = doc(collection(db, 'diamondTransactions'));
      await setDoc(welcomeTxRef, {
        userId: fbUser.uid,
        userName: fallbackName,
        type: 'Earn',
        category: 'welcome_bonus',
        amountDiamonds: 30,
        description: 'Welcome Bonus Signup Reward',
        timestamp: new Date().toISOString(),
        status: 'Success'
      });

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
    isVerified: fbUser.emailVerified,
    referralCode: 'SQ' + fbUser.uid.substring(0, 6).toUpperCase(),
    hasClaimedReferral: false
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
        updatedAt: serverTimestamp(),
        referralCode: 'SQ' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        hasClaimedReferral: false
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
 * FETCH DIAMOND TRANSACTIONS FROM FIRESTORE
 */
export async function fetchDiamondTransactions(userId: string): Promise<any[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'diamondTransactions'), where('userId', '==', userId));
    const snap = await getDocs(q);
    // Sort descending by timestamp
    const list = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    console.error('Error fetching diamond transactions:', e);
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

/**
 * APPLY REFERRAL CODE (User applies someone else's code)
 */
export async function applyReferralCode(currentUserId: string, referralCode: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized.");

  // Fetch referrer by code
  const usersColl = collection(db, 'users');
  const q = query(usersColl, where('referralCode', '==', referralCode));
  const referrerSnap = await getDocs(q);
  if (referrerSnap.empty) {
    throw new Error("Invalid referral code.");
  }
  const referrerDoc = referrerSnap.docs[0];
  const referrerId = referrerDoc.id;

  if (referrerId === currentUserId) {
    throw new Error("You cannot use your own referral code.");
  }

  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', currentUserId);
    const currentUserDoc = await transaction.get(userRef);
    if (!currentUserDoc.exists()) throw new Error("User not found");
    const userData = currentUserDoc.data();

    if (userData.hasClaimedReferral) {
      throw new Error("You have already used a referral code.");
    }

    // Give user 5 diamonds and mark as claimed
    transaction.update(userRef, {
      hasClaimedReferral: true,
      diamonds: increment(5)
    });

    // Create diamond transaction for referred user
    const txRef = doc(collection(db, 'diamondTransactions'));
    transaction.set(txRef, {
      userId: currentUserId,
      userName: userData.name || 'Gamer',
      type: 'Earn',
      category: 'referral',
      amountDiamonds: 5,
      description: `Used referral code ${referralCode}`,
      timestamp: new Date().toISOString(),
      status: 'Success'
    });

    // Create referral relationship
    const refDocRef = doc(db, 'referrals', currentUserId);
    transaction.set(refDocRef, {
      referrerId: referrerId,
      referredUserId: currentUserId,
      referredUserName: userData.name || 'Gamer',
      referralCode: referralCode,
      createdAt: new Date().toISOString(),
      progress: {
        emailVerified: false,
        dailyBonusCount: 0,
        customRoomsPlayed: 0,
        rewardUnlocked: false,
        rewardPaid: false
      },
      status: 'Pending'
    });
  });
}

/**
 * FETCH MY REFERRALS (For referrer to see who they invited)
 */
export async function fetchMyReferrals(userId: string) {
  if (!db) return [];
  const q = query(collection(db, 'referrals'), where('referrerId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeToMyReferrals(userId: string, callback: (referrals: any[]) => void) {
  if (!db) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'referrals'), where('referrerId', '==', userId));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  }, (err) => {
    console.warn("Error listening to referrals:", err);
    callback([]);
  });
}

/**
 * CHECK AND PROCESS REFERRAL REWARD
 */
export async function updateReferralProgress(
  userId: string, 
  updates: { emailVerified?: boolean; incrementDaily?: boolean; incrementRoom?: boolean }
): Promise<void> {
  if (!db) return;
  const refDocRef = doc(db, 'referrals', userId);
  const snap = await getDoc(refDocRef);
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.status === 'Completed') return;

  await runTransaction(db, async (transaction) => {
    const freshSnap = await transaction.get(refDocRef);
    if (!freshSnap.exists()) return;
    const freshData = freshSnap.data();
    if (freshData.status === 'Completed') return;

    const progress = freshData.progress;
    if (updates.emailVerified !== undefined) progress.emailVerified = updates.emailVerified;
    if (updates.incrementDaily) progress.dailyBonusCount = Math.min(7, progress.dailyBonusCount + 1);
    if (updates.incrementRoom) progress.customRoomsPlayed = Math.min(7, progress.customRoomsPlayed + 1);

    const isComplete = progress.emailVerified && progress.dailyBonusCount >= 7 && progress.customRoomsPlayed >= 7;

    if (isComplete && !progress.rewardPaid) {
      progress.rewardUnlocked = true;
      progress.rewardPaid = true;
      
      const referrerRef = doc(db, 'users', freshData.referrerId);
      transaction.update(referrerRef, { diamonds: increment(50) });

      const txRef = doc(collection(db, 'diamondTransactions'));
      transaction.set(txRef, {
        userId: freshData.referrerId,
        userName: 'Referrer', // Can't easily get the referrer name, but it's fine for transactions
        type: 'Earn',
        category: 'referral',
        amountDiamonds: 50,
        description: `Referral reward for ${freshData.referredUserName} completing requirements`,
        timestamp: new Date().toISOString(),
        status: 'Success'
      });

      transaction.update(refDocRef, { progress, status: 'Completed' });
    } else {
      transaction.update(refDocRef, { progress, status: isComplete ? 'Completed' : 'Pending' });
    }
  });
}

/**
 * SECURELY CLAIM DAILY BONUS WITH 24-HOUR TIMESTAMP CHECK
 */
export async function claimDailyBonusSecurely(userId: string, amount: number, isLuckySpin: boolean): Promise<{ success: boolean; newDiamonds?: number; newEarnings?: number; error?: string }> {
  if (!db) {
    return { success: true };
  }
  try {
    const userRef = doc(db, 'users', userId);
    const result = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User profile not found');
      }
      const data = userSnap.data();
      const lastClaimStr = data.lastDailyClaimAt;
      const now = new Date();

      if (!isLuckySpin && lastClaimStr) {
        const lastClaim = new Date(lastClaimStr);
        const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (diffHours < 24) {
          throw new Error('Daily bonus can only be claimed once every 24 hours. Please come back tomorrow!');
        }
      }

      const currentDiamonds = typeof data.diamonds === 'number' ? data.diamonds : 30;
      const currentEarnings = typeof data.totalEarnings === 'number' ? data.totalEarnings : 0;
      const newDiamonds = currentDiamonds + amount;
      const newEarnings = currentEarnings + amount;

      const updateData: Record<string, any> = {
        diamonds: newDiamonds,
        totalEarnings: newEarnings,
        updatedAt: serverTimestamp()
      };

      if (!isLuckySpin) {
        updateData.lastDailyClaimAt = now.toISOString();
      }

      transaction.update(userRef, updateData);

      // Create a diamond transaction record
      const txRef = doc(collection(db, 'diamondTransactions'));
      transaction.set(txRef, {
        userId,
        userName: data.name || 'Gamer',
        type: 'Earn',
        category: isLuckySpin ? 'tournament_win' : 'daily_checkin',
        amountDiamonds: amount,
        description: isLuckySpin ? `Booyah Lucky Spin Wheel (+${amount} 💎)` : `Daily Check-in Reward`,
        timestamp: now.toISOString(),
        status: 'Success'
      });

      return { newDiamonds, newEarnings };
    });

    return { success: true, ...result };
  } catch (err: any) {
    console.error('Error in claimDailyBonusSecurely:', err);
    return { success: false, error: err.message || 'Failed to claim daily bonus' };
  }
}

/**
 * Subscribe to real-time user profile updates (Single Source of Truth)
 */
export function subscribeToUserProfile(userId: string, onUpdate: (user: User) => void): () => void {
  if (!db) return () => {};
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      onUpdate({
        id: docSnap.id,
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
        isVerified: data.isVerified || false,
        referralCode: data.referralCode || '',
        hasClaimedReferral: data.hasClaimedReferral || false
      });
    }
  }, (err) => {
    console.warn('User snapshot error:', err);
  });
}

/**
 * Subscribe to real-time diamond transactions for user (Single Source of Truth)
 */
export function subscribeToTransactions(userId: string, onUpdate: (txs: any[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'diamondTransactions'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    onUpdate(list);
  }, (err) => {
    console.warn('Transactions snapshot error:', err);
  });
}
