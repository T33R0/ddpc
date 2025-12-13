import React from 'react'
import { Card } from '@repo/ui/card'
import { cn } from '@repo/ui/lib/utils'

interface DashboardCardProps extends React.ComponentProps<typeof Card> {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function DashboardCard({ children, className, onClick, ...props }: DashboardCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-300 ease-out bg-card",
        "hover:scale-105 hover:border-accent hover:shadow-[0_0_30px_hsl(var(--accent)/0.6)]",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Card>
  )
}
