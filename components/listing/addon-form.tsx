'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addOnSchema, AddOnInput } from '@/lib/validations/listing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CreditCard as Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddOnFormProps {
  addOns: AddOnInput[];
  onAdd: (addOn: AddOnInput) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, addOn: AddOnInput) => void;
}

export function AddOnForm({ addOns, onAdd, onRemove, onUpdate }: AddOnFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddOnInput>({
    resolver: zodResolver(addOnSchema),
    defaultValues: {
      price: 0,
      isRequired: false,
    },
  });

  const isRequired = watch('isRequired');

  const onSubmit = (data: AddOnInput) => {
    if (editingIndex !== null) {
      onUpdate(editingIndex, data);
      toast.success('Add-on updated');
    } else {
      onAdd(data);
      toast.success('Add-on added');
    }
    reset({ price: 0, isRequired: false });
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleEdit = (index: number) => {
    const addOn = addOns[index];
    reset(addOn);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleCancel = () => {
    reset({ price: 0, isRequired: false });
    setShowForm(false);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Add-Ons (Optional)</h3>
          <p className="text-sm text-muted-foreground">
            Offer delivery, setup, or other services
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        )}
      </div>

      {addOns.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {addOns.map((addOn, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold">{addOn.name}</div>
                      {addOn.isRequired && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </div>
                    {addOn.description && (
                      <div className="text-xs text-muted-foreground mb-2">
                        {addOn.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="default">${addOn.price}</Badge>
                      {addOn.type && (
                        <Badge variant="outline" className="capitalize">
                          {addOn.type}
                        </Badge>
                      )}
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
              {editingIndex !== null ? 'Edit Add-On' : 'Add New Service'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addOnName">Name *</Label>
                <Input
                  id="addOnName"
                  placeholder="e.g., Delivery, Setup, Cleaning"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="addOnDescription">Description</Label>
                <Textarea
                  id="addOnDescription"
                  placeholder="Describe what's included in this service..."
                  rows={2}
                  {...register('description')}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addOnPrice">Price *</Label>
                  <Input
                    id="addOnPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addOnType">Type</Label>
                  <Select onValueChange={(value: any) => setValue('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="setup">Setup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRequired"
                  checked={isRequired}
                  onCheckedChange={(checked) => setValue('isRequired', !!checked)}
                />
                <Label htmlFor="isRequired" className="cursor-pointer">
                  This service is required (automatically added to bookings)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingIndex !== null ? 'Update' : 'Add'} Service
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
