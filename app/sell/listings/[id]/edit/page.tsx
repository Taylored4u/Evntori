'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [lenderProfile, setLenderProfile] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [addOns, setAddOns] = useState<AddOnInput[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ListingInput>({
    resolver: zodResolver(listingSchema),
  });

  const pricingType = watch('pricingType');

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      try {
        const { data: lender } = (await supabase
          .from('lender_profiles')
          .select('*')
          .eq('user_id', profile.id)
          .single()) as any;

        setLenderProfile(lender);

        const { data: listing } = (await supabase
          .from('listings')
          .select(`
            *,
            listing_images (*),
            listing_variants (*),
            listing_add_ons (*),
            listing_availability (*),
            deposits (*)
          `)
          .eq('id', listingId)
          .eq('lender_id', lender.id)
          .single()) as any;

        if (!listing) {
          toast.error('Listing not found');
          router.push('/sell/listings');
          return;
        }

        reset({
          title: listing.title,
          description: listing.description,
          categoryId: listing.category_id,
          condition: listing.condition || '',
          replacementValue: listing.replacement_value || undefined,
          basePrice: listing.base_price,
          pricingType: listing.pricing_type,
          minRentalDuration: listing.min_rental_duration,
          maxRentalDuration: listing.max_rental_duration || undefined,
          cancellationPolicy: listing.cancellation_policy,
          quantityAvailable: listing.quantity_available,
          depositAmount: listing.deposits?.[0]?.amount || undefined,
        });

        setExistingImages(listing.listing_images || []);
        setVariants(
          (listing.listing_variants || []).map((v: any) => ({
            name: v.name,
            sku: v.sku || '',
            priceAdjustment: v.price_adjustment,
            quantity: v.quantity,
          }))
        );
        setAddOns(
          (listing.listing_add_ons || []).map((a: any) => ({
            name: a.name,
            description: a.description || '',
            price: a.price,
            type: a.type,
            isRequired: a.is_required,
          }))
        );
        setBlockedDates(
          (listing.listing_availability || [])
            .filter((avail: any) => !avail.is_available)
            .map((avail: any) => new Date(avail.date))
        );

        await seedCategories();
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        setCategories(cats || []);
      } catch (error) {
        console.error('Error fetching listing:', error);
        toast.error('Failed to load listing');
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [profile, listingId, reset, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + imageFiles.length + files.length;

    if (totalImages > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    setImageFiles([...imageFiles, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: string) => {
    try {
      await supabase.from('listing_images').delete().eq('id', imageId);
      setExistingImages(existingImages.filter(img => img.id !== imageId));
      toast.success('Image removed');
    } catch (error) {
      toast.error('Failed to remove image');
    }
  };

  const onSubmit = async (data: ListingInput) => {
    if (!lenderProfile) {
      toast.error('Lender profile not found');
      return;
    }

    if (existingImages.length === 0 && imageFiles.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    setIsLoading(true);

    try {
      await (supabase
        .from('listings')
        .update as any)({
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
      })
        .eq('id', listingId);

      if (imagePreviews.length > 0) {
        const imageInserts = imagePreviews.map((preview, index) => ({
          listing_id: listingId,
          url: preview,
          alt_text: `${data.title} - Image ${existingImages.length + index + 1}`,
          sort_order: existingImages.length + index,
          is_cover: existingImages.length === 0 && index === 0,
        }));
        await supabase.from('listing_images').insert(imageInserts as any);
      }

      await supabase.from('deposits').delete().eq('listing_id', listingId);
      if (data.depositAmount && data.depositAmount > 0) {
        await supabase.from('deposits').insert({
          listing_id: listingId,
          amount: data.depositAmount,
          type: 'fixed',
          refundable: true,
        } as any);
      }

      await supabase.from('listing_variants').delete().eq('listing_id', listingId);
      if (variants.length > 0) {
        const variantInserts = variants.map(v => ({
          listing_id: listingId,
          name: v.name,
          sku: v.sku || null,
          price_adjustment: v.priceAdjustment,
          quantity: v.quantity,
        }));
        await supabase.from('listing_variants').insert(variantInserts as any);
      }

      await supabase.from('listing_add_ons').delete().eq('listing_id', listingId);
      if (addOns.length > 0) {
        const addOnInserts = addOns.map(a => ({
          listing_id: listingId,
          name: a.name,
          description: a.description || null,
          price: a.price,
          type: a.type || null,
          is_required: a.isRequired,
        }));
        await supabase.from('listing_add_ons').insert(addOnInserts as any);
      }

      await supabase.from('listing_availability').delete().eq('listing_id', listingId);
      if (blockedDates.length > 0) {
        const availabilityInserts = blockedDates.map(date => ({
          listing_id: listingId,
          date: date.toISOString().split('T')[0],
          is_available: false,
        }));
        await supabase.from('listing_availability').insert(availabilityInserts as any);
      }

      toast.success('Listing updated successfully!');
      router.push('/sell/listings');
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error('Failed to update listing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lenderProfile) {
    return null;
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
          <CardTitle className="text-3xl font-serif">Edit Listing</CardTitle>
          <CardDescription>
            Update your rental item details
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
                      {...register('title')}
                      disabled={isLoading}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category *</Label>
                    <Select
                      defaultValue={watch('categoryId')}
                      onValueChange={(value) => setValue('categoryId', value)}
                    >
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
                      rows={6}
                      {...register('description')}
                      disabled={isLoading}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <Input
                        id="condition"
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
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Images</h3>

                {existingImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {existingImages.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.url}
                          alt={image.alt_text}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(image.id)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                        {image.is_cover && (
                          <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            Cover
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <Label htmlFor="images" className="cursor-pointer">
                    <span className="text-primary hover:underline">Click to upload more</span>
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`New ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Pricing & Rental Terms</h3>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricingType">Pricing Type *</Label>
                      <Select
                        defaultValue={watch('pricingType')}
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
                      <Label htmlFor="basePrice">Base Price *</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        min="1"
                        step="0.01"
                        {...register('basePrice', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minRentalDuration">Minimum Rental *</Label>
                      <Input
                        id="minRentalDuration"
                        type="number"
                        min="1"
                        {...register('minRentalDuration', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxRentalDuration">Maximum Rental</Label>
                      <Input
                        id="maxRentalDuration"
                        type="number"
                        min="1"
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
                        {...register('depositAmount', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="replacementValue">Replacement Value</Label>
                      <Input
                        id="replacementValue"
                        type="number"
                        min="0"
                        step="0.01"
                        {...register('replacementValue', { valueAsNumber: true })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cancellationPolicy">Cancellation Policy *</Label>
                    <Select
                      defaultValue={watch('cancellationPolicy')}
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
                Save Changes
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
