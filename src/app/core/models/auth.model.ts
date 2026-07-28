export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  fullName: string;
  email: string;
  password: string;
  privacyAccepted: boolean;
}

export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string;
  isAnonymous: boolean;
}

export interface SignUpResult {
  user: AuthUser;
  requiresEmailConfirmation: boolean;
}