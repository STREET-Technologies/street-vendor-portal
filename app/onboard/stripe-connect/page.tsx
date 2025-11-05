"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { Loader2, CreditCard, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";

function StripeConnectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorEmail, setVendorEmail] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    chargesEnabled?: boolean;
    accountId?: string;
  } | null>(null);

  // Auto-login and get vendor info from JWT
  useEffect(() => {
    const email = searchParams.get("email");
    const password = searchParams.get("password");

    if (!email || !password) {
      setError("Missing credentials. Please log in to continue.");
      setIsLoading(false);
      return;
    }

    const login = async () => {
      try {
        const response = await apiClient.post("/auth/vendor/login", {
          email,
          password,
        });

        const token = response.data.data?.accessToken || response.data.access_token || response.data.accessToken;
        const vendor = response.data.data?.vendor || response.data.vendor;

        if (!token) {
          setError("Authentication failed. No token received.");
          setIsLoading(false);
          return;
        }

        if (!vendor?.id) {
          setError("Vendor information not found.");
          setIsLoading(false);
          return;
        }

        setAuthToken(token);
        setVendorId(vendor.id);
        setVendorEmail(vendor.email || email);

        // Check current Stripe connection status
        await checkConnectionStatus(vendor.id);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(
          error.response?.data?.message || "Failed to authenticate. Please try logging in manually."
        );
        setIsLoading(false);
      }
    };

    login();
  }, [searchParams]);

  const checkConnectionStatus = async (id: string) => {
    try {
      const response = await apiClient.get(`/vendors/${id}/stripe-connection/status`);
      setConnectionStatus(response.data);
    } catch (err) {
      console.error("Failed to check connection status:", err);
      setConnectionStatus({ isConnected: false });
    } finally {
      setIsLoading(false);
    }
  };

  const initiateStripeOnboarding = async () => {
    if (!authToken || !vendorId || !vendorEmail) {
      setError("Missing authentication information. Please refresh the page.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const response = await apiClient.post(
        `/vendors/${vendorId}/stripe-connection/onboard`,
        {
          email: vendorEmail,
          refreshUrl: `${window.location.origin}/onboard/stripe-connect?email=${encodeURIComponent(searchParams.get("email") || "")}&password=${encodeURIComponent(searchParams.get("password") || "")}`,
          returnUrl: `${window.location.origin}/onboard/success`,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const onboardingUrl = response.data.data?.onboardingUrl;

      if (!onboardingUrl) {
        setError("Failed to generate onboarding link. Please try again.");
        setIsConnecting(false);
        return;
      }

      // Open Stripe onboarding in current window
      window.location.href = onboardingUrl;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || "Failed to initiate Stripe onboarding. Please try again."
      );
      setIsConnecting(false);
    }
  };

  const handleSkip = () => {
    router.push("/onboard/success");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-street-lime mx-auto mb-4" />
          <p className="text-lg text-street-gray">Checking payment setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <Image
              src="/img/logo-white-transparent.png"
              alt="Street London"
              width={150}
              height={50}
              priority
            />
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-street-lime/10 rounded-full mb-4">
              <CreditCard className="w-8 h-8 text-street-lime" />
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "Hanson Bold, sans-serif" }}
            >
              PAYMENT SETUP
            </h1>
            <p className="text-lg text-street-gray">
              Connect your Stripe account to start receiving payments from customers
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Connection Status Card */}
          {connectionStatus && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
              {connectionStatus.isConnected && connectionStatus.chargesEnabled ? (
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Stripe Connected</h3>
                    <p className="text-street-gray mb-2">
                      Your Stripe account is connected and ready to accept payments.
                    </p>
                    <p className="text-sm text-gray-500">
                      Account ID: {connectionStatus.accountId}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <AlertCircle className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Stripe Not Connected</h3>
                    <p className="text-street-gray">
                      You haven&apos;t connected your Stripe account yet. Connect now to start receiving payments.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Information Section */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
            <h2 className="font-bold text-xl mb-4">Why connect Stripe?</h2>
            <ul className="space-y-3 text-street-gray">
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-street-lime mr-2 flex-shrink-0 mt-0.5" />
                <span>Receive payments directly from customers who order your products</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-street-lime mr-2 flex-shrink-0 mt-0.5" />
                <span>Automatic payment processing with daily payouts to your bank account</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-street-lime mr-2 flex-shrink-0 mt-0.5" />
                <span>Secure and compliant payment infrastructure powered by Stripe</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-street-lime mr-2 flex-shrink-0 mt-0.5" />
                <span>Platform fee (12% + £3) automatically deducted from each order</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {!connectionStatus?.isConnected || !connectionStatus?.chargesEnabled ? (
              <button
                onClick={initiateStripeOnboarding}
                disabled={isConnecting}
                className="w-full bg-street-lime hover:bg-street-lime/80 text-black font-bold py-4 px-8 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Connecting to Stripe...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2" size={20} />
                    Connect Stripe Account
                    <ExternalLink className="ml-2" size={16} />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => router.push("/onboard/success")}
                className="w-full bg-street-lime hover:bg-street-lime/80 text-black font-bold py-4 px-8 rounded-lg text-lg transition-colors flex items-center justify-center"
              >
                <CheckCircle2 className="mr-2" size={20} />
                Continue to Dashboard
              </button>
            )}

            <button
              onClick={handleSkip}
              disabled={isConnecting}
              className="w-full bg-transparent border-2 border-gray-700 hover:border-gray-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip for Now
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            You can connect Stripe later from your vendor dashboard.
            <br />
            Note: You won&apos;t be able to receive payments until Stripe is connected.
          </p>

          <p className="text-center text-sm text-gray-400 mt-6">
            Need help?{" "}
            <a
              href="mailto:support@street.london"
              className="text-street-lime hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>© 2025 Street London. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default function StripeConnectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <StripeConnectForm />
    </Suspense>
  );
}
