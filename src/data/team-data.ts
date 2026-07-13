export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
}

// Bios beyond the CEO's are pending from the company; cards render name + role.
export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Amina Adamu Fari",
    role: "CEO",
    bio: "Founder and visionary behind KGR Partners Ltd, with extensive experience in transport operations and clean energy transition in Northern Nigeria.",
  },
  { name: "Shafiu Sani", role: "Managing Director" },
  { name: "Adamu Muhammad Usman", role: "Technical Head and Lead Engineer" },
  { name: "Muhammad Sadiq Abubakar, CMILT", role: "Logistics Manager" },
  { name: "Usman Suleiman", role: "Admin" },
  { name: "Bashir Saidu", role: "Battery Technician" },
  { name: "Nazifi Aliyu", role: "Mechanical Technician" },
  { name: "Saidu Muhammad Tukur", role: "Battery Swapping Technician" },
  { name: "Abdullahi Muhammad", role: "Battery Charging Technician" },
];

export const TEAM_HEADER_IMAGE =
  "https://images.unsplash.com/photo-1529171918672-ba6d0733a56c?w=1400&q=80";
