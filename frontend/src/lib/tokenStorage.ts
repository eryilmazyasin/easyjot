const accessTokenKey = "easyjot.access-token";
const refreshTokenKey = "easyjot.refresh-token";

const getStorage = (): Storage | null =>
  typeof window === "undefined" ? null : window.localStorage;

export const tokenStorage = {
  getAccessToken(): string | null {
    return getStorage()?.getItem(accessTokenKey) ?? null;
  },
  getRefreshToken(): string | null {
    return getStorage()?.getItem(refreshTokenKey) ?? null;
  },
  setTokens(accessToken: string, refreshToken: string): void {
    const storage = getStorage();
    storage?.setItem(accessTokenKey, accessToken);
    storage?.setItem(refreshTokenKey, refreshToken);
  },
  clear(): void {
    const storage = getStorage();
    storage?.removeItem(accessTokenKey);
    storage?.removeItem(refreshTokenKey);
  },
};
