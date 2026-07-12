import PageMeta from "@/components/shared/PageMeta";
import PageHeader from "@/components/shared/PageHeader";
import QuoteBand from "@/components/shared/QuoteBand";
import ContactCards from "../components/contact/ContactCards";
import ContactForm from "../components/contact/ContactForm";
import ContactSide from "../components/contact/ContactSide";
import { CONTACT_IMAGES } from "@/data/contact-data";

export default function Contact() {
  return (
    <main>
      <PageMeta
        title="Contact | KGR Partners"
        description="Talk to KGR. We reply within a day. Ride requests, fleet conversion enquiries, partnerships and press."
      />
      <PageHeader
        eyebrow="CONTACT"
        title="Talk to KGR. We reply within a day."
        crumb="Contact"
        image={CONTACT_IMAGES.header}
      />
      <ContactCards />
      <div className="bg-linear-to-b from-white to-haze px-5 pb-20 pt-14 sm:px-8 lg:px-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <ContactForm />
          <ContactSide />
        </div>
      </div>
      <QuoteBand ctaLabel="Read our story" ctaTo="/about" />
    </main>
  );
}
