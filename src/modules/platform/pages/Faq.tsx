import PageMeta from "@/components/shared/PageMeta";
import PageHeader from "@/components/shared/PageHeader";
import QuoteBand from "@/components/shared/QuoteBand";
import FaqAccordion from "../components/faq/FaqAccordion";
import { FAQ_HEADER_IMAGE } from "@/data/faq-data";

export default function Faq() {
  return (
    <main>
      <PageMeta
        title="FAQ | KGR Partners"
        description="What we do, how battery swapping works, where we operate and how to partner with KGR Partners."
      />
      <PageHeader
        eyebrow="FAQ"
        title="Answers, before you even ask."
        crumb="FAQ"
        image={FAQ_HEADER_IMAGE}
      />
      <FaqAccordion />
      <QuoteBand ctaLabel="See our technology" ctaTo="/technology" />
    </main>
  );
}
