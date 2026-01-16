'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter, ModalDescription } from '@repo/ui/modal'
import { Activity, Wrench, Fuel, Settings, Edit, Upload, Lock, Unlock, ChevronLeft, Puzzle } from 'lucide-react'
import { Vehicle } from '@repo/types'
import { Badge } from '@repo/ui/badge'
import { DropdownMenu } from '@repo/ui/dropdown-menu'
import { OnboardingModal } from './components/OnboardingModal'
import { WishlistButton } from '@/features/wishlist/components/WishlistButton'
import { format } from 'date-fns'

type ImageWithTimeoutFallbackProps = {
  src: string
  fallbackSrc: string
  alt: string
  className?: string
  timeout?: number
  unoptimized?: boolean
}

function ImageWithTimeoutFallback({
  src,
  fallbackSrc,
  alt,
  className,
  timeout = 5000,
  unoptimized = false
}: ImageWithTimeoutFallbackProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [showFallback, setShowFallback] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [currentSrc, setCurrentSrc] = React.useState(src)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Update currentSrc when src changes
  React.useEffect(() => {
    if (src && src !== currentSrc) {
      setCurrentSrc(src)
      setImageLoaded(false)
      setShowFallback(false)
    }
  }, [src, currentSrc])

  React.useEffect(() => {
    if (!mounted || !currentSrc) return

    const timer = setTimeout(() => {
      if (!imageLoaded) {
        console.log('Image load timeout for:', currentSrc)
        setShowFallback(true)
      }
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout, imageLoaded, mounted, currentSrc])

  // On server-side or before hydration, show fallback
  if (!mounted || showFallback || !currentSrc) {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        className={className}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority
        unoptimized={unoptimized}
      />
    )
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      className={className}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority
      unoptimized={unoptimized}
      onLoad={() => {
        console.log('Image loaded successfully:', currentSrc)
        setImageLoaded(true)
      }}
      onError={() => {
        console.error('Image load error for:', currentSrc)
        setShowFallback(true)
      }}
    />
  )
}

// Helper function to format specs with proper units
const formatSpec = (value: string | number | undefined | null, unit: string = ''): string => {
  if (!value || value === 'null' || value === 'undefined') return '—';
  return unit ? `${value}${unit}` : String(value);
};

function VehicleImageCard({ vehicle, vehicleId, isOwner }: { vehicle: Vehicle; vehicleId: string; isOwner: boolean }) {
  const [isUploading, setIsUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(vehicle.vehicle_image || null)
  const [isHovered, setIsHovered] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwner) return
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB')
      return
    }

    setIsUploading(true)

    try {
      // Use API route for upload (handles bucket creation errors better)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('vehicleId', vehicleId)

      const response = await fetch('/api/garage/upload-vehicle-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.code === 'BUCKET_NOT_FOUND') {
          alert('Storage bucket not configured. Please create a bucket named "vehicles" in your Supabase Storage dashboard.')
        } else {
          alert(result.error || 'Failed to upload image. Please try again.')
        }
        setIsUploading(false)
        return
      }

      if (result.success && result.imageUrl) {
        console.log('Setting image URL:', result.imageUrl)
        setImageUrl(result.imageUrl)
        // Force a small delay to ensure state updates
        setTimeout(() => {
          console.log('Image URL state updated')
          router.refresh()
        }, 100)
      } else {
        alert('Upload succeeded but failed to get image URL')
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      alert('An error occurred while uploading the image')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Image Priority:
  // 1. User Uploaded Image (imageUrl state)
  // 2. Stock Image from DB (vehicle.stock_image)
  // 3. DDPC Logo Fallback
  const displayImage = imageUrl || vehicle.stock_image || "/branding/fallback-logo.png"

  return (
    <Card
      className={`bg-card rounded-2xl overflow-hidden h-full relative border border-border ${isOwner ? 'cursor-pointer' : ''}`}
      onMouseEnter={isOwner ? () => setIsHovered(true) : undefined}
      onMouseLeave={isOwner ? () => setIsHovered(false) : undefined}
    >
      <ImageWithTimeoutFallback
        key={displayImage}
        src={displayImage}
        fallbackSrc="/branding/fallback-logo.png"
        alt={`${vehicle.name || 'Vehicle'} vehicle`}
        className="w-full h-full object-cover"
        unoptimized={true}
      />
      {isOwner && (
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? 'bg-background/60 opacity-100' : 'bg-background/0 opacity-0'
            }`}
          onClick={(e) => {
            e.stopPropagation()
            fileInputRef.current?.click()
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id={`vehicle-image-upload-${vehicleId}`}
            disabled={isUploading}
          />
          <Button
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            disabled={isUploading}
            className={`bg-card/80 hover:bg-card/95 text-foreground border border-border px-4 py-2 transition-all ${isHovered ? 'scale-100' : 'scale-0'
              }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </div>
      )}
    </Card>
  )
}

function StatusBadge({
  vehicleId,
  currentStatus,
  onUpdate,
  isOwner
}: {
  vehicleId: string
  currentStatus: string
  onUpdate: (newStatus: string) => void
  isOwner: boolean
}) {
  const router = useRouter()
  const statusOptions = ['active', 'inactive', 'archived']
  const statusLabels: Record<string, string> = {
    active: 'Daily Driver',
    inactive: 'Inactive',
    archived: 'Archived',
  }

  if (!isOwner) {
    return (
      <Badge variant="outline" className="text-muted-foreground border-border bg-muted cursor-default">
        {statusLabels[currentStatus] || currentStatus}
      </Badge>
    )
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch('/api/garage/update-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          vehicleId,
          status: newStatus,
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        console.error('Failed to update status:', {
          status: response.status,
          statusText: response.statusText,
          error: result
        })
        const errorMessage = result.error || result.details || 'Unknown error'
        alert(`Failed to update status: ${errorMessage}${result.hint ? '\n\n' + result.hint : ''}`)
        return
      }

      // Verify the response indicates success
      if (!result.success && !result.vehicle) {
        console.error('Update response missing success indicator:', result)
        alert('Update may have failed. Please check the console for details.')
        return
      }

      console.log('Status updated successfully:', {
        vehicleId: result.vehicle?.id,
        newStatus: result.vehicle?.current_status,
        response: result
      })

      onUpdate(newStatus)
      // Soft refresh to update server state without page flash
      router.refresh()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const availableOptions = statusOptions.filter(opt => opt !== currentStatus)

  return (
    <DropdownMenu
      options={availableOptions.map(option => ({
        label: statusLabels[option] || option,
        onClick: () => handleStatusChange(option),
      }))}
    >
      <Badge variant="outline" className="text-muted-foreground border-border bg-muted hover:bg-muted/80 cursor-pointer">
        {statusLabels[currentStatus] || currentStatus}
      </Badge>
    </DropdownMenu>
  )
}

function PrivacyBadge({
  vehicleId,
  privacy,
  onUpdate,
  isOwner
}: {
  vehicleId: string
  privacy: 'PUBLIC' | 'PRIVATE'
  onUpdate: (newPrivacy: 'PUBLIC' | 'PRIVATE') => void
  isOwner: boolean
}) {
  const router = useRouter()

  if (!isOwner) {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground border-border bg-muted cursor-default flex items-center gap-1"
      >
        {privacy === 'PUBLIC' ? (
          <>
            <Unlock className="w-3 h-3" />
            Public
          </>
        ) : (
          <>
            <Lock className="w-3 h-3" />
            Private
          </>
        )}
      </Badge>
    )
  }

  const handlePrivacyChange = async (newPrivacy: 'PUBLIC' | 'PRIVATE') => {
    try {
      const response = await fetch('/api/garage/update-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          vehicleId,
          privacy: newPrivacy,
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        console.error('Failed to update privacy:', {
          status: response.status,
          statusText: response.statusText,
          error: result
        })
        const errorMessage = result.error || result.details || 'Unknown error'
        alert(`Failed to update privacy: ${errorMessage}${result.hint ? '\n\n' + result.hint : ''}`)
        return
      }

      // Verify the response indicates success
      if (!result.success && !result.vehicle) {
        console.error('Update response missing success indicator:', result)
        alert('Update may have failed. Please check the console for details.')
        return
      }

      console.log('Privacy updated successfully:', {
        vehicleId: result.vehicle?.id,
        newPrivacy: result.vehicle?.privacy,
        response: result
      })

      onUpdate(newPrivacy)
      // Soft refresh to update server state without page flash
      router.refresh()
    } catch (err) {
      console.error('Failed to update privacy:', err)
    }
  }

  const otherOption = privacy === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'

  return (
    <DropdownMenu
      options={[{
        label: otherOption === 'PUBLIC' ? 'Public' : 'Private',
        onClick: () => handlePrivacyChange(otherOption),
      }]}
    >
      <Badge
        variant="outline"
        className={`text-muted-foreground border-border bg-muted hover:bg-muted/80 cursor-pointer flex items-center gap-1`}
      >
        {privacy === 'PUBLIC' ? (
          <>
            <Unlock className="w-3 h-3" />
            Public
          </>
        ) : (
          <>
            <Lock className="w-3 h-3" />
            Private
          </>
        )}
      </Badge>
    </DropdownMenu>
  )
}


function VehicleHeader({
  vehicle,
  vehicleId,
  onNicknameUpdate,
  onStatusUpdate,
  onPrivacyUpdate,
  isOwner
}: {
  vehicle: Vehicle
  vehicleId: string
  onNicknameUpdate: (newNickname: string | null) => void
  onStatusUpdate: (newStatus: string) => void
  onPrivacyUpdate: (newPrivacy: 'PUBLIC' | 'PRIVATE') => void
  isOwner: boolean
}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [nickname, setNickname] = useState(vehicle.name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/garage/update-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          vehicleId,
          nickname: nickname.trim() || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update nickname')
      }

      // Update successful - close dialog and redirect to new URL
      setIsEditDialogOpen(false)
      const newNickname = nickname.trim() || null
      onNicknameUpdate(newNickname)

      // Redirect to the new nickname URL (or vehicle ID if nickname was removed)
      const newSlug = newNickname || vehicleId
      router.refresh() // Force refresh to update server data
      router.push(`/vehicle/${encodeURIComponent(newSlug)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/garage" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold truncate max-w-48 md:max-w-md">{vehicle.name || 'Unnamed Vehicle'}</h1>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <WishlistButton
            vehicleId={vehicleId}
            isOwner={isOwner}
          />
          <PrivacyBadge
            vehicleId={vehicleId}
            privacy={vehicle.privacy || 'PRIVATE'}
            onUpdate={onPrivacyUpdate}
            isOwner={isOwner}
          />
          <StatusBadge
            vehicleId={vehicleId}
            currentStatus={vehicle.current_status || 'inactive'}
            onUpdate={onStatusUpdate}
            isOwner={isOwner}
          />
        </div>
      </div>

      {isOwner && (
        <Modal open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <ModalContent className="sm:max-w-md bg-card border-border">
            <ModalHeader>
              <ModalTitle className="text-foreground">Edit Vehicle Nickname</ModalTitle>
              <ModalDescription className="text-muted-foreground">
                Change the nickname for this vehicle. Leave empty to remove the nickname.
              </ModalDescription>
            </ModalHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nickname" className="text-foreground">Nickname</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter vehicle nickname"
                  className="bg-background border-border text-foreground mt-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSaving) {
                      handleSave()
                    }
                  }}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <ModalFooter>
              <Button
                variant="ghost"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSaving}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  )
}

// Removed BuildSpecsCard, EngineSpecsCard, DimensionsCard, DrivetrainCard

function NavigationCard({
  icon: Icon,
  title,
  onClick,
  stats,
  disabled = false
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  onClick: () => void
  stats: Array<{ label: string; value: string }>
  disabled?: boolean
}) {
  const handleClick = () => {
    if (disabled) return
    onClick()
  }

  return (
    <Card
      className={`bg-card rounded-2xl p-6 text-foreground transition-all duration-300 h-full border border-border group ${disabled
        ? 'cursor-not-allowed opacity-60'
        : 'cursor-pointer hover:scale-105 hover:border-accent hover:shadow-[0_0_30px_hsl(var(--accent)/0.6)]'
        }`}
      onClick={handleClick}
    >
      <CardContent className="p-0 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5 text-accent" />
          <p className="text-base font-semibold text-muted-foreground">{title}</p>
        </div>
        <div className="space-y-1 text-sm flex-1">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-muted-foreground">{stat.label}:</span>
              <span className="text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Extended vehicle type to include onboarding fields
type VehicleWithOnboarding = Vehicle & {
  is_onboarding_completed?: boolean
  acquisition_date?: string
  ownership_end_date?: string
  acquisition_type?: string
  acquisition_cost?: number
}

type VehicleDetailPageClientProps = {
  vehicle: Vehicle
  vehicleNickname?: string | null
  isOwner: boolean
  stats?: {
    totalRecords?: number
    serviceCount?: number
    avgMpg?: number | null
    lastServiceDate?: string | null
    lastFuelDate?: string | null
    nextServiceDate?: string | null
    totalCompletedMods?: number
    totalCompletedModCost?: number
  }
}

export function VehicleDetailPageClient({ vehicle: initialVehicle, vehicleNickname, stats, isOwner }: VehicleDetailPageClientProps) {
  const vehicle = initialVehicle as VehicleWithOnboarding
  const router = useRouter()
  const [currentNickname, setCurrentNickname] = useState(vehicleNickname || vehicle.name || null)
  const [currentStatus, setCurrentStatus] = useState(vehicle.current_status || 'inactive')
  const [currentPrivacy, setCurrentPrivacy] = useState<'PUBLIC' | 'PRIVATE'>(vehicle.privacy || 'PRIVATE')
  const [showOnboarding, setShowOnboarding] = useState(!vehicle.is_onboarding_completed)

  // Use nickname for URLs if available, otherwise fall back to ID
  const urlSlug = currentNickname || vehicle.id

  const handleNavigation = (path: string) => {
    if (!isOwner) return
    router.push(path)
  }

  // Safe date formatting helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      // Handle YYYY-MM-DD explicitly to avoid timezone shifts
      const [year, month, day] = dateStr.split('-').map(Number)
      if (year && month) {
        // Month is 0-indexed in Date constructor
        const date = new Date(year, month - 1, day || 1)
        return format(date, 'MMM d, yyyy')
      }
      return format(new Date(dateStr), 'MMM d, yyyy')
    } catch (e) {
      return ''
    }
  }

  // Helper for currency formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen text-foreground pb-20 pt-16">
      {isOwner && !vehicle.is_onboarding_completed && (
        <OnboardingModal
          vehicleId={vehicle.id}
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      )}
      {/* Sticky Header */}
      <div className="sticky top-16 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <VehicleHeader
          vehicle={{ ...vehicle, name: currentNickname || vehicle.name, current_status: currentStatus, privacy: currentPrivacy }}
          vehicleId={vehicle.id}
          onNicknameUpdate={(newNickname) => {
            setCurrentNickname(newNickname || null)
          }}
          onStatusUpdate={(newStatus) => {
            setCurrentStatus(newStatus)
          }}
          onPrivacyUpdate={(newPrivacy) => {
            setCurrentPrivacy(newPrivacy)
          }}
          isOwner={isOwner}
        />
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted/20 shadow-lg">
            <VehicleImageCard vehicle={vehicle} vehicleId={vehicle.id} isOwner={isOwner} />
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || vehicle.trim_description || 'Base'}
              </h2>
              <p className="text-muted-foreground text-lg">
                {[vehicle.body_type, vehicle.drive_type, vehicle.transmission].filter(Boolean).join(' • ')}
              </p>

              {vehicle.acquisition_date && (
                <p className="text-sm font-medium text-muted-foreground mt-2">
                  Owned: <span className="text-foreground">{formatDate(vehicle.acquisition_date)}</span> – <span className="text-foreground">{vehicle.ownership_end_date ? formatDate(vehicle.ownership_end_date) : 'Present'}</span>
                </p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="text-sm text-muted-foreground">MSRP</div>
                <div className="text-xl font-bold">{vehicle.base_msrp ? `$${parseInt(vehicle.base_msrp).toLocaleString()}` : '—'}</div>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="text-sm text-muted-foreground">MPG (Combined)</div>
                <div className="text-xl font-bold">{formatSpec(vehicle.epa_combined_mpg)}</div>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="text-sm text-muted-foreground">Horsepower</div>
                <div className="text-xl font-bold">{formatSpec(vehicle.horsepower_hp, ' hp')}</div>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="text-sm text-muted-foreground">0-60 mph</div>
                <div className="text-xl font-bold">—</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NavigationCard
            icon={Activity}
            title="History"
            onClick={() => handleNavigation(`/vehicle/${encodeURIComponent(urlSlug)}/history`)}
            stats={[
              { label: 'Last Service', value: stats?.lastServiceDate ? formatDate(stats.lastServiceDate) : '---' },
              { label: 'Total Records', value: stats?.totalRecords?.toLocaleString() || '0' }
            ]}
            disabled={!isOwner}
          />
          <NavigationCard
            icon={Wrench}
            title="Service"
            onClick={() => handleNavigation(`/vehicle/${encodeURIComponent(urlSlug)}/service`)}
            stats={[
              { label: 'Next Service', value: stats?.nextServiceDate ? formatDate(stats.nextServiceDate) : '---' },
              { label: 'Service Count', value: stats?.serviceCount?.toLocaleString() || '0' }
            ]}
            disabled={!isOwner}
          />
          <NavigationCard
            icon={Fuel}
            title="Fuel"
            onClick={() => handleNavigation(`/vehicle/${encodeURIComponent(urlSlug)}/fuel`)}
            stats={[
              { label: 'Last Fill-up', value: stats?.lastFuelDate ? formatDate(stats.lastFuelDate) : '---' },
              { label: 'Avg MPG', value: stats?.avgMpg ? stats.avgMpg.toFixed(1) : '---' }
            ]}
            disabled={!isOwner}
          />
          <NavigationCard
            icon={Settings}
            title="Mods"
            onClick={() => handleNavigation(`/vehicle/${encodeURIComponent(urlSlug)}/mods`)}
            stats={[
              { label: 'Total Mods', value: stats?.totalCompletedMods?.toLocaleString() || '---' },
              { label: 'Total Cost', value: stats?.totalCompletedModCost !== undefined ? formatCurrency(stats.totalCompletedModCost) : '---' }
            ]}
            disabled={!isOwner}
          />

        </div>

        {/* Detailed Specs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Engine & Performance */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-border pb-2">Engine & Performance</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Engine Type</dt><dd className="font-medium text-right">{formatSpec(vehicle.engine_type)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Configuration</dt><dd className="font-medium text-right">{[vehicle.engine_size_l && `${vehicle.engine_size_l}L`, vehicle.cylinders && `${vehicle.cylinders}-cyl`].filter(Boolean).join(' ') || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Horsepower</dt><dd className="font-medium text-right">{formatSpec(vehicle.horsepower_hp, ' hp')} @ {formatSpec(vehicle.horsepower_rpm, ' rpm')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Torque</dt><dd className="font-medium text-right">{formatSpec(vehicle.torque_ft_lbs, ' lb-ft')} @ {formatSpec(vehicle.torque_rpm, ' rpm')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Drive Type</dt><dd className="font-medium text-right">{formatSpec(vehicle.drive_type)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Transmission</dt><dd className="font-medium text-right">{formatSpec(vehicle.transmission)}</dd></div>
            </dl>
          </div>

          {/* Dimensions & Weight */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-border pb-2">Dimensions & Weight</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Length</dt><dd className="font-medium text-right">{formatSpec(vehicle.length_in, '"')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Width</dt><dd className="font-medium text-right">{formatSpec(vehicle.width_in, '"')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Height</dt><dd className="font-medium text-right">{formatSpec(vehicle.height_in, '"')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Wheelbase</dt><dd className="font-medium text-right">{formatSpec(vehicle.wheelbase_in, '"')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Ground Clearance</dt><dd className="font-medium text-right">{formatSpec(vehicle.ground_clearance_in, '"')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Curb Weight</dt><dd className="font-medium text-right">{formatSpec(vehicle.curb_weight_lbs, ' lbs')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">GVWR</dt><dd className="font-medium text-right">{formatSpec(vehicle.gross_weight_lbs, ' lbs')}</dd></div>
            </dl>
          </div>

          {/* Fuel & Efficiency */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-border pb-2">Fuel & Efficiency</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Fuel Type</dt><dd className="font-medium text-right">{formatSpec(vehicle.fuel_type)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Tank Capacity</dt><dd className="font-medium text-right">{formatSpec(vehicle.fuel_tank_capacity_gal, ' gal')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">City MPG</dt><dd className="font-medium text-right">{vehicle.epa_city_highway_mpg ? vehicle.epa_city_highway_mpg.split('/')[0] : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Highway MPG</dt><dd className="font-medium text-right">{vehicle.epa_city_highway_mpg ? vehicle.epa_city_highway_mpg.split('/')[1] : '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Combined MPG</dt><dd className="font-medium text-right">{formatSpec(vehicle.epa_combined_mpg)}</dd></div>
            </dl>
          </div>

          {/* Interior & Cargo */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-border pb-2">Interior & Cargo</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Seating Capacity</dt><dd className="font-medium text-right">{formatSpec(vehicle.total_seating)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Doors</dt><dd className="font-medium text-right">{formatSpec(vehicle.doors)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Cargo Capacity</dt><dd className="font-medium text-right">{formatSpec(vehicle.cargo_capacity_cuft, ' cu ft')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Max Cargo</dt><dd className="font-medium text-right">{formatSpec(vehicle.max_cargo_capacity_cuft, ' cu ft')}</dd></div>
            </dl>
          </div>

          {/* Chassis & Suspension */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-border pb-2">Chassis & Suspension</h3>
            <dl className="space-y-2 text-sm">

              {/* Note: front_brakes and rear_brakes might not be in Vehicle type, checking... */}
              {/* They were in the details page but maybe not mapped in Vehicle type. I'll check the type definition if I can, or just use them and see if TS complains. */}
              {/* Based on page.tsx mapping, they are NOT mapped. I will omit them for now or use '—' */}

              <div className="flex justify-between"><dt className="text-muted-foreground">Turning Circle</dt><dd className="font-medium text-right">{formatSpec(vehicle.turning_circle_ft, ' ft')}</dd></div>
            </dl>
          </div>

          {/* Towing & Hauling */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-border pb-2">Towing & Hauling</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Max Towing</dt><dd className="font-medium text-right">{formatSpec(vehicle.max_towing_capacity_lbs, ' lbs')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Max Payload</dt><dd className="font-medium text-right">{formatSpec(vehicle.max_payload_lbs, ' lbs')}</dd></div>
            </dl>
          </div>

        </div>
      </div>
    </div>
  )
}
