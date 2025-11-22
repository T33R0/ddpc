'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AlertCircle, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@repo/ui/dialog';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Label } from '@repo/ui/label';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export function ReportProblem() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [pathname, isOpen]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let screenshotUrl = null;

      // Upload screenshot if exists
      if (screenshot) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('issue-attachments')
          .upload(filePath, screenshot);

        if (uploadError) {
          throw new Error('Failed to upload screenshot');
        }

        const { data: { publicUrl } } = supabase.storage
          .from('issue-attachments')
          .getPublicUrl(filePath);

        screenshotUrl = publicUrl;
      }

      // Insert report
      const { error: insertError } = await supabase
        .from('issue_reports')
        .insert({
          user_email: email || (user?.email ?? 'anonymous'),
          page_url: currentUrl,
          description,
          screenshot_url: screenshotUrl,
          resolved: false,
        });

      if (insertError) {
        throw insertError;
      }

      toast.success('Report submitted successfully');
      setIsOpen(false);
      setDescription('');
      setScreenshot(null);
      if (!user) setEmail('');
      
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-all duration-200 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        aria-label="Report a Problem"
      >
        <AlertCircle className="w-6 h-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report a Problem</DialogTitle>
            <DialogDescription>
              Help us improve by reporting issues you encounter.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              {!user && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="url">Page URL</Label>
                <Input
                  id="url"
                  value={currentUrl}
                  readOnly
                  className="bg-muted text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (max 500 chars)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="Describe the issue..."
                  maxLength={500}
                  className="min-h-[100px]"
                  required
                />
                <div className="text-xs text-right text-muted-foreground">
                  {description.length}/500
                </div>
              </div>

              <div className="space-y-2">
                <Label>Screenshot (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <Label
                    htmlFor="screenshot-upload"
                    className="flex items-center gap-2 cursor-pointer border border-input rounded-md px-3 py-2 hover:bg-accent transition-colors text-sm"
                  >
                    <Paperclip className="w-4 h-4" />
                    {screenshot ? screenshot.name : 'Upload Screenshot'}
                  </Label>
                  {screenshot && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setScreenshot(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

