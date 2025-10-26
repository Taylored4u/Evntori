'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { variantSchema, VariantInput } from '@/lib/validations/listing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, CreditCard as Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface VariantFormProps {
  variants: VariantInput[];
  onAdd: (variant: VariantInput) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, variant: VariantInput) => void;
}

export function VariantForm({ variants, onAdd, onRemove, onUpdate }: VariantFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VariantInput>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      priceAdjustment: 0,
      quantity: 1,
    },
  });

  const onSubmit = (data: VariantInput) => {
    if (editingIndex !== null) {
      onUpdate(editingIndex, data);
      toast.success('Variant updated');
    } else {
      onAdd(data);
      toast.success('Variant added');
    }
    reset();
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    const variant = variants[index];
    reset(variant);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleCancel = () => {
    reset();
    setShowForm(false);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Variants (Optional)</h3>
          <p className="text-sm text-muted-foreground">
            Add size, color, or style options with different pricing
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Variant
          </Button>
        )}
      </div>

      {variants.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {variants.map((variant, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">{variant.name}</div>
                    {variant.sku && (
                      <div className="text-xs text-muted-foreground">SKU: {variant.sku}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={variant.priceAdjustment >= 0 ? 'default' : 'secondary'}>
                        {variant.priceAdjustment >= 0 ? '+' : ''}${variant.priceAdjustment}
                      </Badge>
                      <Badge variant="outline">{variant.quantity} available</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemove(index)}
                      className="text-destructive hover:text-destructive"
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

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingIndex !== null ? 'Edit Variant' : 'Add New Variant'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="variantName">Name *</Label>
                  <Input
                    id="variantName"
                    placeholder="e.g., Large, Gold, Round"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variantSku">SKU</Label>
                  <Input
                    id="variantSku"
                    placeholder="Optional"
                    {...register('sku')}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priceAdjustment">Price Adjustment</Label>
                  <Input
                    id="priceAdjustment"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('priceAdjustment', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add or subtract from base price (use negative for discount)
                  </p>
                  {errors.priceAdjustment && (
                    <p className="text-sm text-destructive">{errors.priceAdjustment.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variantQuantity">Quantity *</Label>
                  <Input
                    id="variantQuantity"
                    type="number"
                    min="1"
                    {...register('quantity', { valueAsNumber: true })}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-destructive">{errors.quantity.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingIndex !== null ? 'Update' : 'Add'} Variant
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
