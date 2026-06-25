import { describe, expect, it } from "vitest";
import { buildHealthResponse } from "@/lib/deployment-health";

describe("deployment health helper", () => {
  it("returns safe deployment health without exposing env values", () => {
    const response = buildHealthResponse({
      now: new Date("2026-06-20T12:00:00.000Z"),
      env: {
        DATABASE_URL: "file:/var/task/prisma/preview.db?mode=ro",
        SITE_ACCESS_ENABLED: "true",
        ADMIN_PASSWORD: "secret"
      }
    });

    expect(response).toEqual({
      ok: true,
      app: "PerPackage Marketing Lead Management System",
      timestamp: "2026-06-20T12:00:00.000Z",
      database: "configured",
      siteAccess: "enabled"
    });
    expect(JSON.stringify(response)).not.toContain("secret");
    expect(JSON.stringify(response)).not.toContain("preview.db");
  });

  it("marks missing database and disabled site access", () => {
    const response = buildHealthResponse({
      now: new Date("2026-06-20T12:00:00.000Z"),
      env: {
        SITE_ACCESS_ENABLED: "false"
      }
    });

    expect(response.database).toBe("missing");
    expect(response.siteAccess).toBe("disabled");
  });
});
