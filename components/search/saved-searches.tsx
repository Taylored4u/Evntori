'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader as Loader2, Save, Trash2, Bell, BellOff, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SavedSearch {
  id: string;
  name: string;
  search_params: any;
  notification_enabled: boolean;
  created_at: string;
}

interface SavedSearchesProps {
  currentSearchParams?: any;
}

export function SavedSearches({ currentSearchParams }: SavedSearchesProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [enableNotifications, setEnableNotifications] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchSavedSearches();
    }
  }, [profile]);

  const fetchSavedSearches = async () => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('saved_searches')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      setSavedSearches(data || []);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!profile || !searchName.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('saved_searches')
        .insert({
          user_id: profile.id,
          name: searchName.trim(),
          search_params: currentSearchParams || {},
          notification_enabled: enableNotifications,
        });

      if (error) throw error;

      toast.success('Search saved successfully');
      setShowSaveDialog(false);
      setSearchName('');
      setEnableNotifications(false);
      fetchSavedSearches();
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Search deleted');
      setSavedSearches(savedSearches.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('Failed to delete search');
    }
  };

  const handleToggleNotifications = async (id: string, enabled: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('saved_searches')
        .update({ notification_enabled: !enabled })
        .eq('id', id);

      if (error) throw error;

      setSavedSearches(savedSearches.map(s =>
        s.id === id ? { ...s, notification_enabled: !enabled } : s
      ));
      toast.success(enabled ? 'Notifications disabled' : 'Notifications enabled');
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error('Failed to update notifications');
    }
  };

  const handleLoadSearch = (search: SavedSearch) => {
    const params = new URLSearchParams();

    if (search.search_params.q) params.set('q', search.search_params.q);
    if (search.search_params.category) params.set('category', search.search_params.category);
    if (search.search_params.minPrice) params.set('minPrice', search.search_params.minPrice);
    if (search.search_params.maxPrice) params.set('maxPrice', search.search_params.maxPrice);
    if (search.search_params.location) params.set('location', search.search_params.location);
    if (search.search_params.sort) params.set('sort', search.search_params.sort);

    router.push(`/search?${params.toString()}`);
  };

  if (!profile) {
    return null;
  }

  const getSearchDescription = (params: any) => {
    const parts = [];
    if (params.q) parts.push(`"${params.q}"`);
    if (params.category) parts.push('in category');
    if (params.minPrice || params.maxPrice) {
      parts.push(`$${params.minPrice || 0}-$${params.maxPrice || '∞'}`);
    }
    if (params.location) parts.push(`near ${params.location}`);
    return parts.join(' · ') || 'All listings';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Searches</h3>
        {currentSearchParams && (
          <Button size="sm" onClick={() => setShowSaveDialog(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save Current Search
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : savedSearches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              No saved searches yet. Save your searches to quickly access them later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedSearches.map((search) => (
            <Card key={search.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 cursor-pointer" onClick={() => handleLoadSearch(search)}>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{search.name}</h4>
                      {search.notification_enabled && (
                        <Badge variant="secondary" className="text-xs">
                          <Bell className="h-3 w-3 mr-1" />
                          Alerts on
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getSearchDescription(search.search_params)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleNotifications(search.id, search.notification_enabled)}
                      title={search.notification_enabled ? 'Disable notifications' : 'Enable notifications'}
                    >
                      {search.notification_enabled ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSearch(search.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Give this search a name to save it for quick access later
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                placeholder="e.g., Vintage Wedding Decor"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new items match this search
                </p>
              </div>
              <Switch
                id="notifications"
                checked={enableNotifications}
                onCheckedChange={setEnableNotifications}
              />
            </div>

            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-1">Search Criteria:</p>
              <p className="text-sm text-muted-foreground">
                {getSearchDescription(currentSearchParams || {})}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch} disabled={isSaving || !searchName.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
