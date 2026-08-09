import { describe, it, expect } from "vitest";
import {
  resolveAddressSource,
  resolveAddressValidationWarning,
  type AddressSourceOutlet,
} from "./onboard-address";

// TT-396: the onboarding form's address is prefilled from a Shopify location
// (mirrored via backend outlets), never from the Settings > General store
// address. STREET is UK-only, so when the feeding location is non-GB the form
// must warn — the Shopify reviewer's Brazil demo store is the canonical case.
const outlet = (overrides: Partial<AddressSourceOutlet> = {}): AddressSourceOutlet => ({
  id: "o-1",
  name: "Brazil Store",
  countryCode: "BR",
  isPrimary: true,
  ...overrides,
});

describe("resolveAddressSource", () => {
  it("flags a non-GB primary outlet and names the location", () => {
    const source = resolveAddressSource([outlet()], undefined, null);
    expect(source).toEqual({
      locationName: "Brazil Store",
      countryCode: "BR",
      isNonUk: true,
    });
  });

  it("does not flag a GB outlet", () => {
    const source = resolveAddressSource(
      [outlet({ name: "Shop location", countryCode: "GB" })],
      undefined,
      null,
    );
    expect(source.isNonUk).toBe(false);
  });

  it("prefers the selected outlet over the primary one", () => {
    const source = resolveAddressSource(
      [
        outlet(),
        outlet({ id: "o-2", name: "London Store", countryCode: "GB", isPrimary: false }),
      ],
      "o-2",
      null,
    );
    expect(source).toEqual({
      locationName: "London Store",
      countryCode: "GB",
      isNonUk: false,
    });
  });

  it("falls back to the first outlet when none is primary or selected", () => {
    const source = resolveAddressSource(
      [outlet({ isPrimary: false, name: "Only One", countryCode: "CA" })],
      undefined,
      null,
    );
    expect(source.locationName).toBe("Only One");
    expect(source.isNonUk).toBe(true);
  });

  it("ignores a selected id that matches no outlet", () => {
    const source = resolveAddressSource([outlet()], "stale-id", null);
    expect(source.locationName).toBe("Brazil Store");
  });

  it("uses the vendor countryCode when there are no outlets", () => {
    const source = resolveAddressSource([], undefined, "BR");
    expect(source).toEqual({ locationName: null, countryCode: "BR", isNonUk: true });
  });

  it("never flags when no country is known at all", () => {
    const source = resolveAddressSource([], undefined, null);
    expect(source.isNonUk).toBe(false);
    const sourceUnknownOutlet = resolveAddressSource(
      [outlet({ countryCode: null })],
      undefined,
      null,
    );
    expect(sourceUnknownOutlet.isNonUk).toBe(false);
  });

  it("treats country codes case-insensitively", () => {
    expect(resolveAddressSource([outlet({ countryCode: "gb" })], undefined, null).isNonUk).toBe(false);
    expect(resolveAddressSource([outlet({ countryCode: "br" })], undefined, null).isNonUk).toBe(true);
  });
});

// TT-397: the courier-bookability check is a separate concern from the
// TT-396 UK-only check above, but reuses its alert-warning banner pattern.
describe("resolveAddressValidationWarning", () => {
  it("warns on an invalid postcode", () => {
    const warning = resolveAddressValidationWarning("invalid_postcode");
    expect(warning?.headline).toBe("This location's address can't be used for courier deliveries");
    expect(warning?.body).toMatch(/doesn't exist or is no longer in use/);
  });

  it("warns on a postcode mismatch with different copy", () => {
    const warning = resolveAddressValidationWarning("postcode_mismatch");
    expect(warning?.headline).toBe("This location's address can't be used for courier deliveries");
    expect(warning?.body).toMatch(/don't appear to match/);
  });

  it("does not warn for valid, unknown, undefined or null verdicts", () => {
    expect(resolveAddressValidationWarning("valid")).toBeNull();
    expect(resolveAddressValidationWarning("unknown")).toBeNull();
    expect(resolveAddressValidationWarning(undefined)).toBeNull();
    expect(resolveAddressValidationWarning(null)).toBeNull();
  });
});
