'use client';

import { useState, useEffect } from 'react';
import { getAllTestimonials, toggleTestimonialApproval } from '@/actions/testimonials';
import { Button } from '@repo/ui/button';
import { Switch } from '@repo/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function TestimonialsAdminPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const data = await getAllTestimonials();
      setTestimonials(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load testimonials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setTestimonials(prev => prev.map(t =>
        t.id === id ? { ...t, is_approved: !currentStatus } : t
      ));

      const result = await toggleTestimonialApproval(id, !currentStatus);
      if (result.error) {
        throw new Error(result.error);
      }
      toast.success(currentStatus ? 'Testimonial hidden' : 'Testimonial approved');
    } catch (error) {
      toast.error('Failed to update status');
      // Revert optimistic update
      setTestimonials(prev => prev.map(t =>
        t.id === id ? { ...t, is_approved: currentStatus } : t
      ));
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading testimonials...</div>;
  }

  return (
    <div className="px-4 sm:px-0 max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Manage Testimonials</h1>
        <div className="text-sm text-muted-foreground">
            {testimonials.filter(t => t.is_approved).length} visible / {testimonials.length} total
        </div>
      </div>

      <div className="space-y-4">
        {testimonials.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No testimonials submitted yet.</p>
          </div>
        ) : (
          testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={`p-6 bg-card rounded-lg border ${testimonial.is_approved ? 'border-green-500/50' : 'border-border'} transition-colors`}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center space-y-2">
                  <Avatar className="h-16 w-16">
                    {testimonial.avatar_url && <AvatarImage src={testimonial.avatar_url} />}
                    <AvatarFallback>{testimonial.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-xs text-muted-foreground text-center">
                    {formatDistanceToNow(new Date(testimonial.created_at), { addSuffix: true })}
                  </div>
                </div>

                <div className="flex-grow space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg">{testimonial.display_name}</h3>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${testimonial.is_approved ? 'text-green-500' : 'text-yellow-500'}`}>
                        {testimonial.is_approved ? 'Visible' : 'Hidden'}
                      </span>
                      <Switch
                        checked={testimonial.is_approved}
                        onCheckedChange={() => handleToggle(testimonial.id, testimonial.is_approved)}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-md text-sm mt-2">
                    "{testimonial.content}"
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
