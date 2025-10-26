'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader as Loader2, DollarSign, CircleAlert as AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RefundRequestDialogProps {
  bookingId: string;
  totalAmount: number;
  depositAmount: number;
  onSuccess?: () => void;
}

export function RefundRequestDialog({
  bookingId,
  totalAmount,
  depositAmount,
  onSuccess,
}: RefundRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'deposit_only'>('full');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    setIsSubmitting(true);
    try {
      const refundAmount = refundType === 'full' ? totalAmount : depositAmount;

      const response = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount: refundAmount,
          reason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund');
      }

      toast.success('Refund request submitted successfully');
      setOpen(false);
      setReason('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Refund error:', error);
      toast.error(error.message || 'Failed to submit refund request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const refundAmount = refundType === 'full' ? totalAmount : depositAmount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <DollarSign className="mr-2 h-4 w-4" />
          Request Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
          <DialogDescription>
            Submit a refund request for this booking. The lender will review your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Refunds are typically processed within 5-10 business days. You'll receive a
              notification once approved.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Label>Refund Amount</Label>
            <RadioGroup value={refundType} onValueChange={(value: any) => setRefundType(value)}>
              <div className="flex items-center space-x-2 rounded-lg border p-3">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span>Full Refund</span>
                    <span className="font-semibold">${totalAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Includes rental amount and deposit
                  </p>
                </Label>
              </div>

              {depositAmount > 0 && (
                <div className="flex items-center space-x-2 rounded-lg border p-3">
                  <RadioGroupItem value="deposit_only" id="deposit_only" />
                  <Label htmlFor="deposit_only" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span>Deposit Only</span>
                      <span className="font-semibold">${depositAmount.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Refund security deposit only</p>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Refund *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you're requesting a refund..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Provide details to help the lender process your request
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between font-medium">
              <span>Refund Amount:</span>
              <span className="text-lg">${refundAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
