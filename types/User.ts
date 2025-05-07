export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt?: Date;
  updatedAt?: Date;
} 