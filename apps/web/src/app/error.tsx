'use client'

import { useEffect } from 'react'
import { Button } from "@repo/ui/button"
import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 p-4">
            <Card className="max-w-md border-destructive/50">
                <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <CardTitle className="text-lg font-medium">Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {error.message || "Something went wrong while loading this page."}
                    </p>
                </CardContent>
            </Card>
            <Button onClick={() => reset()}>Try again</Button>
        </div>
    )
}
