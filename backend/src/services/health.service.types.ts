export interface HealthStatus {
  service: "easyjot-api";
  status: "ok" | "degraded";
  dependencies: {
    database: "up" | "down";
    redis: "up" | "down";
  };
}
