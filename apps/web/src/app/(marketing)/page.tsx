import { Hero, Features, HowItWorks } from '@/components/marketing/hero';
import { PricingSection } from '@/components/marketing/pricing-section';
import { CTASection } from '@/components/marketing/cta-section';

export default function HomePage() {
    return (
        <>
            <Hero />
            <Features />
            <HowItWorks />
            <PricingSection />
            <CTASection />
        </>
    );
}
