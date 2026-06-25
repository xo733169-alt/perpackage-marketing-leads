import { describe, expect, it, vi } from "vitest";
import {
  buildPlugoRequestsUrl,
  fetchPlugoRequests,
  readPlugoConfig,
  redactPlugoSecrets,
  type PlugoConfig
} from "@/lib/plugo";

function createConfig(overrides: Partial<PlugoConfig> = {}): PlugoConfig {
  return {
    baseUrl: "https://api.example.test",
    requestsPath: "/requests",
    apiKey: "api-key-value",
    secretKey: "secret-key-value",
    apiKeyHeaderName: "X-API-Key",
    secretKeyHeaderName: "X-Secret-Key",
    forwardQueryKeys: new Set(["page", "limit", "status"]),
    timeoutMs: 10000,
    ...overrides
  };
}

describe("plugo API helpers", () => {
  it("reports missing server-only environment variables without exposing values", () => {
    const result = readPlugoConfig({
      PLUGO_API_BASE_URL: "",
      PLUGO_API_KEY: "hidden-api-key",
      PLUGO_SECRET_KEY: ""
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toEqual(["PLUGO_API_BASE_URL", "PLUGO_SECRET_KEY"]);
      expect(JSON.stringify(result)).not.toContain("hidden-api-key");
    }
  });

  it("builds the requests URL from allowed query parameters only", () => {
    const sourceParams = new URLSearchParams({
      page: "2",
      limit: "500",
      status: "open",
      apiKey: "do-not-forward",
      unknown: "drop"
    });

    const url = buildPlugoRequestsUrl(createConfig(), sourceParams);

    expect(url.toString()).toBe("https://api.example.test/requests?page=2&limit=100&status=open");
  });

  it("redacts configured Plugo secrets from nested response data", () => {
    const redacted = redactPlugoSecrets(
      {
        echoed: "api-key-value",
        nested: [{ token: "secret-key-value" }]
      },
      {
        PLUGO_API_KEY: "api-key-value",
        PLUGO_SECRET_KEY: "secret-key-value"
      }
    );

    expect(JSON.stringify(redacted)).not.toContain("api-key-value");
    expect(JSON.stringify(redacted)).not.toContain("secret-key-value");
    expect(redacted).toEqual({
      echoed: "[redacted]",
      nested: [{ token: "[redacted]" }]
    });
  });

  it("sends Plugo credentials only in upstream headers and redacts response data", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      return new Response(
        JSON.stringify({
          requests: [{ id: "REQ-1", echoedSecret: "secret-key-value" }]
        }),
        { status: 200 }
      );
    });

    const data = await fetchPlugoRequests({
      searchParams: new URLSearchParams({ page: "1" }),
      env: {
        PLUGO_API_BASE_URL: "https://api.example.test",
        PLUGO_REQUESTS_PATH: "/requests",
        PLUGO_API_KEY: "api-key-value",
        PLUGO_SECRET_KEY: "secret-key-value"
      },
      fetchImpl
    });

    const [url, init] = fetchImpl.mock.calls[0]!;
    const headers = init?.headers as Headers;

    expect(String(url)).toBe("https://api.example.test/requests?page=1");
    expect(headers.get("X-API-Key")).toBe("api-key-value");
    expect(headers.get("X-Secret-Key")).toBe("secret-key-value");
    expect(JSON.stringify(data)).not.toContain("secret-key-value");
    expect(data).toEqual({ requests: [{ id: "REQ-1", echoedSecret: "[redacted]" }] });
  });
});
