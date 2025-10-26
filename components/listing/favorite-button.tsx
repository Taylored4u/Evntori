'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Loader as Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  listingId: string;
  variant?: 'default' | 'icon';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function FavoriteButton({
  listingId,
  variant = 'icon',
  size = 'icon',
  className,
}: FavoriteButtonProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (profile) {
      checkFavoriteStatus();
    } else {
      setIsChecking(false);
    }
  }, [profile, listingId]);

  const checkFavoriteStatus = async () => {
    if (!profile) return;

    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', profile.id)
        .eq('listing_id', listingId)
        .maybeSingle();

      setIsFavorited(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!profile) {
      router.push(`/auth/login?redirect=/listing/${listingId}`);
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', profile.id)
          .eq('listing_id', listingId);

        if (error) throw error;

        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        const { error } = await (supabase as any)
          .from('favorites')
          .insert({
            user_id: profile.id,
            listing_id: listingId,
          });

        if (error) throw error;

        setIsFavorited(true);
        toast.success('Added to favorites');
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      if (error.code === '23505') {
        toast.error('Already in favorites');
      } else {
        toast.error('Failed to update favorites');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Button
        variant="ghost"
        size={size}
        disabled
        className={className}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (variant === 'default') {
    return (
      <Button
        onClick={handleToggleFavorite}
        disabled={isLoading}
        variant={isFavorited ? 'default' : 'outline'}
        size={size}
        className={className}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Heart
            className={cn(
              'h-4 w-4 mr-2',
              isFavorited && 'fill-current'
            )}
          />
        )}
        {isFavorited ? 'Favorited' : 'Add to Favorites'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      variant="ghost"
      size={size}
      className={cn(
        'relative',
        isFavorited && 'text-red-500 hover:text-red-600',
        className
      )}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={cn(
            'h-4 w-4 transition-all',
            isFavorited && 'fill-current scale-110'
          )}
        />
      )}
    </Button>
  );
}
