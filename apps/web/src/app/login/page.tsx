'use client';

import Link from 'next/link';
import { GitBranch, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api-client';

export default function LoginPage() {
    const handleLogin = () => {
        window.location.href = api.getAuthUrl();
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <GitBranch className="h-6 w-6" />
                        </div>
                    </Link>
                    <CardTitle className="text-2xl">Welcome back</CardTitle>
                    <CardDescription>
                        Sign in with your GitHub account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" size="lg" onClick={handleLogin}>
                        <Github className="mr-2 h-5 w-5" />
                        Sign in with GitHub
                    </Button>
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        By signing in, you agree to our{' '}
                        <a href="#" className="underline hover:text-foreground">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="underline hover:text-foreground">
                            Privacy Policy
                        </a>
                        .
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
