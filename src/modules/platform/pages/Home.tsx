import PageMeta from "@/components/shared/PageMeta";
import QuoteBand from "@/components/shared/QuoteBand";
import HomeHero from "../components/home/HomeHero";
import CountersBand from "../components/home/CountersBand";
import ServicesSection from "../components/home/ServicesSection";
import BentoSection from "../components/home/BentoSection";
import StoryTeaser from "../components/home/StoryTeaser";

export default function Home() {
  return (
    <main>
      <PageMeta
        title="KGR Partners | Nigeria's Solar Electric Transport Company"
        description="Driving Nigeria's clean energy future, one electric vehicle at a time. Electric buses and tricycles built and charged in Kaduna on 800kW DC of our own off-grid solar power, since 2017."
      />
      <HomeHero />
      <BentoSection />
      <ServicesSection />
      <StoryTeaser />
      <CountersBand />
      <QuoteBand ctaLabel="Partner with us" ctaTo="/partner" />
    </main>
  );
}
