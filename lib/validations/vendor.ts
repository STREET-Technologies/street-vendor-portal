import { z } from 'zod';

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
  phone: z
    .string()
    .min(10, 'Phone number is required')
    .regex(
      /^(\+44\d{9,10}|0[1-9]\d{8,9})$/,
      'Enter a valid UK phone number (e.g., +447123456789 or 07123456789)'
    ),
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
  acceptTerms: z.literal(true, {
    message: 'You must accept the terms and conditions',
  }),
});

export type VendorOnboardingFormData = z.infer<typeof vendorOnboardingSchema>;
