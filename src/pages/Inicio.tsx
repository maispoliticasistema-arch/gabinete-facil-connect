import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProofSection } from '@/components/landing/ProofSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingFooter } from '@/components/landing/LandingFooter';

const Inicio = () => {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main>
        <HeroSection />
        <ProofSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <SecuritySection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Inicio;
