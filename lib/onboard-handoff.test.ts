import { describe, it, expect } from "vitest";
import { HANDOFF_KEY, writeHandoff, readHandoff, clearHandoff } from "./onboard-handoff";

const fakeStorage = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  };
};

describe("onboard handoff (sessionStorage, never the URL)", () => {
  it("round-trips email + tempPassword", () => {
    const s = fakeStorage();
    writeHandoff({ email: "a@b.com", tempPassword: "tmp-123" }, s);
    expect(readHandoff(s)).toEqual({ email: "a@b.com", tempPassword: "tmp-123" });
  });

  it("round-trips email + password and drops unknown fields", () => {
    const s = fakeStorage();
    s.setItem(HANDOFF_KEY, JSON.stringify({ email: "a@b.com", password: "new-pw", junk: 1 }));
    expect(readHandoff(s)).toEqual({ email: "a@b.com", password: "new-pw" });
  });

  it("returns null when absent, malformed, or missing email", () => {
    const s = fakeStorage();
    expect(readHandoff(s)).toBeNull();
    s.setItem(HANDOFF_KEY, "{not json");
    expect(readHandoff(s)).toBeNull();
    s.setItem(HANDOFF_KEY, JSON.stringify({ password: "x" }));
    expect(readHandoff(s)).toBeNull();
  });

  it("clearHandoff removes the entry", () => {
    const s = fakeStorage();
    writeHandoff({ email: "a@b.com", password: "pw" }, s);
    clearHandoff(s);
    expect(readHandoff(s)).toBeNull();
    expect(s.dump()).toEqual({});
  });

  it("is a no-op without storage (SSR) instead of throwing", () => {
    expect(() => writeHandoff({ email: "a@b.com" }, null)).not.toThrow();
    expect(readHandoff(null)).toBeNull();
    expect(() => clearHandoff(null)).not.toThrow();
  });
});
