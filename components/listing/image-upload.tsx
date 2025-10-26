'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, Star, Loader as Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ImageFile {
  file: File;
  preview: string;
  isCover: boolean;
}

interface ImageUploadProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      toast.error(`${file.name}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`);
      return false;
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`${file.name}: File too large. Maximum size is ${maxSizeMB}MB.`);
      return false;
    }

    return true;
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);

    if (images.length + fileArray.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const validFiles = fileArray.filter(validateFile);
    if (validFiles.length === 0) return;

    const newImages: ImageFile[] = [];
    let processed = 0;

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push({
          file,
          preview: reader.result as string,
          isCover: images.length === 0 && newImages.length === 0,
        });
        processed++;

        if (processed === validFiles.length) {
          onChange([...images, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [images, maxImages, onChange]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);

    if (images[index].isCover && newImages.length > 0) {
      newImages[0].isCover = true;
    }

    onChange(newImages);
  };

  const setCoverImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isCover: i === index,
    }));
    onChange(newImages);
    toast.success('Cover image updated');
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border',
          images.length >= maxImages && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
          disabled={images.length >= maxImages}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-secondary p-3">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <label
              htmlFor="image-upload"
              className={cn(
                'text-sm font-medium cursor-pointer hover:text-primary transition-colors',
                images.length >= maxImages && 'cursor-not-allowed'
              )}
            >
              Click to upload
            </label>
            <span className="text-sm text-muted-foreground"> or drag and drop</span>
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WebP up to {maxSizeMB}MB ({images.length}/{maxImages} images)
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="group relative overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={image.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {image.isCover && (
                    <Badge
                      variant="default"
                      className="absolute top-2 left-2 bg-primary/90 backdrop-blur"
                    >
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Cover
                    </Badge>
                  )}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!image.isCover && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setCoverImage(index)}
                        title="Set as cover image"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(index)}
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No images uploaded yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload at least one image to continue
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
