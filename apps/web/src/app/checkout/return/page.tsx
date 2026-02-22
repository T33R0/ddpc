import { stripe } from '@/lib/stripe';
import { redirect } from 'next/navigation';

export default async function CheckoutReturnPage({
    searchParams,
}: {
    searchParams: Promise<{ session_id?: string }>;
}) {
    const { session_id } = await searchParams;

    if (!session_id) {
        redirect('/account');
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.status === 'open') {
            redirect('/account?billing_status=canceled');
        } else if (session.status === 'complete') {
            redirect('/account?billing_status=success');
        } else {
            redirect('/account');
        }
    } catch (error) {
        console.error('Error retrieving Stripe session:', error);
        redirect('/account');
    }
}
