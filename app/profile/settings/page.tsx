'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader as Loader2, Mail, Bell, MessageSquare, Star, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    booking_notifications: true,
    message_notifications: true,
    review_notifications: true,
    marketing_emails: false,
  });

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/auth/login?redirect=/profile/settings');
      return;
    }

    if (profile) {
      fetchPreferences();
    }
  }, [profile, authLoading, router]);

  const fetchPreferences = async () => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('email_preferences')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          booking_notifications: data.booking_notifications ?? true,
          message_notifications: data.message_notifications ?? true,
          review_notifications: data.review_notifications ?? true,
          marketing_emails: data.marketing_emails ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('email_preferences')
        .upsert({
          user_id: profile.id,
          ...preferences,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Email preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const notificationSettings = [
    {
      key: 'booking_notifications' as const,
      icon: ShoppingBag,
      title: 'Booking Notifications',
      description: 'Get notified when you receive new bookings or booking updates',
    },
    {
      key: 'message_notifications' as const,
      icon: MessageSquare,
      title: 'Message Notifications',
      description: 'Receive alerts when someone sends you a message',
    },
    {
      key: 'review_notifications' as const,
      icon: Star,
      title: 'Review Notifications',
      description: 'Be notified when someone leaves you a review',
    },
    {
      key: 'marketing_emails' as const,
      icon: Mail,
      title: 'Marketing Emails',
      description: 'Receive updates about new features, tips, and promotions',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Email Settings</h1>
          <p className="text-muted-foreground">
            Manage your email notification preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Choose which emails you'd like to receive from KnotAgain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {notificationSettings.map((setting, index) => {
              const Icon = setting.icon;
              return (
                <div key={setting.key}>
                  {index > 0 && <Separator className="my-6" />}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 flex-1">
                      <div className="rounded-full bg-secondary p-2 h-fit">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={setting.key} className="text-base font-medium cursor-pointer">
                          {setting.title}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={setting.key}
                      checked={preferences[setting.key]}
                      onCheckedChange={() => handleToggle(setting.key)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              );
            })}

            <Separator className="my-6" />

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Changes will take effect immediately
              </p>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • You will still receive critical emails related to account security and legal requirements
            </p>
            <p>
              • Turning off notifications may cause you to miss important updates about your bookings
            </p>
            <p>
              • You can update these preferences at any time
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
