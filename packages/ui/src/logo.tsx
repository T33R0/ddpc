"use client";

import Image from "next/image";

export function Logo({ size = 40 }: { size?: number }) {
  return <Image src="/branding/logo-transparent.png" alt="DDPC Transparent Logo" width={size} height={size} />;
}
