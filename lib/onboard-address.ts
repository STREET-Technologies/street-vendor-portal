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

// TT-397: courier-bookability verdict the backend computes for an outlet's
// address (distinct from the TT-396 "is this even in the UK" check above).
// 'unknown' covers outlets not yet re-checked and lookup failures — never a
// reason to warn, same rationale as the non-UK check.
export type AddressValidationVerdict =
  | "valid"
  | "invalid_postcode"
  | "postcode_mismatch"
  | "unknown"
  | null;

export type AddressValidationWarning = {
  headline: string;
  body: string;
};

// Reuses the TT-396 `alert-warning` banner pattern. Only the two verdicts
// that mean "dispatch will fail" render anything.
export function resolveAddressValidationWarning(
  verdict: AddressValidationVerdict | undefined,
): AddressValidationWarning | null {
  switch (verdict) {
    case "invalid_postcode":
      return {
        headline: "This location's address can't be used for courier deliveries",
        body: "The postcode doesn't exist or is no longer in use. Orders from this location will fail at dispatch. Update the address in your Shopify admin (Settings > Locations) and it will re-check automatically.",
      };
    case "postcode_mismatch":
      return {
        headline: "This location's address can't be used for courier deliveries",
        body: "The street and postcode don't appear to match. Orders from this location may fail at dispatch. Check the address in your Shopify admin (Settings > Locations).",
      };
    default:
      return null;
  }
}

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
