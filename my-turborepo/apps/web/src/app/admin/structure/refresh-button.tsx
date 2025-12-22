'use client'

import { useTransition } from 'react'
import { Button } from '@repo/ui/button'
import { RefreshCcw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { refreshStructureAction } from '@/actions/structure'
import { useRouter } from 'next/navigation'

export function RefreshStructureButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const result = await refreshStructureAction()

        if (result.success) {
          toast.success(result.message)
          router.refresh()
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        console.error(error)
        toast.error('An unexpected error occurred.')
      }
    })
  }

  return (
    <Button
      onClick={handleRefresh}
      disabled={isPending}
      className="w-full sm:w-auto"
    >
      <RefreshCcw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Scanning...' : 'Refresh Structure'}
    </Button>
  )
}
