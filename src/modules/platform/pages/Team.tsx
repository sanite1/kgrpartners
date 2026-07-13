import PageMeta from "@/components/shared/PageMeta";
import PageHeader from "@/components/shared/PageHeader";
import QuoteBand from "@/components/shared/QuoteBand";
import TeamGrid from "../components/team/TeamGrid";
import { TEAM_HEADER_IMAGE } from "@/data/team-data";

export default function Team() {
  return (
    <main>
      <PageMeta
        title="Meet the Team | KGR Partners"
        description="The nine people behind Nigeria's first fully electric, solar-powered mass transit fleet, from the CEO to the battery technicians."
      />
      <PageHeader
        eyebrow="MEET THE TEAM"
        title="The people behind the fleet."
        crumb="Team"
        image={TEAM_HEADER_IMAGE}
      />
      <TeamGrid />
      <QuoteBand ctaLabel="Work with us" ctaTo="/contact" />
    </main>
  );
}
