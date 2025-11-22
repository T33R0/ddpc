'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Loader2, ExternalLink, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card';
import { Label } from '@repo/ui/label';

// Define interface for IssueReport
interface IssueReport {
  id: string;
  user_email: string | null;
  page_url: string;
  description: string;
  screenshot_url: string | null;
  resolved: boolean;
  created_at: string;
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('issue_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'unresolved') {
        query = query.eq('resolved', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filter]);

  const toggleResolved = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('issue_reports')
        .update({ resolved: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Issue marked as ${!currentStatus ? 'resolved' : 'unresolved'}`);
      
      // Update local state
      setIssues(issues.map(issue => 
        issue.id === id ? { ...issue, resolved: !currentStatus } : issue
      ));
      
      // If filtering by unresolved and we just resolved it, it should disappear from view
      // but keeping it visible until refresh or filter change might be better UX, 
      // strictly speaking "filters appropriately" implies it should disappear if filter is 'unresolved'.
      if (filter === 'unresolved' && !currentStatus === true) {
        setIssues(prev => prev.filter(i => i.id !== id));
      }

    } catch (error) {
      console.error('Error updating issue:', error);
      toast.error('Failed to update issue status');
    }
  };

  return (
    <div className="space-y-6 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Issue Reports</h1>
          <p className="text-muted-foreground">
            Manage reported problems and feedback.
          </p>
        </div>
        
        <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-2 rounded-lg border">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="filter-all"
              name="filter"
              value="all"
              checked={filter === 'all'}
              onChange={() => setFilter('all')}
              className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
            />
            <Label htmlFor="filter-all" className="cursor-pointer">All</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="filter-unresolved"
              name="filter"
              value="unresolved"
              checked={filter === 'unresolved'}
              onChange={() => setFilter('unresolved')}
              className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
            />
            <Label htmlFor="filter-unresolved" className="cursor-pointer">Unresolved</Label>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            {issues.length} {filter} issue{issues.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No issues found.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Page</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Image</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((issue) => (
                    <tr key={issue.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="px-6 py-4">
                        <Badge variant={issue.resolved ? "secondary" : "destructive"}>
                          {issue.resolved ? 'Resolved' : 'Open'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">{issue.user_email || 'Anonymous'}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={issue.page_url}>
                        <a href={issue.page_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          View Page <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="line-clamp-3" title={issue.description}>
                          {issue.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {issue.screenshot_url ? (
                          <a 
                            href={issue.screenshot_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ImageIcon className="h-4 w-4" />
                            Image
                          </a>
                        ) : (
                          <span className="text-gray-400 flex items-center gap-1 cursor-not-allowed">
                            <ImageIcon className="h-4 w-4" />
                            Image
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleResolved(issue.id, issue.resolved)}
                          className={issue.resolved ? "text-green-600" : "text-orange-600"}
                        >
                          {issue.resolved ? (
                            <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Re-open</span>
                          ) : (
                            <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Resolve</span>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
