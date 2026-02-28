'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');

        if (token && refreshToken) {
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);

            // Set cookie for middleware
            document.cookie = `token=${token}; path=/; max-age=3600`;

            // Redirect to dashboard or onboarding
            router.push('/dashboard');
        } else {
            // No tokens, redirect to login
            router.push('/login');
        }
    }, [router, searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <Skeleton className="mx-auto h-12 w-12 rounded-full" />
                <p className="mt-4 text-muted-foreground">Signing you in...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
                        <p className="mt-4 text-muted-foreground">Loading...</p>
                    </div>
                </div>
            }
        >
            <CallbackHandler />
        </Suspense>
    );
}
