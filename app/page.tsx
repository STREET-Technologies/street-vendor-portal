import Image from "next/image";
import Link from "next/link";
import { TrendingUp, RefreshCw, Rocket } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <Image
            src="/img/logo-white-transparent.png"
            alt="STREET"
            width={150}
            height={50}
            priority
          />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6" style={{ fontFamily: 'Hanson Bold, sans-serif' }}>
            BECOME A PARTNER
          </h1>
          <p className="text-xl md:text-2xl text-street-gray mb-8">
            Join STREET and bring your products to thousands of shoppers across London.
          </p>

          <Link
            href="/onboard"
            className="inline-block bg-street-lime hover:bg-street-lime/80 text-black font-bold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            Start Onboarding
          </Link>
        </div>

        {/* Benefits Section */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <TrendingUp className="w-12 h-12 text-street-lime" strokeWidth={1.5} />
            </div>
            <h3 className="font-bold text-xl mb-2">Increase Exposure</h3>
            <p className="text-gray-400">
              Reach thousands of shoppers looking for unique products in London
            </p>
          </div>
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <RefreshCw className="w-12 h-12 text-street-lime" strokeWidth={1.5} />
            </div>
            <h3 className="font-bold text-xl mb-2">Real-time Sync</h3>
            <p className="text-gray-400">
              Automatic inventory management and order processing
            </p>
          </div>
          <div className="text-center p-6">
            <div className="flex justify-center mb-4">
              <Rocket className="w-12 h-12 text-street-lime" strokeWidth={1.5} />
            </div>
            <h3 className="font-bold text-xl mb-2">Grow Your Business</h3>
            <p className="text-gray-400">
              Simple onboarding and seamless integration with Shopify
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>© 2025 STREET. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
