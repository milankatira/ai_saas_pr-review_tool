'use client';

import { Check, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizations, useSubscription, useCreateCheckout } from '@/hooks/use-api';
import { api } from '@/lib/api-client';

export default function BillingPage() {
    const { data: orgsData } = useOrganizations();
    const orgId = orgsData?.data?.[0]?._id;

    const { data, isLoading } = useSubscription(orgId);
    const createCheckout = useCreateCheckout();

    const subscription = data?.data?.subscription;
    const usage = data?.data?.usage;

    const handleUpgrade = async () => {
        if (!orgId) return;

        const result = await createCheckout.mutateAsync({
            organizationId: orgId,
            successUrl: `${window.location.origin}/dashboard/billing?success=true`,
            cancelUrl: `${window.location.origin}/dashboard/billing`,
        });

        if (result.data?.url) {
            window.location.href = result.data.url;
        }
    };

    const handleManageBilling = async () => {
        if (!orgId) return;

        const result = await api.getPortalUrl(
            orgId,
            `${window.location.origin}/dashboard/billing`,
        );

        if (result.data?.url) {
            window.location.href = result.data.url;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Billing</h1>
                    <p className="text-muted-foreground">Manage your subscription and usage</p>
                </div>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    const isPro = subscription?.plan === 'pro';
    const usagePercent = usage?.limit === -1 ? 0 : ((usage?.used || 0) / (usage?.limit || 1)) * 100;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Billing</h1>
                <p className="text-muted-foreground">Manage your subscription and usage</p>
            </div>

            {/* Current Plan */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Current Plan</CardTitle>
                            <CardDescription>
                                {isPro ? 'Pro plan with unlimited reviews' : 'Free plan with limited reviews'}
                            </CardDescription>
                        </div>
                        <Badge variant={isPro ? 'default' : 'secondary'}>
                            {isPro ? 'Pro' : 'Free'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Usage meter */}
                        <div>
                            <div className="flex justify-between text-sm">
                                <span>Reviews this period</span>
                                <span>
                                    {usage?.used || 0} / {usage?.limit === -1 ? 'Unlimited' : usage?.limit}
                                </span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {!isPro && (
                                <Button onClick={handleUpgrade} disabled={createCheckout.isPending}>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Upgrade to Pro
                                </Button>
                            )}
                            {isPro && (
                                <Button variant="outline" onClick={handleManageBilling}>
                                    Manage Billing
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Plans Comparison */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className={!isPro ? 'border-primary' : ''}>
                    <CardHeader>
                        <CardTitle>Free</CardTitle>
                        <CardDescription>For trying out AI code reviews</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">$0</div>
                        <ul className="mt-4 space-y-2">
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary" />5 reviews per month
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary" />3 repositories
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary" />Basic categories
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {!isPro && <Badge>Current Plan</Badge>}
                    </CardFooter>
                </Card>

                <Card className={isPro ? 'border-primary' : ''}>
                    <CardHeader>
                        <CardTitle>Pro</CardTitle>
                        <CardDescription>For teams that ship daily</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            $29<span className="text-lg font-normal text-muted-foreground">/mo</span>
                        </div>
                        <ul className="mt-4 space-y-2">
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary" />Unlimited reviews
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary" />Unlimited repositories
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary" />All categories
                            </li>
                            <li className="flex items-center gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary" />Priority support
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        {isPro ? (
                            <Badge>Current Plan</Badge>
                        ) : (
                            <Button className="w-full" onClick={handleUpgrade}>
                                Upgrade
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
