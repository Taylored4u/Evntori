'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Shield, TrendingUp } from 'lucide-react';
import { PaymentStatusBadge } from './payment-status-badge';

interface PaymentSummaryProps {
  booking: any;
  refunds?: any[];
}

export function PaymentSummary({ booking, refunds = [] }: PaymentSummaryProps) {
  const totalRefunded = refunds.reduce((sum, refund) => sum + (refund.amount || 0), 0);
  const netAmount = booking.total_price - totalRefunded;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Payment Summary</CardTitle>
          <PaymentStatusBadge status={booking.payment_status || 'pending'} />
        </div>
        <CardDescription>Breakdown of charges and payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Rental Subtotal</span>
            </div>
            <span className="font-medium">${(booking.subtotal || 0).toFixed(2)}</span>
          </div>

          {booking.deposit_amount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Security Deposit</span>
              </div>
              <span className="font-medium">${booking.deposit_amount.toFixed(2)}</span>
            </div>
          )}

          {booking.tax_amount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tax</span>
              <span className="font-medium">${booking.tax_amount.toFixed(2)}</span>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total Paid</span>
            <span>${booking.total_price.toFixed(2)}</span>
          </div>

          {totalRefunded > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-red-600">
                  <span className="text-sm">Total Refunded</span>
                  <span className="font-medium">-${totalRefunded.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Net Amount</span>
                  <span>${netAmount.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {booking.payment_status === 'paid' && (
          <div className="rounded-lg bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Payment Successful</p>
                <p className="text-xs text-green-700">
                  {booking.confirmed_at
                    ? `Confirmed on ${new Date(booking.confirmed_at).toLocaleDateString()}`
                    : 'Your payment has been processed'}
                </p>
              </div>
            </div>
          </div>
        )}

        {booking.payment_status === 'failed' && (
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <DollarSign className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Payment Failed</p>
                <p className="text-xs text-red-700">
                  {booking.payment_error || 'Please try again or use a different payment method'}
                </p>
              </div>
            </div>
          </div>
        )}

        {booking.payment_status === 'pending' && (
          <div className="rounded-lg bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                <DollarSign className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">Payment Pending</p>
                <p className="text-xs text-yellow-700">
                  Complete your payment to confirm this booking
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
