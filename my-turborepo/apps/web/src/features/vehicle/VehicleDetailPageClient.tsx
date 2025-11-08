'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@repo/ui/card'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/dialog'
import { Plus, Activity, Wrench, Fuel, Settings, Edit } from 'lucide-react'
import { LogServiceModal } from '../../components/LogServiceModal'
import { Vehicle } from '@repo/types'

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
  timeout = 3000
}: ImageWithTimeoutFallbackProps) {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [showFallback, setShowFallback] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!imageLoaded) {
        setShowFallback(true)
      }
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout, imageLoaded])

  if (showFallback) {
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
      src={src}
      alt={alt}
      className={className}
      onLoad={() => setImageLoaded(true)}
      onError={() => setShowFallback(true)}
    />
  )
}

function VehicleHeader({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="mb-8 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <h1 className="text-4xl font-bold text-white">{vehicle.name || 'Unnamed Vehicle'}</h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={() => {/* TODO: Implement edit modal */}}
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>
      <Button className="bg-red-600 hover:bg-red-700 text-white">
        <Plus className="w-4 h-4 mr-2" />
        Log Event
      </Button>
    </div>
  )
}

function BuildSpecsCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}>
      <CardContent className="p-0">
        <p className="text-sm font-semibold text-gray-400 mb-2">Build Specs</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Year:</span>
            <span className="text-white">{vehicle.year || 'UNK'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Make:</span>
            <span className="text-white">{vehicle.make || 'UNK'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Model:</span>
            <span className="text-white">{vehicle.model || 'UNK'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Trim:</span>
            <span className="text-white">{vehicle.trim || 'UNK'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EngineSpecsCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}>
      <CardContent className="p-0">
        <p className="text-sm font-semibold text-gray-400 mb-2">Engine Specs</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Power:</span>
            <span className="text-white">{vehicle.horsepower_hp ? `${vehicle.horsepower_hp} hp` : 'UNK'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Torque:</span>
            <span className="text-white">{vehicle.torque_ft_lbs ? `${vehicle.torque_ft_lbs} ft-lbs` : 'UNK'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Size:</span>
            <span className="text-white">{vehicle.engine_size_l ? `${vehicle.engine_size_l}L` : 'UNK'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Cylinders:</span>
            <span className="text-white">{vehicle.cylinders || 'UNK'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DimensionsCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}>
      <CardContent className="p-0">
        <p className="text-sm font-semibold text-gray-400 mb-2">Dimensions</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Length:</span>
            <span className="text-white">{vehicle.length_in ? `${(parseFloat(vehicle.length_in.toString()) * 25.4).toFixed(0)} mm` : 'UNK'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Width:</span>
            <span className="text-white">{vehicle.width_in ? `${(parseFloat(vehicle.width_in.toString()) * 25.4).toFixed(0)} mm` : 'UNK'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Height:</span>
            <span className="text-white">{vehicle.height_in ? `${(parseFloat(vehicle.height_in.toString()) * 25.4).toFixed(0)} mm` : 'UNK'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DrivetrainCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}>
      <CardContent className="p-0">
        <p className="text-sm font-semibold text-gray-400 mb-2">Drivetrain</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Type:</span>
            <span className="text-white">{vehicle.drive_type || 'UNK'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Transmission:</span>
            <span className="text-white text-right flex-1">{vehicle.transmission || 'UNK'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NavigationCard({
  icon: Icon,
  title,
  onClick,
  stats
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  onClick: () => void
  stats: Array<{ label: string; value: string }>
}) {
  return (
    <Card
      className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 text-white cursor-pointer transition-all duration-300"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.3)',
        transition: 'all 0.3s ease-out',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)'
        e.currentTarget.style.border = '1px solid rgb(132, 204, 22)'
        e.currentTarget.style.boxShadow = '0 0 30px rgba(132, 204, 22, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-blue-400" />
          <p className="text-sm font-semibold text-gray-400">{title}</p>
        </div>
        <div className="space-y-1 text-sm">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between">
              <span className="text-gray-400">{stat.label}:</span>
              <span className="text-white">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

type VehicleDetailPageClientProps = {
  vehicle: Vehicle
}

export function VehicleDetailPageClient({ vehicle }: VehicleDetailPageClientProps) {
  const router = useRouter()
  const [logServiceModalOpen, setLogServiceModalOpen] = useState(false)

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <>
      <section className="relative py-12 bg-black min-h-screen">
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
        >
          <div className="blur-[106px] h-56 bg-gradient-to-br from-red-500 to-purple-400" />
          <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300" />
        </div>

        <div className="relative container px-4 md:px-6 pt-24">
          <VehicleHeader vehicle={vehicle} />

          <div className="grid w-full max-w-7xl mx-auto grid-cols-4 grid-rows-3 gap-4 h-[600px]">
            {/* Row 1 */}
            {/* Slot 1: Build Specs */}
            <BuildSpecsCard vehicle={vehicle} />

            {/* Slots 2-3, 6-7: Vehicle Image (spanning 2 columns and 2 rows) */}
            <Card className="col-span-2 row-span-2 bg-black/50 backdrop-blur-lg rounded-2xl overflow-hidden"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}>
              <ImageWithTimeoutFallback
                src={vehicle.image_url || "https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop&crop=center"}
                fallbackSrc="/branding/fallback-logo.png"
                alt={`${vehicle.name || 'Vehicle'} vehicle`}
                className="w-full h-full object-cover"
              />
            </Card>

            {/* Slot 4: Engine Specs */}
            <EngineSpecsCard vehicle={vehicle} />

            {/* Row 2 */}
            {/* Slot 5: Dimensions */}
            <DimensionsCard vehicle={vehicle} />

            {/* Slot 8: Drivetrain */}
            <DrivetrainCard vehicle={vehicle} />

            {/* Row 3 */}
            {/* Slot 9: History */}
            <NavigationCard
              icon={Activity}
              title="History"
              onClick={() => handleNavigation(`/vehicle/${vehicle.id}/history`)}
              stats={[
                { label: 'Last Service', value: '---' },
                { label: 'Total Records', value: '---' }
              ]}
            />

            {/* Slot 10: Service */}
            <NavigationCard
              icon={Wrench}
              title="Service"
              onClick={() => handleNavigation(`/vehicle/${vehicle.id}/service`)}
              stats={[
                { label: 'Next Service', value: '---' },
                { label: 'Service Count', value: '---' }
              ]}
            />

            {/* Slot 11: Fuel */}
            <NavigationCard
              icon={Fuel}
              title="Fuel"
              onClick={() => handleNavigation(`/vehicle/${vehicle.id}/fuel`)}
              stats={[
                { label: 'Avg MPG', value: '---' },
                { label: 'Total Cost', value: '---' }
              ]}
            />

            {/* Slot 12: Mods */}
            <NavigationCard
              icon={Settings}
              title="Mods"
              onClick={() => handleNavigation(`/vehicle/${vehicle.id}/mods`)}
              stats={[
                { label: 'Total Mods', value: '---' },
                { label: 'Total Cost', value: '---' }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Log Service Modal */}
      <LogServiceModal
        open={logServiceModalOpen}
        onOpenChange={setLogServiceModalOpen}
      />
    </>
  )
}
