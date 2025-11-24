'use client';

import { useState, useEffect } from 'react';
import { Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Textarea } from '@repo/ui/textarea';
import { Label } from '@repo/ui/label';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface IssueReportFormProps {
  defaultUrl?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export function IssueReportForm({ defaultUrl = '', onSuccess, onCancel, isModal = false }: IssueReportFormProps) {
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [url, setUrl] = useState(defaultUrl);

  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (defaultUrl) {
      setUrl(defaultUrl);
    }
  }, [defaultUrl]);

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

      // Upload screenshot if exists (keep client-side for now)
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

      // Use Server Action for DB insert
      const formData = new FormData();
      formData.append('description', description);
      formData.append('url', url);
      formData.append('email', email);
      if (screenshotUrl) {
        formData.append('screenshotUrl', screenshotUrl);
      }

      // Dynamically import the action to avoid build issues if not fully set up
      const { submitIssueReport } = await import('@/actions/issues');
      const result = await submitIssueReport(null, formData);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success('Report submitted successfully');
      setDescription('');
      setScreenshot(null);
      if (!user) setEmail('');

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          value={url}
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

      <div className={`flex ${isModal ? 'justify-end gap-2 pt-4 border-t' : 'flex-col gap-2'}`}>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className={!isModal ? "w-full" : ""}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className={!isModal ? "w-full" : ""}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Report'
          )}
        </Button>
      </div>
    </form>
  );
}

