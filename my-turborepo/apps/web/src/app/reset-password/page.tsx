'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';
import LandingLayout from '../landing-layout';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { updatePassword, session } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If no session, they might not have clicked the magic link or it expired.
        // However, usually the magic link signs them in.
        // We'll let them try, but if not signed in, updatePassword might fail or we should handle it.
        // Supabase magic link for password reset signs the user in.
        if (!loading && !session) {
            // Ideally we might want to check if we are in the process of handling the recovery link
            // For now, we rely on the fact that the link does the sign-in.
        }
    }, [session, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { error } = await updatePassword(password);
            if (error) {
                toast.error(error.message);
            } else {
                toast.success('Password updated successfully!');
                router.push('/'); // Redirect to home/dashboard
            }
        } catch (error) {
            console.error(error);
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LandingLayout>
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                        <CardDescription className="text-center">
                            Enter your new password below
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Confirm your new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </LandingLayout>
    );
}
