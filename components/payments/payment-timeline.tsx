'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleCheck as CheckCircle, Circle, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface PaymentEvent {
  id: string;
  type: 'payment' | 'refund' | 'payout' | 'dispute';
  status: 'completed' | 'pending' | 'failed';
  amount: number;
  description: string;
  timestamp: string;
}

interface PaymentTimelineProps {
  booking: any;
  refunds?: any[];
  payouts?: any[];
}

export function PaymentTimeline({ booking, refunds = [], payouts = [] }: PaymentTimelineProps) {
  const events: PaymentEvent[] = [];

  if (booking.confirmed_at) {
    events.push({
      id: 'payment',
      type: 'payment',
      status: 'completed',
      amount: booking.total_price,
      description: 'Payment received',
      timestamp: booking.confirmed_at,
    });
  }

  refunds.forEach((refund, index) => {
    events.push({
      id: `refund-${index}`,
      type: 'refund',
      status: refund.status === 'completed' ? 'completed' : 'pending',
      amount: refund.amount,
      description: refund.reason || 'Refund processed',
      timestamp: refund.processed_at || refund.created_at,
    });
  });

  payouts.forEach((payout, index) => {
    events.push({
      id: `payout-${index}`,
      type: 'payout',
      status: payout.status === 'paid' ? 'completed' : payout.status === 'failed' ? 'failed' : 'pending',
      amount: payout.amount,
      description: `Payout to lender`,
      timestamp: payout.paid_at || payout.created_at,
    });
  });

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return DollarSign;
      case 'refund':
        return RefreshCw;
      case 'payout':
        return DollarSign;
      default:
        return Circle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Timeline</CardTitle>
          <CardDescription>No payment activity yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mb-2" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Payment activity will appear here once processed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Timeline</CardTitle>
        <CardDescription>Transaction history for this booking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = getIcon(event.type);
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="relative">
                {!isLast && (
                  <div className="absolute left-5 top-10 h-full w-0.5 bg-border" />
                )}
                <div className="flex gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${getStatusColor(
                      event.status
                    )}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{event.description}</p>
                      <p className="text-sm font-semibold">
                        {event.type === 'refund' ? '-' : ''}$
                        {event.amount.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                    <div className="flex items-center gap-2">
                      {event.status === 'completed' && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Completed</span>
                        </div>
                      )}
                      {event.status === 'pending' && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                          <Clock className="h-3 w-3" />
                          <span>Processing</span>
                        </div>
                      )}
                      {event.status === 'failed' && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <Circle className="h-3 w-3" />
                          <span>Failed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
