'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, Check, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const steps = [
    {
        id: 1,
        title: 'Install GitHub App',
        description: 'Connect your GitHub account and install our app',
    },
    {
        id: 2,
        title: 'Select Repositories',
        description: 'Choose which repositories to enable for AI reviews',
    },
    {
        id: 3,
        title: 'You\'re All Set!',
        description: 'Start getting AI-powered code reviews on your PRs',
    },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);

    const handleInstallApp = () => {
        // Open GitHub App installation in new tab
        window.open(
            `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || 'codereview-ai'}/installations/new`,
            '_blank',
        );
        // Move to next step
        setCurrentStep(2);
    };

    const handleComplete = () => {
        router.push('/dashboard');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
            <div className="w-full max-w-2xl">
                {/* Progress */}
                <div className="mb-8 flex items-center justify-center gap-2">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${currentStep > step.id
                                        ? 'bg-primary text-primary-foreground'
                                        : currentStep === step.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                            >
                                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`mx-2 h-0.5 w-12 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <GitBranch className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">{steps[currentStep - 1].title}</CardTitle>
                        <CardDescription>{steps[currentStep - 1].description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {currentStep === 1 && (
                            <>
                                <p className="text-center text-muted-foreground">
                                    Click the button below to install the CodeReview AI GitHub App.
                                    This will allow us to receive webhook events when you open pull requests.
                                </p>
                                <Button className="w-full" size="lg" onClick={handleInstallApp}>
                                    Install GitHub App
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </>
                        )}

                        {currentStep === 2 && (
                            <>
                                <p className="text-center text-muted-foreground">
                                    After installing the app, select the repositories you want to enable
                                    for AI code reviews. You can change this later in settings.
                                </p>
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        Once you have selected your repositories on GitHub, click continue.
                                    </p>
                                </div>
                                <Button className="w-full" size="lg" onClick={() => setCurrentStep(3)}>
                                    Continue
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </>
                        )}

                        {currentStep === 3 && (
                            <>
                                <div className="py-4 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                                        <Check className="h-8 w-8 text-green-500" />
                                    </div>
                                    <p className="text-muted-foreground">
                                        You are all set! Open a pull request on any connected repository
                                        and you will receive AI-powered code review feedback within seconds.
                                    </p>
                                </div>
                                <Button className="w-full" size="lg" onClick={handleComplete}>
                                    Go to Dashboard
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
