import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth Check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get User Profile
    const { data: profile } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      // Create customer so they can access portal (even if empty)
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from('user_profile')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    let session;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.get('origin')}/account`,
      });
    } catch (err: any) {
      if (err.code === 'resource_missing' && err.param === 'customer') {
        console.warn(`Stripe customer ${customerId} missing in portal, creating new one...`);

        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });
        customerId = newCustomer.id;

        await supabase
          .from('user_profile')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', user.id);

        // Retry portal creation
        session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${req.headers.get('origin')}/account`,
        });
      } else {
        throw err;
      }
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Portal Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
