// Categories from the content plan. Images are placeholders from the design's
// photo list until professional photography arrives; swap URLs here only.
export type GalleryCategory =
  | "fleet"
  | "solar"
  | "swap"
  | "conversions";

export interface GalleryFilter {
  id: GalleryCategory | "all";
  label: string;
}

export const GALLERY_FILTERS: GalleryFilter[] = [
  { id: "all", label: "Everything" },
  { id: "fleet", label: "Fleet in operation" },
  { id: "solar", label: "Solar stations" },
  { id: "swap", label: "Battery swapping" },
  { id: "conversions", label: "Conversions" },
];

export interface GalleryItem {
  image: string;
  caption: string;
  category: GalleryCategory;
  tall?: boolean;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    image:
      "https://images.unsplash.com/photo-1573662766191-066ba9570a4b?w=800&q=80",
    caption: "The fleet on Kaduna streets",
    category: "fleet",
    tall: true,
  },
  {
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80",
    caption: "Off-grid solar array",
    category: "solar",
  },
  {
    image:
      "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80",
    caption: "Battery swap bay",
    category: "swap",
  },
  {
    image:
      "https://images.unsplash.com/photo-1529171918672-ba6d0733a56c?w=800&q=80",
    caption: "Bus conversion in the workshop",
    category: "conversions",
    tall: true,
  },
  {
    image:
      "https://images.unsplash.com/photo-1649502913092-fb7f0e8fc632?w=800&q=80",
    caption: "Morning routes, zero fumes",
    category: "fleet",
  },
  {
    image:
      "https://images.unsplash.com/photo-1549383433-0d8ef3f38afa?w=800&q=80",
    caption: "Keke NAPEP, electric from scratch",
    category: "conversions",
  },
  {
    image:
      "https://images.unsplash.com/photo-1648023199223-25d3622bcb13?w=800&q=80",
    caption: "Serving 5,000+ commuters daily",
    category: "fleet",
  },
  {
    image:
      "https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=800&q=80",
    caption: "Kaduna from above",
    category: "fleet",
  },
];

export const GALLERY_HEADER_IMAGE =
  "https://images.unsplash.com/photo-1618828665347-d870c38c95c7?w=1400&q=80";
