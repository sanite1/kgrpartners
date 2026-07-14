import PageMeta from "@/components/shared/PageMeta";
import PageHeader from "@/components/shared/PageHeader";
import QuoteBand from "@/components/shared/QuoteBand";
import PartnerAreas from "../components/partner/PartnerAreas";
import { PARTNER_HEADER_IMAGE } from "@/data/partner-data";

export default function Partner() {
  return (
    <main>
      <PageMeta
        title="Partner With Us | KGR Partners"
        description="We collaborate with government agencies, investors, transport unions and development organizations on EV conversion, charging infrastructure and fleet electrification."
      />
      <PageHeader
        eyebrow="PARTNER WITH US"
        title="Let's electrify Nigeria together."
        crumb="Partner With Us"
        image={PARTNER_HEADER_IMAGE}
      />
      <PartnerAreas />
      <QuoteBand ctaLabel="See our impact" ctaTo="/technology#impact" />
    </main>
  );
}
