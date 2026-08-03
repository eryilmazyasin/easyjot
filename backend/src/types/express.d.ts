import type { AuthenticatedUser } from "../services/auth.service.types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
