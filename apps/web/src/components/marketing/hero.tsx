import Link from 'next/link';
import { ArrowRight, Shield, Zap, BookOpen, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
    return (
        <section className="relative overflow-hidden py-20 sm:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                        AI Code Reviews
                        <br />
                        <span className="text-primary">for Your PRs</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                        Get instant, intelligent feedback on your GitHub pull requests. Our AI analyzes
                        correctness, security, performance, and maintainability to help you ship
                        better code faster.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Button asChild size="lg">
                            <Link href="/login">
                                Get Started Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" asChild>
                            <Link href="#features">See How It Works</Link>
                        </Button>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                        Free tier includes 5 reviews per month. No credit card required.
                    </p>
                </div>
            </div>
        </section>
    );
}

export function Features() {
    const features = [
        {
            icon: Code2,
            title: 'Correctness & Logic',
            description:
                'Detect bugs, race conditions, edge cases, and logic errors before they reach production.',
        },
        {
            icon: Shield,
            title: 'Security & Vulnerabilities',
            description:
                'Find injection risks, data leaks, insecure authentication, and vulnerable dependencies.',
        },
        {
            icon: Zap,
            title: 'Performance & Efficiency',
            description:
                'Identify N+1 queries, unnecessary re-renders, expensive loops, and memory leaks.',
        },
        {
            icon: BookOpen,
            title: 'Maintainability & Best Practices',
            description:
                'Ensure clean code, proper naming, modularity, and adherence to modern coding standards.',
        },
    ];

    return (
        <section id="features" className="py-20 sm:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Comprehensive Code Analysis
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Our AI reviewer acts as a strict Senior Engineer, catching issues that matter.
                    </p>
                </div>

                <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 font-semibold">{feature.title}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function HowItWorks() {
    const steps = [
        {
            number: '1',
            title: 'Connect GitHub',
            description: 'Install our GitHub App and select the repositories you want to review.',
        },
        {
            number: '2',
            title: 'Open a PR',
            description: 'Create or update a pull request as you normally would.',
        },
        {
            number: '3',
            title: 'Get AI Feedback',
            description: 'Receive detailed, actionable comments directly on your PR within seconds.',
        },
    ];

    return (
        <section className="bg-muted/50 py-20 sm:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Get started in minutes with just a few clicks.
                    </p>
                </div>

                <div className="mt-16 grid gap-8 sm:grid-cols-3">
                    {steps.map((step) => (
                        <div key={step.number} className="text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                                {step.number}
                            </div>
                            <h3 className="mt-4 font-semibold">{step.title}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
