import { supabase } from '@/lib/supabase/client';

export interface AdminRole {
  id: string;
  user_id: string;
  role: 'super_admin' | 'moderator' | 'support';
  permissions: any;
  created_at: string;
}

export interface ContentReport {
  id: string;
  reporter_id: string;
  content_type: 'listing' | 'profile' | 'review' | 'message';
  content_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface PlatformStats {
  date: string;
  total_users: number;
  new_users: number;
  total_listings: number;
  new_listings: number;
  total_bookings: number;
  new_bookings: number;
  total_revenue: number;
  active_users: number;
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data } = await (supabase as any)
    .from('admin_roles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
}

export async function getAdminRole(userId: string): Promise<AdminRole | null> {
  const { data } = await (supabase as any)
    .from('admin_roles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return data;
}

export async function getPlatformOverview() {
  const today = new Date().toISOString().split('T')[0];

  const [usersResult, listingsResult, bookingsResult, revenueResult] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('listings').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('total_price').eq('status', 'completed'),
  ]);

  const totalRevenue = revenueResult.data?.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0) || 0;

  return {
    totalUsers: usersResult.count || 0,
    totalListings: listingsResult.count || 0,
    totalBookings: bookingsResult.count || 0,
    totalRevenue,
  };
}

export async function getRecentActivity(limit: number = 20) {
  const [bookings, listings, users] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, created_at, status, renter:profiles!bookings_renter_id_fkey(full_name), listing:listings(title)')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('listings')
      .select('id, created_at, title, status, lender_profiles(business_name)')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('profiles')
      .select('id, created_at, full_name, email')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  const activities: any[] = [];

  bookings.data?.forEach((b: any) => {
    activities.push({
      type: 'booking',
      id: b.id,
      timestamp: b.created_at,
      description: `${b.renter?.full_name || 'User'} booked ${b.listing?.title || 'a listing'}`,
      status: b.status,
    });
  });

  listings.data?.forEach((l: any) => {
    activities.push({
      type: 'listing',
      id: l.id,
      timestamp: l.created_at,
      description: `${l.lender_profiles?.business_name || 'Lender'} created "${l.title}"`,
      status: l.status,
    });
  });

  users.data?.forEach((u: any) => {
    activities.push({
      type: 'user',
      id: u.id,
      timestamp: u.created_at,
      description: `${u.full_name || u.email} joined the platform`,
      status: 'active',
    });
  });

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export async function getContentReports(status?: string) {
  let query = (supabase as any)
    .from('content_reports')
    .select(`
      *,
      reporter:profiles!content_reports_reporter_id_fkey(full_name, email),
      resolver:profiles!content_reports_resolved_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data } = await query;
  return data || [];
}

export async function updateReportStatus(
  reportId: string,
  status: string,
  resolvedBy: string,
  notes?: string
) {
  const { error } = await (supabase as any)
    .from('content_reports')
    .update({
      status,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      resolution_notes: notes,
    })
    .eq('id', reportId);

  return { success: !error, error };
}

export async function getPlatformStats(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await (supabase as any)
    .from('platform_stats')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  return data || [];
}

export async function getAllUsers(limit: number = 50, offset: number = 0) {
  const { data, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { users: data || [], total: count || 0 };
}

export async function getAllListings(limit: number = 50, offset: number = 0) {
  const { data, count } = await supabase
    .from('listings')
    .select(`
      *,
      lender_profiles(business_name, rating_avg),
      categories(name)
    `, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return { listings: data || [], total: count || 0 };
}

export async function suspendUser(userId: string, reason: string) {
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ is_suspended: true, suspension_reason: reason })
    .eq('id', userId);

  return { success: !error, error };
}

export async function unsuspendUser(userId: string) {
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ is_suspended: false, suspension_reason: null })
    .eq('id', userId);

  return { success: !error, error };
}

export async function deactivateListing(listingId: string, reason: string) {
  const { error } = await (supabase as any)
    .from('listings')
    .update({
      status: 'inactive',
      admin_notes: reason,
      deleted_at: new Date().toISOString()
    })
    .eq('id', listingId);

  return { success: !error, error };
}
