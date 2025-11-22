'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@repo/ui/dialog'
import { Activity, Wrench, Fuel, Settings, Edit, Upload, Lock, Unlock, Car, Gauge, Ruler, CarFront, Scale, Cog } from 'lucide-react'
import { Vehicle } from '@repo/types'
import { supabase } from '@/lib/supabase'
import { Badge } from '@repo/ui/badge'
import { DropdownMenu } from '@repo/ui/dropdown-menu'

type ImageWithTimeoutFallbackProps = {
  src: string
  fallbackSrc: string
  alt: string
  className?: string
  timeout?: number
}

function ImageWithTimeoutFallback({
  src,
  fallbackSrc,
  alt,
  className,
  timeout = 5000
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
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
      />
    )
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onLoad={() => {
        console.log('Image loaded successfully:', currentSrc)
        setImageLoaded(true)
      }}
      onError={(e) => {
        console.error('Image load error for:', currentSrc, e)
        setShowFallback(true)
      }}
    />
  )
}

function VehicleImageCard({ vehicle, vehicleId, isOwner }: { vehicle: Vehicle; vehicleId: string; isOwner: boolean }) {
  const [isUploading, setIsUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(vehicle.vehicle_image || vehicle.image_url || null)
  const [isHovered, setIsHovered] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('You must be logged in to upload images')
        setIsUploading(false)
        return
      }

      // Use API route for upload (handles bucket creation errors better)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('vehicleId', vehicleId)

      const response = await fetch('/api/garage/upload-vehicle-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
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

  return (
    <Card
      className={`bg-card rounded-2xl overflow-hidden h-full relative border border-border ${isOwner ? 'cursor-pointer' : ''}`}
      onMouseEnter={isOwner ? () => setIsHovered(true) : undefined}
      onMouseLeave={isOwner ? () => setIsHovered(false) : undefined}
    >
      <ImageWithTimeoutFallback
        src={imageUrl || "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center"}
        fallbackSrc="/branding/fallback-logo.png"
        alt={`${vehicle.name || 'Vehicle'} vehicle`}
        className="w-full h-full object-cover"
      />
      {isOwner && (
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? 'bg-black/60 opacity-100' : 'bg-black/0 opacity-0'
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
            className={`bg-black/80 hover:bg-black/95 text-white border border-white/40 px-4 py-2 transition-all ${isHovered ? 'scale-100' : 'scale-0'
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
  const statusOptions = ['daily_driver', 'parked', 'listed', 'sold', 'retired']
  const statusLabels: Record<string, string> = {
    daily_driver: 'Daily Driver',
    parked: 'Parked',
    listed: 'Listed',
    sold: 'Sold',
    retired: 'Retired'
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/garage/update-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vehicleId,
          status: newStatus,
        }),
      })

      if (response.ok) {
        onUpdate(newStatus)
      }
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/garage/update-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vehicleId,
          privacy: newPrivacy,
        }),
      })

      if (response.ok) {
        onUpdate(newPrivacy)
      }
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
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError('You must be logged in to update the nickname')
        setIsSaving(false)
        return
      }

      const response = await fetch('/api/garage/update-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
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
      router.push(`/vehicle/${encodeURIComponent(newSlug)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-foreground">{vehicle.name || 'Unnamed Vehicle'}</h1>
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <PrivacyBadge
            vehicleId={vehicleId}
            privacy={vehicle.privacy || 'PRIVATE'}
            onUpdate={onPrivacyUpdate}
            isOwner={isOwner}
          />
          <StatusBadge
            vehicleId={vehicleId}
            currentStatus={vehicle.current_status || 'parked'}
            onUpdate={onStatusUpdate}
            isOwner={isOwner}
          />
        </div>
      </div>

      {isOwner && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Vehicle Nickname</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Change the nickname for this vehicle. Leave empty to remove the nickname.
              </DialogDescription>
            </DialogHeader>
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
            <DialogFooter>
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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function BuildSpecsCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="bg-card rounded-2xl p-6 h-full border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Wrench className="h-5 w-5 text-accent" />
        Build Specs
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Trim</span>
          <span className="text-foreground font-medium">{vehicle.trim || '-'}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Color</span>
          <span className="text-foreground font-medium">{vehicle.colors_exterior || '-'}</span>
        </div>
      </div>
    </Card>
  )
}

function EngineSpecsCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="bg-card rounded-2xl p-6 h-full border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Gauge className="h-5 w-5 text-accent" />
        Engine & Power
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Engine Type</span>
          <span className="text-foreground font-medium">{vehicle.engine_type || '-'}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Displacement</span>
          <span className="text-foreground font-medium">{vehicle.engine_size_l || '-'}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Horsepower</span>
          <span className="text-foreground font-medium">{vehicle.horsepower_hp ? `${vehicle.horsepower_hp} hp` : '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Torque</span>
          <span className="text-foreground font-medium">{vehicle.torque_ft_lbs ? `${vehicle.torque_ft_lbs} lb-ft` : '-'}</span>
        </div>
      </div>
    </Card>
  )
}

function DimensionsCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="bg-card rounded-2xl p-6 h-full border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Scale className="h-5 w-5 text-accent" />
        Dimensions & Weight
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Curb Weight</span>
          <span className="text-foreground font-medium">{vehicle.curb_weight_lbs ? `${vehicle.curb_weight_lbs} lbs` : '-'}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Length</span>
          <span className="text-foreground font-medium">{vehicle.length_in ? `${vehicle.length_in}"` : '-'}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Width</span>
          <span className="text-foreground font-medium">{vehicle.width_in ? `${vehicle.width_in}"` : '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Height</span>
          <span className="text-foreground font-medium">{vehicle.height_in ? `${vehicle.height_in}"` : '-'}</span>
        </div>
      </div>
    </Card>
  )
}

function DrivetrainCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="bg-card rounded-2xl p-6 h-full border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Cog className="h-5 w-5 text-accent" />
        Drivetrain & Chassis
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Transmission</span>
          <span className="text-foreground font-medium">{vehicle.transmission || '-'}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Drivetrain</span>
          <span className="text-foreground font-medium">{vehicle.drive_type || '-'}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span className="text-muted-foreground">Brake System</span>
          <span className="text-foreground font-medium">{'Unknown'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Wheel Size</span>
          <span className="text-foreground font-medium">{vehicle.tires_and_wheels || '-'}</span>
        </div>
      </div>
    </Card>
  )
}

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
      className={`bg-card rounded-2xl p-6 text-foreground transition-all duration-300 h-full border border-border group ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      onClick={handleClick}
      onMouseEnter={disabled ? undefined : (e) => {
        e.currentTarget.style.transform = 'scale(1.02)'
        e.currentTarget.style.borderColor = 'hsl(var(--accent))'
        e.currentTarget.style.boxShadow = '0 0 30px hsl(var(--accent) / 0.3)'
      }}
      onMouseLeave={disabled ? undefined : (e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.borderColor = 'hsl(var(--border))'
        e.currentTarget.style.boxShadow = 'none'
      }}
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

type VehicleDetailPageClientProps = {
  vehicle: Vehicle
  vehicleNickname?: string | null
  isOwner: boolean
  stats?: {
    totalRecords?: number
    serviceCount?: number
    avgMpg?: number | null
  }
}

export function VehicleDetailPageClient({ vehicle, vehicleNickname, stats, isOwner }: VehicleDetailPageClientProps) {
  const router = useRouter()
  const [currentNickname, setCurrentNickname] = useState(vehicleNickname || vehicle.name || null)
  const [currentStatus, setCurrentStatus] = useState(vehicle.current_status || 'parked')
  const [currentPrivacy, setCurrentPrivacy] = useState<'PUBLIC' | 'PRIVATE'>(vehicle.privacy || 'PRIVATE')

  // Use nickname for URLs if available, otherwise fall back to ID
  const urlSlug = currentNickname || vehicle.id

  const handleNavigation = (path: string) => {
    if (!isOwner) return
    router.push(path)
  }

  return (
    <>
      <section className="relative py-12 bg-background min-h-screen">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
        >
          <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
          <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
        </div>

        <div className="relative container px-4 md:px-6 pt-24">
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

          {/* Grid container - Fixed 4x3 grid for desktop */}
          <div className="grid w-full max-w-7xl mx-auto gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-3 min-h-[600px]">
            {/* Row 1, Col 1 */}
            <div className="lg:col-start-1 lg:row-start-1">
              <BuildSpecsCard vehicle={vehicle} />
            </div>

            {/* Row 1-2, Col 2-3 (Center Image) */}
            <div className="lg:col-start-2 lg:col-span-2 lg:row-start-1 lg:row-span-2 h-full">
              <VehicleImageCard vehicle={vehicle} vehicleId={vehicle.id} isOwner={isOwner} />
            </div>

            {/* Row 1, Col 4 */}
            <div className="lg:col-start-4 lg:row-start-1">
              <EngineSpecsCard vehicle={vehicle} />
            </div>

            {/* Row 2, Col 1 */}
            <div className="lg:col-start-1 lg:row-start-2">
              <DimensionsCard vehicle={vehicle} />
            </div>

            {/* Row 2, Col 4 */}
            <div className="lg:col-start-4 lg:row-start-2">
              <DrivetrainCard vehicle={vehicle} />
            </div>

            {/* Row 3 */}
            <div className="lg:col-start-1 lg:row-start-3">
              <NavigationCard
                icon={Activity}
                title="History"
                onClick={() => handleNavigation(`/vehicle/${encodeURIComponent(urlSlug)}/history`)}
                stats={[
                  { label: 'Last Service', value: '---' },
                  { label: 'Total Records', value: stats?.totalRecords?.toLocaleString() || '0' }
                ]}
                disabled={!isOwner}
              />
            </div>

            <div className="lg:col-start-2 lg:row-start-3">
              <NavigationCard
                icon={Wrench}
                title="Service"
                onClick={() => handleNavigation(`/vehicle/${encodeURIComponent(urlSlug)}/service`)}
                stats={[
                  { label: 'Next Service', value: '---' },
                  { label: 'Service Count', value: stats?.serviceCount?.toLocaleString() || '0' }
                ]}
                disabled={!isOwner}
              />
            </div>

            <div className="lg:col-start-3 lg:row-start-3">
              <NavigationCard
                icon={Fuel}
                title="Fuel"
                onClick={() => handleNavigation(`/vehicle/${encodeURIComponent(urlSlug)}/fuel`)}
                stats={[
                  { label: 'Avg MPG', value: stats?.avgMpg ? stats.avgMpg.toFixed(1) : '---' },
                  { label: 'Last Fill-up', value: '---' }
                ]}
                disabled={!isOwner}
              />
            </div>

            <div className="lg:col-start-4 lg:row-start-3">
              <NavigationCard
                icon={Settings}
                title="Mods"
                onClick={() => handleNavigation(`/vehicle/${encodeURIComponent(urlSlug)}/mods`)}
                stats={[
                  { label: 'Total Mods', value: '0' },
                  { label: 'Total Cost', value: '$0' }
                ]}
                disabled={!isOwner}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
