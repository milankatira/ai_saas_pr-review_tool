import Link from 'next/link';
import { GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/footer';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <GitBranch className="h-5 w-5" />
                        </div>
                        <span className="font-semibold">CodeReview AI</span>
                    </Link>

                    <nav className="hidden items-center gap-6 md:flex">
                        <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground">
                            Features
                        </Link>
                        <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground">
                            Pricing
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/login">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
