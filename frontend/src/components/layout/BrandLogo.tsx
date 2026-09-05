import { cn } from "@/lib/utils"

interface BrandLogoProps {
  size?: number
  className?: string
}

/**
 * EduPulse brand mark - gradient cap tile per the brand reference:
 * indigo -> cyan -> emerald diagonal fill, white mortarboard.
 */
export function BrandLogo({ size = 32, className }: BrandLogoProps) {
  const id = "brand-grad"
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className={cn("shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="55%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="12" fill={`url(#${id})`} />
      <path d="M28 14 L14 22.5 L28 31 L42 22.5 Z" fill="#ffffff" />
      <path
        d="M14 27.5 V30.5 C14 35.5 21 39 28 39 C35 39 42 35.5 42 30.5 V27.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="28" cy="36" r="2.25" fill="#ffffff" />
    </svg>
  )
}