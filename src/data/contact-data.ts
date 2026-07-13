// "What is this about?" select — sent as the top-level `subject`
// field of the public contact endpoint (optional, max 300 chars).
export const CONTACT_SUBJECTS: string[] = [
  "I want to ride",
  "Fleet conversion enquiry",
  "Partnership",
  "Media and press",
  "Something else",
];

export interface ContactChannel {
  label: string;
  value: string;
  icon: string;
}

export const CONTACT_CHANNELS: ContactChannel[] = [
  { label: "EMAIL US", value: "kgrpartners744@gmail.com", icon: "Mail" },
  {
    label: "CALL US",
    value: "0703 697 3015 · 0803 343 4560",
    icon: "Phone",
  },
  {
    label: "VISIT THE DEPOT",
    value: "No.6 GGSS Road, Kawo, Kaduna",
    icon: "MapPin",
  },
];

export interface ContactQuickStat {
  value: string;
  label: string;
}

export const CONTACT_QUICK_STATS: ContactQuickStat[] = [
  { value: "1 day", label: "reply time" },
  { value: "6 to 20", label: "open Mon to Sat" },
  { value: "Kaduna", label: "Nigeria" },
];

export const CONTACT_IMAGES = {
  header:
    "https://images.unsplash.com/photo-1572816225927-d08fb138f2b2?w=1400&q=80",
  side: "https://images.unsplash.com/photo-1573662766191-066ba9570a4b?w=800&q=80",
};
