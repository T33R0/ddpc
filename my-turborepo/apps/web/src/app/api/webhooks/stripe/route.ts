import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function getPlanFromPriceId(priceId: string): 'free' | 'builder' | 'pro' {
  // Use NEXT_PUBLIC_ vars to match client-side and ensure availability if defined in .env.local
  const builderPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUILDER;
  const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;

  if (priceId === builderPriceId) return 'builder';
  if (priceId === proPriceId) return 'pro';
  // If no match found, default to free.
  return 'free';
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('Stripe-Signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Logic to link user if not already linked
        if (session.client_reference_id && session.customer) {
          const { error } = await supabase
            .from('user_profile')
            .update({ stripe_customer_id: session.customer as string })
            .eq('user_id', session.client_reference_id);

          if (error) {
            console.error('Error linking stripe customer:', error);
          }
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Check status
        if (['active', 'trialing'].includes(subscription.status)) {
           // Ensure items exist
           if (subscription.items.data.length > 0) {
             const priceId = subscription.items.data[0].price.id;
             const plan = getPlanFromPriceId(priceId);

             if (plan === 'free') {
               console.log(`Price ID ${priceId} mapped to free plan.`);
             }

             // Update user plan
             const { data: user } = await supabase
               .from('user_profile')
               .select('user_id')
               .eq('stripe_customer_id', customerId)
               .single();

             if (user) {
               await supabase
                 .from('user_profile')
                 .update({ plan })
                 .eq('user_id', user.user_id);
             } else {
               console.warn(`User not found for customer ${customerId} in subscription update`);
             }
           }
        } else {
           // If status is incomplete, past_due, canceled... we might handle it.
           // Usually 'canceled' comes via subscription.deleted (or updated with status=canceled)
           if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
              const { data: user } = await supabase
               .from('user_profile')
               .select('user_id')
               .eq('stripe_customer_id', customerId)
               .single();

              if (user) {
                await supabase
                  .from('user_profile')
                  .update({ plan: 'free' })
                  .eq('user_id', user.user_id);
              }
           }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: user } = await supabase
             .from('user_profile')
             .select('user_id')
             .eq('stripe_customer_id', customerId)
             .single();

        if (user) {
           await supabase
             .from('user_profile')
             .update({ plan: 'free' })
             .eq('user_id', user.user_id);
        }
        break;
      }
    }
  } catch (error: any) {
    console.error(`Error processing webhook: ${error.message}`);
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
