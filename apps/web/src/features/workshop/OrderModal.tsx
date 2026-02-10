'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@repo/ui/modal';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { Loader2, Package } from 'lucide-react';
import { createOrder, updateOrder } from './actions';
import { toast } from 'react-hot-toast';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicleId: string;
    onSuccess?: () => void;
    initialData?: any; // For editing existing order
    selectedInventoryIds?: string[]; // For creating new order from selection
}

export function OrderModal({ isOpen, onClose, vehicleId, onSuccess, initialData, selectedInventoryIds = [] }: OrderModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [vendor, setVendor] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [subtotal, setSubtotal] = useState('');
    const [tax, setTax] = useState('');
    const [shipping, setShipping] = useState('');
    const [status, setStatus] = useState<string>('ordered');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [carrier, setCarrier] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setVendor(initialData.vendor || '');
                setOrderNumber(initialData.order_number || '');
                setOrderDate(initialData.order_date ? new Date(initialData.order_date).toISOString().split('T')[0] : '');
                setSubtotal(initialData.subtotal || '');
                setTax(initialData.tax || '');
                setShipping(initialData.shipping_cost || '');
                setStatus(initialData.status || 'ordered');
                setTrackingNumber(initialData.tracking_number || '');
                setCarrier(initialData.carrier || '');
            } else {
                // Reset for new order
                setVendor('');
                setOrderNumber('');
                setOrderDate(new Date().toISOString().split('T')[0]);
                setSubtotal('');
                setTax('');
                setShipping('');
                setStatus('ordered');
                setTrackingNumber('');
                setCarrier('');
            }
        }
    }, [isOpen, initialData]);

    const calculateTotal = () => {
        const s = parseFloat(subtotal) || 0;
        const t = parseFloat(tax) || 0;
        const sh = parseFloat(shipping) || 0;
        return (s + t + sh).toFixed(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                vendor,
                orderNumber: orderNumber || undefined,
                orderDate: orderDate ? new Date(orderDate).toISOString() : undefined,
                subtotal: subtotal ? parseFloat(subtotal) : 0,
                tax: tax ? parseFloat(tax) : 0,
                shipping: shipping ? parseFloat(shipping) : 0,
                status: status as any,
                trackingNumber: trackingNumber || undefined,
                carrier: carrier || undefined
            };

            if (initialData) {
                const res = await updateOrder(initialData.id, payload);
                if (res.error) throw new Error(res.error);
                toast.success('Order updated');
            } else {
                const res = await createOrder(vehicleId, payload, selectedInventoryIds);
                if (res.error) throw new Error(res.error);
                toast.success('Order created');
            }

            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save order');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal open={isOpen} onOpenChange={onClose}>
            <ModalContent className="sm:max-w-[500px]">
                <ModalHeader>
                    <ModalTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {initialData ? 'Edit Order' : 'Create Batch Order'}
                    </ModalTitle>
                </ModalHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="vendor">Vendor *</Label>
                            <Input
                                id="vendor"
                                value={vendor}
                                onChange={(e) => setVendor(e.target.value)}
                                placeholder="e.g. Summit Racing"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="orderNumber">Order #</Label>
                            <Input
                                id="orderNumber"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="orderDate">Date</Label>
                            <Input
                                id="orderDate"
                                type="date"
                                value={orderDate}
                                onChange={(e) => setOrderDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ordered">Ordered</SelectItem>
                                    <SelectItem value="shipped">Shipped</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="border rounded-md p-3 bg-muted/20 space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Financials</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="subtotal" className="text-xs">Subtotal</Label>
                                <Input
                                    id="subtotal"
                                    type="number"
                                    step="0.01"
                                    value={subtotal}
                                    onChange={(e) => setSubtotal(e.target.value)}
                                    placeholder="0.00"
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="tax" className="text-xs">Tax</Label>
                                <Input
                                    id="tax"
                                    type="number"
                                    step="0.01"
                                    value={tax}
                                    onChange={(e) => setTax(e.target.value)}
                                    placeholder="0.00"
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="shipping" className="text-xs">Shipping</Label>
                                <Input
                                    id="shipping"
                                    type="number"
                                    step="0.01"
                                    value={shipping}
                                    onChange={(e) => setShipping(e.target.value)}
                                    placeholder="0.00"
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-1 px-1">
                            <span className="text-sm font-medium">Total:</span>
                            <span className="text-sm font-bold font-mono">${calculateTotal()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="trackingNumber">Tracking #</Label>
                            <Input
                                id="trackingNumber"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Optional"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="carrier">Carrier</Label>
                            <Select value={carrier} onValueChange={setCarrier}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="usps">USPS</SelectItem>
                                    <SelectItem value="ups">UPS</SelectItem>
                                    <SelectItem value="fedex">FedEx</SelectItem>
                                    <SelectItem value="dhl">DHL</SelectItem>
                                    <SelectItem value="amazon">Amazon</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <ModalFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {initialData ? 'Update Order' : 'Create Order'}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
}
