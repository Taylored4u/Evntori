'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { seedCategories } from '@/lib/db-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader as Loader2, Search, SlidersHorizontal, Package, MapPin, Star, Calendar as CalendarIcon, DollarSign, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { FavoriteButton } from '@/components/listing/favorite-button';
import { SavedSearches } from '@/components/search/saved-searches';
import { PopularSearches } from '@/components/search/popular-searches';
import { useAuth } from '@/lib/auth/context';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [showFilters, setShowFilters] = useState(false);

  const [priceRange, setPriceRange] = useState([
    parseInt(searchParams.get('minPrice') || '0'),
    parseInt(searchParams.get('maxPrice') || '1000')
  ]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [hasDateFilter, setHasDateFilter] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchMaxPrice();
  }, []);

  useEffect(() => {
    fetchListings();
    updateURLParams();
  }, [selectedCategory, sortBy, priceRange, hasDateFilter, dateRange, location]);

  const fetchCategories = async () => {
    await seedCategories();
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    setCategories(data || []);
  };

  const fetchMaxPrice = async () => {
    const { data } = (await supabase
      .from('listings')
      .select('base_price')
      .eq('status', 'active')
      .order('base_price', { ascending: false })
      .limit(1)) as any;

    if (data && data.length > 0) {
      const max = Math.ceil(data[0].base_price / 100) * 100;
      setMaxPrice(max);
      setPriceRange([0, max]);
    }
  };

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('listings')
        .select(`
          *,
          listing_images (url, is_cover),
          categories (name, slug),
          lender_profiles (
            business_name,
            rating_avg,
            city,
            state
          )
        `)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      query = query.gte('base_price', priceRange[0]).lte('base_price', priceRange[1]);

      switch (sortBy) {
        case 'price_low':
          query = query.order('base_price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('base_price', { ascending: false });
          break;
        case 'popular':
          query = query.order('booking_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data: allListings } = (await query) as any;
      let filteredListings = allListings || [];

      if (hasDateFilter && dateRange?.from && dateRange?.to) {
        const availableListings = [];

        for (const listing of filteredListings) {
          const { data: bookings } = await supabase
            .from('bookings')
            .select('start_date, end_date')
            .eq('listing_id', listing.id)
            .in('status', ['pending', 'confirmed', 'active'])
            .or(`start_date.lte.${dateRange.to.toISOString()},end_date.gte.${dateRange.from.toISOString()}`);

          const hasConflict = bookings?.some((booking: any) => {
            const bookingStart = new Date(booking.start_date);
            const bookingEnd = new Date(booking.end_date);
            return (
              (dateRange.from! >= bookingStart && dateRange.from! <= bookingEnd) ||
              (dateRange.to! >= bookingStart && dateRange.to! <= bookingEnd) ||
              (dateRange.from! <= bookingStart && dateRange.to! >= bookingEnd)
            );
          });

          if (!hasConflict) {
            availableListings.push(listing);
          }
        }

        filteredListings = availableListings;
      }

      if (location) {
        filteredListings = filteredListings.filter((listing: any) => {
          const lender = listing.lender_profiles;
          return (
            lender?.city?.toLowerCase().includes(location.toLowerCase()) ||
            lender?.state?.toLowerCase().includes(location.toLowerCase())
          );
        });
      }

      setListings(filteredListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateURLParams = () => {
    const params = new URLSearchParams();

    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < maxPrice) params.set('maxPrice', priceRange[1].toString());
    if (location) params.set('location', location);

    const newURL = params.toString() ? `/search?${params.toString()}` : '/search';
    router.replace(newURL, { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
    updateURLParams();
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSortBy('newest');
    setSearchTerm('');
    setPriceRange([0, maxPrice]);
    setDateRange(undefined);
    setHasDateFilter(false);
    setLocation('');
    router.replace('/search', { scroll: false });
  };

  const activeFilterCount = [
    selectedCategory !== 'all',
    priceRange[0] > 0 || priceRange[1] < maxPrice,
    hasDateFilter,
    location.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/20 to-background">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1">
              <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <span className="text-foreground">evnt</span>
                <span className="text-primary">o</span>
                <span className="text-foreground">ri</span>
              </span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/search" className="text-sm hover:text-primary transition">
                Browse
              </Link>
              <Link href="/sell" className="text-sm hover:text-primary transition">
                Become a Lender
              </Link>
              <Button asChild size="sm">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Find Your Perfect Rentals</h1>
          <p className="text-muted-foreground">
            Browse thousands of wedding items available for rent
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">{activeFilterCount}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Price Range</Label>
                    <span className="text-sm text-muted-foreground">
                      ${priceRange[0]} - ${priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={maxPrice}
                    step={10}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="py-4"
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <span>Per day pricing</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Availability</Label>
                    {hasDateFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setHasDateFilter(false);
                          setDateRange(undefined);
                        }}
                        className="h-6 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dateRange?.from && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange?.to ? (
                            <>
                              {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
                            </>
                          ) : (
                            format(dateRange.from, 'MMM dd, yyyy')
                          )
                        ) : (
                          'Select dates'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          setDateRange(range);
                          setHasDateFilter(!!range?.from && !!range?.to);
                        }}
                        numberOfMonths={2}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="City or State"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onBlur={fetchListings}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClearFilters}
                  disabled={activeFilterCount === 0}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>

            {profile && (
              <div className="mt-6 space-y-4">
                <SavedSearches
                  currentSearchParams={{
                    q: searchTerm,
                    category: selectedCategory !== 'all' ? selectedCategory : undefined,
                    minPrice: priceRange[0],
                    maxPrice: priceRange[1],
                    location,
                    sort: sortBy,
                  }}
                />
                <PopularSearches />
              </div>
            )}

            {!profile && (
              <div className="mt-6">
                <PopularSearches />
              </div>
            )}
          </aside>

          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for wedding items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit">Search</Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="lg:hidden relative"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="default"
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="px-3 py-1">
                    {categories.find(c => c.id === selectedCategory)?.name}
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                  <Badge variant="secondary" className="px-3 py-1">
                    ${priceRange[0]} - ${priceRange[1]}
                    <button
                      onClick={() => setPriceRange([0, maxPrice])}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {hasDateFilter && dateRange?.from && dateRange?.to && (
                  <Badge variant="secondary" className="px-3 py-1">
                    {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
                    <button
                      onClick={() => {
                        setHasDateFilter(false);
                        setDateRange(undefined);
                      }}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {location && (
                  <Badge variant="secondary" className="px-3 py-1">
                    {location}
                    <button
                      onClick={() => {
                        setLocation('');
                        fetchListings();
                      }}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : listings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No listings found</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Try adjusting your search or filters
                  </p>
                  <Button onClick={handleClearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {listings.length} {listings.length === 1 ? 'item' : 'items'} found
                  </div>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {listings.map((listing) => {
                    const coverImage = listing.listing_images?.find((img: any) => img.is_cover);
                    const lender = listing.lender_profiles;

                    return (
                      <Link key={listing.id} href={`/listing/${listing.id}`}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                          <div className="aspect-[4/3] relative bg-secondary">
                            {coverImage ? (
                              <img
                                src={coverImage.url}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Package className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                              <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                                {listing.categories?.name}
                              </Badge>
                              <div className="bg-background/80 backdrop-blur rounded-full">
                                <FavoriteButton listingId={listing.id} />
                              </div>
                            </div>
                          </div>

                          <CardHeader>
                            <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {listing.description}
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="space-y-3">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold">
                                ${listing.base_price}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                / {listing.pricing_type}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">
                                  {lender?.city && lender?.state
                                    ? `${lender.city}, ${lender.state}`
                                    : lender?.business_name || 'Verified Lender'}
                                </span>
                              </div>
                              {lender?.rating_avg > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">
                                    {lender.rating_avg.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="pt-2">
                              <Button className="w-full" size="sm">
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
