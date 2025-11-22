'use client';

import { useSearchParams } from 'next/navigation';
import { IssueReportForm } from '@/components/IssueReportForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Suspense } from 'react';

function IssuePageContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || '';
  // Use current window location as fallback if ref is not provided, 
  // but realistically if they come here directly we might just want "Direct Visit" or empty.
  // IssueReportForm handles empty defaultUrl by showing the input as editable or just empty.
  // But wait, IssueReportForm uses defaultUrl prop.
  
  // If the user navigates directly to /issues, we might not have a ref.
  const defaultUrl = ref || (typeof window !== 'undefined' ? window.location.origin : '');

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Report a Problem</CardTitle>
          <CardDescription>
            Found a bug or have feedback? Let us know!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IssueReportForm 
            defaultUrl={defaultUrl} 
            // No onCancel needed for full page
            // onSuccess could redirect or just show success message (handled in form toast)
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IssuePageContent />
    </Suspense>
  );
}

