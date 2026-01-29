'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@repo/ui/modal'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { completeOnboarding } from '@/features/garage/actions'
import { toast } from 'react-hot-toast'

interface OnboardingModalProps {
  vehicleId: string
  open: boolean
  onClose: () => void
}

export function OnboardingModal({ vehicleId, open, onClose }: OnboardingModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1 Data
  const [acquisitionDate, setAcquisitionDate] = useState('')
  const [acquisitionCost, setAcquisitionCost] = useState('')
  const [acquisitionType, setAcquisitionType] = useState('Dealer')

  // Step 2 Data
  const [stillOwn, setStillOwn] = useState<boolean | null>(null)
  const [status, setStatus] = useState('active')
  const [endDate, setEndDate] = useState('')
  const [endStatus, setEndStatus] = useState('archived')

  const handleNext = () => {
    if (!acquisitionDate) {
      toast.error('Please enter acquisition date')
      return
    }
    setStep(2)
  }

  const handleSubmit = async () => {
    if (step === 2) {
      if (stillOwn === null) {
        toast.error('Please select if you still own the vehicle')
        return
      }
      if (stillOwn === false && !endDate) {
        toast.error('Please enter the date you parted with the vehicle')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const result = await completeOnboarding({
        vehicleId,
        acquisitionDate,
        acquisitionType,
        acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : undefined,
        ownershipEndDate: stillOwn === false ? endDate : undefined,
        status: stillOwn === true ? status : endStatus,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast.success('Vehicle setup complete!')
      onClose()
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to save details')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={(val) => !val && onClose()}>
      <ModalContent className="sm:max-w-lg">
        <ModalHeader>
          <ModalTitle>Setup Your Vehicle</ModalTitle>
          <ModalDescription>
            {step === 1 ? 'Tell us how you got this vehicle.' : 'Update ownership status.'}
          </ModalDescription>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="acquisitionDate">When did you acquire it?</Label>
                  <Input
                    id="acquisitionDate"
                    type="date"
                    value={acquisitionDate}
                    onChange={(e) => setAcquisitionDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acquisitionType">How did you acquire it?</Label>
                  <Select value={acquisitionType} onValueChange={setAcquisitionType}>
                    <SelectTrigger id="acquisitionType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dealer">Dealer</SelectItem>
                      <SelectItem value="Private Party">Private Party</SelectItem>
                      <SelectItem value="Auction">Auction</SelectItem>
                      <SelectItem value="Trade">Trade</SelectItem>
                      <SelectItem value="Gift">Gift</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acquisitionCost">Acquisition Cost (Optional)</Label>
                  <Input
                    id="acquisitionCost"
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(e.target.value)}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Do you still own this vehicle?</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={stillOwn === true ? 'default' : 'outline'}
                      onClick={() => {
                        setStillOwn(true)
                        setStatus('active')
                      }}
                      className="flex-1"
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={stillOwn === false ? 'default' : 'outline'}
                      onClick={() => {
                        setStillOwn(false)
                        setEndStatus('archived')
                      }}
                      className="flex-1"
                    >
                      No
                    </Button>
                  </div>
                </div>

                {stillOwn === true && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Current Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Daily Driver (Active)</SelectItem>
                        <SelectItem value="inactive">Inactive (Stored)</SelectItem>
                        <SelectItem value="listed">Listed (For Sale)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {stillOwn === false && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">When did you part with it?</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endStatus">Final Status</Label>
                      <Select value={endStatus} onValueChange={setEndStatus}>
                        <SelectTrigger id="endStatus">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="archived">Archived</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex w-full justify-end gap-4">
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                Back
              </Button>
            )}
            <Button onClick={step === 1 ? handleNext : handleSubmit} disabled={isSubmitting}>
              {step === 1 ? 'Next' : (isSubmitting ? 'Saving...' : 'Finish')}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
