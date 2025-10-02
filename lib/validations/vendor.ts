import { z } from 'zod';

export const vendorOnboardingSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  storeUrl: z
    .string()
    .min(1, 'Shopify store URL is required')
    .regex(
      /^[\w-]+\.myshopify\.com$/,
      'Must be a valid Shopify store URL (e.g., yourstore.myshopify.com)'
    ),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .min(10, 'Phone number is required')
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format'),
  country: z.string().min(2, 'Country is required'),
  postcode: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  vendorCategory: z.enum([
    'Fashion',
    'Beauty',
    'Electronics',
    'Home & Living',
    'Food & Beverage',
    'Sports & Outdoors',
    'Books & Media',
    'Toys & Games',
    'Health & Wellness',
    'Automotive',
    'Pet Supplies',
    'Other',
  ], {
    required_error: 'Please select a business category',
  }),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});

export type VendorOnboardingFormData = z.infer<typeof vendorOnboardingSchema>;
