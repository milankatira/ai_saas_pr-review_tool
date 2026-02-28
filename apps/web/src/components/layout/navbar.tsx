'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useUser } from '@/hooks/use-api';

export function Navbar() {
    const router = useRouter();
    const { data: userData } = useUser();
    const user = userData?.data;
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        document.documentElement.classList.toggle('dark', newIsDark);
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold md:hidden">CodeReview AI</h1>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                {user && (
                    <div className="flex items-center gap-3">
                        <Avatar src={user.avatarUrl} alt={user.username} fallback={user.username[0]} />
                        <span className="hidden text-sm font-medium md:inline">{user.username}</span>
                    </div>
                )}

                <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
}
