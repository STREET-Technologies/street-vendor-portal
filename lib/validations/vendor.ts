import { z } from 'zod';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const vendorOnboardingSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  storeUrl: z
    .string()
    .min(1, 'Store URL is required')
    .transform((val) => {
      // Strip protocol (http://, https://), www., and trailing slashes
      return val
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/+$/, '')
        .toLowerCase()
        .trim();
    })
    .refine(
      (val) => /^[\w-]+(\.[\w-]+)+$/.test(val),
      'Must be a valid domain (e.g., yourstore.myshopify.com or yourdomain.com)'
    ),
  email: z.string().email('Invalid email address'),
  // TT-250: validate with libphonenumber (accepts national or international
  // format, e.g. "020 8544 9100", "07123 456789", "+447123456789") and store
  // the canonical E.164 form. Replaces the old regex that demanded "+44" yet
  // still let through invalid numbers like +44208544911 (one digit short).
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .transform((val, ctx) => {
      const parsed = parsePhoneNumberFromString(val, 'GB');
      if (!parsed || !parsed.isValid()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid phone number (e.g., 020 8544 9100 or 07123 456789)',
        });
        return z.NEVER;
      }
      return String(parsed.number); // E.164 string, e.g. +442085449100
    }),
  country: z.string().min(2, 'Country is required'),
  postcode: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  vendorType: z.enum(['shopify', 'woocommerce', 'magento', 'custom', 'other'], {
    message: 'Please select a vendor type',
  }),
  vendorCategory: z.enum([
    'Fashion',
    'Streetwear',
    'Footwear',
    'Activewear',
    'Jewellery',
    'Beauty',
    'Home & Living',
    'Health & Wellness',
    'Kids & Babywear',
    'Other',
  ], {
    message: 'Please select a business category',
  }),
  shippingReturnsUrl: z
    .string()
    .url('Must be a valid URL (e.g., https://yourstore.com/pages/shipping-returns)')
    .optional()
    .or(z.literal('')),
  acceptTerms: z.literal(true, {
    message: 'You must accept the terms and conditions',
  }),
  primaryOutletId: z.string().uuid().optional(),
});

export type VendorOnboardingFormData = z.infer<typeof vendorOnboardingSchema>;
