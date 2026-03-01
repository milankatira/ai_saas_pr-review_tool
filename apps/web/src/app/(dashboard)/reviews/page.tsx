'use client';

import Link from 'next/link';
import { FileCode, GitBranch, Clock, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useReviews } from '@/hooks/use-api';
import { formatRelativeTime } from '@/lib/utils';

export default function ReviewsPage() {
    const { data, isLoading } = useReviews({ limit: 50 });
console.log(data,"data")
    const reviews = data?.data?.reviews || [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Reviews</h1>
                    <p className="text-muted-foreground">Loading your review history...</p>
                </div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Reviews</h1>
                    <p className="text-muted-foreground">All your AI code review history</p>
                </div>
                <Button asChild>
                    <Link href="/reviews/create">
                        <Plus className="mr-2 h-4 w-4" />
                        New Review
                    </Link>
                </Button>
            </div>

            {reviews.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileCode className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No reviews yet</h3>
                        <p className="mt-2 text-center text-muted-foreground">
                            Trigger a review by clicking "New Review" above.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <Link
                            key={review._id}
                            href={`/reviews/${review._id}`}
                            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{review.prTitle}</span>
                                    <Badge
                                        variant={
                                            review.status === 'completed'
                                                ? 'success'
                                                : review.status === 'failed'
                                                    ? 'destructive'
                                                    : review.status === 'processing'
                                                        ? 'default'
                                                        : 'secondary'
                                        }
                                    >
                                        {review.status}
                                    </Badge>
                                </div>
                                <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <GitBranch className="h-3 w-3" />
                                        #{review.prNumber}
                                    </span>
                                    <span>by {review.prAuthor}</span>
                                    {review.metrics?.processingTimeMs && (
                                        <span>
                                            ⚡ {(review.metrics.processingTimeMs / 1000).toFixed(1)}s
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                {review.status === 'pending' ? (
                                    <p className="text-sm text-muted-foreground">
                                        Review pending...
                                    </p>
                                ) : review.status === 'processing' ? (
                                    <p className="text-sm text-muted-foreground">
                                        Analyzing code...
                                    </p>
                                ) : review.status === 'failed' ? (
                                    <p className="text-sm text-destructive">
                                        {review.errorMessage || 'Review failed'}
                                    </p>
                                ) : review.summary ? (
                                    <div className="text-sm text-muted-foreground">
                                        <p>
                                            {review.summary.totalIssues} issue
                                            {review.summary.totalIssues !== 1 ? 's' : ''}
                                        </p>
                                        <div className="flex gap-2 mt-1">
                                            {review.summary.critical > 0 && (
                                                <Badge variant="destructive" className="text-xs">
                                                    🔴 {review.summary.critical}
                                                </Badge>
                                            )}
                                            {review.summary.warnings > 0 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    🟡 {review.summary.warnings}
                                                </Badge>
                                            )}
                                            {review.summary.infos > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    🔵 {review.summary.infos}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatRelativeTime(review.createdAt)}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
