'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Clock, CircleAlert as AlertCircle } from 'lucide-react';
import type { RevenueStats } from '@/lib/analytics/queries';

interface RevenueStatsProps {
  stats: RevenueStats;
}

export function RevenueStatsComponent({ stats }: RevenueStatsProps) {
  const statCards = [
    {
      title: 'Total Revenue',
      value: stats.totalRevenue,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Completed',
      value: stats.completedRevenue,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Pending',
      value: stats.pendingRevenue,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Refunded',
      value: stats.refundedRevenue,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
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
              <div className="text-2xl font-bold">${stat.value.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stat.value / (stats.totalRevenue || 1)) * 100).toFixed(0)}% of total
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
