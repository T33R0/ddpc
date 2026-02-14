'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { useState, useEffect } from 'react';
import { PartSlot, VehicleInstalledComponent } from '../types';
import { updatePartInstallation, deletePart } from '../actions';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { FieldLabel } from './forms/FieldLabel';
import { getDisplayComponentForType } from './forms/type-specific';
import { calculateHealth, HealthStatus } from '../lib/health';
import { AlertTriangle, Pencil, Trash2, X, Check, Calendar, Gauge, ExternalLink, DollarSign } from 'lucide-react';
import Link from 'next/link';

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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const router = useRouter();

  const installed = slot?.installedComponent;
  const masterPart = installed?.master_part;
  const isKitPart = !!installed?.inventory_source_id;

  // Form state
  const [formData, setFormData] = useState({
    partName: '',
    partNumber: '',
    variant: '',
    vendorLink: '',
    installedDate: '',
    installedMileage: '',
    purchaseCost: '',
    category: '',
    customLifespanMiles: '',
    customLifespanMonths: '',
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
    setIsDeleteConfirmOpen(false);
  }, [installed, masterPart, isOpen]);

  const handleDelete = async () => {
    if (!installed?.id) return;
    setLoading(true);
    const result = await deletePart(installed.id);
    if ('error' in result) {
      setError(result.error);
      setLoading(false);
      setIsDeleteConfirmOpen(false);
    } else {
      setLoading(false);
      setIsDeleteConfirmOpen(false);
      onClose();
      if (onSuccess) onSuccess();
      else router.refresh();
    }
  };

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
        // onClose(); // Don't close, just exit edit mode to show updated view
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

  // Helper to check if crucial field is missing
  const isCrucialFieldMissing = (fieldName: string, value: any) => {
    const crucialFields = ['installedDate', 'installedMileage', 'purchaseCost'];
    return crucialFields.includes(fieldName) && (!value || value === '');
  };

  const defaultLifespanMiles = slot.default_lifespan_miles;
  const defaultLifespanMonths = slot.default_lifespan_months;
  const effectiveLifespanMiles = installed.lifespan_miles ?? defaultLifespanMiles;
  const effectiveLifespanMonths = installed.lifespan_months ?? defaultLifespanMonths;

  // Get type-specific display component
  const partType = installed.category || slot.category || 'default';
  const TypeSpecificDisplay = getDisplayComponentForType(partType);

  // --- View Mode Logic (Expanded Card) ---
  const health = calculateHealth(installed, slot, currentOdometer);

  // Color mapping matches PartCard
  const getHealthColor = (status: HealthStatus) => {
    switch (status) {
      case 'Good': return 'bg-success';
      case 'Warning': return 'bg-warning';
      case 'Critical': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const statusColor = health ? getHealthColor(health.status) : '';
  const healthValue = health ? Math.max(0, 100 - health.percentageUsed) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            setIsEditing(false);
            onClose();
        }
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 bg-transparent shadow-none">
        
        {/* Expanded Card Container */}
        <Card className="w-full h-full overflow-hidden shadow-2xl border-border">
            {/* Header / Banner */}
            <div className="bg-muted/30 border-b p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                         <h2 className="text-2xl font-bold tracking-tight">{installed.name || slot.name}</h2>
                         {isKitPart && <Badge variant="secondary">Kit</Badge>}
                    </div>
                    {installed.category && (
                         <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                                {installed.category.replace('_', ' ')}
                            </Badge>
                             {installed.variant && (
                                <Badge variant="secondary" className="capitalize">
                                    {installed.variant}
                                </Badge>
                             )}
                            {installed.status === 'wishlist' && (
                                <Badge variant="outline" className="border-dashed border-primary/50 text-muted-foreground">
                                    Wishlist
                                </Badge>
                            )}
                         </div>
                    )}
                </div>

                <div className="flex gap-2">
                     {!isEditing ? (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                     ) : (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                            Cancel Edit
                        </Button>
                     )}
                </div>
            </div>

            <CardContent className="p-6">
                {isEditing ? (
                    /* EDIT MODE FORM */
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              {error}
                            </div>
                          )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* General Info */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-2">General Info</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="partName">Part Name</Label>
                                    <Input
                                        id="partName"
                                        value={formData.partName}
                                        onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="category">Category</Label>
                                  <Select
                                    value={formData.category} // Controlled value
                                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                                    disabled={loading}
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
                                        disabled={loading}
                                    />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="variant">Variant</Label>
                                    <Select
                                      value={formData.variant}
                                      onValueChange={(val) => setFormData({ ...formData, variant: val })}
                                      disabled={loading}
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
                            </div>
                            
                            {/* Installation & Cost */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-2">Installation & Cost</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <FieldLabel 
                                        htmlFor="installedDate"
                                        showHazard={isCrucialFieldMissing('installedDate', formData.installedDate)}
                                        hazardTooltip="Installation date is missing"
                                      >
                                        Date Installed
                                      </FieldLabel>
                                      <Input
                                        id="installedDate"
                                        type="date"
                                        value={formData.installedDate}
                                        onChange={(e) => setFormData({ ...formData, installedDate: e.target.value })}
                                        disabled={loading}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <FieldLabel 
                                        htmlFor="installedMileage"
                                        showHazard={isCrucialFieldMissing('installedMileage', formData.installedMileage)}
                                        hazardTooltip="Installation mileage is missing"
                                      >
                                        Mileage
                                      </FieldLabel>
                                      <Input
                                        id="installedMileage"
                                        type="number"
                                        inputMode="numeric"
                                        value={formData.installedMileage}
                                        onChange={(e) => setFormData({ ...formData, installedMileage: e.target.value })}
                                        disabled={loading}
                                      />
                                    </div>
                                </div>
                                 <div className="space-y-2">
                                    <FieldLabel 
                                      htmlFor="purchaseCost"
                                      showHazard={!isKitPart && isCrucialFieldMissing('purchaseCost', formData.purchaseCost)}
                                      hazardTooltip="Purchase cost is missing"
                                    >
                                      Purchase Cost ($)
                                    </FieldLabel>
                                    {isKitPart ? (
                                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                                        Included in Kit Cost
                                      </div>
                                    ) : (
                                      <Input
                                        id="purchaseCost"
                                        type="number"
                                        step="0.01"
                                        inputMode="decimal"
                                        value={formData.purchaseCost}
                                        onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                                        disabled={loading}
                                        placeholder="0.00"
                                      />
                                    )}
                                  </div>
                                   <div className="space-y-2">
                                    <Label htmlFor="vendorLink">Vendor Link</Label>
                                    <Input
                                      type="text"
                                      value={formData.vendorLink}
                                      onChange={(e) => setFormData({ ...formData, vendorLink: e.target.value })}
                                      disabled={loading}
                                      placeholder="https://..."
                                    />
                                  </div>
                            </div>
                        </div>
                        
                         {/* Lifespan */}
                         <div className="space-y-4">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-2">Lifespan Settings</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="customLifespanMiles">
                                      Custom Lifespan (Miles)
                                    </Label>
                                    <Input
                                      id="customLifespanMiles"
                                      type="number"
                                      inputMode="numeric"
                                      value={formData.customLifespanMiles}
                                      onChange={(e) => setFormData({ ...formData, customLifespanMiles: e.target.value })}
                                      disabled={loading}
                                      placeholder={defaultLifespanMiles?.toString() || 'Use default'}
                                    />
                                  </div>
                                   <div className="space-y-2">
                                    <Label htmlFor="customLifespanMonths">
                                      Custom Lifespan (Months)
                                    </Label>
                                    <Input
                                      id="customLifespanMonths"
                                      type="number"
                                      inputMode="numeric"
                                      value={formData.customLifespanMonths}
                                      onChange={(e) => setFormData({ ...formData, customLifespanMonths: e.target.value })}
                                      disabled={loading}
                                      placeholder={defaultLifespanMonths?.toString() || 'Use default'}
                                    />
                                  </div>
                             </div>
                         </div>
                        
                         {/* Type Specific */}
                         {installed.specs && Object.keys(installed.specs).length > 0 && (
                            <div className="space-y-4 pt-4">
                              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-2">Type-Specific Details</h3>
                              <TypeSpecificDisplay specs={installed.specs} />
                            </div>
                          )}

                        {/* Actions */}
                        <div className="flex justify-between pt-6 border-t mt-6">
                             {/* Delete Confirmation Logic */}
                            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                                  <DialogContent className="max-w-sm">
                                    <DialogHeader>
                                      <DialogTitle>Delete Component?</DialogTitle>
                                    </DialogHeader>
                                    <p className="text-sm text-muted-foreground">
                                        This action cannot be undone. This will permanently remove the component 
                                        {isKitPart ? ' and potentially affect key kit data' : ''} from your inventory.
                                    </p>
                                    <div className="flex justify-end gap-2 pt-4">
                                       <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={loading}>
                                         Cancel
                                       </Button>
                                       <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                                         {loading ? 'Deleting...' : 'Delete'}
                                       </Button>
                                    </div>
                                  </DialogContent>
                            </Dialog>

                             <Button 
                                 type="button" 
                                 variant="ghost" 
                                 className="text-red-500 hover:text-red-900 hover:bg-red-50"
                                 onClick={() => setIsDeleteConfirmOpen(true)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Component
                              </Button>

                            <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setIsEditing(false)}
                                  disabled={loading}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                  {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>

                    </form>
                ) : (
                    /* VIEW MODE (Expanded Card) */
                    <div className="space-y-6">
                        {/* Health Status Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {/* Left: Overall Health & Status */}
                             <div className="bg-muted/10 rounded-xl border p-4 flex flex-col items-center justify-center text-center space-y-2">
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Overall Health</span>
                                
                                <span className={`text-3xl font-bold ${
                                     health?.status === 'Critical' ? 'text-destructive' :
                                      health?.status === 'Warning' ? 'text-warning' :
                                       health?.status === 'Unknown' ? 'text-muted-foreground' : 'text-green-500' 
                                }`}>
                                   {installed.status === 'planned' ? 'Planned' : health?.status || 'Unknown'}
                                </span>

                                <div className="w-full max-w-[140px]">
                                     {health?.status !== 'Unknown' && (
                                         <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mt-2">
                                          <div
                                            className={`h-full ${statusColor} transition-all duration-500`}
                                            style={{ width: `${healthValue}%` }}
                                          />
                                        </div>
                                     )}
                                </div>
                             </div>

                             {/* Center/Right: detailed bars */}
                             <div className="md:col-span-2 space-y-4">
                                {health?.mileage && (
                                     <div className="space-y-2">
                                         <div className="flex justify-between text-sm">
                                             <span className="text-muted-foreground flex items-center gap-2">
                                                <Gauge className="h-4 w-4" /> Mileage
                                             </span>
                                             <span className="font-medium">{health.mileage.remaining.toLocaleString()} mi remaining</span>
                                         </div>
                                         <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                              className={`h-full transition-all duration-500 ${getHealthColor(health.mileage.percentage > 90 ? 'Critical' : health.mileage.percentage > 70 ? 'Warning' : 'Good')}`}
                                              style={{ width: `${Math.max(0, 100 - health.mileage.percentage)}%` }}
                                            />
                                          </div>
                                          <div className="flex justify-between text-xs text-muted-foreground">
                                              <span>{health.mileage.used.toLocaleString()} mi used</span>
                                              <span>{health.mileage.total.toLocaleString()} mi total lifespan</span>
                                          </div>
                                     </div>
                                )}
                                {health?.time && (
                                     <div className="space-y-2">
                                         <div className="flex justify-between text-sm">
                                             <span className="text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-4 w-4" /> Time
                                             </span>
                                             <span className="font-medium">{Math.round(health.time.remaining)} mo remaining</span>
                                         </div>
                                         <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                              className={`h-full transition-all duration-500 ${getHealthColor(health.time.percentage > 90 ? 'Critical' : health.time.percentage > 70 ? 'Warning' : 'Good')}`}
                                              style={{ width: `${Math.max(0, 100 - health.time.percentage)}%` }}
                                            />
                                          </div>
                                          <div className="flex justify-between text-xs text-muted-foreground">
                                              <span>{Math.round(health.time.used)} mo used</span>
                                              <span>{Math.round(health.time.total)} mo total lifespan</span>
                                          </div>
                                     </div>
                                )}
                             </div>
                        </div>

                        {/* Detailed Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                             {/* Installation Details */}
                             <div>
                                 <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-500" /> Installation
                                 </h3>
                                 <div className="space-y-3">
                                      <div className="flex justify-between border-b pb-2 border-border/50">
                                         <span className="text-muted-foreground text-sm">Date</span>
                                         <span className="font-medium">
                                            {installed.installed_at ? format(new Date(installed.installed_at), 'MMM d, yyyy') : '-'}
                                         </span>
                                      </div>
                                      <div className="flex justify-between border-b pb-2 border-border/50">
                                         <span className="text-muted-foreground text-sm">Mileage</span>
                                         <span className="font-medium">
                                            {installed.install_miles ? `${installed.install_miles.toLocaleString()} mi` : '-'}
                                         </span>
                                      </div>
                                      <div className="flex justify-between border-b pb-2 border-border/50">
                                         <span className="text-muted-foreground text-sm">Part Number</span>
                                         <span className="font-mono text-sm">{installed.part_number || 'N/A'}</span>
                                      </div>
                                 </div>
                             </div>

                             {/* Purchase Details */}
                             <div>
                                 <h3 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-blue-500" /> Purchase Info
                                 </h3>
                                 <div className="space-y-3">
                                      <div className="flex justify-between border-b pb-2 border-border/50">
                                         <span className="text-muted-foreground text-sm">Cost</span>
                                         <span className="font-medium">
                                            {installed.purchase_price !== null 
                                                ? `$${installed.purchase_price.toFixed(2)}` 
                                                : installed.specs?.acquisition_type === 'warranty' || installed.specs?.acquisition_type === 'gift' 
                                                    ? 'N/A' 
                                                    : '-'
                                            }
                                         </span>
                                      </div>
                                      <div className="flex justify-between border-b pb-2 border-border/50">
                                         <span className="text-muted-foreground text-sm">Acquisition</span>
                                         <span className="font-medium capitalize">
                                            {installed.specs?.acquisition_type || 'Purchase'}
                                         </span>
                                      </div>
                                      <div className="flex justify-between border-b pb-2 border-border/50 items-center">
                                         <span className="text-muted-foreground text-sm">Vendor</span>
                                         {installed.purchase_url ? (
                                             <a href={installed.purchase_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-sm">
                                                Link <ExternalLink className="h-3 w-3" />
                                             </a>
                                         ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                         )}
                                      </div>
                                 </div>
                             </div>
                        </div>

                         {/* Type Specific Props (e.g. Tire Size) */}
                         {installed.specs && Object.keys(installed.specs).length > 0 && (
                            <div className="pt-4 border-t">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">Specifications</h3>
                                <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                                   {Object.entries(installed.specs).map(([key, val]) => {
                                      if (key === 'acquisition_type') return null;
                                      return (
                                          <div key={key} className="flex flex-col">
                                              <span className="text-xs text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</span>
                                              <span className="font-medium truncate">{val}</span>
                                          </div>
                                      )
                                   })}
                                </div>
                            </div>
                          )}
                    </div>
                )}
            </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
