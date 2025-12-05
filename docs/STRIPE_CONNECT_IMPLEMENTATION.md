# Stripe Connect Implementation Plan - Standard Accounts

**Last Updated:** 2025-10-30
**Status:** Partially Implemented - OAuth Flow Needed
**Account Type:** Standard (OAuth) - $0 additional fees

---

## Current Implementation Status

### ✅ Already Implemented

1. **Database Schema** - Complete
   - All Stripe Connect columns exist in `vendors` table
   - `stripeAccountId`, `stripeChargesEnabled`, `stripePayoutsEnabled`, `stripeDetailsSubmitted`

2. **Payment Splitting Logic** - Working
   - `StripeService.createConnectPaymentIntent()` - Creates split payments
   - `StripeService.calculateMarketplaceFees()` - Commission + £3 service fee calculation
   - Application fees correctly sent to Stripe API

3. **Commission Calculation** - Working
   - Reads `commissionPercentage` from vendor record (default 10%)
   - Example: £100 order → £10 commission + £3 service fee = **£13 platform** | **£87 vendor**
   - Calculation: `applicationFee = (amount × commissionPercent) + £3.00`

4. **Test Data**
   - 5/6 vendors have Stripe accounts (manually created via CLI)
   - Accounts: `acct_1SKmqVCgc5jysrmg`, `acct_1SKmqaEMfCPXWPyA`

5. **One Status Endpoint**
   - `GET /vendors/:vendorId/stripe-connection/status` - Check connection status

### ❌ Not Yet Implemented

1. **OAuth Flow** - Missing
   - No endpoint to generate OAuth URL for Standard accounts
   - No callback handler for OAuth redirect
   - No disconnect endpoint

2. **Frontend Pages** - Missing
   - No Stripe Connect page for vendors
   - No OAuth callback handler page

3. **Account Creation** - Wrong Type
   - Current `createExpressAccount()` creates Express accounts ($2/month + 0.25%)
   - Need OAuth-based Standard accounts instead ($0 extra fees)

---

## Summary: What's Left to Build

**Good News:** The hard parts are done! Payment splitting and commission calculations are working perfectly.

**What's Needed:** Just the OAuth connection flow so vendors can connect their own Stripe accounts.

**Estimated Work:**
- **Backend:** 3 new endpoints (~4-6 hours)
- **Frontend:** 2 new pages (~4-6 hours)
- **Stripe Config:** Dashboard setup (~1 hour)
- **Testing:** End-to-end OAuth flow (~2-3 hours)

**Total:** ~1-2 days of development work

Once implemented, vendors will be able to:
1. Click "Connect Stripe" during onboarding
2. Log into their existing Stripe account
3. Authorize Street to charge customers on their behalf
4. Start receiving automatic payouts (minus commission + £3 fee)

---

## Table of Contents

1. [Overview](#overview)
2. [Why Standard Accounts](#why-standard-accounts)
3. [How Standard Connect Works](#how-standard-connect-works)
4. [Commission & Fee Structure](#commission--fee-structure)
5. [Technical Requirements](#technical-requirements)
6. [What Needs to Be Built](#what-needs-to-be-built)
7. [Backend Changes Needed](#backend-changes-needed)
8. [Frontend Changes Needed](#frontend-changes-needed)
9. [Security Considerations](#security-considerations)
10. [Testing Plan](#testing-plan)
11. [Go-Live Checklist](#go-live-checklist)

---

## Overview

Street needs to collect payments from customers and pay out vendors. Stripe Connect Standard accounts allow vendors to connect their existing Stripe accounts via OAuth, enabling Street to:

- Charge customers on behalf of vendors
- Automatically split payments (platform fee + vendor payout)
- Vendors manage their own disputes, refunds, and compliance
- Zero additional platform fees beyond standard Stripe processing

---

## Why Standard Accounts

### Comparison: Standard vs Express

| Feature | Standard (OAuth) | Express (Hosted) |
|---------|------------------|------------------|
| **Platform Cost** | $0/month | $2/month per account |
| **Payout Fees** | $0 additional | 0.25% + $0.25 per payout |
| **Processing Fees** | 2.9% + £0.30 | 2.9% + £0.30 |
| **Onboarding Time** | 30 seconds | 5-10 minutes |
| **Vendor Control** | Full (own dashboard) | Limited (platform controlled) |
| **Best For** | Established businesses | New/small sellers |
| **Liability** | Vendor handles disputes | Platform handles disputes |

### Why Standard is Perfect for Street

1. **Shopify vendors likely already have Stripe** - Quick OAuth connection
2. **Zero platform costs** - No monthly fees or payout fees
3. **Vendors are established businesses** - Can manage their own Stripe accounts
4. **Simpler compliance** - Vendors handle their own tax reporting
5. **Less liability** - Vendors responsible for chargebacks/disputes

---

## How Standard Connect Works

### High-Level Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Vendor    │      │   Street    │      │   Stripe    │
│  (Shopify)  │      │  Platform   │      │  Connect    │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                     │
       │  1. Click "Connect Stripe"              │
       │─────────────────────>                   │
       │                    │                     │
       │  2. Redirect to Stripe OAuth            │
       │────────────────────────────────────────>│
       │                    │                     │
       │  3. Authorize Street Platform           │
       │<────────────────────────────────────────│
       │                    │                     │
       │  4. Redirect back with auth code        │
       │─────────────────────>                   │
       │                    │                     │
       │                    │  5. Exchange code   │
       │                    │    for account ID   │
       │                    │────────────────────>│
       │                    │<────────────────────│
       │                    │                     │
       │  6. Show success   │                     │
       │<─────────────────────                   │
       │                    │                     │
```

### Customer Order Flow (After Connected)

```
Customer places order on Street app
         ↓
Street charges customer using Stripe
         ↓
Stripe holds funds in vendor's connected account
         ↓
Street takes platform fee (via application_fee)
         ↓
Vendor receives payout (on their Stripe schedule)
```

---

## Commission & Fee Structure

### How It Works (Already Implemented ✅)

The commission system is **fully implemented and working**. Here's how fees are calculated:

#### Fee Breakdown

```typescript
// From StripeService.calculateMarketplaceFees()
const commission = orderTotal × (vendor.commissionPercentage ÷ 100)
const serviceFee = £3.00 (300 pence)
const applicationFee = commission + serviceFee
const vendorReceives = orderTotal - applicationFee - stripeFees
```

#### Real Examples

**Example 1: £100 Order with 10% Commission**
```
Order Total:        £100.00
Commission (10%):   £10.00
Service Fee:        £3.00
─────────────────────────────
Application Fee:    £13.00  ← Platform keeps
Vendor Receives:    £87.00  ← After Stripe fees (~2.9% + £0.30)
Stripe Fees:        ~£2.90  ← Paid by vendor
Net to Vendor:      ~£84.10
```

**Example 2: £50 Order with 12% Commission**
```
Order Total:        £50.00
Commission (12%):   £6.00
Service Fee:        £3.00
─────────────────────────────
Application Fee:    £9.00   ← Platform keeps
Vendor Receives:    £41.00  ← After Stripe fees
Stripe Fees:        ~£1.45  ← Paid by vendor
Net to Vendor:      ~£39.55
```

#### Code Location

**Payment Controller** (`src/modules/v1/payments/payment.controller.ts:197`)
```typescript
const commissionPercentage = vendor.commissionPercentage || 10;
const fees = this.stripeService.calculateMarketplaceFees(
  dto.amount,
  commissionPercentage,
);

// fees.applicationFee is passed to Stripe
const paymentIntent = await this.stripeService.createConnectPaymentIntent(
  dto.amount,
  dto.currency,
  vendor.stripeAccountId,
  fees.applicationFee,  // ← This is the platform fee
  dto.orderId,
  metadata,
  customerId,
);
```

#### Customizing Commission Per Vendor

Each vendor can have a different commission rate stored in their database record:

```sql
-- Example: Set Hobbs London to 8% commission
UPDATE vendors
SET "commissionPercentage" = 8.0
WHERE "storeName" = 'Hobbs London';

-- Example: Set Charlotte Tillbury to 15% commission
UPDATE vendors
SET "commissionPercentage" = 15.0
WHERE "storeName" = 'Charlotte Tillbury';
```

Default is **10%** if not set.

---

## Technical Requirements

### Stripe Dashboard Setup

**Before implementation:**

1. **Enable Standard Accounts Only**
   - Go to: Dashboard → Settings → Connect
   - Account types: **Enable "Standard" only**
   - **Disable "Express"** to avoid accidental $2/month charges

2. **Configure OAuth Settings**
   - Redirect URIs: Add your callback URL
   - Example: `https://vendor-portal.street.london/stripe-callback`
   - Example: `https://streetadmin.tech/stripe-callback` (if backend handles it)

3. **Get OAuth Credentials**
   - Client ID: `ca_xxxxx` (found in Connect settings)
   - Publishable Key: `pk_live_xxxxx` or `pk_test_xxxxx`
   - Secret Key: `sk_live_xxxxx` or `sk_test_xxxxx`

4. **Set Branding**
   - Platform name: "Street London"
   - Logo: Upload Street logo
   - Colors: Match Street branding

### Environment Variables Needed

```bash
# Backend
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_CLIENT_ID=ca_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Frontend (if needed)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

---

## Implementation Flow

### Option 1: During Vendor Onboarding (RECOMMENDED)

**Add as Step 4 after Operating Hours:**

1. Vendor completes info form
2. Vendor changes password
3. Vendor sets operating hours
4. **NEW: Vendor connects Stripe account**
5. Success page

**Pros:**
- Complete setup in one session
- Store is immediately ready to receive orders
- No follow-up emails needed

**Cons:**
- Longer onboarding flow (but still manageable)

---

### Option 2: Separate Email Flow

**Send email after onboarding:**

```
Subject: Connect Your Stripe Account - Final Step

Hi {vendorName},

Your Street account is set up! To start receiving customer orders
and payouts, please connect your Stripe account:

[Connect Stripe Account]

This takes 30 seconds and allows us to automatically pay you for
customer orders.

- The Street Team
```

**Pros:**
- Shorter initial onboarding
- Vendors can prepare their Stripe credentials

**Cons:**
- Requires follow-up
- Some vendors may not complete it
- Store not fully operational until connected

---

## What Needs to Be Built

The core infrastructure is in place. Here's what remains:

### Backend (3 New Endpoints)

1. **OAuth URL Generator**
   - `GET /v1/stripe/connect/oauth-url`
   - Generates Stripe OAuth URL for Standard accounts
   - Returns URL for vendor to visit

2. **OAuth Callback Handler**
   - `GET or POST /v1/stripe/connect/callback`
   - Receives authorization code from Stripe
   - Exchanges code for account ID
   - Saves to vendor record

3. **Disconnect Endpoint**
   - `DELETE /v1/stripe/connect/disconnect`
   - Allows vendor to disconnect account
   - Revokes OAuth access

### Frontend (2 New Pages)

1. **Stripe Connect Page**
   - `/stripe-connect/page.tsx`
   - Shows connection status
   - Button to initiate OAuth
   - Can be added to onboarding flow

2. **OAuth Callback Page**
   - `/stripe-callback/page.tsx`
   - Handles redirect from Stripe
   - Shows success/error state
   - Redirects to dashboard/success

### Stripe Dashboard Config

1. Enable Standard accounts (disable Express)
2. Add OAuth redirect URI
3. Note down Client ID

---

## Backend Changes Needed

### 1. New API Endpoints

#### **GET /v1/stripe/connect/oauth-url**
Generate Stripe OAuth URL for vendor to connect account.

**Request:**
```typescript
GET /v1/stripe/connect/oauth-url
Authorization: Bearer {vendorJWT}
```

**Response:**
```typescript
{
  "statusCode": 200,
  "data": {
    "oauthUrl": "https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_xxx&scope=read_write&redirect_uri=https://..."
  }
}
```

**Implementation:**
```typescript
async generateOAuthUrl(vendorId: string): Promise<string> {
  const redirectUri = `${process.env.FRONTEND_URL}/stripe-callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.STRIPE_CLIENT_ID,
    scope: 'read_write',
    redirect_uri: redirectUri,
    state: vendorId, // Pass vendor ID for security
  });

  return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
}
```

---

#### **POST /v1/stripe/connect/callback**
Handle OAuth callback and save connected account ID.

**Request:**
```typescript
POST /v1/stripe/connect/callback
Content-Type: application/json

{
  "code": "ac_xxxxx",
  "state": "vendor-uuid"
}
```

**Response:**
```typescript
{
  "statusCode": 200,
  "data": {
    "stripeAccountId": "acct_xxxxx",
    "accountEmail": "vendor@example.com",
    "connected": true
  }
}
```

**Implementation:**
```typescript
async handleOAuthCallback(code: string, state: string): Promise<void> {
  // 1. Exchange code for account ID
  const response = await stripe.oauth.token({
    grant_type: 'authorization_code',
    code,
  });

  const stripeAccountId = response.stripe_user_id;

  // 2. Verify vendor ID from state
  const vendorId = state;

  // 3. Update vendor record
  await this.vendorRepository.update(vendorId, {
    stripeAccountId,
    stripeConnected: true,
    stripeConnectedAt: new Date(),
  });

  // 4. Verify account is valid
  const account = await stripe.accounts.retrieve(stripeAccountId);

  if (!account.charges_enabled) {
    throw new Error('Stripe account not fully activated');
  }
}
```

---

#### **GET /v1/stripe/connect/status**
Check if vendor's Stripe account is connected and active.

**Request:**
```typescript
GET /v1/stripe/connect/status
Authorization: Bearer {vendorJWT}
```

**Response:**
```typescript
{
  "statusCode": 200,
  "data": {
    "connected": true,
    "stripeAccountId": "acct_xxxxx",
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "detailsSubmitted": true,
    "email": "vendor@example.com"
  }
}
```

---

#### **DELETE /v1/stripe/connect/disconnect**
Allow vendor to disconnect their Stripe account.

**Request:**
```typescript
DELETE /v1/stripe/connect/disconnect
Authorization: Bearer {vendorJWT}
```

**Response:**
```typescript
{
  "statusCode": 200,
  "message": "Stripe account disconnected successfully"
}
```

**Implementation:**
```typescript
async disconnectStripeAccount(vendorId: string): Promise<void> {
  const vendor = await this.vendorRepository.findById(vendorId);

  if (!vendor.stripeAccountId) {
    throw new Error('No Stripe account connected');
  }

  // Deauthorize the account
  await stripe.oauth.deauthorize({
    client_id: process.env.STRIPE_CLIENT_ID,
    stripe_user_id: vendor.stripeAccountId,
  });

  // Update vendor record
  await this.vendorRepository.update(vendorId, {
    stripeAccountId: null,
    stripeConnected: false,
    stripeConnectedAt: null,
  });
}
```

---

### 2. Payment Flow Updates

#### **Create Charge with Application Fee**

When customer places order:

```typescript
async chargeCustomer(orderId: string): Promise<void> {
  const order = await this.orderRepository.findById(orderId);
  const vendor = await this.vendorRepository.findById(order.vendorId);

  if (!vendor.stripeAccountId) {
    throw new Error('Vendor has not connected Stripe account');
  }

  // Calculate platform fee (e.g., 10% of order total)
  const orderTotal = order.totalAmount; // in pence
  const platformFeePercent = 0.10; // 10%
  const platformFee = Math.round(orderTotal * platformFeePercent);

  // Create charge
  const charge = await stripe.charges.create({
    amount: orderTotal,
    currency: 'gbp',
    source: order.paymentMethodId, // Customer's payment method
    application_fee_amount: platformFee,
    description: `Order ${order.id} from ${vendor.storeName}`,
    metadata: {
      orderId: order.id,
      vendorId: vendor.id,
    },
  }, {
    stripeAccount: vendor.stripeAccountId, // Important: charge on vendor's account
  });

  // Update order with charge info
  await this.orderRepository.update(orderId, {
    stripeChargeId: charge.id,
    status: 'paid',
  });
}
```

**Key Points:**
- Charge is created **on vendor's connected account**
- Platform fee is automatically deducted
- Vendor receives: `orderTotal - platformFee - stripeFees`
- Platform receives: `platformFee`

---

### 3. Webhook Handlers

#### **Handle `account.updated` Webhook**

Monitor when connected accounts change status:

```typescript
async handleAccountUpdated(event: Stripe.Event): Promise<void> {
  const account = event.data.object as Stripe.Account;

  // Find vendor with this Stripe account
  const vendor = await this.vendorRepository.findByStripeAccountId(account.id);

  if (!vendor) {
    console.warn(`No vendor found for Stripe account: ${account.id}`);
    return;
  }

  // Update vendor's Stripe status
  await this.vendorRepository.update(vendor.id, {
    stripeChargesEnabled: account.charges_enabled,
    stripePayoutsEnabled: account.payouts_enabled,
    stripeDetailsSubmitted: account.details_submitted,
  });

  // If account gets disabled, notify vendor
  if (!account.charges_enabled) {
    await this.emailService.sendEmail({
      to: vendor.email,
      subject: 'Action Required: Stripe Account Issue',
      body: 'Your Stripe account needs attention. Please log in to Stripe to resolve.',
    });
  }
}
```

---

## Frontend Changes

### 1. New Route: `/stripe-connect/page.tsx`

**Purpose:** Show Stripe Connect status and provide connection button.

**Location:** `app/stripe-connect/page.tsx` (or during onboarding)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StripeConnectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await apiClient.get('/stripe/connect/status');
      setStatus(response.data.data);
    } catch (err) {
      console.error('Failed to check Stripe status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/stripe/connect/oauth-url');
      const oauthUrl = response.data.data.oauthUrl;

      // Redirect to Stripe OAuth
      window.location.href = oauthUrl;
    } catch (err) {
      setError('Failed to initiate Stripe connection');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Stripe Connected!</h2>
          <p className="text-gray-600 mb-4">
            Your Stripe account is connected and ready to receive payments.
          </p>
          <div className="bg-white p-4 rounded border">
            <p className="text-sm text-gray-600">Account: {status.email}</p>
            <p className="text-sm text-gray-600">ID: {status.stripeAccountId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-4">Connect Your Stripe Account</h1>
      <p className="text-lg text-gray-600 mb-6">
        Connect your existing Stripe account to receive customer payments automatically.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="font-bold mb-2">What you'll need:</h3>
        <ul className="list-disc list-inside text-gray-700">
          <li>Existing Stripe account (or create one)</li>
          <li>Access to your Stripe login credentials</li>
          <li>Takes about 30 seconds</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded mb-6">
          {error}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg"
      >
        {loading ? 'Connecting...' : 'Connect Stripe Account'}
      </button>

      <p className="text-sm text-gray-500 mt-4 text-center">
        Secure connection via Stripe OAuth
      </p>
    </div>
  );
}
```

---

### 2. New Route: `/stripe-callback/page.tsx`

**Purpose:** Handle OAuth redirect from Stripe.

**Location:** `app/stripe-callback/page.tsx`

```typescript
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function StripeCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setError('Connection cancelled or failed');
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setError('Invalid callback parameters');
      return;
    }

    handleCallback(code, state);
  }, [searchParams]);

  const handleCallback = async (code: string, state: string) => {
    try {
      await apiClient.post('/stripe/connect/callback', { code, state });
      setStatus('success');

      // Redirect to success page or dashboard after 2 seconds
      setTimeout(() => {
        router.push('/onboard/success');
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      setError(err.response?.data?.message || 'Failed to connect Stripe account');
    }
  };

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg text-gray-600">Connecting your Stripe account...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Successfully Connected!</h2>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Connection Failed</h2>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={() => router.push('/stripe-connect')}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        Try Again
      </button>
    </div>
  );
}

export default function StripeCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <StripeCallbackHandler />
    </Suspense>
  );
}
```

---

### 3. Update Success Page (Optional)

Add Stripe connection status check to success page:

```typescript
// In app/onboard/success/page.tsx

const [stripeConnected, setStripeConnected] = useState(false);

useEffect(() => {
  checkStripeStatus();
}, []);

const checkStripeStatus = async () => {
  try {
    const response = await apiClient.get('/stripe/connect/status');
    setStripeConnected(response.data.data.connected);
  } catch (err) {
    console.error('Failed to check Stripe status');
  }
};

// Show different message based on connection status
{!stripeConnected && (
  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mt-6">
    <p className="font-bold">⚠️ Action Required</p>
    <p>Please connect your Stripe account to receive payments.</p>
    <button
      onClick={() => router.push('/stripe-connect')}
      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
    >
      Connect Stripe Now
    </button>
  </div>
)}
```

---

## Database Schema

### Vendors Table - ✅ Already Implemented

The database schema is **complete**. All required columns already exist in the `vendors` table:

**Existing Columns:**

| Column | Type | Description | Current Usage |
|--------|------|-------------|---------------|
| `stripeAccountId` | VARCHAR | Connected account ID (e.g., `acct_xxxxx`) | ✅ Used in payment flow |
| `stripeChargesEnabled` | BOOLEAN | Account can accept charges | ✅ Checked before creating charges |
| `stripePayoutsEnabled` | BOOLEAN | Account can receive payouts | ✅ Status tracking |
| `stripeDetailsSubmitted` | BOOLEAN | Vendor completed Stripe requirements | ✅ Status tracking |
| `commissionPercentage` | DOUBLE PRECISION | Platform commission (default 10%) | ✅ Used to calculate fees |

**Sample Data** (from staging database):

```sql
SELECT
  "storeName",
  "stripeAccountId",
  "stripeChargesEnabled",
  "commissionPercentage"
FROM vendors
ORDER BY "createdAt" DESC;

-- Results:
-- Flabelus              | null                      | false | 10
-- Bloobloom             | acct_1SKmqVCgc5jysrmg     | true  | 10
-- Strawberries & Cream  | acct_1SKmqVCgc5jysrmg     | true  | 10
-- Charlotte Tillbury    | acct_1SKmqaEMfCPXWPyA     | true  | 10
-- Erdem                 | acct_1SKmqaEMfCPXWPyA     | true  | 10
-- Hobbs London          | acct_1SKmqVCgc5jysrmg     | true  | 10
```

**Migration Note:**

The columns were added in migration: `src/database/migrations/1761000000000-AddStripeConnectToVendors.ts`

**No database changes needed** - ready for OAuth implementation.

---

## Security Considerations

### 1. OAuth State Parameter

**Always use the `state` parameter** to prevent CSRF attacks:

```typescript
// Generate state with vendor ID + random token
const state = `${vendorId}:${crypto.randomBytes(16).toString('hex')}`;

// Store state in session/database temporarily
await redis.set(`stripe_oauth_state:${state}`, vendorId, 'EX', 600); // 10 min expiry

// Verify state in callback
const storedVendorId = await redis.get(`stripe_oauth_state:${state}`);
if (!storedVendorId || storedVendorId !== vendorId) {
  throw new Error('Invalid state parameter');
}
```

---

### 2. Verify Connected Account

**Always verify the account before saving:**

```typescript
const account = await stripe.accounts.retrieve(stripeAccountId);

if (!account.charges_enabled) {
  throw new Error('Account not fully activated');
}

if (account.country !== 'GB') {
  throw new Error('Only UK Stripe accounts are supported');
}
```

---

### 3. Webhook Signature Verification

**Always verify webhook signatures:**

```typescript
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);

// Only process verified events
```

---

### 4. Store Minimal Data

**Do NOT store sensitive Stripe data** (like refresh tokens) in your database. Only store:
- ✅ Account ID
- ✅ Connection status
- ✅ Capabilities (charges_enabled, etc.)

---

## Testing Plan

### 1. Test Mode Setup

**Use Stripe Test Mode during development:**

1. Go to: Dashboard → Toggle "Test Mode" (top right)
2. Get test credentials:
   - Test Client ID: `ca_xxxxx_test`
   - Test Secret Key: `sk_test_xxxxx`
   - Test Publishable Key: `pk_test_xxxxx`

3. Create test connected accounts:
   - Use test OAuth flow
   - Test account IDs start with `acct_test_`

---

### 2. Test Scenarios

**Test Case 1: Successful Connection**
```
✓ Vendor clicks "Connect Stripe"
✓ Redirected to Stripe OAuth
✓ Vendor logs in and authorizes
✓ Redirected back to callback
✓ Account ID saved to database
✓ Success message shown
```

**Test Case 2: Connection Cancelled**
```
✓ Vendor clicks "Connect Stripe"
✓ Redirected to Stripe OAuth
✓ Vendor cancels authorization
✓ Redirected back with error
✓ Error message shown
✓ Can retry connection
```

**Test Case 3: Test Payment Flow**
```
✓ Customer places order
✓ Charge created on connected account
✓ Platform fee deducted
✓ Vendor receives payout (minus fees)
✓ Verify amounts in Stripe dashboard
```

**Test Case 4: Disconnection**
```
✓ Vendor disconnects Stripe account
✓ Account ID removed from database
✓ Future orders cannot be processed
✓ Reconnection works correctly
```

---

### 3. Test Data

**Use Stripe test cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

---

## Go-Live Checklist

### Pre-Launch

- [ ] Stripe Connect enabled for Standard accounts only
- [ ] Express accounts disabled in Stripe Dashboard
- [ ] OAuth redirect URIs configured in Stripe
- [ ] Production API keys added to environment variables
- [ ] Webhook endpoints configured with correct URLs
- [x] **Database columns added to vendors table** ✅ Already complete
- [x] **Payment splitting logic implemented** ✅ Already working
- [x] **Commission calculation implemented** ✅ Already working
- [ ] OAuth backend endpoints implemented and tested
- [ ] Frontend pages implemented and tested
- [ ] Test mode thoroughly tested with test accounts
- [ ] Error handling implemented for all edge cases

### Launch Day

- [ ] Switch from test mode to live mode
- [ ] Update environment variables with live keys
- [ ] Deploy backend changes (OAuth endpoints)
- [ ] Deploy frontend changes (Connect pages)
- [ ] Test OAuth flow end-to-end in production
- [ ] Create test vendor and connect real Stripe account
- [x] **Process test order and verify payment split** ✅ Already working (manually created accounts)
- [ ] Monitor webhook events in Stripe Dashboard
- [ ] Set up alerting for failed webhooks

### Post-Launch

- [ ] Monitor Stripe Dashboard for connected accounts
- [ ] Track OAuth conversion rate (how many vendors complete it)
- [ ] Set up reporting for platform fees collected
- [ ] Document troubleshooting steps for support team
- [ ] Create vendor FAQ about Stripe connection
- [ ] Monitor for any disconnection issues

---

## Common Issues & Troubleshooting

### Issue: "Invalid redirect_uri"

**Cause:** Redirect URI not added to Stripe Connect settings

**Fix:**
1. Go to: Stripe Dashboard → Settings → Connect
2. Add your callback URL to "Redirect URIs"
3. Ensure exact match (including https://)

---

### Issue: Vendor sees "Account not found"

**Cause:** Vendor doesn't have a Stripe account yet

**Fix:**
- Update OAuth URL with `stripe_user[email]` parameter to pre-fill email
- Or show "Create Stripe Account" option first

---

### Issue: Charge fails with "No such destination"

**Cause:** Invalid or disconnected Stripe account ID

**Fix:**
- Verify `stripe_account_id` exists in database
- Check if account is still connected via API
- Handle gracefully and notify vendor to reconnect

---

### Issue: Platform fee not deducted

**Cause:** Missing `application_fee_amount` in charge creation

**Fix:**
- Always include `application_fee_amount` parameter
- Verify fee is calculated correctly (in pence, not pounds)

---

## Next Steps

### Phase 1: Stripe Dashboard Configuration (1 Day)
1. ✅ ~~Database columns~~ - Already complete
2. ✅ ~~Payment splitting logic~~ - Already working
3. ✅ ~~Commission calculation~~ - Already working
4. **TODO:** Enable Standard accounts in Stripe Dashboard
5. **TODO:** Disable Express accounts to avoid fees
6. **TODO:** Configure OAuth redirect URIs
7. **TODO:** Get Stripe Client ID
8. **TODO:** Add `STRIPE_CLIENT_ID` to environment variables

### Phase 2: Backend Implementation (2-3 Days)
1. **TODO:** Create `StripeConnectController` (new file)
2. **TODO:** Implement `GET /v1/stripe/connect/oauth-url` endpoint
3. **TODO:** Implement `POST /v1/stripe/connect/callback` endpoint
4. **TODO:** Implement `DELETE /v1/stripe/connect/disconnect` endpoint
5. **TODO:** Add OAuth state validation (security)
6. **TODO:** Add webhook handler for `account.updated`
7. **TODO:** Test endpoints with Stripe CLI

### Phase 3: Frontend Implementation (2-3 Days)
1. **TODO:** Create `/stripe-connect/page.tsx`
2. **TODO:** Create `/stripe-callback/page.tsx`
3. **TODO:** Add to onboarding flow (after operating hours)
4. **TODO:** Update success page to show Stripe status
5. **TODO:** Test OAuth flow end-to-end in test mode

### Phase 4: Testing & Launch (2-3 Days)
1. **TODO:** Test with Stripe test mode accounts
2. **TODO:** Security review of OAuth implementation
3. **TODO:** Test all error scenarios (cancel, timeout, etc.)
4. **TODO:** Switch to live mode credentials
5. **TODO:** Test with one real vendor
6. **TODO:** Full launch to all vendors

**Total Timeline:** ~7-10 days

---

## Resources

### Official Documentation
- [Stripe Connect Standard Accounts](https://stripe.com/docs/connect/standard-accounts)
- [OAuth for Connect](https://stripe.com/docs/connect/oauth-reference)
- [Application Fees](https://stripe.com/docs/connect/direct-charges#collecting-fees)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

### Support
- Stripe Support: https://support.stripe.com
- Stripe Community: https://support.stripe.com/community

---

**Document maintained by:** Claude + Street Team
**Questions?** Review this doc first, then ask!
