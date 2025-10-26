import { supabase } from '@/lib/supabase/client';

export interface RevenueStats {
  totalRevenue: number;
  pendingRevenue: number;
  completedRevenue: number;
  refundedRevenue: number;
}

export interface BookingStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
}

export interface ListingPerformance {
  listingId: string;
  title: string;
  coverImage: string | null;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  viewCount: number;
}

export interface RecentActivity {
  id: string;
  type: 'booking' | 'message' | 'review' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export async function getRevenueStats(
  lenderId: string,
  startDate?: Date,
  endDate?: Date
): Promise<RevenueStats> {
  let query = supabase
    .from('bookings')
    .select('total_price, status')
    .eq('lender_id', lenderId);

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data: bookings } = await query;

  if (!bookings) {
    return {
      totalRevenue: 0,
      pendingRevenue: 0,
      completedRevenue: 0,
      refundedRevenue: 0,
    };
  }

  const stats = bookings.reduce(
    (acc: any, booking: any) => {
      const amount = booking.total_price || 0;

      acc.totalRevenue += amount;

      if (booking.status === 'completed') {
        acc.completedRevenue += amount;
      } else if (booking.status === 'pending' || booking.status === 'confirmed') {
        acc.pendingRevenue += amount;
      } else if (booking.status === 'cancelled') {
        acc.refundedRevenue += amount;
      }

      return acc;
    },
    {
      totalRevenue: 0,
      pendingRevenue: 0,
      completedRevenue: 0,
      refundedRevenue: 0,
    }
  );

  return stats;
}

export async function getBookingStats(
  lenderId: string,
  startDate?: Date,
  endDate?: Date
): Promise<BookingStats> {
  let query = supabase
    .from('bookings')
    .select('status, total_price')
    .eq('lender_id', lenderId);

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data: bookings } = await query;

  if (!bookings || bookings.length === 0) {
    return {
      totalBookings: 0,
      activeBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      averageBookingValue: 0,
    };
  }

  const stats = bookings.reduce(
    (acc: any, booking: any) => {
      acc.totalBookings++;

      if (booking.status === 'active' || booking.status === 'confirmed') {
        acc.activeBookings++;
      } else if (booking.status === 'completed') {
        acc.completedBookings++;
      } else if (booking.status === 'cancelled') {
        acc.cancelledBookings++;
      }

      acc.totalRevenue += booking.total_price || 0;

      return acc;
    },
    {
      totalBookings: 0,
      activeBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      totalRevenue: 0,
    }
  );

  return {
    ...stats,
    averageBookingValue: stats.totalBookings > 0
      ? stats.totalRevenue / stats.totalBookings
      : 0,
  };
}

export async function getTopPerformingListings(
  lenderId: string,
  limit: number = 5
): Promise<ListingPerformance[]> {
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      booking_count,
      listing_images!inner(url, is_cover),
      bookings(total_price),
      reviews(rating)
    `)
    .eq('lender_id', lenderId)
    .order('booking_count', { ascending: false })
    .limit(limit);

  if (!listings) return [];

  return listings.map((listing: any) => {
    const coverImage = listing.listing_images?.find((img: any) => img.is_cover);
    const totalRevenue = listing.bookings?.reduce(
      (sum: number, b: any) => sum + (b.total_price || 0),
      0
    ) || 0;
    const ratings = listing.reviews?.map((r: any) => r.rating) || [];
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
      : 0;

    return {
      listingId: listing.id,
      title: listing.title,
      coverImage: coverImage?.url || null,
      totalBookings: listing.booking_count || 0,
      totalRevenue,
      averageRating,
      viewCount: 0,
    };
  });
}

export async function getRecentActivity(
  lenderId: string,
  limit: number = 10
): Promise<RecentActivity[]> {
  const activities: RecentActivity[] = [];

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      status,
      total_price,
      created_at,
      listings(title),
      profiles(full_name)
    `)
    .eq('lender_id', lenderId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (bookings) {
    bookings.forEach((booking: any) => {
      activities.push({
        id: booking.id,
        type: 'booking',
        title: 'New Booking',
        description: `${booking.profiles?.full_name} booked ${booking.listings?.title}`,
        timestamp: booking.created_at,
        metadata: { status: booking.status, amount: booking.total_price },
      });
    });
  }

  const { data: messages } = await supabase
    .from('conversations')
    .select(`
      id,
      last_message_at,
      last_message_content,
      participant_1:profiles!conversations_participant_1_id_fkey(full_name),
      participant_2:profiles!conversations_participant_2_id_fkey(full_name),
      listing:listings(title)
    `)
    .or(`participant_1_id.eq.${lenderId},participant_2_id.eq.${lenderId}`)
    .order('last_message_at', { ascending: false })
    .limit(5);

  if (messages) {
    messages.forEach((conv: any) => {
      const otherParticipant = conv.participant_1_id === lenderId
        ? conv.participant_2
        : conv.participant_1;

      activities.push({
        id: conv.id,
        type: 'message',
        title: 'New Message',
        description: `From ${otherParticipant?.full_name} about ${conv.listing?.title || 'a listing'}`,
        timestamp: conv.last_message_at,
        metadata: { preview: conv.last_message_content },
      });
    });
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      reviewer:profiles!reviews_reviewer_id_fkey(full_name),
      listing:listings!reviews_listing_id_fkey(title)
    `)
    .eq('reviewee_id', lenderId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (reviews) {
    reviews.forEach((review: any) => {
      activities.push({
        id: review.id,
        type: 'review',
        title: 'New Review',
        description: `${review.reviewer?.full_name} rated ${review.listing?.title}`,
        timestamp: review.created_at,
        metadata: { rating: review.rating, comment: review.comment },
      });
    });
  }

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export async function getBookingTrends(
  lenderId: string,
  days: number = 30
): Promise<{ date: string; bookings: number; revenue: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: bookings } = await supabase
    .from('bookings')
    .select('created_at, total_price')
    .eq('lender_id', lenderId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (!bookings) return [];

  const trends = new Map<string, { bookings: number; revenue: number }>();

  bookings.forEach((booking: any) => {
    const date = new Date(booking.created_at).toISOString().split('T')[0];
    const current = trends.get(date) || { bookings: 0, revenue: 0 };
    trends.set(date, {
      bookings: current.bookings + 1,
      revenue: current.revenue + (booking.total_price || 0),
    });
  });

  return Array.from(trends.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
