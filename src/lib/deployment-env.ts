export const REQUIRED_DEPLOYMENT_ENV_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "ADMIN_PASSWORD",
  "NEXT_PUBLIC_SITE_URL",
  "SITE_ACCESS_ENABLED"
] as const;

export const OPTIONAL_DEPLOYMENT_ENV_KEYS = [
  "NEXT_PUBLIC_KAKAO_CHANNEL_URL",
  "LEAD_NOTIFICATION_WEBHOOK_URL",
  "QUOTE_RESPONSE_WEBHOOK_URL",
  "PLUGO_API_BASE_URL",
  "PLUGO_REQUESTS_PATH",
  "PLUGO_API_KEY",
  "PLUGO_SECRET_KEY",
  "PLUGO_API_KEY_HEADER_NAME",
  "PLUGO_SECRET_KEY_HEADER_NAME",
  "PLUGO_FORWARD_QUERY_KEYS",
  "PLUGO_TIMEOUT_MS",
  "PORTFOLIO_STORAGE_PROVIDER",
  "BLOB_READ_WRITE_TOKEN",
  "NAVER_OBJECT_STORAGE_ACCESS_KEY",
  "NAVER_OBJECT_STORAGE_SECRET_KEY",
  "NAVER_OBJECT_STORAGE_BUCKET",
  "NAVER_OBJECT_STORAGE_ENDPOINT",
  "NAVER_OBJECT_STORAGE_REGION",
  "NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL"
] as const;

const PLUGO_REQUIRED_ENV_KEYS = ["PLUGO_API_BASE_URL", "PLUGO_API_KEY", "PLUGO_SECRET_KEY"] as const;
const NAVER_OBJECT_STORAGE_REQUIRED_ENV_KEYS = [
  "NAVER_OBJECT_STORAGE_ACCESS_KEY",
  "NAVER_OBJECT_STORAGE_SECRET_KEY",
  "NAVER_OBJECT_STORAGE_BUCKET",
  "NAVER_OBJECT_STORAGE_ENDPOINT",
  "NAVER_OBJECT_STORAGE_REGION",
  "NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL"
] as const;

type EnvMap = Record<string, string | undefined>;

export type DeploymentEnvCheckResult = {
  ok: boolean;
  missing: string[];
  warnings: string[];
  siteAccessEnabled: boolean;
  databaseMode: "sqlite-file" | "other" | "missing";
  plugoApi: "configured" | "partial" | "missing";
  portfolioStorage: "local" | "vercel-blob" | "naver-object-storage" | "unsupported";
};

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function getDatabaseMode(databaseUrl: string | undefined): DeploymentEnvCheckResult["databaseMode"] {
  if (!hasValue(databaseUrl)) return "missing";
  return databaseUrl?.trim().startsWith("file:") ? "sqlite-file" : "other";
}

export function checkDeploymentEnv(env: EnvMap = process.env): DeploymentEnvCheckResult {
  const missing: string[] = REQUIRED_DEPLOYMENT_ENV_KEYS.filter((key) => !hasValue(env[key]));
  const warnings: string[] = [];
  const siteAccessEnabled = env.SITE_ACCESS_ENABLED === "true";
  const databaseMode = getDatabaseMode(env.DATABASE_URL);
  const portfolioStorageProvider = (env.PORTFOLIO_STORAGE_PROVIDER || "local").trim().toLowerCase();
  const portfolioStorage: DeploymentEnvCheckResult["portfolioStorage"] =
    portfolioStorageProvider === "local" || portfolioStorageProvider === ""
      ? "local"
      : portfolioStorageProvider === "vercel-blob"
        ? "vercel-blob"
        : portfolioStorageProvider === "naver-object-storage" || portfolioStorageProvider === "naver"
          ? "naver-object-storage"
          : "unsupported";
  const plugoKeysPresent = PLUGO_REQUIRED_ENV_KEYS.filter((key) => hasValue(env[key]));
  const plugoApi =
    plugoKeysPresent.length === 0
      ? "missing"
      : plugoKeysPresent.length === PLUGO_REQUIRED_ENV_KEYS.length
        ? "configured"
        : "partial";

  if (siteAccessEnabled) {
    if (!hasValue(env.SITE_ACCESS_PASSWORD)) {
      missing.push("SITE_ACCESS_PASSWORD");
    }

    if (!hasValue(env.SITE_ACCESS_SECRET)) {
      missing.push("SITE_ACCESS_SECRET");
    }
  }

  if (databaseMode === "sqlite-file") {
    warnings.push("DATABASE_URL uses a SQLite file database. Use this for preview/testing only; plan PostgreSQL before real production operation.");
  }

  if (databaseMode === "other" && !hasValue(env.DIRECT_URL)) {
    missing.push("DIRECT_URL");
  }

  if (env.SITE_ACCESS_ENABLED && env.SITE_ACCESS_ENABLED !== "true" && env.SITE_ACCESS_ENABLED !== "false") {
    warnings.push('SITE_ACCESS_ENABLED should be either "true" or "false".');
  }

  if (plugoApi === "partial") {
    PLUGO_REQUIRED_ENV_KEYS.forEach((key) => {
      if (!hasValue(env[key])) missing.push(key);
    });
  }

  if (portfolioStorage === "local") {
    warnings.push("Portfolio image storage is local. Use Naver Object Storage for durable production uploads.");
  }

  if (portfolioStorage === "vercel-blob" && !hasValue(env.BLOB_READ_WRITE_TOKEN)) {
    missing.push("BLOB_READ_WRITE_TOKEN");
  }

  if (portfolioStorage === "naver-object-storage") {
    NAVER_OBJECT_STORAGE_REQUIRED_ENV_KEYS.forEach((key) => {
      if (!hasValue(env[key])) missing.push(key);
    });
  }

  if (portfolioStorage === "unsupported") {
    warnings.push("PORTFOLIO_STORAGE_PROVIDER should be local, vercel-blob, or naver-object-storage.");
  }

  if (hasValue(env.NEXT_PUBLIC_PLUGO_API_KEY) || hasValue(env.NEXT_PUBLIC_PLUGO_SECRET_KEY)) {
    warnings.push("Do not use NEXT_PUBLIC_ for Plugo credentials. Browser-exposed variables can leak API secrets.");
  }

  return {
    ok: missing.length === 0,
    missing,
    warnings,
    siteAccessEnabled,
    databaseMode,
    plugoApi,
    portfolioStorage
  };
}

export function formatDeploymentEnvCheck(result: DeploymentEnvCheckResult): string {
  const lines = [
    result.ok ? "Deployment environment check passed." : "Deployment environment check failed.",
    `Site access: ${result.siteAccessEnabled ? "enabled" : "disabled"}`,
    `Database mode: ${result.databaseMode}`,
    `Plugo API: ${result.plugoApi}`,
    `Portfolio storage: ${result.portfolioStorage}`
  ];

  if (result.missing.length) {
    lines.push(`Missing variables: ${result.missing.join(", ")}`);
  }

  if (result.warnings.length) {
    lines.push("Warnings:");
    result.warnings.forEach((warning) => lines.push(`- ${warning}`));
  }

  return lines.join("\n");
}
