'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CircleCheck as CheckCircle, Activity, Circle as XCircle } from 'lucide-react';
import type { BookingStats } from '@/lib/analytics/queries';

interface BookingStatsProps {
  stats: BookingStats;
}

export function BookingStatsComponent({ stats }: BookingStatsProps) {
  const statCards = [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Active',
      value: stats.activeBookings,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Completed',
      value: stats.completedBookings,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Cancelled',
      value: stats.cancelledBookings,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((stat.value / (stats.totalBookings || 1)) * 100).toFixed(0)}% of total
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Average Booking Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${stats.averageBookingValue.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground mt-2">
            Based on {stats.totalBookings} bookings
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
