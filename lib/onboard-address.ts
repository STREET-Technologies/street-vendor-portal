// TT-396: which Shopify location feeds the onboarding form's address, and
// whether it needs the "not in the UK" warning. The backend mirrors Shopify
// Locations into outlets; the Settings > General store address plays no part.
// Kept as a pure helper so the warning condition has one testable home.

export type AddressSourceOutlet = {
  id: string;
  name: string;
  countryCode: string | null;
  isPrimary: boolean;
};

export type AddressSource = {
  // Null when the vendor has no outlets (pre-TT-242 installs).
  locationName: string | null;
  countryCode: string | null;
  isNonUk: boolean;
};

export function resolveAddressSource(
  outlets: AddressSourceOutlet[],
  selectedOutletId: string | null | undefined,
  vendorCountryCode: string | null | undefined,
): AddressSource {
  const source =
    outlets.find((o) => o.id === selectedOutletId) ??
    outlets.find((o) => o.isPrimary) ??
    outlets[0] ??
    null;

  const countryCode = source ? source.countryCode : vendorCountryCode ?? null;

  return {
    locationName: source?.name ?? null,
    countryCode,
    // Unknown country never warns — a false alarm on a UK store is worse
    // than a missed warning on a store that misses geocoding anyway.
    isNonUk: countryCode != null && countryCode.toUpperCase() !== "GB",
  };
}
