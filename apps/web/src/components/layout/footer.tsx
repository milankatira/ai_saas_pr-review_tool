import Link from 'next/link';
import { GitBranch } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t bg-card">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <GitBranch className="h-5 w-5" />
                            </div>
                            <span className="font-semibold">CodeReview AI</span>
                        </Link>
                        <p className="mt-4 text-sm text-muted-foreground">
                            AI-powered code reviews for your GitHub PRs.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold">Product</h4>
                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/#features" className="hover:text-foreground">Features</Link></li>
                            <li><Link href="/#pricing" className="hover:text-foreground">Pricing</Link></li>
                            <li><Link href="/login" className="hover:text-foreground">Get Started</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold">Company</h4>
                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground">About</a></li>
                            <li><a href="#" className="hover:text-foreground">Blog</a></li>
                            <li><a href="#" className="hover:text-foreground">Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold">Legal</h4>
                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                            <li><a href="#" className="hover:text-foreground">Terms</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} CodeReview AI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
