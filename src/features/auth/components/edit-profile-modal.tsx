'use client';

import { Camera, Loader } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { Id } from '@/../convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useGenerateUploadUrl } from '@/features/upload/api/use-generate-upload-url';
import { useObjectUrl } from '@/hooks/use-object-url';

import { useCurrentUser } from '../api/use-current-user';
import { useUpdateProfile } from '../api/use-update-profile';
import { useEditProfileModal } from '../store/use-edit-profile-modal';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const EditProfileModal = () => {
  const [open, setOpen] = useEditProfileModal();
  const { data: user } = useCurrentUser();

  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: generateUploadUrl } = useGenerateUploadUrl();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const isPending = isUploading || isUpdating;

  useEffect(() => {
    if (!open) return;

    setName(user?.name ?? '');
    setImage(null);
    setRemoveImage(false);
  }, [open, user?.name]);

  const imagePreview = useObjectUrl(image);

  const previewUrl = imagePreview ?? (removeImage ? undefined : user?.image);

  const onImageChange = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) return void toast.error('Please select an image file.');
    if (file.size > MAX_IMAGE_SIZE) return void toast.error('Image must be smaller than 5MB.');

    setImage(file);
    setRemoveImage(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      let storageId: Id<'_storage'> | undefined;

      if (image) {
        setIsUploading(true);

        const url = await generateUploadUrl({}, { throwError: true });

        if (!url) throw new Error('Url not found.');

        const result = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': image.type },
          body: image,
        });

        if (!result.ok) throw new Error('Failed to upload image.');

        ({ storageId } = await result.json());
      }

      await updateProfile({ name, image: storageId, removeImage }, { throwError: true });

      toast.success('Profile updated.');
      setOpen(false);
    } catch (error) {
      console.error('[EDIT_PROFILE]: ', error);
      toast.error('Failed to update profile.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !isPending && setOpen(value)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit your profile</DialogTitle>
          <DialogDescription>Your name and photo are visible to everyone in your workspaces.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
              className="group relative rounded-md"
              aria-label="Upload profile photo"
            >
              <Avatar className="size-20 rounded-md">
                <AvatarImage alt={name} src={previewUrl} className="object-cover" />
                <AvatarFallback className="rounded-md text-3xl">{name.charAt(0).toUpperCase() || '?'}</AvatarFallback>
              </Avatar>

              <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 opacity-0 transition group-hover:opacity-100">
                <Camera className="size-6 text-white" />
              </span>
            </button>

            <div className="flex flex-col items-start gap-1">
              <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => inputRef.current?.click()}>
                Upload photo
              </Button>

              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    setImage(null);
                    setRemoveImage(true);
                  }}
                >
                  Remove photo
                </Button>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onImageChange(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="profile-name" className="text-sm font-medium">
              Full name
            </label>
            <Input
              id="profile-name"
              disabled={isPending}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              placeholder="Your name"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button disabled={isPending || !name.trim()}>{isPending ? <Loader className="size-4 animate-spin" /> : 'Save changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
