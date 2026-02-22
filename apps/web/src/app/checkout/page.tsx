'use client';

import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const { session } = useAuth();
    const [clientSecret, setClientSecret] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const priceId = searchParams?.get('priceId');
        if (!priceId || !session?.access_token) return;

        fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ priceId }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                } else {
                    setError(data.error || 'Failed to initialize checkout');
                }
            })
            .catch((err) => {
                console.error('Checkout error:', err);
                setError('An unexpected error occurred');
            });
    }, [searchParams, session?.access_token]);

    if (error) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-4">
                <div className="text-destructive text-center">
                    <h2 className="text-xl font-semibold mb-2">Checkout Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div id="checkout" className="container mx-auto max-w-4xl py-12 px-4 mt-20">
            {clientSecret && stripePromise ? (
                <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret }}
                >
                    <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
            ) : (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}
        </div>
    );
}
