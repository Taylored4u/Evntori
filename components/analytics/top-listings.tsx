'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Package, DollarSign } from 'lucide-react';
import type { ListingPerformance } from '@/lib/analytics/queries';
import Link from 'next/link';

interface TopListingsProps {
  listings: ListingPerformance[];
}

export function TopListings({ listings }: TopListingsProps) {
  if (listings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No listing data yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Listings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {listings.map((listing, index) => (
            <Link
              key={listing.listingId}
              href={`/listing/${listing.listingId}`}
              className="block"
            >
              <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors">
                <div className="flex-shrink-0 relative">
                  <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  {listing.coverImage ? (
                    <img
                      src={listing.coverImage}
                      alt={listing.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{listing.title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${listing.totalRevenue.toFixed(0)}
                    </span>
                    <span>{listing.totalBookings} bookings</span>
                    {listing.averageRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {listing.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                <Badge variant="secondary">
                  View
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
