'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@repo/ui/modal';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Label } from '@repo/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/avatar';
import { toast } from 'react-hot-toast';
import { submitTestimonial } from '../actions/testimonials';

interface TestimonialModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    displayName: string;
    avatarUrl?: string;
  };
}

const ROLES = [
  "Gearhead", "Backyard Mechanic", "Shop Owner", "Responsible Maintainer",
  "Weekend Warrior", "Track Day Hero", "Detailing Obsessive", "OEM+ Purist",
  "Drift Missile Pilot", "Restomod Builder", "Hyper-miler", "V8 Evangelist",
  "Rotary Masochist", "Stance Nation", "Overlander", "Sim Racer",
  "Project Car Hoarder", "Wrench Turner", "Lube Tech", "Sunday Driver"
];

export function TestimonialModal({ isOpen, onOpenChange, user }: TestimonialModalProps) {
  const [role, setRole] = useState(ROLES[0] || 'Gearhead');
  const [content, setContent] = useState('');
  const [displayName, setDisplayName] = useState(user.displayName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('display_name', displayName);
      formData.append('role', role);
      formData.append('content', content);
      if (user.avatarUrl) {
        formData.append('avatar_url', user.avatarUrl);
      }

      const result = await submitTestimonial(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Testimonial submitted for review!');
        onOpenChange(false);
        setContent(''); // Reset content
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-[425px]">
        <ModalHeader>
          <ModalTitle>Give a Testimonial</ModalTitle>
          <ModalDescription>
            Share your experience with ddpc. Your feedback helps us grow!
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                <Label htmlFor="displayName" className="text-xs text-muted-foreground">Display Name</Label>
                <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-8"
                />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-popover text-popover-foreground">{r}</option>
                ))}
                </select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="content">Your Feedback</Label>
                <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tell us what you think..."
                className="min-h-[100px]"
                maxLength={500}
                required
                />
                <div className="text-xs text-right text-muted-foreground">
                {content.length}/500
                </div>
            </div>

            <ModalFooter>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Testimonial'}
                </Button>
            </ModalFooter>
            </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
