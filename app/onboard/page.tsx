"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorOnboardingSchema, type VendorOnboardingFormData } from "@/lib/validations/vendor";
import { apiClient } from "@/lib/api/client";
import { Loader2 } from "lucide-react";

export default function OnboardPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorOnboardingFormData>({
    resolver: zodResolver(vendorOnboardingSchema),
  });

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

      // Redirect to change-password with pre-filled email and temp password
      const { email, tempPassword } = response.data.data;
      window.location.href = `/change-password?email=${encodeURIComponent(email)}&temp=${encodeURIComponent(tempPassword)}`;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSubmitError(
        err.response?.data?.message || "Failed to submit onboarding request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <Image
              src="/img/logo-white-transparent.png"
              alt="STREET"
              width={150}
              height={50}
              priority
            />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "Hanson Bold, sans-serif" }}
          >
            VENDOR ONBOARDING
          </h1>
          <p className="text-lg text-street-gray mb-8">
            Fill out the form below to start your journey as a STREET partner.
          </p>

          {submitError && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Store Name */}
            <div>
              <label htmlFor="storeName" className="block text-sm font-bold mb-2">
                Store Name *
              </label>
              <input
                {...register("storeName")}
                id="storeName"
                type="text"
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-street-lime"
                placeholder="Your Store Name"
              />
              {errors.storeName && (
                <p className="text-red-500 text-sm mt-1">{errors.storeName.message}</p>
              )}
            </div>

            {/* First Name & Last Name */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-bold mb-2">
                  First Name *
                </label>
                <input
                  {...register("firstName")}
                  id="firstName"
                  type="text"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-street-lime"
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-bold mb-2">
                  Last Name *
                </label>
                <input
                  {...register("lastName")}
                  id="lastName"
                  type="text"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-street-lime"
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold mb-2">
                Email *
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-street-lime"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-bold mb-2">
                Phone Number *
              </label>
              <input
                {...register("phone")}
                id="phone"
                type="tel"
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-street-lime"
                placeholder="07123456789 or +447123456789"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-bold mb-2">
                Business Address *
              </label>
              <input
                {...register("address")}
                id="address"
                type="text"
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-street-lime"
                placeholder="123 Main Street"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>

            {/* Country & Postcode */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="country" className="block text-sm font-bold mb-2">
                  Country *
                </label>
                <input
                  {...register("country")}
                  id="country"
                  type="text"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-street-lime"
                  placeholder="United Kingdom"
                />
                {errors.country && (
                  <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="postcode" className="block text-sm font-bold mb-2">
                  Postcode
                </label>
                <input
                  {...register("postcode")}
                  id="postcode"
                  type="text"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-street-lime"
                  placeholder="SW1A 1AA"
                />
                {errors.postcode && (
                  <p className="text-red-500 text-sm mt-1">{errors.postcode.message}</p>
                )}
              </div>
            </div>

            {/* Store URL */}
            <div>
              <label htmlFor="storeUrl" className="block text-sm font-bold mb-2">
                Store URL *
              </label>
              <input
                {...register("storeUrl")}
                id="storeUrl"
                type="text"
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-street-lime"
                placeholder="yourstore.myshopify.com or yourdomain.com"
              />
              {errors.storeUrl && (
                <p className="text-red-500 text-sm mt-1">{errors.storeUrl.message}</p>
              )}
            </div>

            {/* Vendor Category */}
            <div>
              <label htmlFor="vendorCategory" className="block text-sm font-bold mb-2">
                Business Category *
              </label>
              <select
                {...register("vendorCategory")}
                id="vendorCategory"
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-street-lime"
              >
                <option value="">Select a category</option>
                <option value="Fashion">Fashion</option>
                <option value="Beauty">Beauty</option>
                <option value="Electronics">Electronics</option>
                <option value="Home & Living">Home & Living</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Sports & Outdoors">Sports & Outdoors</option>
                <option value="Books & Media">Books & Media</option>
                <option value="Toys & Games">Toys & Games</option>
                <option value="Kids / Babywear">Kids / Babywear</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Automotive">Automotive</option>
                <option value="Pet Supplies">Pet Supplies</option>
                <option value="Other">Other</option>
              </select>
              {errors.vendorCategory && (
                <p className="text-red-500 text-sm mt-1">{errors.vendorCategory.message}</p>
              )}
            </div>

            {/* Vendor Type */}
            <div>
              <label htmlFor="vendorType" className="block text-sm font-bold mb-2">
                Platform Type *
              </label>
              <select
                {...register("vendorType")}
                id="vendorType"
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-street-lime"
              >
                <option value="">Select your platform</option>
                <option value="shopify">Shopify</option>
                <option value="woocommerce">WooCommerce</option>
                <option value="magento">Magento</option>
                <option value="custom">Custom Platform</option>
                <option value="other">Other</option>
              </select>
              {errors.vendorType && (
                <p className="text-red-500 text-sm mt-1">{errors.vendorType.message}</p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start">
              <input
                {...register("acceptTerms")}
                id="acceptTerms"
                type="checkbox"
                className="mt-1 mr-3 h-4 w-4 bg-gray-900 border-gray-800 rounded focus:ring-street-lime"
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-400">
                I accept the{" "}
                <a
                  href="https://street.london/user-terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-street-lime hover:underline"
                >
                  terms and conditions
                </a>{" "}
                and{" "}
                <a
                  href="https://street.london/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-street-lime hover:underline"
                >
                  privacy policy
                </a>{" "}
                and agree to STREET&apos;s vendor policies *
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-red-500 text-sm">{errors.acceptTerms.message}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-street-lime hover:bg-street-lime/80 text-black font-bold py-4 px-8 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>© 2025 STREET. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
