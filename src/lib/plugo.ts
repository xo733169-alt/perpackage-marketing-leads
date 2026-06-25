const DEFAULT_REQUESTS_PATH = "/requests";
const DEFAULT_API_KEY_HEADER_NAME = "X-API-Key";
const DEFAULT_SECRET_KEY_HEADER_NAME = "X-Secret-Key";
const DEFAULT_TIMEOUT_MS = 10000;
const MAX_TIMEOUT_MS = 30000;

const DEFAULT_FORWARD_QUERY_KEYS = [
  "page",
  "limit",
  "offset",
  "cursor",
  "status",
  "from",
  "to",
  "startDate",
  "endDate",
  "createdFrom",
  "createdTo",
  "updatedFrom",
  "updatedTo",
  "sort",
  "order",
  "q"
];

const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const SAFE_QUERY_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/;
const SENSITIVE_QUERY_KEY_PATTERN = /(api|key|secret|token|auth|password|credential)/i;

type EnvMap = Record<string, string | undefined>;

export type PlugoConfig = {
  baseUrl: string;
  requestsPath: string;
  apiKey: string;
  secretKey: string;
  apiKeyHeaderName: string;
  secretKeyHeaderName: string;
  forwardQueryKeys: Set<string>;
  timeoutMs: number;
};

export type PlugoConfigResult =
  | { ok: true; config: PlugoConfig }
  | { ok: false; missing: string[]; errors: string[] };

type FetchLike = typeof fetch;

export class PlugoConfigError extends Error {
  constructor(
    readonly missing: string[],
    readonly errors: string[]
  ) {
    super("Plugo API configuration is invalid.");
  }
}

export class PlugoUpstreamError extends Error {
  constructor(readonly status: number) {
    super("Plugo API request failed.");
  }
}

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function cleanEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

function parseTimeoutMs(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(Math.round(parsed), 1000), MAX_TIMEOUT_MS);
}

function parseForwardQueryKeys(value: string | undefined): Set<string> {
  const rawKeys = hasValue(value) ? value!.split(",") : DEFAULT_FORWARD_QUERY_KEYS;
  const safeKeys = rawKeys
    .map((key) => key.trim())
    .filter((key) => SAFE_QUERY_KEY_PATTERN.test(key))
    .filter((key) => !SENSITIVE_QUERY_KEY_PATTERN.test(key));

  return new Set(safeKeys);
}

function validateBaseUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "PLUGO_API_BASE_URL must start with http:// or https://.";
    }
    return undefined;
  } catch {
    return "PLUGO_API_BASE_URL must be a valid URL.";
  }
}

function validateRequestsPath(value: string): string | undefined {
  if (!value.startsWith("/")) return "PLUGO_REQUESTS_PATH must start with '/'.";
  if (/^https?:\/\//i.test(value)) return "PLUGO_REQUESTS_PATH must be a relative path.";
  return undefined;
}

function validateHeaderName(key: string, value: string): string | undefined {
  if (!HEADER_NAME_PATTERN.test(value)) return `${key} must be a valid HTTP header name.`;
  return undefined;
}

export function readPlugoConfig(env: EnvMap = process.env): PlugoConfigResult {
  const missing = ["PLUGO_API_BASE_URL", "PLUGO_API_KEY", "PLUGO_SECRET_KEY"].filter((key) => !hasValue(env[key]));
  const errors: string[] = [];
  const baseUrl = cleanEnv(env.PLUGO_API_BASE_URL);
  const requestsPath = cleanEnv(env.PLUGO_REQUESTS_PATH) || DEFAULT_REQUESTS_PATH;
  const apiKeyHeaderName = cleanEnv(env.PLUGO_API_KEY_HEADER_NAME) || DEFAULT_API_KEY_HEADER_NAME;
  const secretKeyHeaderName = cleanEnv(env.PLUGO_SECRET_KEY_HEADER_NAME) || DEFAULT_SECRET_KEY_HEADER_NAME;

  if (baseUrl) {
    const error = validateBaseUrl(baseUrl);
    if (error) errors.push(error);
  }

  const pathError = validateRequestsPath(requestsPath);
  if (pathError) errors.push(pathError);

  const apiKeyHeaderError = validateHeaderName("PLUGO_API_KEY_HEADER_NAME", apiKeyHeaderName);
  if (apiKeyHeaderError) errors.push(apiKeyHeaderError);

  const secretKeyHeaderError = validateHeaderName("PLUGO_SECRET_KEY_HEADER_NAME", secretKeyHeaderName);
  if (secretKeyHeaderError) errors.push(secretKeyHeaderError);

  if (apiKeyHeaderName.toLowerCase() === secretKeyHeaderName.toLowerCase()) {
    errors.push("PLUGO_API_KEY_HEADER_NAME and PLUGO_SECRET_KEY_HEADER_NAME must be different.");
  }

  if (missing.length || errors.length) {
    return { ok: false, missing, errors };
  }

  return {
    ok: true,
    config: {
      baseUrl,
      requestsPath,
      apiKey: cleanEnv(env.PLUGO_API_KEY),
      secretKey: cleanEnv(env.PLUGO_SECRET_KEY),
      apiKeyHeaderName,
      secretKeyHeaderName,
      forwardQueryKeys: parseForwardQueryKeys(env.PLUGO_FORWARD_QUERY_KEYS),
      timeoutMs: parseTimeoutMs(env.PLUGO_TIMEOUT_MS)
    }
  };
}

function appendForwardedSearchParams(target: URL, source: URLSearchParams, allowedKeys: Set<string>) {
  source.forEach((value, key) => {
    if (!allowedKeys.has(key)) return;

    if (key === "limit") {
      const parsedLimit = Number(value);
      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) return;
      target.searchParams.append(key, String(Math.min(Math.round(parsedLimit), 100)));
      return;
    }

    target.searchParams.append(key, value);
  });
}

export function buildPlugoRequestsUrl(config: PlugoConfig, sourceParams: URLSearchParams = new URLSearchParams()): URL {
  const normalizedBase = config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`;
  const normalizedPath = config.requestsPath.replace(/^\/+/, "");
  const url = new URL(normalizedPath, normalizedBase);

  appendForwardedSearchParams(url, sourceParams, config.forwardQueryKeys);

  return url;
}

export function buildPlugoHeaders(config: PlugoConfig): Headers {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set(config.apiKeyHeaderName, config.apiKey);
  headers.set(config.secretKeyHeaderName, config.secretKey);
  return headers;
}

function getRedactionValues(env: EnvMap): string[] {
  return [env.PLUGO_API_KEY, env.PLUGO_SECRET_KEY].map((value) => value?.trim()).filter((value): value is string => Boolean(value));
}

function redactText(value: string, redactionValues: string[]): string {
  return redactionValues.reduce((text, secret) => text.split(secret).join("[redacted]"), value);
}

export function redactPlugoSecrets<T>(value: T, env: EnvMap = process.env): T {
  const redactionValues = getRedactionValues(env);
  if (!redactionValues.length) return value;

  function redact(current: unknown): unknown {
    if (typeof current === "string") return redactText(current, redactionValues);
    if (Array.isArray(current)) return current.map((item) => redact(item));
    if (!current || typeof current !== "object") return current;

    return Object.fromEntries(
      Object.entries(current).map(([key, entry]) => [redactText(key, redactionValues), redact(entry)])
    );
  }

  return redact(value) as T;
}

function createTimeoutSignal(timeoutMs: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timeout)
  };
}

export async function fetchPlugoRequests({
  searchParams = new URLSearchParams(),
  env = process.env,
  fetchImpl = fetch
}: {
  searchParams?: URLSearchParams;
  env?: EnvMap;
  fetchImpl?: FetchLike;
}) {
  const configResult = readPlugoConfig(env);
  if (!configResult.ok) {
    throw new PlugoConfigError(configResult.missing, configResult.errors);
  }

  const config = configResult.config;
  const url = buildPlugoRequestsUrl(config, searchParams);
  const timeout = createTimeoutSignal(config.timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: buildPlugoHeaders(config),
      cache: "no-store",
      signal: timeout.signal
    });

    if (!response.ok) {
      throw new PlugoUpstreamError(response.status);
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    return redactPlugoSecrets(data, env);
  } finally {
    timeout.cancel();
  }
}
