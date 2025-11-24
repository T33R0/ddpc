'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '@/lib/auth';
import { getIssueReports, toggleIssueResolution } from '@/actions/admin';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastLoaded, setLastLoaded] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const { loading: authLoading } = useAuth();

  const PAGE_SIZE = 50;

  const fetchIssues = useCallback(async () => {
    if (authLoading) {
      return;
    }
    try {
      setLoading(true);
      setErrorMessage(null);

      const { data, count } = await getIssueReports(page, PAGE_SIZE, filter);

      setIssues(data || []);
      if (typeof count === 'number') {
        setTotalCount(count);
      }
      setLastLoaded(new Date().toISOString());
    } catch (error) {
      console.error('Error fetching issues:', error);
      const message = 'Failed to load issues';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filter, page, authLoading]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const toggleResolved = async (id: string, currentStatus: boolean) => {
    try {
      await toggleIssueResolution(id, !currentStatus);

      toast.success(`Issue marked as ${!currentStatus ? 'resolved' : 'unresolved'}`);

      // Update local state
      setIssues(issues.map(issue =>
        issue.id === id ? { ...issue, resolved: !currentStatus } : issue
      ));

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
          {lastLoaded && (
            <p className="text-xs text-muted-foreground mt-1">
              Last updated {new Date(lastLoaded).toLocaleTimeString()}
            </p>
          )}
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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIssues}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            {(totalCount ?? issues.length)} {filter} issue{(totalCount ?? issues.length) !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
              <div>
                <Button size="sm" variant="outline" onClick={fetchIssues} disabled={loading}>
                  Try again
                </Button>
              </div>
            </div>
          )}
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
              {totalCount && totalCount > PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                  <span className="text-sm text-muted-foreground">
                    Showing {page * PAGE_SIZE + 1}-
                    {page * PAGE_SIZE + issues.length} of {totalCount}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                      disabled={page === 0 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={(page + 1) * PAGE_SIZE >= totalCount || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
