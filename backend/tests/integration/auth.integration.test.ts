import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import express, { type Express } from "express";
import request from "supertest";

import { errorHandler } from "../../src/middleware/errorHandler.middleware.js";
import { createAuthRouter } from "../../src/routes/auth.routes.js";
import { AuthService } from "../../src/services/auth.service.js";
import { InMemoryRefreshTokenRepository } from "../helpers/inMemoryRefreshToken.repository.js";
import { InMemoryUserRepository } from "../helpers/inMemoryUser.repository.js";

const testJwtSecret = "easyjot-test-jwt-secret-with-at-least-32-characters";
const credentials = {
  email: "user@example.com",
  password: "secure-password",
};

const createTestApp = (): Express => {
  const app = express();
  const authService = new AuthService(
    new InMemoryUserRepository(),
    new InMemoryRefreshTokenRepository(),
    testJwtSecret,
    4,
  );

  app.use(express.json());
  app.use("/api/v1/auth", createAuthRouter(authService));
  app.use(errorHandler);

  return app;
};

describe("Auth API", () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it("registers a new user", async () => {
    const response = await request(app).post("/api/v1/auth/register").send(credentials);

    assert.equal(response.status, 201);
    assert.equal(response.body.user.email, credentials.email);
    assert.equal(response.body.user.baseCurrency, "TRY");
    assert.equal(response.body.tokenType, "Bearer");
    assert.equal(typeof response.body.accessToken, "string");
    assert.equal(typeof response.body.refreshToken, "string");
    assert.equal(response.body.refreshTokenExpiresIn, 604_800);
    assert.equal("password" in response.body.user, false);
    assert.equal("passwordHash" in response.body.user, false);
  });

  it("returns 401 when logging in with an incorrect password", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials).expect(201);

    const response = await request(app).post("/api/v1/auth/login").send({
      ...credentials,
      password: "incorrect-password",
    });

    assert.equal(response.status, 401);
  });

  it("returns an access token after a successful login", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials).expect(201);

    const response = await request(app).post("/api/v1/auth/login").send(credentials);

    assert.equal(response.status, 200);
    assert.equal(response.body.tokenType, "Bearer");
    assert.equal(response.body.expiresIn, 900);
    assert.equal(typeof response.body.accessToken, "string");
  });

  it("returns the current profile from the protected me endpoint", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials).expect(201);
    const loginResponse = await request(app).post("/api/v1/auth/login").send(credentials);

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.user.email, credentials.email);
    assert.equal(response.body.user.baseCurrency, "TRY");
  });

  it("rotates refresh tokens and rejects reuse of the previous token", async () => {
    const registration = await request(app)
      .post("/api/v1/auth/register")
      .send(credentials)
      .expect(201);

    const refreshResponse = await request(app).post("/api/v1/auth/refresh").send({
      refreshToken: registration.body.refreshToken,
    });

    assert.equal(refreshResponse.status, 200);
    assert.equal(typeof refreshResponse.body.accessToken, "string");
    assert.equal(typeof refreshResponse.body.refreshToken, "string");
    assert.notEqual(refreshResponse.body.refreshToken, registration.body.refreshToken);

    await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: registration.body.refreshToken })
      .expect(401);
  });

  it("revokes the refresh token on logout", async () => {
    const registration = await request(app)
      .post("/api/v1/auth/register")
      .send(credentials)
      .expect(201);

    await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken: registration.body.refreshToken })
      .expect(204);

    await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: registration.body.refreshToken })
      .expect(401);
  });
});
