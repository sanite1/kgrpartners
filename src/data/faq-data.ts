export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What does KGR Partners do?",
    answer:
      "We operate Nigeria's first sustained, fully electric mass transit service. Commercial buses and tricycles powered entirely by our own off-grid solar charging infrastructure, based in Kaduna.",
  },
  {
    question: "How does the battery swapping system work?",
    answer:
      "Instead of waiting 2 to 6 hours to recharge, our drivers exchange a depleted battery for a fully charged one in under 5 minutes at one of our swap stations, so vehicles stay on the road almost continuously. Every swapped battery is recharged on our solar racks using our own 800kW DC solar infrastructure, never from the national grid.",
  },
  {
    question: "Do you only convert vehicles, or do you build them too?",
    answer:
      "Both. We convert existing petrol-powered buses and tricycles to electric, and we also design and build electric tricycles (Keke NAPEP) from scratch using locally sourced materials, making KGR Partners both an EV conversion specialist and a local EV manufacturer.",
  },
  {
    question: "Where do you currently operate?",
    answer:
      "Our fleet serves intra-city routes across Kaduna metropolis, with plans to expand to Abuja (FCT), Kano, Lagos, Port Harcourt, and Ibadan.",
  },
  {
    question: "How can we partner with KGR Partners?",
    answer:
      "We work with government agencies, private investors, transport unions, and development organizations on EV conversion programmes, charging infrastructure expansion, and fleet electrification. See our Partner With Us page or contact us directly.",
  },
  {
    question: "Are you hiring?",
    answer:
      "We're always interested in hearing from skilled technicians, drivers, and engineers. Reach out via our Contact page.",
  },
];

export const FAQ_HEADER_IMAGE =
  "https://images.unsplash.com/photo-1648023200201-8fcede127835?w=1400&q=80";
