import PageMeta from "@/components/shared/PageMeta";
import PageHeader from "@/components/shared/PageHeader";
import QuoteBand from "@/components/shared/QuoteBand";
import GalleryGrid from "../components/gallery/GalleryGrid";
import { GALLERY_HEADER_IMAGE } from "@/data/gallery-data";

export default function Gallery() {
  return (
    <main>
      <PageMeta
        title="Gallery | KGR Partners"
        description="The fleet, the solar stations and the swap bays. Photos of KGR Partners' electric transport operation in Kaduna."
      />
      <PageHeader
        eyebrow="GALLERY"
        title="See the fleet, feel the sunshine."
        crumb="Gallery"
        image={GALLERY_HEADER_IMAGE}
      />
      <GalleryGrid />
      <QuoteBand ctaLabel="Partner with us" ctaTo="/partner" />
    </main>
  );
}
