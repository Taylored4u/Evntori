'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';

interface AvailabilityCalendarProps {
  blockedDates: Date[];
  onAddBlockedDate: (date: Date) => void;
  onRemoveBlockedDate: (date: Date) => void;
}

export function AvailabilityCalendar({
  blockedDates,
  onAddBlockedDate,
  onRemoveBlockedDate,
}: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const isBlocked = blockedDates.some(
      d => d.toDateString() === date.toDateString()
    );

    if (isBlocked) {
      onRemoveBlockedDate(date);
    } else {
      onAddBlockedDate(date);
    }
    setSelectedDate(undefined);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Availability (Optional)</h3>
        <p className="text-sm text-muted-foreground">
          Block specific dates when this item is unavailable
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Select Blocked Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date()}
              modifiers={{
                blocked: blockedDates,
              }}
              modifiersStyles={{
                blocked: {
                  backgroundColor: 'hsl(var(--destructive))',
                  color: 'hsl(var(--destructive-foreground))',
                  opacity: 0.5,
                },
              }}
              className="rounded-md border"
            />
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Click a date to block/unblock it. Blocked dates appear in red.
          </div>

          {blockedDates.length > 0 && (
            <div>
              <Label className="mb-2 block">Blocked Dates ({blockedDates.length})</Label>
              <div className="flex flex-wrap gap-2">
                {blockedDates
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((date, index) => (
                    <Badge key={index} variant="destructive" className="gap-1">
                      {format(date, 'MMM dd, yyyy')}
                      <button
                        type="button"
                        onClick={() => onRemoveBlockedDate(date)}
                        className="ml-1 hover:bg-destructive-foreground/20 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => blockedDates.forEach(onRemoveBlockedDate)}
                className="mt-2"
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
