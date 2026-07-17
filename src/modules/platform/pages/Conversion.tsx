import PageMeta from "@/components/shared/PageMeta";
import PageHeader from "@/components/shared/PageHeader";
import QuoteBand from "@/components/shared/QuoteBand";
import ConversionPaths from "../components/conversion/ConversionPaths";
import ConversionWizard from "../components/conversion/ConversionWizard";

const HEADER_IMAGE =
  "https://images.unsplash.com/photo-1549383433-0d8ef3f38afa?w=1400&q=80";

export default function Conversion() {
  return (
    <main>
      <PageMeta
        title="Start Your Conversion | KGR Partners"
        description="Tell us about your vehicle with the EV conversion technical information sheet. Fill it online in six short steps, or download the fillable PDF."
      />
      <PageHeader
        eyebrow="EV CONVERSION SHEET"
        title="Tell us about your vehicle."
        crumb="Conversion"
        image={HEADER_IMAGE}
      />

      <div className="px-5 py-16 sm:px-8 lg:px-16 lg:py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-12">
          <div className="max-w-[760px]" data-aos="fade-up">
            <p className="m-0 text-[15px] font-medium leading-[1.7] text-bark sm:text-[16px]">
              This information lets our engineers specify the correct motor,
              battery pack and charging system for your EV conversion project.
              Complete every field as accurately as you can; where you are
              unsure, leave it blank and we will work it out together.
            </p>
          </div>
          <ConversionPaths />
          <ConversionWizard />
        </div>
      </div>

      <QuoteBand
        ctaLabel="See how conversion works"
        ctaTo="/technology#conversion"
      />
    </main>
  );
}
