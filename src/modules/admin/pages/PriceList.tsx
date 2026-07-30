import PageMeta from "@/components/shared/PageMeta";
import PageHead from "../components/console/PageHead";
import PriceListSection from "../components/purchases/PriceListSection";

// the "KGR items prices in dollars" sheet as its own tab
export default function PriceList() {
  return (
    <>
      <PageMeta title="Price List | KGR Console" />
      <PageHead
        eyebrow="BOUGHT ABROAD"
        title="Price List"
        subtitle="What we buy abroad in dollars; one exchange rate reprices every naira total."
      />
      <PriceListSection />
    </>
  );
}
