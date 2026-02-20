'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@repo/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { Search, Calendar, DollarSign, Gauge, AlertCircle, Wrench } from 'lucide-react';
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

            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[1.25rem] before:-translate-x-px md:before:ml-[1.25rem] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border/0 before:via-border/80 before:to-border/0 py-4">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                        <div key={job.id} className="relative flex items-start gap-4 group">
                            <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-background border border-background shadow-xs shrink-0 transition-transform duration-300 group-hover:scale-110 mt-1">
                                <div className="w-8 h-8 bg-info/20 rounded-full flex items-center justify-center">
                                    <Wrench className="w-4 h-4 text-info" />
                                </div>
                            </div>

                            <Card
                                onClick={() => handleJobClick(job)}
                                className="flex-1 bg-card rounded-2xl text-foreground hover:bg-accent/5 transition-colors border border-border cursor-pointer active:scale-[0.99] shadow-sm group-hover:shadow-md"
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                                <span className="text-xs font-black uppercase tracking-wider text-info">
                                                    Job
                                                </span>
                                            </div>
                                            <CardTitle className="text-lg font-bold text-foreground mb-1 leading-tight group-hover:text-primary transition-colors">
                                                {job.title}
                                            </CardTitle>
                                            <div className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mt-2">
                                                {job.notes || "No additional notes"}
                                            </div>
                                        </div>

                                        <div className="text-right flex-shrink-0 flex flex-col items-end">
                                            {job.date_completed ? (
                                                <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md border border-border/50">
                                                    {format(new Date(job.date_completed), 'MMM d, yyyy')}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md border border-border/50">
                                                    Pending
                                                </span>
                                            )}
                                            {job.odometer && (
                                                <span className="text-[10px] font-semibold text-muted-foreground mt-2 flex items-center gap-1 opacity-80">
                                                    <Gauge className="w-3 h-3" />
                                                    {job.odometer.toLocaleString()} mi
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                {job.cost_total ? (
                                    <CardContent className="pt-0">
                                        <div className="flex justify-between items-center border-t border-border/40 pt-3 mt-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Cost</span>
                                            <span className="text-sm font-bold text-foreground">
                                                ${job.cost_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </CardContent>
                                ) : null}
                            </Card>
                        </div>
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
