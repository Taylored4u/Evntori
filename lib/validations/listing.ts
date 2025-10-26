import { z } from 'zod';

export const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title is too long'),
  description: z.string().min(50, 'Please provide a detailed description (at least 50 characters)').max(2000, 'Description is too long'),
  categoryId: z.string().min(1, 'Please select a category'),
  condition: z.string().optional(),
  replacementValue: z.number().min(0, 'Replacement value must be positive').optional(),
  basePrice: z.number().min(1, 'Price must be at least $1'),
  pricingType: z.enum(['hourly', 'daily', 'weekly']),
  minRentalDuration: z.number().min(1, 'Minimum duration must be at least 1'),
  maxRentalDuration: z.number().optional(),
  cancellationPolicy: z.enum(['flexible', 'moderate', 'strict']),
  quantityAvailable: z.number().min(1, 'Quantity must be at least 1'),
  depositAmount: z.number().min(0, 'Deposit must be positive').optional(),
});

export const variantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().optional(),
  priceAdjustment: z.number(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

export const addOnSchema = z.object({
  name: z.string().min(1, 'Add-on name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  type: z.enum(['pickup', 'delivery', 'setup']).optional(),
  isRequired: z.boolean(),
});

export type ListingInput = z.infer<typeof listingSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type AddOnInput = z.infer<typeof addOnSchema>;
