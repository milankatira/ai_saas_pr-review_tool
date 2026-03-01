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
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground">Create AI Code Review</h1>
                    <p className="text-muted-foreground mt-2">Loading your repositories...</p>
                </div>
                <Card>
                    <CardContent className="p-8">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Loading repositories and pull requests...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground">Create AI Code Review</h1>
                <p className="text-muted-foreground mt-2">Trigger intelligent code analysis for your pull requests</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-foreground">Review Configuration</CardTitle>
                    <CardDescription>
                        Select a repository and pull request to analyze with AI
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Repository Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Repository</label>
                        <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a repository" />
                            </SelectTrigger>
                            <SelectContent>
                                {repositories.length === 0 ? (
                                    <SelectItem value="no-repos" disabled>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <FileCode className="h-4 w-4" />
                                            No repositories available
                                        </div>
                                    </SelectItem>
                                ) : (
                                    repositories.map((repo) => (
                                        <SelectItem key={repo._id} value={repo._id}>
                                            <div className="flex items-center gap-2">
                                                <GitBranch className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{repo.fullName}</span>
                                                {!repo.isActive && (
                                                    <span className="text-xs text-muted-foreground">(Inactive)</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {repositories.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Select a repository with the GitHub App installed
                            </p>
                        )}
                    </div>

                    {/* Pull Request Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Pull Request</label>
                        <Select
                            value={selectedPR}
                            onValueChange={setSelectedPR}
                            disabled={!selectedRepo || isLoadingPRs}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={isLoadingPRs ? "Loading PRs..." : "Select a pull request"} />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingPRs ? (
                                    <SelectItem value="loading" disabled>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Loading pull requests...</span>
                                        </div>
                                    </SelectItem>
                                ) : pullRequests.length === 0 ? (
                                    <SelectItem value="no-prs" disabled>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <FileCode className="h-4 w-4" />
                                            <span>No open pull requests found</span>
                                        </div>
                                    </SelectItem>
                                ) : (
                                    pullRequests
                                        .filter(pr => pr.state === 'open')
                                        .map((pr) => (
                                            <SelectItem key={pr.number} value={pr.number.toString()}>
                                                <div className="flex flex-col gap-1 py-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">#{pr.number}</span>
                                                        <span className="truncate">{pr.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>by {pr.author}</span>
                                                        <span>•</span>
                                                        <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))
                                )}
                            </SelectContent>
                        </Select>
                        {selectedRepo && !isLoadingPRs && pullRequests.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Only open pull requests are shown
                            </p>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-destructive">Error</h3>
                                <p className="text-sm text-destructive/80 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-6">
                        <Button
                            onClick={handleTriggerReview}
                            disabled={!selectedRepo || !selectedPR || isTriggering || isLoadingPRs}
                            className="w-full h-12 text-base font-medium transition-all duration-200 hover:shadow-lg"
                        >
                            {isTriggering ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Triggering Review...
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-5 w-5" />
                                    Trigger AI Review
                                </>
                            )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground mt-3">
                            {selectedRepo && selectedPR
                                ? "Click to start AI code review on this pull request"
                                : "Select a repository and pull request to enable review"}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-muted/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <Plus className="h-5 w-5 text-primary" />
                        How it works
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                            <span className="text-primary text-sm font-medium">1</span>
                        </div>
                        <div>
                            <h4 className="font-medium text-foreground">Select Repository</h4>
                            <p className="text-sm text-muted-foreground">Choose a repository with the GitHub App installed</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                            <span className="text-primary text-sm font-medium">2</span>
                        </div>
                        <div>
                            <h4 className="font-medium text-foreground">Choose Pull Request</h4>
                            <p className="text-sm text-muted-foreground">Select an open pull request to analyze</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                            <span className="text-primary text-sm font-medium">3</span>
                        </div>
                        <div>
                            <h4 className="font-medium text-foreground">Trigger Review</h4>
                            <p className="text-sm text-muted-foreground">Click to start AI code analysis</p>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-muted/20">
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Note:</span> The AI review will be posted as comments directly on the GitHub pull request.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
