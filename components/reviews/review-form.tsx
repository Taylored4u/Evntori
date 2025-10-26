'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader as Loader2, Sparkles, MessageSquare, DollarSign, CircleCheck as CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(2000),
  cleanliness_rating: z.number().min(1).max(5).optional(),
  accuracy_rating: z.number().min(1).max(5).optional(),
  communication_rating: z.number().min(1).max(5).optional(),
  value_rating: z.number().min(1).max(5).optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  reviewerId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ bookingId, listingId, listingTitle, reviewerId, onSuccess }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
  });

  const onSubmit = async (data: ReviewFormData) => {
    if (overallRating === 0) {
      toast.error('Please select an overall rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase.from('reviews').insert as any)({
        booking_id: bookingId,
        listing_id: listingId,
        reviewer_id: reviewerId,
        rating: overallRating,
        title: data.title,
        comment: data.comment,
        cleanliness_rating: cleanlinessRating || null,
        accuracy_rating: accuracyRating || null,
        communication_rating: communicationRating || null,
        value_rating: valueRating || null,
        status: 'approved',
        is_verified: true,
      });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      if (error.code === '23505') {
        toast.error('You have already reviewed this booking');
      } else {
        toast.error('Failed to submit review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({
    rating,
    setRating,
    hover,
    setHover,
    label,
    icon: Icon,
  }: {
    rating: number;
    setRating: (rating: number) => void;
    hover: number;
    setHover: (rating: number) => void;
    label: string;
    icon?: any;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <Label className="text-sm font-medium">{label}</Label>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'h-8 w-8 transition-colors',
                star <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>Share your experience with {listingTitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <StarRating
            rating={overallRating}
            setRating={setOverallRating}
            hover={hoverRating}
            setHover={setHoverRating}
            label="Overall Rating"
          />

          <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
            <h4 className="font-medium text-sm">Detailed Ratings (Optional)</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <StarRating
                rating={cleanlinessRating}
                setRating={setCleanlinessRating}
                hover={0}
                setHover={() => {}}
                label="Cleanliness"
                icon={Sparkles}
              />
              <StarRating
                rating={accuracyRating}
                setRating={setAccuracyRating}
                hover={0}
                setHover={() => {}}
                label="Accuracy"
                icon={CheckCircle2}
              />
              <StarRating
                rating={communicationRating}
                setRating={setCommunicationRating}
                hover={0}
                setHover={() => {}}
                label="Communication"
                icon={MessageSquare}
              />
              <StarRating
                rating={valueRating}
                setRating={setValueRating}
                hover={0}
                setHover={() => {}}
                label="Value"
                icon={DollarSign}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Review Title</Label>
            <Input
              id="title"
              placeholder="Summarize your experience"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Review</Label>
            <Textarea
              id="comment"
              placeholder="Tell others about your rental experience. What did you love? Were there any issues?"
              rows={6}
              {...register('comment')}
            />
            {errors.comment && (
              <p className="text-sm text-destructive">{errors.comment.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
