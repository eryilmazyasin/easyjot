export interface CreateRefreshTokenRecord {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface RefreshTokenRecord extends CreateRefreshTokenRecord {
  id: string;
  createdAt: Date;
}

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenRecord): Promise<RefreshTokenRecord>;
  revokeByHash(tokenHash: string): Promise<void>;
  rotate(
    currentTokenHash: string,
    replacement: Omit<CreateRefreshTokenRecord, "userId">,
    referenceDate: Date,
  ): Promise<RefreshTokenRecord | null>;
}
