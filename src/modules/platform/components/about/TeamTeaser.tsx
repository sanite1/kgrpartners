import { Link } from "react-router-dom";
import { TEAM_MEMBERS } from "@/data/team-data";

const initials = (name: string) =>
  name
    .replace(",", "")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

// Compact band linking to the Team page, with an avatar stack for warmth.
const TeamTeaser = () => (
  <section className="bg-mist px-5 py-14 sm:px-8 lg:px-16">
    <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-4" data-aos="fade-up">
        <div className="flex -space-x-3">
          {TEAM_MEMBERS.slice(0, 5).map((member) => (
            <span
              key={member.name}
              title={member.name}
              className="cta-gradient flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-mist text-[14px] font-extrabold text-forest-deep"
            >
              {initials(member.name)}
            </span>
          ))}
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-mist bg-ink text-[13px] font-extrabold text-neon">
            +{TEAM_MEMBERS.length - 5}
          </span>
        </div>
        <h2 className="m-0 text-[26px] font-extrabold tracking-[-0.5px] text-ink sm:text-[30px]">
          The engineers, technicians and drivers making it real.
        </h2>
      </div>
      <Link
        to="/team"
        className="shrink-0 rounded-lg bg-ink px-8 py-4 text-[15px] font-extrabold text-white transition-transform hover:scale-[1.02] hover:text-white"
      >
        Meet the team →
      </Link>
    </div>
  </section>
);

export default TeamTeaser;
