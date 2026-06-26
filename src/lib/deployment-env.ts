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
  "NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "UPLOAD_MAX_FILE_SIZE_MB",
  "UPLOAD_MAX_ZIP_SIZE_MB",
  "UPLOAD_MAX_PROJECT_SIZE_MB",
  "UPLOAD_ALLOWED_EXTENSIONS",
  "UPLOAD_SIGNED_URL_EXPIRES_SECONDS",
  "PRINT_FILE_STORAGE_PROVIDER",
  "UPLOAD_LOCAL_STORAGE_DIR",
  "UPLOAD_LOCAL_STORAGE_SECRET",
  "ADMIN_UPLOAD_ACCESS_MODE",
  "CAFE24_MALL_ID",
  "CAFE24_CLIENT_ID",
  "CAFE24_CLIENT_SECRET",
  "CAFE24_REDIRECT_URI",
  "CAFE24_WEBHOOK_SECRET",
  "CAFE24_API_VERSION",
  "CAFE24_SCOPES"
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
const CAFE24_REQUIRED_ENV_KEYS = [
  "CAFE24_MALL_ID",
  "CAFE24_CLIENT_ID",
  "CAFE24_CLIENT_SECRET",
  "CAFE24_REDIRECT_URI",
  "CAFE24_WEBHOOK_SECRET"
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
  printFileStorage: "local" | "naver-object-storage" | "unsupported";
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
  const addMissing = (key: string) => {
    if (!missing.includes(key)) missing.push(key);
  };
  const siteAccessEnabled = env.SITE_ACCESS_ENABLED === "true";
  const databaseMode = getDatabaseMode(env.DATABASE_URL);
  const portfolioStorageProvider = (env.PORTFOLIO_STORAGE_PROVIDER || "local").trim().toLowerCase();
  const printFileStorageProvider = (env.PRINT_FILE_STORAGE_PROVIDER || "naver-object-storage").trim().toLowerCase();
  const portfolioStorage: DeploymentEnvCheckResult["portfolioStorage"] =
    portfolioStorageProvider === "local" || portfolioStorageProvider === ""
      ? "local"
      : portfolioStorageProvider === "vercel-blob"
        ? "vercel-blob"
        : portfolioStorageProvider === "naver-object-storage" || portfolioStorageProvider === "naver"
          ? "naver-object-storage"
          : "unsupported";
  const plugoKeysPresent = PLUGO_REQUIRED_ENV_KEYS.filter((key) => hasValue(env[key]));
  const printFileStorage: DeploymentEnvCheckResult["printFileStorage"] =
    printFileStorageProvider === "local"
      ? "local"
      : printFileStorageProvider === "naver-object-storage" || printFileStorageProvider === "naver"
        ? "naver-object-storage"
        : "unsupported";
  const plugoApi =
    plugoKeysPresent.length === 0
      ? "missing"
      : plugoKeysPresent.length === PLUGO_REQUIRED_ENV_KEYS.length
        ? "configured"
        : "partial";

  if (siteAccessEnabled) {
    if (!hasValue(env.SITE_ACCESS_PASSWORD)) {
      addMissing("SITE_ACCESS_PASSWORD");
    }

    if (!hasValue(env.SITE_ACCESS_SECRET)) {
      addMissing("SITE_ACCESS_SECRET");
    }
  }

  if (databaseMode === "sqlite-file") {
    warnings.push("DATABASE_URL uses a SQLite file database. Use this for preview/testing only; plan PostgreSQL before real production operation.");
  }

  if (databaseMode === "other" && !hasValue(env.DIRECT_URL)) {
    addMissing("DIRECT_URL");
  }

  if (env.SITE_ACCESS_ENABLED && env.SITE_ACCESS_ENABLED !== "true" && env.SITE_ACCESS_ENABLED !== "false") {
    warnings.push('SITE_ACCESS_ENABLED should be either "true" or "false".');
  }

  if (plugoApi === "partial") {
    PLUGO_REQUIRED_ENV_KEYS.forEach((key) => {
      if (!hasValue(env[key])) addMissing(key);
    });
  }

  if (portfolioStorage === "local") {
    warnings.push("Portfolio image storage is local. Use Naver Object Storage for durable production uploads.");
  }

  if (portfolioStorage === "vercel-blob" && !hasValue(env.BLOB_READ_WRITE_TOKEN)) {
    addMissing("BLOB_READ_WRITE_TOKEN");
  }

  if (portfolioStorage === "naver-object-storage") {
    NAVER_OBJECT_STORAGE_REQUIRED_ENV_KEYS.forEach((key) => {
      if (!hasValue(env[key])) addMissing(key);
    });
  }

  if (portfolioStorage === "unsupported") {
    warnings.push("PORTFOLIO_STORAGE_PROVIDER should be local, vercel-blob, or naver-object-storage.");
  }

  if (printFileStorage === "local") {
    warnings.push("Print-file storage is local. Use Naver Object Storage before production operation.");
  }

  if (printFileStorage === "naver-object-storage") {
    NAVER_OBJECT_STORAGE_REQUIRED_ENV_KEYS.slice(0, 5).forEach((key) => {
      if (!hasValue(env[key])) addMissing(key);
    });
  }

  if (printFileStorage === "unsupported") {
    warnings.push("PRINT_FILE_STORAGE_PROVIDER should be local or naver-object-storage.");
  }

  const cafe24KeysPresent = CAFE24_REQUIRED_ENV_KEYS.filter((key) => hasValue(env[key]));
  if (cafe24KeysPresent.length > 0 && cafe24KeysPresent.length < CAFE24_REQUIRED_ENV_KEYS.length) {
    CAFE24_REQUIRED_ENV_KEYS.forEach((key) => {
      if (!hasValue(env[key])) addMissing(key);
    });
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
    portfolioStorage,
    printFileStorage
  };
}

export function formatDeploymentEnvCheck(result: DeploymentEnvCheckResult): string {
  const lines = [
    result.ok ? "Deployment environment check passed." : "Deployment environment check failed.",
    `Site access: ${result.siteAccessEnabled ? "enabled" : "disabled"}`,
    `Database mode: ${result.databaseMode}`,
    `Plugo API: ${result.plugoApi}`,
    `Portfolio storage: ${result.portfolioStorage}`,
    `Print-file storage: ${result.printFileStorage}`
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
