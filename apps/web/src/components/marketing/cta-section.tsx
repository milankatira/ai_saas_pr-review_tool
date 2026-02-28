import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
    return (
        <section className="bg-primary py-20 text-primary-foreground sm:py-32">
            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Ready to improve your code quality?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">
                    Join developers who are shipping better code with AI-powered reviews.
                    Start free today.
                </p>
                <div className="mt-10">
                    <Button size="lg" variant="secondary" asChild>
                        <Link href="/login">
                            Get Started Free
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
