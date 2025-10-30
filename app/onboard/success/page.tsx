import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function OnboardingSuccessPage() {
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

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="w-20 h-20 text-street-lime" />
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold mb-6"
            style={{ fontFamily: "Hanson Bold, sans-serif" }}
          >
            WELCOME TO STREET!
          </h1>
          <p className="text-xl text-street-gray mb-4">
            Your account has been successfully set up.
          </p>
          <p className="text-lg text-gray-400 mb-8">
            Download the Street London Retail App to start managing your orders, updating products, and growing your business.
          </p>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">What's Next?</h2>
            <ul className="text-left space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-street-lime text-xl">1.</span>
                <span>Download the Street London Retail App on your mobile device</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-street-lime text-xl">2.</span>
                <span>Log in with the credentials you just created</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-street-lime text-xl">3.</span>
                <span>Start receiving and managing orders from retailers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-street-lime text-xl">4.</span>
                <span>Update your product catalog and inventory in real-time</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-block bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
            <a
              href="https://apps.apple.com/app/street-london"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-street-lime hover:bg-street-lime/80 text-black font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Download Retail App
            </a>
          </div>

          <p className="text-sm text-gray-500 mt-8">
            Need help getting started?{" "}
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
