export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
    theme: string;
    notifications: boolean;
  };
}

export interface UserCreateInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface UserUpdateInput {
  displayName?: string;
  preferences?: {
    theme?: string;
    notifications?: boolean;
  };
} 