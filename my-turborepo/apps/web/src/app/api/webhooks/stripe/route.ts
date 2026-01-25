import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { sendEmail } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function getPlanFromPriceId(priceId: string): 'free' | 'pro' | 'vanguard' {
  // Use NEXT_PUBLIC_ vars to match client-side and ensure availability if defined in .env.local
  const proMonthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY;
  const proAnnualPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL;
  const vanguardPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_VANGUARD;

  if (priceId === proMonthlyPriceId || priceId === proAnnualPriceId) return 'pro';
  if (priceId === vanguardPriceId) return 'vanguard';

  // Default to free for any other price ID
  return 'free';
}

async function downgradeUserAndNotify(userId: string, reason: string) {
  // 1. Downgrade user to free
  const { error: updateError } = await supabase
    .from('user_profile')
    .update({ plan: 'free' })
    .eq('user_id', userId);

  if (updateError) {
    console.error(`Failed to downgrade user ${userId}:`, updateError);
    return;
  }

  // 2. Fetch user email
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !user || !user.email) {
    console.error(`Failed to fetch email for user ${userId}:`, userError);
    return;
  }

  // 3. Send notification email
  await sendEmail({
    to: user.email,
    subject: 'Payment Failed - Subscription Downgraded',
    html: `
      <div style="font-family: sans-serif; color: #333;">
        <h1>Payment Failed</h1>
        <p>We were unable to process the payment for your subscription.</p>
        <p>As a result, your account has been downgraded to the <strong>Maintainer (Free)</strong> plan.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>To restore your Pro access, please update your payment method in your account settings.</p>
        <br />
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://myddpc.com'}/account?tab=billing" style="display: inline-block; background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Update Payment Method</a>
      </div>
    `
  });

  console.log(`Downgraded and notified user ${userId} due to: ${reason}`);
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.client_reference_id && session.customer) {
          // Link customer ID logic
          const { error } = await supabase
            .from('user_profile')
            .update({ stripe_customer_id: session.customer as string })
            .eq('user_id', session.client_reference_id);

          if (error) {
            console.error('Error linking stripe customer:', error);
          }

          // Handle One-Time Payments (Vanguard)
          if (session.mode === 'payment' && session.payment_status === 'paid') {
            const expandedSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] });
            const priceId = expandedSession.line_items?.data[0]?.price?.id;

            if (priceId && getPlanFromPriceId(priceId) === 'vanguard') {
              await supabase
                .from('user_profile')
                .update({ plan: 'vanguard' })
                .eq('user_id', session.client_reference_id);
            }
          }
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find the user associated with this customer
        const { data: user } = await supabase
          .from('user_profile')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!user) {
          console.warn(`User not found for customer ${customerId} in subscription update`);
          break;
        }

        // Check status
        if (['active', 'trialing'].includes(subscription.status)) {
          // Ensure items exist
          const firstItem = subscription.items.data[0];
          if (firstItem) {
            const priceId = firstItem.price.id;
            const plan = getPlanFromPriceId(priceId);

            // Update user plan
            await supabase
              .from('user_profile')
              .update({ plan })
              .eq('user_id', user.user_id);
          }
        } else if (['past_due', 'unpaid', 'canceled'].includes(subscription.status)) {
          // Handle failed payment states immediately as requested
          await downgradeUserAndNotify(user.user_id, `Subscription status: ${subscription.status}`);
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
          await downgradeUserAndNotify(user.user_id, 'Subscription canceled');
        }
        break;
      }
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Error processing webhook: ${errorMessage}`);
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
