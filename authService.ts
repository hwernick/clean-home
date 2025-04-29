import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from './types/User';

// Register a new user
export const registerUser = async (email: string, password: string, displayName?: string) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      preferences: {
        theme: 'dark',
        notifications: true
      }
    });

    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Login existing user
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login timestamp
    await setDoc(doc(db, 'users', user.uid), {
      lastLoginAt: serverTimestamp(),
    }, { merge: true });

    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Subscribe to auth state changes
export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get user profile
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Delete user account
export const deleteUserAccount = async (user: FirebaseUser) => {
  try {
    // Delete user document from Firestore
    await deleteDoc(doc(db, 'users', user.uid));
    
    // Delete the user's authentication account
    await deleteUser(user);
    
    return true;
  } catch (error: any) {
    console.error('Error deleting account:', error);
    throw new Error(error.message);
  }
}; 