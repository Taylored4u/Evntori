'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader as Loader2, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, Eye } from 'lucide-react';
import { checkIsAdmin, getContentReports, updateReportStatus } from '@/lib/admin/queries';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function ReportsPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'dismissed'>('resolved');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/auth/login?redirect=/admin/reports');
      return;
    }

    if (profile) {
      checkAdminAccess();
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin, filterStatus]);

  const checkAdminAccess = async () => {
    if (!profile) return;

    try {
      const adminStatus = await checkIsAdmin(profile.id);
      if (!adminStatus) {
        toast.error('Access denied');
        router.push('/');
        return;
      }
      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/');
    }
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await getContentReports(filterStatus === 'all' ? undefined : filterStatus);
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveReport = async () => {
    if (!selectedReport || !profile) return;

    setIsResolving(true);
    try {
      const { success } = await updateReportStatus(
        selectedReport.id,
        resolutionStatus,
        profile.id,
        resolutionNotes
      );

      if (success) {
        toast.success(`Report ${resolutionStatus}`);
        setShowResolveDialog(false);
        setSelectedReport(null);
        setResolutionNotes('');
        fetchReports();
      } else {
        toast.error('Failed to update report');
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
    } finally {
      setIsResolving(false);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'default', icon: AlertTriangle },
      reviewing: { variant: 'secondary', icon: Eye },
      resolved: { variant: 'default', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      dismissed: { variant: 'outline', icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-background">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif font-bold">Content Reports</h1>
            <Button variant="outline" onClick={() => router.push('/admin')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground">
              {reports.length} report(s)
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No reports found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{report.content_type}</Badge>
                          {getStatusBadge(report.status)}
                        </div>
                        <CardTitle className="text-lg">{report.reason}</CardTitle>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        <p>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</p>
                        <p>by {report.reporter?.full_name || report.reporter?.email || 'Unknown'}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {report.description && (
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    )}

                    {report.resolution_notes && (
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <p className="text-xs font-medium mb-1">Resolution Notes:</p>
                        <p className="text-sm">{report.resolution_notes}</p>
                        {report.resolver && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Resolved by {report.resolver.full_name}
                          </p>
                        )}
                      </div>
                    )}

                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setResolutionStatus('resolved');
                            setShowResolveDialog(true);
                          }}
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReport(report);
                            setResolutionStatus('dismissed');
                            setShowResolveDialog(true);
                          }}
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolutionStatus === 'resolved' ? 'Resolve Report' : 'Dismiss Report'}
            </DialogTitle>
            <DialogDescription>
              Add notes about your decision
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Resolution notes..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolveReport} disabled={isResolving}>
              {isResolving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {resolutionStatus === 'resolved' ? 'Resolve' : 'Dismiss'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
