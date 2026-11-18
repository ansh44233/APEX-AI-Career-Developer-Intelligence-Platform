import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const originalEnv = process.env;

function validEnv() {
  process.env = {
    ...originalEnv,
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/apex_test",
    BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
    BETTER_AUTH_URL: "http://localhost:3000",
    AI_BASE_URL: "",
    AI_API_KEY: "",
    AI_MODEL: "",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  };
}

afterEach(() => {
  process.env = originalEnv;
  vi.resetModules();
});

describe("server environment validation", () => {
  it("accepts required database and auth settings with blank optional AI values", async () => {
    validEnv();
    const { getServerEnv } = await import("@/lib/env");
    const env = getServerEnv();

    expect(env.DATABASE_URL).toContain("postgresql://");
    expect(env.BETTER_AUTH_URL).toBe("http://localhost:3000");
    expect(env.AI_BASE_URL).toBeUndefined();
    expect(env.AI_API_KEY).toBeUndefined();
    expect(env.AI_MODEL).toBeUndefined();
  });

  it("rejects a short Better Auth secret without exposing its value", async () => {
    validEnv();
    process.env.BETTER_AUTH_SECRET = "short-secret";
    const { getServerEnv } = await import("@/lib/env");

    expect(() => getServerEnv()).toThrow(/BETTER_AUTH_SECRET must contain at least 32 characters/);
  });

  it("rejects partial AI provider configuration", async () => {
    validEnv();
    process.env.AI_API_KEY = "configured-key";
    const { getServerEnv } = await import("@/lib/env");

    expect(() => getServerEnv()).toThrow(/must be configured together/);
  });

  it("rejects non-PostgreSQL database URLs", async () => {
    validEnv();
    process.env.DATABASE_URL = "https://example.test/database";
    const { getServerEnv } = await import("@/lib/env");

    expect(() => getServerEnv()).toThrow(/must use the postgresql/);
  });
});
