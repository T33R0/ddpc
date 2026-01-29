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
import { Textarea } from '@repo/ui/textarea';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
} from '@repo/ui/modal';
import { useAuth } from '@/lib/auth';
import { getIssueReports, toggleIssueResolution, updateIssueNotes } from '@/actions/admin';

// Define interface for IssueReport
interface IssueReport {
  id: string;
  user_email: string | null;
  page_url: string;
  description: string;
  screenshot_url: string | null;
  resolved: boolean;
  created_at: string;
  admin_notes?: string | null;
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastLoaded, setLastLoaded] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
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

      const newStatus = !currentStatus;
      toast.success(`Issue marked as ${newStatus ? 'resolved' : 'unresolved'}`);

      // Update local state
      const updateIssue = (issue: IssueReport) =>
        issue.id === id ? { ...issue, resolved: newStatus } : issue;

      setIssues(prev => prev.map(updateIssue));

      // Also update selected issue if open
      if (selectedIssue && selectedIssue.id === id) {
        setSelectedIssue(prev => prev ? { ...prev, resolved: newStatus } : null);
      }

      if (filter === 'unresolved' && newStatus === true) {
        // Delay removal slightly if it's the selected one so it doesn't disappear from modal instantly?
        // Actually, if filter is applied, we might want to remove it from the list.
        // But if modal is open, we keep it in modal state.
        setIssues(prev => prev.filter(i => i.id !== id));
      }

    } catch (error) {
      console.error('Error updating issue:', error);
      toast.error('Failed to update issue status');
    }
  };

  const handleRowClick = (issue: IssueReport) => {
    setSelectedIssue(issue);
    setNotes(issue.admin_notes || '');
  };

  const handleSaveNotes = async () => {
    if (!selectedIssue) return;
    try {
      setSavingNotes(true);
      await updateIssueNotes(selectedIssue.id, notes);

      // Update local state
      const updatedIssue = { ...selectedIssue, admin_notes: notes };
      setIssues(prev => prev.map(i => i.id === selectedIssue.id ? updatedIssue : i));
      setSelectedIssue(updatedIssue);

      toast.success('Notes saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6 pt-8">
      {/* Modal for Issue Details */}
      <Modal open={!!selectedIssue} onOpenChange={(open) => !open && setSelectedIssue(null)}>
        <ModalContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>Issue Details</ModalTitle>
            <ModalDescription>
              Reported on {selectedIssue && new Date(selectedIssue.created_at).toLocaleDateString()}
            </ModalDescription>
          </ModalHeader>

          {selectedIssue && (
            <ModalBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <Badge variant={selectedIssue.resolved ? "secondary" : "destructive"}>
                    {selectedIssue.resolved ? 'Resolved' : 'Open'}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">User</h4>
                  <div className="text-sm">{selectedIssue.user_email || 'Anonymous'}</div>
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Page URL</h4>
                  <a
                    href={selectedIssue.page_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 text-sm break-all"
                  >
                    {selectedIssue.page_url} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                  {selectedIssue.description}
                </div>
              </div>

              {selectedIssue.screenshot_url && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Screenshot</h4>
                  <div className="border rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedIssue.screenshot_url}
                      alt="Issue Screenshot"
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  </div>
                  <div className="mt-1">
                    <a
                      href={selectedIssue.screenshot_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Open original <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Reviewer Notes</h4>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add comments or notes about this issue..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                    >
                      {savingNotes ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : 'Save Notes'}
                    </Button>
                  </div>
                </div>
              </div>
            </ModalBody>
          )}

          <ModalFooter className="flex justify-between items-center sm:justify-between">
            {selectedIssue && (
              <Button
                variant={selectedIssue.resolved ? "outline" : "default"} // Changed logic to highlight action
                onClick={() => toggleResolved(selectedIssue.id, selectedIssue.resolved)}
                className={selectedIssue.resolved ? "text-green-600 border-green-200 hover:bg-green-50" : ""}
              >
                {selectedIssue.resolved ? (
                  <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Re-open Issue</span>
                ) : (
                  <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Mark as Resolved</span>
                )}
              </Button>
            )}
            <ModalClose asChild>
              <Button variant="ghost">Close</Button>
            </ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
                    <tr
                      key={issue.id}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(issue)}
                    >
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
                        <a
                          href={issue.page_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Page <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="line-clamp-3 text-sm" title={issue.description}>
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
                            onClick={(e) => e.stopPropagation()}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleResolved(issue.id, issue.resolved);
                          }}
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
