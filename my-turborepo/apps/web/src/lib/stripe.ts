import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing. Please set it in your environment variables.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // apiVersion: '2024-12-18.acacia', // Removed to avoid TS error with new SDK version
  typescript: true,
});
