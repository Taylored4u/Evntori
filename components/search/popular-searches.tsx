'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PopularSearch {
  search_term: string;
  search_count: number;
  category_id?: string;
  categories?: { name: string };
}

export function PopularSearches() {
  const router = useRouter();
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPopularSearches();
  }, []);

  const fetchPopularSearches = async () => {
    setIsLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('popular_searches')
        .select(`
          search_term,
          search_count,
          category_id,
          categories (name)
        `)
        .order('search_count', { ascending: false })
        .limit(8);

      setPopularSearches(data || []);
    } catch (error) {
      console.error('Error fetching popular searches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchClick = (searchTerm: string, categoryId?: string) => {
    const params = new URLSearchParams();
    params.set('q', searchTerm);
    if (categoryId) params.set('category', categoryId);

    router.push(`/search?${params.toString()}`);
  };

  if (isLoading || popularSearches.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Trending Searches
        </CardTitle>
        <CardDescription>
          Popular searches from other users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((search, index) => (
            <Badge
              key={`${search.search_term}-${index}`}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 transition-colors px-3 py-1.5"
              onClick={() => handleSearchClick(search.search_term, search.category_id || undefined)}
            >
              <Search className="h-3 w-3 mr-1.5" />
              {search.search_term}
              {search.categories && (
                <span className="ml-1.5 text-xs opacity-70">
                  in {search.categories.name}
                </span>
              )}
              <span className="ml-2 text-xs opacity-50">
                {search.search_count}
              </span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
