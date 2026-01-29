import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  // Merge Tailwind classes intelligently and accept conditional class names
  // usage: cn("px-2", condition && "text-sm")
  return twMerge(clsx(inputs))
}
