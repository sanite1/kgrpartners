import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  GALLERY_FILTERS,
  GALLERY_ITEMS,
  type GalleryFilter,
} from "@/data/gallery-data";

// Filterable photo grid; tall items span two rows for a collage feel.
const GalleryGrid = () => {
  const [active, setActive] = useState<GalleryFilter["id"]>("all");

  const items =
    active === "all"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === active);

  return (
    <section className="px-5 py-16 sm:px-8 lg:px-16 lg:py-20">
      <div className="mx-auto max-w-7xl">
        {/* filter chips */}
        <div className="mb-8 flex flex-wrap gap-2.5" data-aos="fade-up">
          {GALLERY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActive(filter.id)}
              className={cn(
                "cursor-pointer rounded-full border px-5 py-2.5 text-[14px] font-bold transition-colors",
                active === filter.id
                  ? "cta-gradient border-transparent text-forest-deep"
                  : "border-line bg-white text-bark hover:border-brand-500 hover:text-brand-600",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="grid auto-rows-[200px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <figure
              key={item.image}
              className={cn(
                "group relative m-0 overflow-hidden rounded-[18px]",
                item.tall && "sm:row-span-2",
              )}
            >
              <img
                src={item.image}
                alt={item.caption}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <figcaption className="absolute bottom-3.5 left-3.5 rounded-[10px] bg-[rgba(13,31,21,0.85)] px-3.5 py-2 text-[13px] font-extrabold text-white">
                {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mb-0 mt-6 text-[13px] font-medium text-fog">
          Placeholder photography. Professional photos of the fleet, stations
          and workshop are on the way.
        </p>
      </div>
    </section>
  );
};

export default GalleryGrid;
