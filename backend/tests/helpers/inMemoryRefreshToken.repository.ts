import { randomUUID } from "node:crypto";

import type {
  CreateRefreshTokenRecord,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from "../../src/repositories/refreshToken.repository.types.js";

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private readonly tokensByHash = new Map<string, RefreshTokenRecord>();

  public async create(input: CreateRefreshTokenRecord): Promise<RefreshTokenRecord> {
    const token: RefreshTokenRecord = {
      ...input,
      id: randomUUID(),
      createdAt: new Date(),
    };

    this.tokensByHash.set(token.tokenHash, token);
    return token;
  }

  public async revokeByHash(tokenHash: string): Promise<void> {
    this.tokensByHash.delete(tokenHash);
  }

  public async rotate(
    currentTokenHash: string,
    replacement: Omit<CreateRefreshTokenRecord, "userId">,
    referenceDate: Date,
  ): Promise<RefreshTokenRecord | null> {
    const currentToken = this.tokensByHash.get(currentTokenHash);
    this.tokensByHash.delete(currentTokenHash);

    if (!currentToken || currentToken.expiresAt <= referenceDate) {
      return null;
    }

    return this.create({
      ...replacement,
      userId: currentToken.userId,
    });
  }
}
