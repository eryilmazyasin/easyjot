import { createHash, randomBytes, randomUUID } from "node:crypto";

import { compare, hash } from "bcryptjs";
import jwt from "jsonwebtoken";

import type { RefreshTokenRepository } from "../repositories/refreshToken.repository.types.js";
import type {
  UserRecord,
  UserRepository,
} from "../repositories/user.repository.types.js";
import type {
  AuthenticatedUser,
  AuthResult,
  AuthUserProfile,
} from "./auth.service.types.js";

const accessTokenExpiresInSeconds = 15 * 60;
const refreshTokenExpiresInSeconds = 7 * 24 * 60 * 60;
const jwtAudience = "easyjot-client";
const jwtIssuer = "easyjot-api";

export class EmailAlreadyRegisteredError extends Error {
  public constructor() {
    super("An account with this email address already exists.");
    this.name = "EmailAlreadyRegisteredError";
  }
}

export class InvalidCredentialsError extends Error {
  public constructor() {
    super("Email or password is incorrect.");
    this.name = "InvalidCredentialsError";
  }
}

export class InvalidAccessTokenError extends Error {
  public constructor() {
    super("The access token is invalid or expired.");
    this.name = "InvalidAccessTokenError";
  }
}

export class InvalidRefreshTokenError extends Error {
  public constructor() {
    super("The refresh token is invalid or expired.");
    this.name = "InvalidRefreshTokenError";
  }
}

export class AuthUserNotFoundError extends Error {
  public constructor() {
    super("The authenticated user no longer exists.");
    this.name = "AuthUserNotFoundError";
  }
}

const toUserProfile = (user: UserRecord): AuthUserProfile => ({
  id: user.id,
  email: user.email,
  baseCurrency: user.baseCurrency,
  createdAt: user.createdAt,
});

export class AuthService {
  public constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly jwtSecret: string,
    private readonly passwordSaltRounds = 12,
  ) {}

  public async register(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLocaleLowerCase("en-US");
    const existingUser = await this.users.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await hash(password, this.passwordSaltRounds);
    const user = await this.users.create({
      email: normalizedEmail,
      passwordHash,
      baseCurrency: "TRY",
    });

    return this.createAuthResult(user);
  }

  public async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLocaleLowerCase("en-US");
    const user = await this.users.findByEmail(normalizedEmail);

    // The same error is used for missing users and bad passwords to avoid account enumeration.
    if (!user || !(await compare(password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }

    return this.createAuthResult(user);
  }

  public async refresh(refreshToken: string): Promise<AuthResult> {
    const replacementToken = this.generateRefreshToken();
    const referenceDate = new Date();
    const rotatedToken = await this.refreshTokens.rotate(
      this.hashRefreshToken(refreshToken),
      {
        tokenHash: this.hashRefreshToken(replacementToken),
        expiresAt: this.getRefreshTokenExpiry(referenceDate),
      },
      referenceDate,
    );

    if (!rotatedToken) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.users.findById(rotatedToken.userId);

    if (!user) {
      await this.refreshTokens.revokeByHash(rotatedToken.tokenHash);
      throw new InvalidRefreshTokenError();
    }

    return this.createAuthResult(user, replacementToken, false);
  }

  public async logout(refreshToken: string): Promise<void> {
    await this.refreshTokens.revokeByHash(this.hashRefreshToken(refreshToken));
  }

  public async getProfile(userId: string): Promise<AuthUserProfile> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new AuthUserNotFoundError();
    }

    return toUserProfile(user);
  }

  public verifyAccessToken(token: string): AuthenticatedUser {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ["HS256"],
        audience: jwtAudience,
        issuer: jwtIssuer,
      });

      if (
        typeof payload === "string" ||
        typeof payload.sub !== "string" ||
        typeof payload.email !== "string"
      ) {
        throw new InvalidAccessTokenError();
      }

      return {
        id: payload.sub,
        email: payload.email,
      };
    } catch {
      throw new InvalidAccessTokenError();
    }
  }

  private async createAuthResult(
    user: UserRecord,
    existingRefreshToken?: string,
    persistRefreshToken = true,
  ): Promise<AuthResult> {
    const accessToken = jwt.sign({ email: user.email }, this.jwtSecret, {
      algorithm: "HS256",
      audience: jwtAudience,
      expiresIn: accessTokenExpiresInSeconds,
      issuer: jwtIssuer,
      jwtid: randomUUID(),
      subject: user.id,
    });
    const refreshToken = existingRefreshToken ?? this.generateRefreshToken();

    if (persistRefreshToken) {
      await this.refreshTokens.create({
        userId: user.id,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt: this.getRefreshTokenExpiry(new Date()),
      });
    }

    return {
      accessToken,
      expiresIn: accessTokenExpiresInSeconds,
      refreshToken,
      refreshTokenExpiresIn: refreshTokenExpiresInSeconds,
      tokenType: "Bearer",
      user: toUserProfile(user),
    };
  }

  private generateRefreshToken(): string {
    return randomBytes(32).toString("base64url");
  }

  private getRefreshTokenExpiry(referenceDate: Date): Date {
    return new Date(referenceDate.getTime() + refreshTokenExpiresInSeconds * 1_000);
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash("sha256").update(refreshToken, "utf8").digest("hex");
  }
}
