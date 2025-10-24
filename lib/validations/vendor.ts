import { z } from 'zod';

export const vendorOnboardingSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  storeUrl: z
    .string()
    .min(1, 'Store URL is required')
    .regex(
      /^[\w-]+(\.[\w-]+)+$/,
      'Must be a valid domain (e.g., yourstore.myshopify.com or yourdomain.com)'
    ),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .min(10, 'Phone number is required')
    .regex(/^\+\d{1,3}\d{9,14}$/, 'Phone number must be in international format, e.g., +13124567890'),
  country: z.string().min(2, 'Country is required'),
  postcode: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  vendorType: z.enum(['shopify', 'woocommerce', 'magento', 'custom', 'other'], {
    message: 'Please select a vendor type',
  }),
  vendorCategory: z.enum([
    'Fashion',
    'Beauty',
    'Electronics',
    'Home & Living',
    'Food & Beverage',
    'Sports & Outdoors',
    'Books & Media',
    'Toys & Games',
    'Kids / Babywear',
    'Health & Wellness',
    'Automotive',
    'Pet Supplies',
    'Other',
  ], {
    message: 'Please select a business category',
  }),
  acceptTerms: z.literal(true, {
    message: 'You must accept the terms and conditions',
  }),
});

export type VendorOnboardingFormData = z.infer<typeof vendorOnboardingSchema>;
