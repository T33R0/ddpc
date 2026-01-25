import React from 'react'
import { Card } from '@repo/ui/card'
import { cn } from '@repo/ui/lib/utils'
import Image from 'next/image'
import { Badge } from '@repo/ui/badge'
import Link from 'next/link'

interface DashboardCardProps extends React.ComponentProps<typeof Card> {
  children?: React.ReactNode
  className?: string
  onClick?: () => void
  href?: string
  imageSrc?: string
  title?: string
  description?: string
  badges?: string[]
}

export function DashboardCard({
  children,
  className,
  onClick,
  href,
  imageSrc,
  title,
  description,
  badges,
  ...props
}: DashboardCardProps) {

  const CardContent = (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-300 ease-out bg-card border-border",
        "hover:scale-105 hover:border-accent hover:shadow-lg",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Background Image with next/image */}
      {imageSrc && (
        <div className="absolute inset-0 z-0">
          <Image
            src={imageSrc}
            alt={title || "Dashboard card background"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-40 group-hover:opacity-30"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        </div>
      )}

      {/* Structured Content (if props provided) */}
      {(title || description) && (
        <div className="relative z-10 p-6 flex flex-col justify-end h-full">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors">
              {title}
            </h2>
            {badges && badges.length > 0 && (
              <div className="flex gap-2">
                {badges.map(badge => (
                  <Badge key={badge} variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground font-medium line-clamp-2">
              {description}
            </p>
          )}
          {children}
        </div>
      )}

      {/* Raw Children (Legacy Support or Custom Layout) */}
      {/* If no title/desc provided, render children directly as before */}
      {(!title && !description) && children}
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="h-full block">
        {CardContent}
      </Link>
    )
  }

  return CardContent
}
