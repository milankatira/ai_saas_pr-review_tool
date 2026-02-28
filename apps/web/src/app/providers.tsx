'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        retry: 1,
                    },
                },
            }),
    );

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check for dark mode preference
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || (!stored && isDark)) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}
