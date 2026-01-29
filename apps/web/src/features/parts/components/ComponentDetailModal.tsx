'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { useState, useEffect } from 'react';
import { PartSlot } from '../types';
import { updatePartInstallation } from '../actions';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface ComponentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: PartSlot | null;
  vehicleId: string;
  currentOdometer: number;
  onSuccess?: () => void;
}

export const ComponentDetailModal = ({
  isOpen,
  onClose,
  slot,
  vehicleId,
  currentOdometer,
  onSuccess
}: ComponentDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const installed = slot?.installedComponent;
  const masterPart = installed?.master_part;

  // Form state
  const [formData, setFormData] = useState({
    partName: installed?.name || masterPart?.name || '',
    partNumber: installed?.part_number || masterPart?.part_number || '',
    variant: installed?.variant || '',
    vendorLink: installed?.purchase_url || masterPart?.affiliate_url || '',
    installedDate: installed?.installed_at ? format(new Date(installed.installed_at), 'yyyy-MM-dd') : '',
    installedMileage: installed?.install_miles?.toString() || '',
    purchaseCost: installed?.purchase_price?.toString() || '',
    category: installed?.category || masterPart?.category || '',
    customLifespanMiles: installed?.lifespan_miles?.toString() || '',
    customLifespanMonths: installed?.lifespan_months?.toString() || '',
  });

  useEffect(() => {
    if (installed) {
      setFormData({
        partName: installed.name || masterPart?.name || '',
        partNumber: installed.part_number || masterPart?.part_number || '',
        variant: installed.variant || '',
        vendorLink: installed.purchase_url || masterPart?.affiliate_url || '',
        installedDate: installed.installed_at ? format(new Date(installed.installed_at), 'yyyy-MM-dd') : '',
        installedMileage: installed.install_miles?.toString() || '',
        purchaseCost: installed.purchase_price?.toString() || '',
        category: installed.category || masterPart?.category || '',
        customLifespanMiles: installed.lifespan_miles?.toString() || '',
        customLifespanMonths: installed.lifespan_months?.toString() || '',
      });
    }
    setIsEditing(false);
  }, [installed, masterPart, isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!slot || !installed?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await updatePartInstallation(installed.id, vehicleId, {
        partName: formData.partName,
        partNumber: formData.partNumber,
        variant: formData.variant,
        vendorLink: formData.vendorLink,
        installedDate: formData.installedDate || undefined,
        installedMileage: formData.installedMileage ? parseInt(formData.installedMileage, 10) : undefined,
        purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : undefined,
        category: formData.category || undefined,
        customLifespanMiles: formData.customLifespanMiles ? parseInt(formData.customLifespanMiles, 10) : undefined,
        customLifespanMonths: formData.customLifespanMonths ? parseInt(formData.customLifespanMonths, 10) : undefined,
        status: (installed.status === 'planned' && formData.installedDate) ? 'installed' : undefined,
      });

      if ('error' in result) {
        setError(result.error);
        setLoading(false);
      } else {
        setIsEditing(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      }
    } catch (err) {
      console.error('Error updating part:', err);
      setError('Failed to update part. Please try again.');
      setLoading(false);
    }
  };

  if (!slot || !installed) {
    return null;
  }

  const defaultLifespanMiles = slot.default_lifespan_miles;
  const defaultLifespanMonths = slot.default_lifespan_months;
  const effectiveLifespanMiles = installed.lifespan_miles ?? defaultLifespanMiles;
  const effectiveLifespanMonths = installed.lifespan_months ?? defaultLifespanMonths;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Component Details: {slot.name}</DialogTitle>
          <DialogDescription>
            View and edit details for this installed component.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partName">Part Name</Label>
              <Input
                id="partName"
                value={formData.partName}
                onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                disabled={!isEditing || loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category} // Controlled value
                onValueChange={(val) => setFormData({ ...formData, category: val })}
                disabled={!isEditing || loading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engine">Engine</SelectItem>
                  <SelectItem value="suspension">Suspension</SelectItem>
                  <SelectItem value="brakes">Braking</SelectItem>
                  <SelectItem value="wheels_tires">Wheels & Tires</SelectItem>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="exterior">Exterior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                value={formData.partNumber}
                onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                disabled={!isEditing || loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant">Variant (Optional)</Label>
            <Select
              value={formData.variant}
              onValueChange={(val) => setFormData({ ...formData, variant: val })}
              disabled={!isEditing || loading}
            >
              <SelectTrigger id="variant">
                <SelectValue placeholder="Select Variant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="upgrade">Upgrade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorLink">Vendor Link</Label>
            <Input
              type="text"
              value={formData.vendorLink}
              onChange={(e) => setFormData({ ...formData, vendorLink: e.target.value })}
              disabled={!isEditing || loading}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="installedDate">Date Installed</Label>
              <Input
                id="installedDate"
                type="date"
                value={formData.installedDate}
                onChange={(e) => setFormData({ ...formData, installedDate: e.target.value })}
                disabled={!isEditing || loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installedMileage">Mileage Installed</Label>
              <Input
                id="installedMileage"
                type="number"
                inputMode="numeric"
                value={formData.installedMileage}
                onChange={(e) => setFormData({ ...formData, installedMileage: e.target.value })}
                disabled={!isEditing || loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseCost">Purchase Cost ($)</Label>
            <Input
              id="purchaseCost"
              type="number"
              step="0.01"
              inputMode="decimal"
              value={formData.purchaseCost}
              onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
              disabled={!isEditing || loading}
              placeholder="0.00"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Lifespan Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customLifespanMiles">
                  Custom Lifespan (Miles)
                  {defaultLifespanMiles && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Default: {defaultLifespanMiles.toLocaleString()})
                    </span>
                  )}
                </Label>
                <Input
                  id="customLifespanMiles"
                  type="number"
                  inputMode="numeric"
                  value={formData.customLifespanMiles}
                  onChange={(e) => setFormData({ ...formData, customLifespanMiles: e.target.value })}
                  disabled={!isEditing || loading}
                  placeholder={defaultLifespanMiles?.toString() || 'Use default'}
                />
                {effectiveLifespanMiles && (
                  <p className="text-xs text-muted-foreground">
                    Effective: {effectiveLifespanMiles.toLocaleString()} miles
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customLifespanMonths">
                  Custom Lifespan (Months)
                  {defaultLifespanMonths && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Default: {defaultLifespanMonths})
                    </span>
                  )}
                </Label>
                <Input
                  id="customLifespanMonths"
                  type="number"
                  inputMode="numeric"
                  value={formData.customLifespanMonths}
                  onChange={(e) => setFormData({ ...formData, customLifespanMonths: e.target.value })}
                  disabled={!isEditing || loading}
                  placeholder={defaultLifespanMonths?.toString() || 'Use default'}
                />
                {effectiveLifespanMonths && (
                  <p className="text-xs text-muted-foreground">
                    Effective: {effectiveLifespanMonths} months
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status Section for Planned Parts */}
          {installed.status === 'planned' && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-900">Planned Part</h4>
                  <p className="text-sm text-blue-700">This part is in your plan but not yet installed.</p>
                </div>
                {!isEditing && (
                  <Button
                    type="button"
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditing(true);
                      // Pre-fill date with today for convenience
                      const today = new Date().toISOString().split('T')[0] || '';
                      setFormData(prev => ({
                        ...prev,
                        installedDate: today
                      }));
                    }}
                  >
                    Install Now
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            {!isEditing ? (
              <>
                <Button type="button" variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button type="button" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditing(true);
                }}>
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditing(false);
                    setError(null);
                    // Reset form data
                    if (installed && masterPart) {
                      setFormData({
                        partName: masterPart.name || '',
                        partNumber: masterPart.part_number || '',
                        variant: '',
                        vendorLink: masterPart.affiliate_url || '',
                        installedDate: installed.installed_at ? format(new Date(installed.installed_at), 'yyyy-MM-dd') : '',
                        installedMileage: installed.install_miles?.toString() || '',
                        purchaseCost: installed.purchase_price?.toString() || '',
                        category: installed.category || '',
                        customLifespanMiles: installed.lifespan_miles?.toString() || '',
                        customLifespanMonths: installed.lifespan_months?.toString() || '',
                      });
                    }
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

