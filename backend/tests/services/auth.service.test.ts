import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compare } from "bcryptjs";

import {
  AuthService,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from "../../src/services/auth.service.js";
import { InMemoryRefreshTokenRepository } from "../helpers/inMemoryRefreshToken.repository.js";
import { InMemoryUserRepository } from "../helpers/inMemoryUser.repository.js";

const testJwtSecret = "easyjot-test-jwt-secret-with-at-least-32-characters";

describe("AuthService", () => {
  it("hashes passwords and assigns TRY when registering", async () => {
    const users = new InMemoryUserRepository();
    const authService = new AuthService(
      users,
      new InMemoryRefreshTokenRepository(),
      testJwtSecret,
      4,
    );

    const result = await authService.register("USER@Example.com", "secure-password");
    const storedUser = await users.findByEmail("user@example.com");

    assert.ok(storedUser);
    assert.notEqual(storedUser.passwordHash, "secure-password");
    assert.equal(await compare("secure-password", storedUser.passwordHash), true);
    assert.equal(result.user.email, "user@example.com");
    assert.equal(result.user.baseCurrency, "TRY");
    assert.equal(result.expiresIn, 900);
    assert.equal(result.refreshTokenExpiresIn, 604_800);
    assert.ok(result.refreshToken.length >= 43);
  });

  it("rejects a login attempt with an incorrect password", async () => {
    const users = new InMemoryUserRepository();
    const authService = new AuthService(
      users,
      new InMemoryRefreshTokenRepository(),
      testJwtSecret,
      4,
    );
    await authService.register("user@example.com", "secure-password");

    await assert.rejects(
      authService.login("user@example.com", "incorrect-password"),
      InvalidCredentialsError,
    );
  });

  it("rotates a refresh token and rejects reuse of the previous token", async () => {
    const authService = new AuthService(
      new InMemoryUserRepository(),
      new InMemoryRefreshTokenRepository(),
      testJwtSecret,
      4,
    );
    const registration = await authService.register("user@example.com", "secure-password");

    const rotated = await authService.refresh(registration.refreshToken);

    assert.notEqual(rotated.refreshToken, registration.refreshToken);
    assert.notEqual(rotated.accessToken, registration.accessToken);
    await assert.rejects(
      authService.refresh(registration.refreshToken),
      InvalidRefreshTokenError,
    );
  });

  it("revokes a refresh token on logout", async () => {
    const authService = new AuthService(
      new InMemoryUserRepository(),
      new InMemoryRefreshTokenRepository(),
      testJwtSecret,
      4,
    );
    const registration = await authService.register("user@example.com", "secure-password");

    await authService.logout(registration.refreshToken);

    await assert.rejects(
      authService.refresh(registration.refreshToken),
      InvalidRefreshTokenError,
    );
  });
});
