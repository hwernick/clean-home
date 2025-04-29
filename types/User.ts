export interface User {
  uid: string;          // Firebase Auth UID
  email: string;
  displayName?: string;
  createdAt: number;
  lastLoginAt: number;
  preferences?: {
    theme?: string;
    notifications?: boolean;
    dataCollection?: boolean;
    locationServices?: boolean;
  };
} 