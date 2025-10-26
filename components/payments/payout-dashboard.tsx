'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, TrendingUp, Clock, CircleCheck as CheckCircle, Loader as Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PayoutDashboardProps {
  lenderId: string;
}

export function PayoutDashboard({ lenderId }: PayoutDashboardProps) {
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingPayouts: 0,
    paidPayouts: 0,
    totalBookings: 0,
  });
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPayoutData();
  }, [lenderId]);

  const fetchPayoutData = async () => {
    try {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('lender_id', lenderId)
        .in('status', ['confirmed', 'completed']);

      const { data: payoutData } = await supabase
        .from('payouts')
        .select('*')
        .eq('lender_id', lenderId)
        .order('created_at', { ascending: false });

      if (bookings) {
        const totalEarnings = bookings.reduce((sum: number, b: any) => sum + (b.subtotal || 0), 0);
        setStats((prev) => ({
          ...prev,
          totalEarnings,
          totalBookings: bookings.length,
        }));
      }

      if (payoutData) {
        const pending = payoutData
          .filter((p: any) => p.status === 'pending')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const paid = payoutData
          .filter((p: any) => p.status === 'paid')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        setStats((prev) => ({
          ...prev,
          pendingPayouts: pending,
          paidPayouts: paid,
        }));
        setPayouts(payoutData.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching payout data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="default">
            <CheckCircle className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {stats.totalBookings} booking{stats.totalBookings !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingPayouts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Processing to your account</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.paidPayouts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Successfully transferred</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fee (10%)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.totalEarnings * 0.1).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Deducted from earnings</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payouts</CardTitle>
          <CardDescription>Your payout transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <DollarSign className="mx-auto mb-2 h-12 w-12" />
              <p>No payouts yet</p>
              <p className="text-sm">Payouts will appear here after bookings are completed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout, index) => (
                <div key={payout.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          Payout for {format(new Date(payout.created_at), 'MMMM yyyy')}
                        </p>
                        {getStatusBadge(payout.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payout.paid_at
                          ? `Paid on ${format(new Date(payout.paid_at), 'MMM d, yyyy')}`
                          : `Created ${format(new Date(payout.created_at), 'MMM d, yyyy')}`}
                      </p>
                      {payout.failure_message && (
                        <p className="text-sm text-red-600">{payout.failure_message}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${payout.amount.toFixed(2)}</p>
                      {payout.status === 'pending' && (
                        <p className="text-xs text-muted-foreground">Processing</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
