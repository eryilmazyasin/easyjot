import { eq } from "drizzle-orm";

import { db } from "../db/index.js";
import { refreshTokens } from "../db/schema.js";
import type {
  CreateRefreshTokenRecord,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from "./refreshToken.repository.types.js";

const refreshTokenSelection = {
  id: refreshTokens.id,
  userId: refreshTokens.userId,
  tokenHash: refreshTokens.tokenHash,
  expiresAt: refreshTokens.expiresAt,
  createdAt: refreshTokens.createdAt,
};

export class DrizzleRefreshTokenRepository implements RefreshTokenRepository {
  public async create(input: CreateRefreshTokenRecord): Promise<RefreshTokenRecord> {
    const [createdToken] = await db
      .insert(refreshTokens)
      .values(input)
      .returning(refreshTokenSelection);

    if (!createdToken) {
      throw new Error("The refresh token could not be created.");
    }

    return createdToken;
  }

  public async revokeByHash(tokenHash: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
  }

  public async rotate(
    currentTokenHash: string,
    replacement: Omit<CreateRefreshTokenRecord, "userId">,
    referenceDate: Date,
  ): Promise<RefreshTokenRecord | null> {
    return db.transaction(async (transaction) => {
      // Deleting first makes concurrent refresh attempts single-use: only one can receive the row.
      const [currentToken] = await transaction
        .delete(refreshTokens)
        .where(eq(refreshTokens.tokenHash, currentTokenHash))
        .returning(refreshTokenSelection);

      if (!currentToken || currentToken.expiresAt <= referenceDate) {
        return null;
      }

      const [replacementToken] = await transaction
        .insert(refreshTokens)
        .values({
          ...replacement,
          userId: currentToken.userId,
        })
        .returning(refreshTokenSelection);

      if (!replacementToken) {
        throw new Error("The replacement refresh token could not be created.");
      }

      return replacementToken;
    });
  }
}

export const refreshTokenRepository = new DrizzleRefreshTokenRepository();
