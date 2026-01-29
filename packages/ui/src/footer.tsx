'use client';

import React from 'react';
import Link from 'next/link';
import { Linkedin } from 'lucide-react';

const navLinks = [
  { name: 'About', href: '/about' },
  { name: 'Join', href: '/join' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Help Center', href: '/help' },
];

const RedditIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    {...props}
  >
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

const socialLinks = [
  { icon: <RedditIcon className="size-5" />, href: 'https://www.reddit.com/r/ddpc/', label: 'Reddit' },
  { icon: <Linkedin className="size-5" />, href: 'https://www.linkedin.com/in/rory-teehan/', label: 'LinkedIn' },
];

const legalLinks = [
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Privacy Policy', href: '/privacy' },
];

export function Footer({ onReportProblem }: { onReportProblem?: () => void }) {
  return (
    <footer className="bg-background border-t border-border text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Logo & Slogan */}
          <div className="flex flex-col gap-2 text-center lg:text-left">
            <Link href="/" className="text-2xl font-bold">
              ddpc
            </Link>
            <p className="text-muted-foreground text-sm">
              Fueling your automotive passion.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="grid grid-cols-2 gap-4 md:flex md:gap-8 justify-center items-center w-full lg:w-auto">
            {navLinks.map((link) => {
              if (link.name === 'Help Center' && onReportProblem) {
                return (
                  <button
                    key={link.name}
                    onClick={onReportProblem}
                    className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                  >
                    {link.name}
                  </button>
                );
              }
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Social Icons */}
          <div className="flex justify-center gap-4">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {social.icon}
              </Link>
            ))}
          </div>
        </div>

        {/* Copyright & Legal */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} DDPC. All rights reserved.
          </div>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
