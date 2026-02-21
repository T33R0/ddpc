'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@repo/ui/modal'
import { ScanLine, CheckCircle2 } from 'lucide-react'
import { ImageUploader } from './ImageUploader'
import { ReviewForm } from './ReviewForm'
import { uploadAndScanReceipt, saveScannerReview } from '../actions'
import type { OcrExtraction, ScannerSubmitPayload } from '../schema'

type ScannerDialogProps = {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
}

type ScannerStep = 'upload' | 'review' | 'success'

export function ScannerDialog({ isOpen, onClose, vehicleId }: ScannerDialogProps) {
  const router = useRouter()

  const [step, setStep] = useState<ScannerStep>('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Scan results
  const [scannerId, setScannerId] = useState<string | null>(null)
  const [extraction, setExtraction] = useState<OcrExtraction | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // ── Reset State ──

  function resetState() {
    setStep('upload')
    setIsProcessing(false)
    setIsSubmitting(false)
    setError(null)
    setScannerId(null)
    setExtraction(null)
    setReceiptUrl(null)
    setPreviewUrl(null)
  }

  function handleClose() {
    resetState()
    onClose()
  }

  // ── Step 1: Upload + OCR ──

  const handleImageSelected = useCallback(
    async (file: File) => {
      setError(null)
      setIsProcessing(true)

      // Create local preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      try {
        const formData = new FormData()
        formData.append('receipt', file)

        const result = await uploadAndScanReceipt(formData)

        if (result.error) {
          setError(result.error)
          setPreviewUrl(null)
          URL.revokeObjectURL(objectUrl)
          return
        }

        setScannerId(result.scannerId!)
        setExtraction(result.extraction!)
        setReceiptUrl(result.receiptUrl || objectUrl)
        setStep('review')
      } catch {
        setError('Failed to process receipt. Please try again.')
        setPreviewUrl(null)
        URL.revokeObjectURL(objectUrl)
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  // ── Step 2: Save ──

  async function handleSaveReview(payload: ScannerSubmitPayload) {
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await saveScannerReview(payload)

      if (result.error) {
        setError(result.error)
        return
      }

      setStep('success')

      // Auto-close after 1.5s and refresh
      setTimeout(() => {
        handleClose()
        router.refresh()
      }, 1500)
    } catch {
      setError('Failed to save record. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ──

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent className="sm:max-w-lg p-0 max-h-[90dvh] overflow-y-auto">
        <ModalHeader className="px-6 pt-6 pb-2">
          <ModalTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            {step === 'upload' && 'Scan Receipt'}
            {step === 'review' && 'Review & Save'}
            {step === 'success' && 'Saved!'}
          </ModalTitle>
          <ModalDescription>
            {step === 'upload' && 'Take a photo or upload a receipt to auto-fill your records.'}
            {step === 'review' && 'Review the extracted data below. Edit anything that looks off.'}
            {step === 'success' && 'Record saved successfully.'}
          </ModalDescription>
        </ModalHeader>

        <div className="px-6 pb-6 pt-2">
          {/* Error display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 mb-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <ImageUploader
              onImageSelected={handleImageSelected}
              isProcessing={isProcessing}
              previewUrl={previewUrl}
              onClear={() => {
                setPreviewUrl(null)
                setError(null)
              }}
            />
          )}

          {/* Step 2: Review */}
          {step === 'review' && extraction && scannerId && (
            <ReviewForm
              extraction={extraction}
              scannerId={scannerId}
              vehicleId={vehicleId}
              receiptUrl={receiptUrl || undefined}
              onSubmit={handleSaveReview}
              onCancel={() => {
                setStep('upload')
                setPreviewUrl(null)
                setExtraction(null)
                setScannerId(null)
                setError(null)
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle2 className="h-12 w-12 text-success" />
              <p className="text-sm text-muted-foreground">Record saved to your vehicle.</p>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}
