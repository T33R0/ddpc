'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { ChevronUp } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

export function ScrollToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShow(true)
      } else {
        setShow(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!show) return null

  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn(
        "fixed bottom-20 right-8 z-50 rounded-full shadow-lg transition-all duration-300 opacity-0 scale-0",
        show && "opacity-100 scale-100"
      )}
      onClick={scrollToTop}
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  )
}
