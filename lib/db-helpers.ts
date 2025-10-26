import { supabase } from './supabase/client';

export async function seedCategories() {
  const categories = [
    { name: 'Arches & Backdrops', slug: 'arches-backdrops', description: 'Ceremony arches, wedding backdrops, and photo booth backgrounds' },
    { name: 'Centerpieces & Decor', slug: 'centerpieces-decor', description: 'Table centerpieces, vases, and decorative items' },
    { name: 'Furniture', slug: 'furniture', description: 'Chairs, tables, benches, and seating arrangements' },
    { name: 'Lighting', slug: 'lighting', description: 'String lights, chandeliers, lanterns, and uplighting' },
    { name: 'Linens & Textiles', slug: 'linens-textiles', description: 'Table linens, napkins, runners, and fabric draping' },
    { name: 'Signage & Displays', slug: 'signage-displays', description: 'Welcome signs, seating charts, and display easels' },
    { name: 'Tableware', slug: 'tableware', description: 'Plates, glasses, flatware, and serving pieces' },
    { name: 'Ceremony Items', slug: 'ceremony-items', description: 'Unity candles, ring pillows, and aisle runners' },
  ];

  const { data: existing } = await supabase
    .from('categories')
    .select('slug');

  const existingSlugs = new Set(existing?.map((c: any) => c.slug) || []);
  const newCategories = categories.filter(c => !existingSlugs.has(c.slug));

  if (newCategories.length > 0) {
    await supabase
      .from('categories')
      .insert(newCategories as any);
  }

  return categories;
}
