import { describe, expect, it } from "vitest";
import { checkDeploymentEnv, formatDeploymentEnvCheck } from "@/lib/deployment-env";

describe("deployment env helpers", () => {
  it("passes with required public and server variables", () => {
    const result = checkDeploymentEnv({
      DATABASE_URL: "postgresql://example.invalid/db",
      DIRECT_URL: "postgresql://example.invalid/db",
      ADMIN_PASSWORD: "admin-password",
      NEXT_PUBLIC_SITE_URL: "https://example.com",
      SITE_ACCESS_ENABLED: "false",
      PRINT_FILE_STORAGE_PROVIDER: "local"
    });

    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.databaseMode).toBe("other");
    expect(result.plugoApi).toBe("missing");
    expect(result.portfolioStorage).toBe("local");
    expect(result.printFileStorage).toBe("local");
  });

  it("requires site access password and secret when private mode is enabled", () => {
    const result = checkDeploymentEnv({
      DATABASE_URL: "file:/var/task/prisma/preview.db?mode=ro",
      ADMIN_PASSWORD: "admin-password",
      NEXT_PUBLIC_SITE_URL: "https://example.com",
      SITE_ACCESS_ENABLED: "true",
      PRINT_FILE_STORAGE_PROVIDER: "local"
    });

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(["DIRECT_URL", "SITE_ACCESS_PASSWORD", "SITE_ACCESS_SECRET"]);
    expect(result.databaseMode).toBe("sqlite-file");
    expect(result.warnings[0]).toContain("SQLite file database");
  });

  it("requires the remaining Plugo variables when Plugo is partially configured", () => {
    const result = checkDeploymentEnv({
      DATABASE_URL: "postgresql://example.invalid/db",
      DIRECT_URL: "postgresql://example.invalid/db",
      ADMIN_PASSWORD: "admin-password",
      NEXT_PUBLIC_SITE_URL: "https://example.com",
      SITE_ACCESS_ENABLED: "false",
      PRINT_FILE_STORAGE_PROVIDER: "local",
      PLUGO_API_BASE_URL: "https://api.example.test",
      PLUGO_API_KEY: "plugo-api-key"
    });

    expect(result.ok).toBe(false);
    expect(result.plugoApi).toBe("partial");
    expect(result.missing).toEqual(["PLUGO_SECRET_KEY"]);
    expect(JSON.stringify(result)).not.toContain("plugo-api-key");
  });

  it("requires Naver Object Storage variables when the Naver provider is selected", () => {
    const result = checkDeploymentEnv({
      DATABASE_URL: "postgresql://example.invalid/db",
      DIRECT_URL: "postgresql://example.invalid/db",
      ADMIN_PASSWORD: "admin-password",
      NEXT_PUBLIC_SITE_URL: "https://example.com",
      SITE_ACCESS_ENABLED: "false",
      PRINT_FILE_STORAGE_PROVIDER: "local",
      PORTFOLIO_STORAGE_PROVIDER: "naver-object-storage",
      NAVER_OBJECT_STORAGE_BUCKET: "bucket"
    });

    expect(result.ok).toBe(false);
    expect(result.portfolioStorage).toBe("naver-object-storage");
    expect(result.missing).toEqual([
      "NAVER_OBJECT_STORAGE_ACCESS_KEY",
      "NAVER_OBJECT_STORAGE_SECRET_KEY",
      "NAVER_OBJECT_STORAGE_ENDPOINT",
      "NAVER_OBJECT_STORAGE_REGION",
      "NAVER_OBJECT_STORAGE_PUBLIC_BASE_URL"
    ]);
  });

  it("requires private Naver variables for print-file storage when selected", () => {
    const result = checkDeploymentEnv({
      DATABASE_URL: "postgresql://example.invalid/db",
      DIRECT_URL: "postgresql://example.invalid/db",
      ADMIN_PASSWORD: "admin-password",
      NEXT_PUBLIC_SITE_URL: "https://example.com",
      SITE_ACCESS_ENABLED: "false",
      PRINT_FILE_STORAGE_PROVIDER: "naver-object-storage"
    });

    expect(result.ok).toBe(false);
    expect(result.printFileStorage).toBe("naver-object-storage");
    expect(result.missing).toEqual([
      "NAVER_OBJECT_STORAGE_ACCESS_KEY",
      "NAVER_OBJECT_STORAGE_SECRET_KEY",
      "NAVER_OBJECT_STORAGE_BUCKET",
      "NAVER_OBJECT_STORAGE_ENDPOINT",
      "NAVER_OBJECT_STORAGE_REGION"
    ]);
  });

  it("formats results without exposing secret values", () => {
    const result = checkDeploymentEnv({
      DATABASE_URL: "file:./dev.db",
      DIRECT_URL: "postgresql://example.invalid/db",
      ADMIN_PASSWORD: "secret-value",
      NEXT_PUBLIC_SITE_URL: "",
      SITE_ACCESS_ENABLED: "false",
      PRINT_FILE_STORAGE_PROVIDER: "local"
    });

    const formatted = formatDeploymentEnvCheck(result);

    expect(formatted).toContain("NEXT_PUBLIC_SITE_URL");
    expect(formatted).not.toContain("secret-value");
    expect(formatted).not.toContain("file:./dev.db");
  });
});
