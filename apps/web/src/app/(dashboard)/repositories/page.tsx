'use client';

import { useState } from 'react';
import { GitBranch, ExternalLink, Settings } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizations, useRepositories, useToggleRepository } from '@/hooks/use-api';

export default function RepositoriesPage() {
    const { data: orgsData } = useOrganizations();
    const orgId = orgsData?.data?.[0]?._id;

    // For now, we'll assume a single installation
    const installationId = 'default';
    const { data, isLoading } = useRepositories(installationId);
    const toggleRepo = useToggleRepository();

    const repos = data?.data || [];

    const handleToggle = async (repoId: string, currentActive: boolean) => {
        await toggleRepo.mutateAsync({ repoId, isActive: !currentActive });
    };

    const handleInstallApp = () => {
        // Redirect to GitHub App installation
        window.location.href = `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG}/installations/new`;
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Repositories</h1>
                    <p className="text-muted-foreground">Manage your connected repositories</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Repositories</h1>
                    <p className="text-muted-foreground">Manage your connected repositories</p>
                </div>
                <Button onClick={handleInstallApp}>
                    <GitBranch className="mr-2 h-4 w-4" />
                    Add Repository
                </Button>
            </div>

            {repos.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <GitBranch className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">No repositories connected</h3>
                        <p className="mt-2 text-center text-muted-foreground">
                            Install the GitHub App on your repositories to start getting AI code reviews.
                        </p>
                        <Button className="mt-6" onClick={handleInstallApp}>
                            Install GitHub App
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {repos.map((repo) => (
                        <Card key={repo._id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <GitBranch className="h-4 w-4" />
                                            {repo.name}
                                        </CardTitle>
                                        <CardDescription>{repo.fullName}</CardDescription>
                                    </div>
                                    <Badge variant={repo.isActive ? 'success' : 'secondary'}>
                                        {repo.isActive ? 'Active' : 'Paused'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggle(repo._id, repo.isActive)}
                                        disabled={toggleRepo.isPending}
                                    >
                                        {repo.isActive ? 'Pause Reviews' : 'Enable Reviews'}
                                    </Button>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/dashboard/repositories/${repo._id}/settings`}>
                                            <Settings className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" asChild>
                                        <a
                                            href={`https://github.com/${repo.fullName}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
