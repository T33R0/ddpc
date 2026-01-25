// ARCHETYPE: List / Table Row
// Use for: Displaying items in a list (e.g., garage vehicles, logs)
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { ChevronRight } from 'lucide-react';

interface RowProps {
    title: string;
    status: 'active' | 'archived';
    onAction: () => void;
}

export function DataRow({ title, status, onAction }: RowProps) {
    return (
        <div className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
            <div className="flex flex-col gap-1">
                <span className="font-medium">{title}</span>
                {/* Semantic color for status text */}
                <span className="text-sm text-muted-foreground">ID: #1234</span>
            </div>
            <div className="flex items-center gap-3">
                <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                    {status}
                </Badge>
                <Button variant="ghost" size="icon" onClick={onAction}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}