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

interface PartialVendorData {
  storeName: string;
  vendorType: string;
}

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
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasHydratedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
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
      return;
    }
    setIsCheckingStore(true);
    try {
      const response = await apiClient.get("/vendors/check-store", { params: { storeUrl } });
      const result = response.data?.data;
      if (result?.exists && result.vendor) {
        setPartialVendor(result.vendor);
        if (result.vendor.storeName) setValue("storeName", cleanShopifyStoreName(result.vendor.storeName));
        if (result.vendor.vendorType) setValue("vendorType", result.vendor.vendorType);
      } else {
        setPartialVendor(null);
      }
    } catch {
      setPartialVendor(null);
    } finally {
      setIsCheckingStore(false);
    }
  }, [setValue]);

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
              Approx. 4 minutes.<br />
              Auto-saves on this device.
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
                <label htmlFor="firstName">First name</label>
                <input {...register("firstName")} id="firstName" type="text" aria-invalid={!!errors.firstName} />
                {errors.firstName && <span className="err">{errors.firstName.message}</span>}
              </div>

              <div className="fld">
                <label htmlFor="lastName">Last name</label>
                <input {...register("lastName")} id="lastName" type="text" aria-invalid={!!errors.lastName} />
                {errors.lastName && <span className="err">{errors.lastName.message}</span>}
              </div>

              <div className="fld">
                <label htmlFor="email">Email</label>
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
                <label htmlFor="phone">Phone <span className="opt">UK mobile</span></label>
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
                <label htmlFor="address">Business address <span className="opt">where we collect orders from</span></label>
                <input {...register("address")} id="address" type="text" placeholder="123 Main Street" aria-invalid={!!errors.address} />
                {errors.address && <span className="err">{errors.address.message}</span>}
              </div>

              <div className="fld">
                <label htmlFor="country">Country</label>
                <input {...register("country")} id="country" type="text" aria-invalid={!!errors.country} />
                {errors.country && <span className="err">{errors.country.message}</span>}
              </div>

              <div className="fld">
                <label htmlFor="postcode">Postcode</label>
                <input {...register("postcode")} id="postcode" type="text" placeholder="SW1A 1AA" />
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

              <div className="form-foot">
                <span className="note"><b>Auto-saved</b> · resume from this browser</span>
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
