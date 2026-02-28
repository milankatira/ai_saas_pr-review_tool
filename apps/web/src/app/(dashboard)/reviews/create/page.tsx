'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    GitBranch,
    FileCode,
    Play,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllRepositories, useOrganizations } from '@/hooks/use-api';
import { api } from '@/lib/api-client';

interface PullRequest {
    number: number;
    title: string;
    author: string;
    state: string;
    url: string;
    created_at: string;
}

export default function CreateReviewPage() {
    const router = useRouter();
    const { data: orgsData } = useOrganizations();
    const orgId = orgsData?.data?.[0]?._id;

    const { data: reposData, isLoading: reposLoading } = useAllRepositories();
    const [selectedRepo, setSelectedRepo] = useState<string>('');
    const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
    const [selectedPR, setSelectedPR] = useState<string>('');
    const [isLoadingPRs, setIsLoadingPRs] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const repositories = reposData?.data || [];

    // Fetch PRs when repository is selected
    useEffect(() => {
        const fetchPRs = async () => {
            if (!selectedRepo) {
                setPullRequests([]);
                setSelectedPR('');
                return;
            }

            setIsLoadingPRs(true);
            setError(null);

            try {
                const data = await api.getRepositoryPulls(selectedRepo);
                setPullRequests(data.data || []);
            } catch (err) {
                setError('Failed to load pull requests. Make sure the repository is accessible.');
                setPullRequests([]);
            } finally {
                setIsLoadingPRs(false);
            }
        };

        fetchPRs();
    }, [selectedRepo]);

    const handleTriggerReview = async () => {
        if (!selectedRepo || !selectedPR) {
            setError('Please select both repository and pull request');
            return;
        }

        setIsTriggering(true);
        setError(null);

        try {
            const result = await api.triggerReview(selectedRepo, parseInt(selectedPR));

            // Redirect to the review page
            router.push(`/reviews/${result.data.reviewId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to trigger review');
        } finally {
            setIsTriggering(false);
        }
    };

    if (reposLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Create Review</h1>
                    <p className="text-muted-foreground">Trigger AI code review for a pull request</p>
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Create Review</h1>
                <p className="text-muted-foreground">Trigger AI code review for a pull request</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Review Configuration</CardTitle>
                    <CardDescription>
                        Select a repository and pull request to analyze
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Repository Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Repository</label>
                        <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a repository" />
                            </SelectTrigger>
                            <SelectContent>
                                {repositories.map((repo) => (
                                    <SelectItem key={repo._id} value={repo._id}>
                                        <div className="flex items-center gap-2">
                                            <GitBranch className="h-4 w-4" />
                                            {repo.fullName}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Pull Request Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Pull Request</label>
                        <Select
                            value={selectedPR}
                            onValueChange={setSelectedPR}
                            disabled={!selectedRepo || isLoadingPRs}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingPRs ? "Loading PRs..." : "Select a pull request"} />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingPRs ? (
                                    <div className="p-4 text-center text-muted-foreground">
                                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                                        <p className="text-sm mt-2">Loading pull requests...</p>
                                    </div>
                                ) : pullRequests.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground">
                                        <FileCode className="mx-auto h-8 w-8 opacity-50" />
                                        <p className="text-sm mt-2">No pull requests found</p>
                                    </div>
                                ) : (
                                    pullRequests
                                        .filter(pr => pr.state === 'open')
                                        .map((pr) => (
                                            <SelectItem key={pr.number} value={pr.number.toString()}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">#{pr.number} {pr.title}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        by {pr.author} • {new Date(pr.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-4">
                        <Button
                            onClick={handleTriggerReview}
                            disabled={!selectedRepo || !selectedPR || isTriggering || isLoadingPRs}
                            className="w-full"
                            size="lg"
                        >
                            {isTriggering ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Triggering Review...
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Trigger AI Review
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        How it works
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>• Select a repository that has the GitHub App installed</p>
                    <p>• Choose an open pull request to review</p>
                    <p>• Click "Trigger AI Review" to start the analysis</p>
                    <p>• You'll be redirected to the review page to see results</p>
                    <p>• The review will appear as comments on the GitHub PR</p>
                </CardContent>
            </Card>
        </div>
    );
}
