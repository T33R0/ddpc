'use client'

import { useEffect } from 'react'
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/card"
import { Wrench } from "lucide-react"

export default function GarageError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Garage Error:', error)
    }, [error])

    return (
        <div className="container mx-auto py-8">
            <Card className="mx-auto max-w-lg border-destructive/50">
                <CardHeader>
                    <div className="flex items-center gap-2 text-destructive">
                        <Wrench className="h-5 w-5" />
                        <CardTitle>Garage Unavailable</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        We couldn't load your garage data. This might be a temporary connection issue.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <pre className="mt-4 rounded bg-muted p-2 text-xs text-destructive">
                            {error.message}
                        </pre>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={() => reset()} variant="outline">
                        Retry Garage Load
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
