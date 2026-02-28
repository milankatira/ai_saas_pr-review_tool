'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-api';

export default function SettingsPage() {
    const { data, isLoading } = useUser();
    const user = data?.data;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">Manage your account settings</p>
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings</p>
            </div>

            {/* Profile */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Your account information from GitHub</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar src={user?.avatarUrl} alt={user?.username} size="lg" />
                        <div>
                            <p className="font-medium">{user?.username}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Profile information is synced from your GitHub account.
                    </p>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Configure how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <label className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Email notifications</p>
                            <p className="text-sm text-muted-foreground">
                                Receive email when reviews are completed
                            </p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" defaultChecked />
                    </label>
                    <label className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Critical issues only</p>
                            <p className="text-sm text-muted-foreground">
                                Only notify for high-severity issues
                            </p>
                        </div>
                        <input type="checkbox" className="h-4 w-4" />
                    </label>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive">Delete Account</Button>
                </CardContent>
            </Card>
        </div>
    );
}
