'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Linkedin, X } from 'lucide-react';

const navLinks = [
  { name: 'About', href: '/about' },
  { name: 'Join', href: '/join' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Contact Us', href: '/contact' },
  { name: 'Help Center', href: '/help' },
];

const socialLinks = [
  { icon: <Instagram className="size-5" />, href: '#', label: 'Instagram' },
  { icon: <X className="size-5" />, href: '#', label: 'X' },
  { icon: <Linkedin className="size-5" />, href: '#', label: 'LinkedIn' },
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
