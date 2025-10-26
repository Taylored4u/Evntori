'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Star, DollarSign } from 'lucide-react';
import type { RecentActivity } from '@/lib/analytics/queries';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  activities: RecentActivity[];
}

export function RecentActivityComponent({ activities }: RecentActivityProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return Calendar;
      case 'message':
        return MessageSquare;
      case 'review':
        return Star;
      case 'payment':
        return DollarSign;
      default:
        return Calendar;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'text-blue-600 bg-blue-100';
      case 'message':
        return 'text-purple-600 bg-purple-100';
      case 'review':
        return 'text-yellow-600 bg-yellow-100';
      case 'payment':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type);
            const colorClass = getColor(activity.type);

            return (
              <div key={activity.id} className="flex gap-3">
                <div className={`rounded-full p-2 h-fit ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs whitespace-nowrap ml-2">
                      {activity.type}
                    </Badge>
                  </div>

                  {activity.metadata && (
                    <div className="text-xs text-muted-foreground">
                      {activity.type === 'booking' && (
                        <span>Amount: ${activity.metadata.amount}</span>
                      )}
                      {activity.type === 'review' && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {activity.metadata.rating}/5
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
