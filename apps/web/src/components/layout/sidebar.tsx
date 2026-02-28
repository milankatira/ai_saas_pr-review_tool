'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    GitBranch,
    Settings,
    CreditCard,
    Menu,
    X,
    FileCode,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/repositories', label: 'Repositories', icon: GitBranch },
    { href: '/reviews', label: 'Reviews', icon: FileCode },
    { href: '/billing', label: 'Billing', icon: CreditCard },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="sm"
                className="fixed left-4 top-4 z-50 md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-card transition-transform duration-200 ease-in-out md:translate-x-0',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center border-b px-6">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <GitBranch className="h-5 w-5" />
                            </div>
                            <span className="font-semibold">CodeReview AI</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 p-4">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                    )}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="border-t p-4">
                        <p className="text-xs text-muted-foreground">
                            Powered by Claude AI
                        </p>
                    </div>
                </div>
            </aside>

            {/* Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
        </>
    );
}
