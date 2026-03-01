'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useReview } from '@/hooks/use-api';
import { formatDate } from '@/lib/utils';

const severityConfig = {
    error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

const categoryLabels: Record<string, string> = {
    correctness: 'Correctness & Logic',
    security: 'Security',
    performance: 'Performance',
    maintainability: 'Maintainability',
    best_practice: 'Best Practices',
};

export default function ReviewDetailPage() {
    const params = useParams();
    const reviewId = params.id as string;
    const { data, isLoading } = useReview(reviewId);

    const review = data?.data?.review;
    const comments = data?.data?.comments || [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!review) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-muted-foreground">Review not found</p>
            </div>
        );
    }

    // Group comments by category
    const commentsByCategory = comments.reduce(
        (acc, comment) => {
            if (!acc[comment.category]) acc[comment.category] = [];
            acc[comment.category].push(comment);
            return acc;
        },
        {} as Record<string, typeof comments>,
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{review.prTitle}</h1>
                    <p className="mt-1 text-muted-foreground">
                        PR #{review.prNumber} by {review.prAuthor} • {formatDate(review.createdAt)}
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <a href={review.prUrl} target="_blank" rel="noopener noreferrer">
                        View on GitHub
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>

            {/* Summary Card */}
            {review.summary && (
                <Card>
                    <CardHeader>
                        <CardTitle>Review Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{review.summary.overallAssessment}</p>
                        <div className="mt-4 flex gap-4">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-red-500">{review.summary.critical}</span>
                                <span className="text-sm text-muted-foreground">Critical</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-yellow-500">{review.summary.warnings}</span>
                                <span className="text-sm text-muted-foreground">Warnings</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-blue-500">{review.summary.infos}</span>
                                <span className="text-sm text-muted-foreground">Info</span>
                            </div>
                        </div>
                        {review.metrics && (
                            <p className="mt-4 text-sm text-muted-foreground">
                                Reviewed {review.metrics.filesReviewed} files in{' '}
                                {(review.metrics.processingTimeMs / 1000).toFixed(1)}s • Cost: $
                                {review.metrics.costUsd.toFixed(4)}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Issues by Category */}
            {Object.entries(commentsByCategory).map(([category, categoryComments]) => (
                <Card key={category}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {categoryLabels[category] || category}
                            <Badge variant="secondary">{categoryComments.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {categoryComments.map((comment) => {
                            const severity = severityConfig[comment.severity as keyof typeof severityConfig] ||
                                severityConfig.info;
                            const SeverityIcon = severity.icon;

                            return (
                                <div
                                    key={comment._id}
                                    className={`rounded-lg border p-4 ${severity.bg}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <SeverityIcon className={`mt-0.5 h-5 w-5 ${severity.color}`} />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{comment.title}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {comment.severity}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {comment.description}
                                            </p>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                {comment.filePath}:{comment.line}
                                            </p>
                                            {comment.suggestion && (
                                                <div className="mt-3 rounded bg-background/50 p-2 text-sm">
                                                    <span className="font-medium">Suggestion:</span> {comment.suggestion}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            ))}

            {comments.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No issues found in this review.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
