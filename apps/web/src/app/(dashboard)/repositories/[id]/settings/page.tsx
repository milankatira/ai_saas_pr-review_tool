'use client';

import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RepositorySettingsPage() {
    const params = useParams();
    const repoId = params.id as string;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Repository Settings</h1>
                <p className="text-muted-foreground">Configure review settings for this repository</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Review Categories</CardTitle>
                    <CardDescription>Select which categories to include in reviews</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                        <span>Readability</span>
                    </label>
                    <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                        <span>Performance</span>
                    </label>
                    <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                        <span>Security</span>
                    </label>
                    <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="h-4 w-4" />
                        <span>React Anti-patterns</span>
                    </label>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Severity Threshold</CardTitle>
                    <CardDescription>Only show issues at or above this severity</CardDescription>
                </CardHeader>
                <CardContent>
                    <select className="w-full rounded-md border p-2">
                        <option value="info">Info (show all)</option>
                        <option value="warning">Warning and above</option>
                        <option value="error">Errors only</option>
                    </select>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Exclude Patterns</CardTitle>
                    <CardDescription>Skip files matching these patterns (one per line)</CardDescription>
                </CardHeader>
                <CardContent>
                    <textarea
                        className="min-h-[100px] w-full rounded-md border p-2"
                        placeholder="*.test.ts&#10;*.spec.js&#10;__mocks__/"
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button>Save Settings</Button>
            </div>
        </div>
    );
}
