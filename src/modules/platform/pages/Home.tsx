import PageMeta from "@/components/shared/PageMeta";
import QuoteBand from "@/components/shared/QuoteBand";
import HomeHero from "../components/home/HomeHero";
import ServicesSection from "../components/home/ServicesSection";
import BentoSection from "../components/home/BentoSection";
import StoryTeaser from "../components/home/StoryTeaser";

export default function Home() {
  return (
    <main>
      <PageMeta
        title="KGR Partners | Nigeria's Solar Electric Transport Company"
        description="Moving people and goods on pure sunshine. Electric buses and tricycles built and converted in Kaduna, 800kW DC of our own off-grid solar power and battery swaps in under 5 minutes, since 2017."
      />
      <HomeHero />
      <ServicesSection />
      <BentoSection />
      <StoryTeaser />
      <QuoteBand ctaLabel="Partner with us" ctaTo="/contact" />
    </main>
  );
}
