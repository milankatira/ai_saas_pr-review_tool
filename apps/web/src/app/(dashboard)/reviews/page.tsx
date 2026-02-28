'use client';

import Link from 'next/link';
import { FileCode, GitBranch, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReviews, useOrganizations } from '@/hooks/use-api';
import { formatRelativeTime } from '@/lib/utils';

export default function ReviewsPage() {
    const { data: orgsData } = useOrganizations();
    const orgId = orgsData?.data?.[0]?._id;

    const { data, isLoading } = useReviews({
        organizationId: orgId,
        limit: 50,
    });

    const reviews = data?.data?.reviews || [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Reviews</h1>
                    <p className="text-muted-foreground">All your AI code reviews</p>
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
            <div>
                <h1 className="text-3xl font-bold">Reviews</h1>
                <p className="text-muted-foreground">All your AI code reviews</p>
            </div>

            {reviews.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileCode className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No reviews yet</h3>
                        <p className="mt-2 text-center text-muted-foreground">
                            Connect a repository and create a pull request to get started.
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
                                </div>
                            </div>
                            <div className="text-right">
                                {review.summary && (
                                    <p className="text-sm text-muted-foreground">
                                        {review.summary.totalIssues} issue
                                        {review.summary.totalIssues !== 1 ? 's' : ''}
                                    </p>
                                )}
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
