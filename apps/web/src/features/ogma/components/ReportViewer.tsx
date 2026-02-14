import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { ScrollArea } from '@repo/ui/scroll-area';
import { FileText } from 'lucide-react';

interface ReportViewerProps {
  // Using a simplified type for now until we have full persistence
  reports: Array<{
    id: string;
    date: string;
    status: 'Green' | 'Yellow' | 'Red';
    summary: string;
  }>;
}

export function ReportViewer({ reports }: ReportViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center space-x-4 rounded-md border p-3"
              >
                <div className="rounded-full bg-muted p-2">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Daily Health Check
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(report.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  <span
                    className={
                      report.status === 'Green'
                        ? 'text-success'
                        : report.status === 'Yellow'
                        ? 'text-warning'
                        : 'text-destructive'
                    }
                  >
                    {report.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
