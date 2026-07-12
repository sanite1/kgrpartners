import PageMeta from "@/components/shared/PageMeta";
import PageHeader from "@/components/shared/PageHeader";
import QuoteBand from "@/components/shared/QuoteBand";
import StoryIntro from "../components/about/StoryIntro";
import Timeline from "../components/about/Timeline";
import ValuesSection from "../components/about/ValuesSection";
import { ABOUT_IMAGES } from "@/data/about-data";

export default function About() {
  return (
    <main>
      <PageMeta
        title="About Us | KGR Partners"
        description="The road taught us. The sun changed us. From a 2017 diesel fleet to Nigeria's fully converted solar electric transport company."
      />
      <PageHeader
        eyebrow="ABOUT US"
        title="The road taught us. The sun changed us."
        crumb="About Us"
        image={ABOUT_IMAGES.header}
      />
      <StoryIntro />
      <Timeline />
      <ValuesSection />
      <QuoteBand ctaLabel="See our technology" ctaTo="/technology" />
    </main>
  );
}
