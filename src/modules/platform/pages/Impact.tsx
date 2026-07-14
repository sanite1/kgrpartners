import PageMeta from "@/components/shared/PageMeta";
import PageHeader from "@/components/shared/PageHeader";
import QuoteBand from "@/components/shared/QuoteBand";
import ImpactMeter from "../components/impact/ImpactMeter";
import { IMPACT_HEADER_IMAGE } from "@/data/impact-data";

export default function Impact() {
  return (
    <main>
      <PageMeta
        title="Impact Calculator | KGR Partners"
        description="See what today's routes are worth: CO₂ avoided by the solar-charged fleet, and what you would save in naira by switching your own vehicle to electric."
      />
      <PageHeader
        eyebrow="IMPACT CALCULATOR"
        title="See what today's routes are worth."
        crumb="Impact Calculator"
        image={IMPACT_HEADER_IMAGE}
      />
      <div className="bg-linear-to-b from-white to-haze px-5 py-16 sm:px-8 lg:px-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <ImpactMeter />
        </div>
      </div>
      <QuoteBand ctaLabel="See our verified impact" ctaTo="/technology#impact" />
    </main>
  );
}
