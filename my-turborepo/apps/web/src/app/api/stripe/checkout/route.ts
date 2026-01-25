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

    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Get User Profile
    const { data: profile } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save to DB
      await supabase
        .from('user_profile')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Determine mode
    const isVanguard = priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_VANGUARD;
    const mode = isVanguard ? 'payment' : 'subscription';

    console.log(`Creating session for user ${user.id} with price ${priceId} in mode ${mode}`);

    // Create Session
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: mode,
        success_url: `${req.headers.get('origin')}/account?billing_status=success`,
        cancel_url: `${req.headers.get('origin')}/account?billing_status=canceled`,
        client_reference_id: user.id,
        allow_promotion_codes: true,
      });
    } catch (err: any) {
      // Handle "Customer not found" error (e.g. from environment mismatch)
      if (err.code === 'resource_missing' && err.param === 'customer') {
        console.warn(`Stripe customer ${customerId} missing, creating new one...`);

        const newCustomer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });
        customerId = newCustomer.id;

        // Update DB with valid customer ID
        const { error: updateError } = await supabase
          .from('user_profile')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Failed to update user profile with new customer ID:', updateError);
        }

        // Retry session creation
        session = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: mode,
          success_url: `${req.headers.get('origin')}/account?billing_status=success`,
          cancel_url: `${req.headers.get('origin')}/account?billing_status=canceled`,
          client_reference_id: user.id,
          allow_promotion_codes: true,
        });
      } else {
        throw err;
      }
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
