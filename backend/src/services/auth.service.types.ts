export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  baseCurrency: string;
  createdAt: Date;
}

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  tokenType: "Bearer";
  user: AuthUserProfile;
}
