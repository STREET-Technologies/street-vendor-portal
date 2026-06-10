"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorOnboardingSchema, type VendorOnboardingFormData } from "@/lib/validations/vendor";
import { apiClient } from "@/lib/api/client";
import { Loader2 } from "lucide-react";
import Nav from "../_components/Nav";
import Footer from "../_components/Footer";
import OnboardingSidebar from "../_components/OnboardingSidebar";

type OnboardOutlet = {
  id: string;
  name: string;
  address: string | null;
  address2: string | null;
  city: string | null;
  postcode: string | null;
  isPrimary: boolean;
  isPublished: boolean;
};

interface PartialVendorData {
  storeName: string;
  vendorType: string;
  // All pre-fill fields are optional — Shopify may not have supplied them at
  // install time (e.g. older installs, or stores where the merchant left
  // billingAddress blank). The form treats missing values as "ask the vendor".
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postcode?: string | null;
}

// Set of field names we pre-fill from Shopify. Used to render the
// "from Shopify" hint and suppress it for fields the vendor edited.
const SHOPIFY_PREFILLABLE = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "address",
  "country",
  "postcode",
] as const;
type ShopifyPrefillField = (typeof SHOPIFY_PREFILLABLE)[number];

// Bumped if the saved shape changes; old payloads are ignored automatically.
const STORAGE_KEY = "street:onboard:v1";
const STORAGE_DEBOUNCE_MS = 400;

// Strip Shopify's auto-appended "-NNNN" suffix from store handles
// (e.g. "gymshark-10024" → "Gymshark", "astrid-and-miyu-6791" → "Astrid And Miyu").
// Only strips trailing purely-numeric segments so legitimate hyphenated
// names like "blue-bottle-coffee" stay intact.
function cleanShopifyStoreName(raw: string): string {
  if (!raw) return raw;
  return raw
    .replace(/[-\s]+\d+\s*$/, "")
    .trim()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OnboardPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCheckingStore, setIsCheckingStore] = useState(false);
  const [partialVendor, setPartialVendor] = useState<PartialVendorData | null>(null);
  const [outlets, setOutlets] = useState<OnboardOutlet[]>([]);
  // Tracks which fields were filled from Shopify so we can render the
  // "from Shopify" hint. Cleared per-field if the vendor edits the value.
  const [prefilledFields, setPrefilledFields] = useState<Set<ShopifyPrefillField>>(
    new Set(),
  );
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasHydratedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    watch,
    formState: { errors },
  } = useForm<VendorOnboardingFormData>({
    resolver: zodResolver(vendorOnboardingSchema),
    defaultValues: {
      country: "United Kingdom",
      vendorType: "shopify",
    },
  });

  // Rehydrate from localStorage on first mount. acceptTerms is deliberately
  // dropped so the retailer re-affirms the T&Cs each session.
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const saved = JSON.parse(raw) as Partial<VendorOnboardingFormData>;
        const { acceptTerms: _omit, ...rest } = saved;
        reset({ country: "United Kingdom", vendorType: "shopify", ...rest });
      }
    } catch {
      // Corrupt storage — fall through to defaults.
    } finally {
      hasHydratedRef.current = true;
    }
  }, [reset]);

  // Debounced auto-save on any form change.
  useEffect(() => {
    const subscription = watch((data) => {
      if (!hasHydratedRef.current) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        try {
          const { acceptTerms: _omit, ...rest } = data;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
        } catch {
          // Quota or privacy mode — silently no-op.
        }
      }, STORAGE_DEBOUNCE_MS);
    });
    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [watch]);

  const checkStoreUrl = useCallback(async (storeUrl: string) => {
    if (!storeUrl || storeUrl.length < 4) {
      setPartialVendor(null);
      setPrefilledFields(new Set());
      return;
    }
    setIsCheckingStore(true);
    try {
      const response = await apiClient.get("/vendors/check-store", { params: { storeUrl } });
      const result = response.data?.data;
      if (result?.exists && result.vendor) {
        const v = result.vendor as PartialVendorData;
        setPartialVendor(v);

        // Pre-fill every field Shopify supplied at install time. Vendor can
        // edit anything; the "from Shopify" hint clears on edit (handled via
        // a watch effect below). See TT-209.
        const filled = new Set<ShopifyPrefillField>();
        if (v.storeName) setValue("storeName", cleanShopifyStoreName(v.storeName));
        if (v.vendorType) setValue("vendorType", v.vendorType as "shopify" | "woocommerce" | "magento" | "custom" | "other");
        if (v.firstName) { setValue("firstName", v.firstName); filled.add("firstName"); }
        if (v.lastName) { setValue("lastName", v.lastName); filled.add("lastName"); }
        if (v.email) { setValue("email", v.email); filled.add("email"); }
        if (v.phone) { setValue("phone", v.phone); filled.add("phone"); }
        if (v.address) { setValue("address", v.address); filled.add("address"); }
        if (v.country) { setValue("country", v.country); filled.add("country"); }
        if (v.postcode) { setValue("postcode", v.postcode); filled.add("postcode"); }
        setPrefilledFields(filled);

        // Populate outlet picker (TT-242). Only show when > 1 outlet.
        const fetchedOutlets: OnboardOutlet[] = result.outlets ?? [];
        if (fetchedOutlets.length > 1) {
          setOutlets(fetchedOutlets);
          // Only apply default when the current selection is not already a
          // member of this store's outlets (i.e. don't clobber an explicit
          // user choice on same-store re-check).
          const current = getValues("primaryOutletId");
          const stillValid = current && fetchedOutlets.some((o: OnboardOutlet) => o.id === current);
          if (!stillValid) {
            const defaultOutlet = fetchedOutlets.find((o: OnboardOutlet) => o.isPrimary) ?? fetchedOutlets[0];
            setValue("primaryOutletId", defaultOutlet.id);
          }
        } else {
          setOutlets(fetchedOutlets);
          setValue("primaryOutletId", undefined);
        }
      } else {
        setPartialVendor(null);
        setPrefilledFields(new Set());
        setOutlets([]);
        setValue("primaryOutletId", undefined);
      }
    } catch {
      setPartialVendor(null);
      setPrefilledFields(new Set());
      setOutlets([]);
      setValue("primaryOutletId", undefined);
    } finally {
      setIsCheckingStore(false);
    }
  }, [setValue, getValues]);

  // Clear the "from Shopify" hint on a field once the vendor edits it.
  // Watching individual fields keeps the hint accurate without churn.
  const watchedValues = watch(SHOPIFY_PREFILLABLE);
  useEffect(() => {
    if (!partialVendor || prefilledFields.size === 0) return;
    const next = new Set(prefilledFields);
    SHOPIFY_PREFILLABLE.forEach((field, idx) => {
      const currentValue = watchedValues[idx];
      const originalValue = partialVendor[field];
      if (
        prefilledFields.has(field) &&
        currentValue !== originalValue &&
        currentValue !== cleanShopifyStoreName(originalValue ?? "")
      ) {
        next.delete(field);
      }
    });
    if (next.size !== prefilledFields.size) {
      setPrefilledFields(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues, partialVendor]);

  // Helper for the JSX — renders the "from Shopify" hint after the field
  // label when the value is still the pre-fill.
  const shopifyHint = (field: ShopifyPrefillField) =>
    prefilledFields.has(field) ? (
      <span className="opt">from Shopify</span>
    ) : null;

  // When the vendor selects a different outlet, prefill address/postcode from
  // that outlet. Only overwrites when the outlet HAS the value (never clears).
  // (city is not a standalone form field — it's embedded in the address line.)
  const handleOutletChange = useCallback((outletId: string) => {
    const outlet = outlets.find((o) => o.id === outletId);
    if (!outlet) return;
    if (outlet.address) setValue("address", outlet.address);
    if (outlet.postcode) setValue("postcode", outlet.postcode);
  }, [outlets, setValue]);

  const scheduleStoreCheck = useCallback((value: string) => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    checkTimeoutRef.current = setTimeout(() => checkStoreUrl(value.trim()), 300);
  }, [checkStoreUrl]);

  const handleStoreUrlBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    scheduleStoreCheck(e.target.value);
  }, [scheduleStoreCheck]);

  const handleStoreUrlPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    scheduleStoreCheck(pasted);
  }, [scheduleStoreCheck]);

  const onSubmit = async (data: VendorOnboardingFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await apiClient.post("/vendors/onboard", {
        storeName: data.storeName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        country: data.country,
        postcode: data.postcode,
        storeUrl: data.storeUrl,
        vendorType: data.vendorType,
        vendorCategory: data.vendorCategory,
        ...(data.shippingReturnsUrl ? { shippingReturnsUrl: data.shippingReturnsUrl } : {}),
        ...(data.primaryOutletId ? { primaryOutletId: data.primaryOutletId } : {}),
      });
      const { email, tempPassword } = response.data.data;
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
      const nextParams = new URLSearchParams({ email, temp: tempPassword, storeUrl: data.storeUrl });
      window.location.href = `/change-password?${nextParams.toString()}`;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSubmitError(err.response?.data?.message || "Failed to submit onboarding request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Nav />

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-block">
            <p className="hero-eyebrow">Shopify install complete</p>
            <h1>You&apos;re in. Let&apos;s finish setting up your store.</h1>
            <p className="lede">
              The STREET app is installed on your Shopify store. We just need a few details to publish you to
              the marketplace and start routing instant delivery orders to the Partner app.
            </p>
          </div>
          <aside className="hero-visual" aria-hidden="true">
            <Image
              src="/img/retailer-hero.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 900px) 100vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          </aside>
        </div>
      </section>

      <section className="apply" id="apply">
        <div className="container">
          <header className="apply-head">
            <div>
              <p className="section-eyebrow">Step 02 of 05</p>
              <h2 className="section-title">Confirm your store details.</h2>
              <div className="stepbar" aria-hidden="true">
                <div className="stp done" />
                <div className="stp current" />
                <div className="stp" />
                <div className="stp" />
                <div className="stp" />
              </div>
            </div>
            <p className="step-meta">
              Approx. 4 minutes.
            </p>
          </header>

          {submitError && (
            <div className="alert alert-error" role="alert">
              <b>Couldn&apos;t submit:</b><span>{submitError}</span>
            </div>
          )}

          {partialVendor && (
            <div className="alert alert-info" role="status">
              <b>We found your store.</b>
              <span>Pre-filled the bits we know. Complete the rest below to finish onboarding.</span>
            </div>
          )}

          <div className="apply-grid">
            <OnboardingSidebar current="store" />

            <form onSubmit={handleSubmit(onSubmit)} className="form-grid" noValidate>
              <div className="fld full">
                <label htmlFor="storeUrl">
                  Store URL
                  <span className="opt">pre-filled from Shopify</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    {...register("storeUrl")}
                    id="storeUrl"
                    type="text"
                    onBlur={handleStoreUrlBlur}
                    onPaste={handleStoreUrlPaste}
                    placeholder="yourstore.myshopify.com or yourdomain.com"
                    aria-invalid={!!errors.storeUrl}
                  />
                  {isCheckingStore && (
                    <Loader2
                      size={18}
                      className="animate-spin"
                      style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--gray-dark)" }}
                    />
                  )}
                </div>
                {errors.storeUrl ? (
                  <span className="err">{errors.storeUrl.message}</span>
                ) : (
                  <span className="hint">Strip <b>http://</b> and <b>www.</b>; we&apos;ll auto-detect your platform from the URL.</span>
                )}
              </div>

              <div className="fld full">
                <label htmlFor="storeName">Store name <span className="opt">as shown to customers</span></label>
                <input
                  {...register("storeName")}
                  id="storeName"
                  type="text"
                  placeholder="The name customers see at checkout"
                  aria-invalid={!!errors.storeName}
                />
                {errors.storeName && <span className="err">{errors.storeName.message}</span>}
              </div>

              <div className="fld">
                <label htmlFor="firstName">First name {shopifyHint("firstName")}</label>
                <input {...register("firstName")} id="firstName" type="text" aria-invalid={!!errors.firstName} />
                {errors.firstName && <span className="err">{errors.firstName.message}</span>}
              </div>

              <div className="fld">
                <label htmlFor="lastName">Last name {shopifyHint("lastName")}</label>
                <input {...register("lastName")} id="lastName" type="text" aria-invalid={!!errors.lastName} />
                {errors.lastName && <span className="err">{errors.lastName.message}</span>}
              </div>

              <div className="fld">
                <label htmlFor="email">Email {shopifyHint("email")}</label>
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="The address we&apos;ll reply to"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <span className="err">{errors.email.message}</span>}
              </div>

              <div className="fld">
                <label htmlFor="phone">Phone <span className="opt">UK mobile</span> {shopifyHint("phone")}</label>
                <input
                  {...register("phone")}
                  id="phone"
                  type="tel"
                  placeholder="07123 456 789 or +447123456789"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <span className="err">{errors.phone.message}</span>}
              </div>

              <div className="fld full">
                <label htmlFor="address">Business address <span className="opt">where we collect orders from</span> {shopifyHint("address")}</label>
                <input {...register("address")} id="address" type="text" placeholder="123 Main Street" aria-invalid={!!errors.address} />
                {errors.address && <span className="err">{errors.address.message}</span>}
              </div>

              <div className="fld">
                <label htmlFor="country">Country {shopifyHint("country")}</label>
                <input {...register("country")} id="country" type="text" aria-invalid={!!errors.country} />
                {errors.country && <span className="err">{errors.country.message}</span>}
              </div>

              <div className="fld">
                <label htmlFor="postcode">Postcode {shopifyHint("postcode")}</label>
                <input {...register("postcode")} id="postcode" type="text" placeholder="SW1A 1AA" />
              </div>

              {outlets.length > 1 && (
                <div className="fld full">
                  <label>Your locations</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.25rem" }}>
                    {outlets.map((o) => {
                      const addressLine = [o.address, o.city, o.postcode].filter(Boolean).join(", ");
                      const isSelected = watch("primaryOutletId") === o.id;
                      return (
                        <label
                          key={o.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.875rem",
                            padding: "0.875rem 1rem",
                            border: isSelected
                              ? "2px solid var(--primary)"
                              : "1px solid var(--rule-mid)",
                            borderRadius: "8px",
                            cursor: "pointer",
                            background: isSelected ? "rgba(198,255,0,0.06)" : "transparent",
                            transition: "border-color 0.15s, background 0.15s",
                          }}
                        >
                          <input
                            type="radio"
                            value={o.id}
                            {...register("primaryOutletId", {
                              onChange: (e) => handleOutletChange(e.target.value),
                            })}
                            style={{ marginTop: "0.2rem", accentColor: "var(--primary)", flexShrink: 0 }}
                          />
                          <span style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <b>{o.name}</b>
                              {o.isPrimary && (
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                    background: "var(--primary)",
                                    color: "var(--black)",
                                    borderRadius: "3px",
                                    padding: "0.1em 0.45em",
                                  }}
                                >
                                  Suggested
                                </span>
                              )}
                            </span>
                            {addressLine && (
                              <span style={{ fontSize: "0.875rem", color: "var(--gray-dark)" }}>{addressLine}</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <span className="hint">Your other locations are saved and can go live later, no re-onboarding needed.</span>
                </div>
              )}

              <div className="fld full">
                <label htmlFor="shippingReturnsUrl">
                  Shipping &amp; Returns URL
                  <span className="opt">optional</span>
                </label>
                <input
                  {...register("shippingReturnsUrl")}
                  id="shippingReturnsUrl"
                  type="url"
                  placeholder="https://yourstore.com/pages/shipping-returns"
                  aria-invalid={!!errors.shippingReturnsUrl}
                />
                {errors.shippingReturnsUrl ? (
                  <span className="err">{errors.shippingReturnsUrl.message}</span>
                ) : (
                  <span className="hint">Link to your shipping &amp; returns policy. Shown to customers on product pages.</span>
                )}
              </div>

              <div className="fld">
                <label htmlFor="vendorCategory">Business category</label>
                <select {...register("vendorCategory")} id="vendorCategory" aria-invalid={!!errors.vendorCategory} defaultValue="">
                  <option value="" disabled>Select a category…</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Streetwear">Streetwear</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Activewear">Activewear</option>
                  <option value="Jewellery">Jewellery</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Home & Living">Home &amp; Living</option>
                  <option value="Health & Wellness">Health &amp; Wellness</option>
                  <option value="Kids & Babywear">Kids &amp; Babywear</option>
                  <option value="Other">Other</option>
                </select>
                {errors.vendorCategory && <span className="err">{errors.vendorCategory.message}</span>}
              </div>

              <div className="fld">
                <label htmlFor="vendorType">Platform <span className="opt">auto-detected</span></label>
                <select {...register("vendorType")} id="vendorType" aria-invalid={!!errors.vendorType}>
                  <option value="shopify">Shopify</option>
                  <option value="woocommerce">WooCommerce</option>
                  <option value="magento">Magento</option>
                  <option value="custom">Custom platform</option>
                  <option value="other">Other</option>
                </select>
                {errors.vendorType && <span className="err">{errors.vendorType.message}</span>}
              </div>

              <div className="fld full">
                <label className="fld-check">
                  <input {...register("acceptTerms")} type="checkbox" />
                  <span>
                    I accept the{" "}
                    <a href="https://street.london/user-terms" target="_blank" rel="noopener noreferrer">terms and conditions</a>
                    {" "}and the{" "}
                    <a href="https://street.london/privacy-policy" target="_blank" rel="noopener noreferrer">privacy policy</a>
                    , and agree to STREET&apos;s retailer policies.
                  </span>
                </label>
                {errors.acceptTerms && <span className="err">{errors.acceptTerms.message}</span>}
              </div>

              <div className="form-foot" style={{ justifyContent: "flex-end" }}>
                <button type="submit" className="btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Submitting…
                    </>
                  ) : (
                    "Continue → set password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
