import PageMeta from "@/components/shared/PageMeta";
import PageHeader from "@/components/shared/PageHeader";
import SystemSection from "../components/technology/SystemSection";
import DayTimeline from "../components/technology/DayTimeline";
import CtaBand from "../components/technology/CtaBand";
import { TECH_SYSTEMS, TECH_HEADER_IMAGE } from "@/data/technology-data";

export default function Technology() {
  return (
    <main>
      <PageMeta
        title="Our Technology | KGR Partners"
        description="Three systems, one fleet that never stops: petrol to electric conversion, 800kW DC of our own off-grid solar charging, and battery swaps in under 5 minutes."
      />
      <PageHeader
        eyebrow="OUR TECHNOLOGY"
        title="Three systems. One fleet that never stops."
        crumb="Our Technology"
        image={TECH_HEADER_IMAGE}
      />
      {TECH_SYSTEMS.map((system, i) => (
        <SystemSection
          key={system.number}
          system={system}
          first={i === 0}
          last={i === TECH_SYSTEMS.length - 1}
        />
      ))}
      <DayTimeline />
      <CtaBand />
    </main>
  );
}
