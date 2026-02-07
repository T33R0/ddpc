'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@repo/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { Search, Calendar, DollarSign, Gauge, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryState } from 'nuqs'; // Should use standard next/navigation hooks or nuqs if available. Checking deps... keeping it simple with standard hooks for now to avoid dep check
import { useRouter, useSearchParams } from 'next/navigation';
import { Job } from './types';
import { CompletedJobDrawer } from './components/CompletedJobDrawer';

interface ShopLogPageClientProps {
  initialJobs: Job[];
}

export function ShopLogPageClient({ initialJobs }: ShopLogPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [filter, setFilter] = useState('');
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [jobs, setJobs] = useState<Job[]>(initialJobs);

    // Filter jobs client-side for immediate feedback (or could rely on server search param)
    // For now, let's do client-side filtering on the initial set, but update URL for shareability
    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(filter.toLowerCase()) || 
        (job.notes && job.notes.toLowerCase().includes(filter.toLowerCase()))
    );

    // Handle "job" query param to open specific job on load
    useEffect(() => {
        const jobId = searchParams.get('job');
        if (jobId && !selectedJob) {
            const jobToOpen = initialJobs.find(j => j.id === jobId);
            if (jobToOpen) {
                setSelectedJob(jobToOpen);
            }
        }
    }, [searchParams, initialJobs]);

    const handleJobClick = (job: Job) => {
        setSelectedJob(job);
        // Update URL without refresh
        const params = new URLSearchParams(searchParams);
        params.set('job', job.id);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const handleClose = () => {
        setSelectedJob(null);
        const params = new URLSearchParams(searchParams);
        params.delete('job');
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const handleSearch = (val: string) => {
        setFilter(val);
        // Consider updating URL for filter too if desired
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input 
                        placeholder="Search completed jobs..." 
                        className="pl-9"
                        value={filter}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Found
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                        <Card 
                            key={job.id} 
                            onClick={() => handleJobClick(job)}
                            className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                        >
                            <CardHeader className="py-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                                        {job.title}
                                    </CardTitle>
                                    <div className="text-sm text-muted-foreground line-clamp-1">
                                        {job.notes || "No additional notes"}
                                    </div>
                                    </div>
                                    {job.date_completed && (
                                        <Badge variant="outline" className="shrink-0">
                                            {format(new Date(job.date_completed), 'MMM d, yyyy')}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pb-4 pt-0 flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Gauge className="w-4 h-4" />
                                    {job.odometer ? `${job.odometer.toLocaleString()} mi` : '---'}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4" />
                                    {job.cost_total ? `$${job.cost_total.toFixed(2)}` : '---'}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-60">
                        <AlertCircle className="w-12 h-12 text-muted-foreground" />
                        <div className="text-lg font-medium">No jobs found</div>
                        <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
                    </div>
                )}
            </div>

            <CompletedJobDrawer
                isOpen={!!selectedJob}
                onClose={handleClose}
                job={selectedJob}
            />
        </div>
    );
}
