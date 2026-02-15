'use client';
import React, { useState, useEffect } from 'react';
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	ModalTitle,
} from './modal';
import Link from 'next/link';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import toast from 'react-hot-toast';
import { AtSignIcon, Eye, EyeOff, Lock } from 'lucide-react';

type AuthModalProps = Omit<React.ComponentProps<typeof Modal>, 'children'> & {
  onGoogleSignIn?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEmailSignUp?: (email: string, password: string) => Promise<{ error?: any }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEmailSignIn?: (email: string, password: string) => Promise<{ error?: any }>;
  initialMode?: 'signin' | 'signup';
};

export function AuthModal({ onGoogleSignIn, onEmailSignUp, onEmailSignIn, initialMode = 'signin', ...props }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset to initial mode when modal opens
  useEffect(() => {
    if (props.open) {
      setIsSignUp(initialMode === 'signup');
      resetForm();
    }
  }, [props.open, initialMode]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      onGoogleSignIn?.();
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (isSignUp && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = isSignUp
        ? await onEmailSignUp?.(email, password)
        : await onEmailSignIn?.(email, password);

      if (result?.error) {
        toast.error(result.error.message || 'Authentication failed');
      } else {
        toast.success(isSignUp ? 'Check your email for confirmation!' : 'Welcome back!');
        props.onOpenChange?.(false);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <Modal {...props}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <GoogleIcon className="w-4 h-4 me-2" />
            <span>{isLoading ? 'Signing in...' : 'Continue With Google'}</span>
          </Button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <AtSignIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-transparent border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-transparent border-slate-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 bg-transparent border-border"
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !email || !password}
              >
                <span>{isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
              </Button>
            </div>
          </form>

          <div className="text-center text-sm mt-4">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-accent hover:text-accent/80 underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </ModalBody>
        <div className="p-4">
          <p className="text-muted-foreground text-center text-xs">
            By clicking Continue, you agree to our{' '}
            <Link className="text-foreground hover:underline" href="/policy">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </ModalContent>
    </Modal>
  );
}

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		{...props}
	>
		<g>
			<path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
		</g>
	</svg>
);
