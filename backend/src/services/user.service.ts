import { auth, db } from '../config/firebase.config';
import { User, UserCreateInput, UserUpdateInput } from '../models/user.model';

export class UserService {
  static async createUser(input: UserCreateInput): Promise<User> {
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: input.email,
        password: input.password,
        displayName: input.displayName,
      });

      // Create user document in Firestore
      const userData: Omit<User, 'uid'> = {
        email: input.email,
        displayName: input.displayName,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      };

      await db.collection('users').doc(userRecord.uid).set(userData);

      return {
        uid: userRecord.uid,
        ...userData,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUserProfile(uid: string): Promise<User | null> {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        return null;
      }
      return { uid, ...userDoc.data() } as User;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  static async updateUserProfile(uid: string, input: UserUpdateInput): Promise<User> {
    try {
      const userRef = db.collection('users').doc(uid);
      const updateData: any = {
        lastLoginAt: new Date(),
      };

      if (input.displayName) {
        updateData.displayName = input.displayName;
      }

      if (input.preferences) {
        const currentDoc = await userRef.get();
        const currentData = currentDoc.data();
        updateData.preferences = {
          ...currentData?.preferences,
          ...input.preferences,
        };
      }

      await userRef.update(updateData);
      const updatedDoc = await userRef.get();
      return { uid, ...updatedDoc.data() } as User;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
} 