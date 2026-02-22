'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@repo/ui/button'
import { Camera, Upload, X, RotateCcw } from 'lucide-react'

type ImageUploaderProps = {
  onImageSelected: (file: File) => void
  isProcessing: boolean
  previewUrl: string | null
  onClear: () => void
}

export function ImageUploader({
  onImageSelected,
  isProcessing,
  previewUrl,
  onClear,
}: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const validateAndEmit = useCallback(
    (file: File) => {
      setError(null)

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPEG, PNG, HEIC, or WebP).')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image is too large. Maximum size is 10MB.')
        return
      }

      onImageSelected(file)
    },
    [onImageSelected]
  )

  // ── Camera ──

  // Callback ref: attaches the stream when the <video> element mounts.
  // This fixes the race condition where openCamera() would try to set
  // srcObject before React had rendered the video element.
  const videoCallbackRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node
      if (node && streamRef.current) {
        node.srcObject = streamRef.current
        node.play().catch(() => {
          // Autoplay blocked — user interaction required on some browsers
        })
      }
    },
    // Re-run when showCamera flips so ref fires on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showCamera]
  )

  async function openCamera() {
    setError(null)
    setCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      // Render the <video> element — the callback ref will attach the stream
      setShowCamera(true)
    } catch {
      setError('Camera access denied or unavailable. Try uploading a file instead.')
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1920
    canvas.height = video.videoHeight || 1080
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' })
          stopCamera()
          validateAndEmit(file)
        }
      },
      'image/jpeg',
      0.9
    )
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraReady(false)
    setShowCamera(false)
  }

  // ── File Input ──

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) validateAndEmit(file)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  // ── Camera View ──

  if (showCamera) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden bg-muted aspect-[4/3]">
          <video
            ref={videoCallbackRef}
            autoPlay
            playsInline
            muted
            onPlaying={() => setCameraReady(true)}
            className="w-full h-full object-cover"
          />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <RotateCcw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={capturePhoto} disabled={!cameraReady} className="flex-1">
            Capture
          </Button>
          <Button type="button" variant="outline" onClick={stopCamera} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // ── Preview ──

  if (previewUrl) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Receipt preview"
            className="w-full max-h-56 object-contain"
          />
          {!isProcessing && (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2 right-2 rounded-full bg-background/80 p-1.5 hover:bg-background transition"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 justify-center py-2">
            <RotateCcw className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Analyzing receipt...</p>
          </div>
        )}
      </div>
    )
  }

  // ── Upload Buttons ──

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp"
        capture="environment"
        hidden
        onChange={handleFileChange}
      />

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const file = e.dataTransfer.files[0]
          if (file) validateAndEmit(file)
        }}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drop a receipt image here, or tap to browse
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">JPEG, PNG, HEIC, WebP up to 10MB</p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={openCamera}
          className="flex-1 gap-2"
          disabled={isProcessing}
        >
          <Camera className="h-4 w-4" />
          Camera
        </Button>
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 gap-2"
          disabled={isProcessing}
        >
          <Upload className="h-4 w-4" />
          Choose File
        </Button>
      </div>
    </div>
  )
}
