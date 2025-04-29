import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { subscribeToAuthChanges } from '../authService';
import { User } from '../types/User';

type AuthContextType = {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = subscribeToAuthChanges((user) => {
      setUser(user);
      if (!user) {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  // Subscribe to user profile changes
  useEffect(() => {
    if (!user) return;

    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), 
      (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as User);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        setLoading(false);
      }
    );

    return unsubscribeProfile;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 