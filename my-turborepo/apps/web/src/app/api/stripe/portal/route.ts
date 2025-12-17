import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
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

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.get('origin')}/account`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Portal Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
