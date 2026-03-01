'use client';

import Link from 'next/link';
import { GitBranch, FileCode, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useReviewStats, useReviews, useOrganizations } from '@/hooks/use-api';
import { formatRelativeTime } from '@/lib/utils';

function StatsCard({
    title,
    value,
    icon: Icon,
    description,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    description?: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}

function RecentReviewsTable() {
    const { data: orgsData, isLoading: isOrgsLoading } = useOrganizations();
    const orgId = orgsData?.data?.[0]?._id;

    const { data, isLoading } = useReviews({
        organizationId: orgId,
        limit: 5,
    });

    const reviews = data?.data?.reviews || [];

    if (isOrgsLoading || isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
                {reviews.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">
                        No reviews yet. Connect a repository to get started.
                    </p>
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
                                    <p className="text-sm text-muted-foreground">
                                        #{review.prNumber} by {review.prAuthor}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                    {review.summary && (
                                        <p>
                                            {review.summary.totalIssues} issue
                                            {review.summary.totalIssues !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                    <p>{formatRelativeTime(review.createdAt)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const { data: orgsData } = useOrganizations();
    const orgId = orgsData?.data?.[0]?._id;

    const { data: statsData, isLoading: statsLoading } = useReviewStats(orgId);
    const stats = statsData?.data;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of your AI code reviews
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statsLoading ? (
                    <>
                        {[...Array(4)].map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <Skeleton className="h-8 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </>
                ) : (
                    <>
                        <StatsCard
                            title="Total Reviews"
                            value={stats?.total || 0}
                            icon={FileCode}
                        />
                        <StatsCard
                            title="Completed"
                            value={stats?.completed || 0}
                            icon={GitBranch}
                        />
                        <StatsCard
                            title="Issues Found"
                            value={stats?.avgProcessingTime ? Math.round(stats.avgProcessingTime / 1000) + 's avg' : 'N/A'}
                            icon={AlertTriangle}
                            description="Average processing time"
                        />
                        <StatsCard
                            title="Total Cost"
                            value={`$${(stats?.totalCost || 0).toFixed(2)}`}
                            icon={Clock}
                            description="This billing period"
                        />
                    </>
                )}
            </div>

            {/* Recent Reviews */}
            <RecentReviewsTable />
        </div>
    );
}
