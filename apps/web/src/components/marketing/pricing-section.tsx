import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

const plans = [
    {
        name: 'Free',
        price: '$0',
        description: 'Perfect for trying out AI code reviews',
        features: [
            '5 reviews per month',
            'Up to 3 repositories',
            'Basic review categories',
            'Community support',
        ],
        cta: 'Get Started',
        href: '/login',
        popular: false,
    },
    {
        name: 'Pro',
        price: '$29',
        period: '/month',
        description: 'For teams that ship code daily',
        features: [
            'Unlimited reviews',
            'Unlimited repositories',
            'All review categories',
            'Priority support',
            'Custom review rules',
            'Team management',
        ],
        cta: 'Start Free Trial',
        href: '/login',
        popular: true,
    },
];

export function PricingSection() {
    return (
        <section id="pricing" className="py-20 sm:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        Start free, upgrade when you need more.
                    </p>
                </div>

                <div className="mx-auto mt-16 grid max-w-4xl gap-8 sm:grid-cols-2">
                    {plans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={plan.popular ? 'border-primary shadow-lg' : ''}
                        >
                            {plan.popular && (
                                <div className="rounded-t-lg bg-primary px-4 py-1 text-center text-sm font-medium text-primary-foreground">
                                    Most Popular
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    {plan.period && (
                                        <span className="ml-1 text-muted-foreground">{plan.period}</span>
                                    )}
                                </div>
                                <ul className="mt-6 space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-2 text-sm">
                                            <Check className="h-4 w-4 text-primary" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={plan.popular ? 'default' : 'outline'}
                                    asChild
                                >
                                    <Link href={plan.href}>{plan.cta}</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
