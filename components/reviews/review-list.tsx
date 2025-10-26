'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, ThumbsUp, Loader as Loader2, MessageSquare, Sparkles, CircleCheck as CheckCircle2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  cleanliness_rating?: number;
  accuracy_rating?: number;
  communication_rating?: number;
  value_rating?: number;
  response?: string;
  response_at?: string;
  helpful_count: number;
  is_verified: boolean;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface ReviewListProps {
  listingId: string;
}

export function ReviewList({ listingId }: ReviewListProps) {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchReviews();
    if (profile) {
      fetchUserHelpfulVotes();
    }
  }, [listingId, profile]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (full_name)
        `)
        .eq('listing_id', listingId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserHelpfulVotes = async () => {
    if (!profile?.id) return;

    try {
      const { data } = await supabase
        .from('review_helpful')
        .select('review_id')
        .eq('user_id', profile.id);

      if (data) {
        setHelpfulVotes(new Set(data.map((v: any) => v.review_id)));
      }
    } catch (error) {
      console.error('Error fetching helpful votes:', error);
    }
  };

  const handleHelpfulClick = async (reviewId: string) => {
    if (!profile?.id) {
      toast.error('Please sign in to mark reviews as helpful');
      return;
    }

    const isHelpful = helpfulVotes.has(reviewId);

    try {
      if (isHelpful) {
        const { error } = await supabase
          .from('review_helpful')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', profile.id);

        if (error) throw error;

        setHelpfulVotes((prev) => {
          const next = new Set(prev);
          next.delete(reviewId);
          return next;
        });
      } else {
        const { error } = await (supabase
          .from('review_helpful')
          .insert as any)({ review_id: reviewId, user_id: profile.id });

        if (error) throw error;

        setHelpfulVotes((prev) => new Set(prev).add(reviewId));
      }

      fetchReviews();
    } catch (error) {
      console.error('Error toggling helpful:', error);
      toast.error('Failed to update. Please try again.');
    }
  };

  const getAverageRating = (): string => {
    if (reviews.length === 0) return '0';
    return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
          <p className="text-muted-foreground">Be the first to review this item!</p>
        </CardContent>
      </Card>
    );
  }

  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{getAverageRating()}</div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(parseFloat(getAverageRating()))
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
            </div>

            <div className="md:col-span-2 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = distribution[rating as keyof typeof distribution];
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {review.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{review.profiles?.full_name || 'Anonymous'}</p>
                        {review.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified Rental
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span>•</span>
                        <span>{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  {review.title && <h4 className="font-semibold mb-2">{review.title}</h4>}
                  <p className="text-sm leading-relaxed">{review.comment}</p>
                </div>

                {(review.cleanliness_rating || review.accuracy_rating || review.communication_rating || review.value_rating) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-secondary/30 rounded-lg">
                    {review.cleanliness_rating && (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <div className="text-xs">
                          <div className="font-medium">Cleanliness</div>
                          <div className="text-muted-foreground">{review.cleanliness_rating}/5</div>
                        </div>
                      </div>
                    )}
                    {review.accuracy_rating && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <div className="text-xs">
                          <div className="font-medium">Accuracy</div>
                          <div className="text-muted-foreground">{review.accuracy_rating}/5</div>
                        </div>
                      </div>
                    )}
                    {review.communication_rating && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <div className="text-xs">
                          <div className="font-medium">Communication</div>
                          <div className="text-muted-foreground">{review.communication_rating}/5</div>
                        </div>
                      </div>
                    )}
                    {review.value_rating && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div className="text-xs">
                          <div className="font-medium">Value</div>
                          <div className="text-muted-foreground">{review.value_rating}/5</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {review.response && (
                  <>
                    <Separator />
                    <div className="pl-4 border-l-2 border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Lender Response
                        </Badge>
                        {review.response_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(review.response_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{review.response}</p>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHelpfulClick(review.id)}
                    className={helpfulVotes.has(review.id) ? 'text-primary' : ''}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Helpful ({review.helpful_count})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
