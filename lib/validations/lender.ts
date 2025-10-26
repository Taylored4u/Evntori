import { z } from 'zod';

export const lenderOnboardingSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessDescription: z.string().min(20, 'Please provide a detailed description (at least 20 characters)').max(500, 'Description is too long'),
});

export type LenderOnboardingInput = z.infer<typeof lenderOnboardingSchema>;
