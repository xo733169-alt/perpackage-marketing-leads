import { isSiteAccessEnabled } from "@/lib/site-access";

type EnvMap = Record<string, string | undefined>;

export type HealthResponse = {
  ok: true;
  app: "PerPackage Marketing Lead Management System";
  timestamp: string;
  database: "configured" | "missing";
  siteAccess: "enabled" | "disabled";
};

export function buildHealthResponse({
  now = new Date(),
  env = process.env
}: {
  now?: Date;
  env?: EnvMap;
} = {}): HealthResponse {
  return {
    ok: true,
    app: "PerPackage Marketing Lead Management System",
    timestamp: now.toISOString(),
    database: env.DATABASE_URL?.trim() ? "configured" : "missing",
    siteAccess: isSiteAccessEnabled(env) ? "enabled" : "disabled"
  };
}
