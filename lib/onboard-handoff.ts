// Same-tab handoff of onboarding credentials between /onboard → /change-password
// → /onboard/operating-hours. Previously these travelled as URL query params
// (?temp=…&password=…), which lands passwords in browser history, Referer
// headers and Vercel request logs. sessionStorage is tab-scoped, never sent
// over the wire, and cleared once the last step has used it. Only storeUrl
// (non-sensitive) stays in the URL.

export const HANDOFF_KEY = "street:onboard:handoff:v1";

export type OnboardHandoff = {
  email: string;
  /** Set by /onboard after signup; consumed by /change-password. */
  tempPassword?: string;
  /** Set by /change-password after success; consumed by /onboard/operating-hours. */
  password?: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const storage = (): StorageLike | null =>
  typeof window === "undefined" ? null : window.sessionStorage;

export function writeHandoff(data: OnboardHandoff, s: StorageLike | null = storage()): void {
  try {
    s?.setItem(HANDOFF_KEY, JSON.stringify(data));
  } catch {
    /* private mode / quota: caller falls back to its "missing credentials" path */
  }
}

export function readHandoff(s: StorageLike | null = storage()): OnboardHandoff | null {
  try {
    const raw = s?.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardHandoff>;
    if (typeof parsed.email !== "string" || !parsed.email) return null;
    return {
      email: parsed.email,
      ...(typeof parsed.tempPassword === "string" ? { tempPassword: parsed.tempPassword } : {}),
      ...(typeof parsed.password === "string" ? { password: parsed.password } : {}),
    };
  } catch {
    return null;
  }
}

export function clearHandoff(s: StorageLike | null = storage()): void {
  try {
    s?.removeItem(HANDOFF_KEY);
  } catch {
    /* no-op */
  }
}
