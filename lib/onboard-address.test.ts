import { describe, it, expect } from "vitest";
import { resolveAddressSource, type AddressSourceOutlet } from "./onboard-address";

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
