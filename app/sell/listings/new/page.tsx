'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listingSchema, ListingInput, VariantInput, AddOnInput } from '@/lib/validations/listing';
import { supabase } from '@/lib/supabase/client';
import { seedCategories } from '@/lib/db-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader as Loader2, ArrowLeft, Save, CircleAlert as AlertCircle, Upload } from 'lucide-react';
import Link from 'next/link';
import { VariantForm } from '@/components/listing/variant-form';
import { AddOnForm } from '@/components/listing/addon-form';
import { AvailabilityCalendar } from '@/components/listing/availability-calendar';
import { ImageUpload } from '@/components/listing/image-upload';
import { uploadListingImage } from '@/lib/storage/upload';

interface ImageFile {
  file: File;
  preview: string;
  isCover: boolean;
}

export default function NewListingPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lenderProfile, setLenderProfile] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [addOns, setAddOns] = useState<AddOnInput[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      pricingType: 'daily',
      cancellationPolicy: 'moderate',
      minRentalDuration: 1,
      quantityAvailable: 1,
      basePrice: 0,
    },
  });

  const pricingType = watch('pricingType');

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      const { data: lender } = (await supabase
        .from('lender_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .single()) as any;

      setLenderProfile(lender);

      await seedCategories();
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      setCategories(cats || []);
    };

    fetchData();
  }, [profile]);


  const onSubmit = async (data: ListingInput) => {
    if (!lenderProfile) {
      toast.error('Lender profile not found');
      return;
    }

    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setIsLoading(true);

    try {
      const { data: listing, error: listingError } = (await supabase
        .from('listings')
        .insert({
          lender_id: lenderProfile.id,
          category_id: data.categoryId,
          title: data.title,
          description: data.description,
          condition: data.condition || null,
          replacement_value: data.replacementValue || null,
          base_price: data.basePrice,
          pricing_type: data.pricingType,
          min_rental_duration: data.minRentalDuration,
          max_rental_duration: data.maxRentalDuration || null,
          cancellation_policy: data.cancellationPolicy,
          quantity_available: data.quantityAvailable,
          status: 'active',
        } as any)
        .select()
        .single()) as any;

      if (listingError || !listing) {
        throw new Error('Failed to create listing');
      }

      const uploadedUrls = await Promise.all(
        images.map((img, index) => uploadListingImage(img.file, listing.id, index))
      );

      const imageInserts = uploadedUrls.map((url, index) => ({
        listing_id: listing.id,
        url,
        alt_text: `${data.title} - Image ${index + 1}`,
        sort_order: index,
        is_cover: images[index].isCover,
      }));

      await supabase.from('listing_images').insert(imageInserts as any);

      if (data.depositAmount && data.depositAmount > 0) {
        await supabase.from('deposits').insert({
          listing_id: listing.id,
          amount: data.depositAmount,
          type: 'fixed',
          refundable: true,
        } as any);
      }

      if (variants.length > 0) {
        const variantInserts = variants.map(v => ({
          listing_id: listing.id,
          name: v.name,
          sku: v.sku || null,
          price_adjustment: v.priceAdjustment,
          quantity: v.quantity,
        }));
        await supabase.from('listing_variants').insert(variantInserts as any);
      }

      if (addOns.length > 0) {
        const addOnInserts = addOns.map(a => ({
          listing_id: listing.id,
          name: a.name,
          description: a.description || null,
          price: a.price,
          type: a.type || null,
          is_required: a.isRequired,
        }));
        await supabase.from('listing_add_ons').insert(addOnInserts as any);
      }

      if (blockedDates.length > 0) {
        const availabilityInserts = blockedDates.map(date => ({
          listing_id: listing.id,
          date: date.toISOString().split('T')[0],
          is_available: false,
        }));
        await supabase.from('listing_availability').insert(availabilityInserts as any);
      }

      toast.success('Listing created successfully!');
      router.push('/sell/listings');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create listing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!lenderProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lenderProfile.stripe_charges_enabled || !lenderProfile.stripe_payouts_enabled) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must complete Stripe verification before creating listings.{' '}
            <Link href="/sell/onboarding/success" className="underline font-medium">
              Check verification status
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/sell/listings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-serif">Create New Listing</CardTitle>
          <CardDescription>
            Add a rental item to your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Elegant Gold Chiavari Chairs"
                      {...register('title')}
                      disabled={isLoading}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category *</Label>
                    <Select onValueChange={(value) => setValue('categoryId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && (
                      <p className="text-sm text-destructive">{errors.categoryId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your item in detail - materials, dimensions, condition, what's included..."
                      rows={6}
                      {...register('description')}
                      disabled={isLoading}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Minimum 50 characters. Be detailed to help couples understand what they're renting.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Input
                        id="condition"
                        placeholder="Excellent, Like New, Good"
                        {...register('condition')}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantityAvailable">Quantity Available *</Label>
                      <Input
                        id="quantityAvailable"
                        type="number"
                        min="1"
                        {...register('quantityAvailable', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                      {errors.quantityAvailable && (
                        <p className="text-sm text-destructive">{errors.quantityAvailable.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Images</h3>
                <ImageUpload images={images} onChange={setImages} maxImages={10} maxSizeMB={5} />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Pricing & Rental Terms</h3>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricingType">Pricing Type *</Label>
                      <Select
                        defaultValue="daily"
                        onValueChange={(value: any) => setValue('pricingType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="basePrice">
                        Base Price * ({pricingType === 'hourly' ? 'per hour' : pricingType === 'daily' ? 'per day' : 'per week'})
                      </Label>
                      <Input
                        id="basePrice"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="0.00"
                        {...register('basePrice', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                      {errors.basePrice && (
                        <p className="text-sm text-destructive">{errors.basePrice.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minRentalDuration">
                        Minimum Rental ({pricingType === 'hourly' ? 'hours' : pricingType === 'daily' ? 'days' : 'weeks'}) *
                      </Label>
                      <Input
                        id="minRentalDuration"
                        type="number"
                        min="1"
                        {...register('minRentalDuration', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxRentalDuration">
                        Maximum Rental ({pricingType === 'hourly' ? 'hours' : pricingType === 'daily' ? 'days' : 'weeks'})
                      </Label>
                      <Input
                        id="maxRentalDuration"
                        type="number"
                        min="1"
                        placeholder="No limit"
                        {...register('maxRentalDuration', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="depositAmount">Security Deposit</Label>
                      <Input
                        id="depositAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...register('depositAmount', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Optional refundable deposit held during rental
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="replacementValue">Replacement Value</Label>
                      <Input
                        id="replacementValue"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...register('replacementValue', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Cost to replace if damaged/lost
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cancellationPolicy">Cancellation Policy *</Label>
                    <Select
                      defaultValue="moderate"
                      onValueChange={(value: any) => setValue('cancellationPolicy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flexible">
                          Flexible - Full refund 24 hours before
                        </SelectItem>
                        <SelectItem value="moderate">
                          Moderate - Full refund 7 days before
                        </SelectItem>
                        <SelectItem value="strict">
                          Strict - 50% refund 14 days before
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <VariantForm
                variants={variants}
                onAdd={(variant) => setVariants([...variants, variant])}
                onRemove={(index) => setVariants(variants.filter((_, i) => i !== index))}
                onUpdate={(index, variant) =>
                  setVariants(variants.map((v, i) => (i === index ? variant : v)))
                }
              />

              <AddOnForm
                addOns={addOns}
                onAdd={(addOn) => setAddOns([...addOns, addOn])}
                onRemove={(index) => setAddOns(addOns.filter((_, i) => i !== index))}
                onUpdate={(index, addOn) =>
                  setAddOns(addOns.map((a, i) => (i === index ? addOn : a)))
                }
              />

              <AvailabilityCalendar
                blockedDates={blockedDates}
                onAddBlockedDate={(date) => setBlockedDates([...blockedDates, date])}
                onRemoveBlockedDate={(date) =>
                  setBlockedDates(blockedDates.filter(d => d.toDateString() !== date.toDateString()))
                }
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Create Listing
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/sell/listings">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
