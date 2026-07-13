import SectionEyebrow from "@/components/shared/SectionEyebrow";
import BoltMark from "@/components/shared/BoltMark";
import { TEAM_MEMBERS } from "@/data/team-data";

// first letters of the first two name parts, e.g. "Amina Adamu Fari" → AA
const initials = (name: string) =>
  name
    .replace(",", "")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

const TeamGrid = () => {
  const [ceo, ...members] = TEAM_MEMBERS;

  return (
    <section className="px-5 py-16 sm:px-8 lg:px-16 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10" data-aos="fade-up">
          <SectionEyebrow>LEADERSHIP AND CREW</SectionEyebrow>
          <h2 className="mb-0 mt-1.5 text-[28px] font-extrabold tracking-[-1px] text-ink sm:text-[32px] lg:text-[36px]">
            Nine people. One electric mission.
          </h2>
        </div>

        {/* CEO feature card */}
        <div
          className="mb-6 flex flex-col gap-6 rounded-[20px] bg-forest p-7 sm:flex-row sm:items-center sm:gap-8 lg:p-10"
          data-aos="fade-up"
        >
          <div className="cta-gradient flex h-24 w-24 flex-none items-center justify-center rounded-2xl text-[32px] font-extrabold text-forest-deep sm:h-28 sm:w-28 sm:text-[36px]">
            {initials(ceo.name)}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-[24px] font-extrabold text-white sm:text-[26px]">
                {ceo.name}
              </span>
              <BoltMark width={14} height={18} />
            </div>
            <span className="text-[14px] font-extrabold tracking-[1px] text-neon">
              {ceo.role.toUpperCase()}
            </span>
            {ceo.bio && (
              <p className="m-0 max-w-[640px] text-[15px] font-medium leading-[1.7] text-mint-pale">
                {ceo.bio}
              </p>
            )}
          </div>
        </div>

        {/* the crew */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member, i) => (
            <div
              key={member.name}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-[0_12px_30px_rgba(13,31,21,0.08)]"
              data-aos="fade-up"
              data-aos-delay={(i % 4) * 75}
            >
              <div className="cta-gradient flex h-14 w-14 items-center justify-center rounded-xl text-[20px] font-extrabold text-forest-deep">
                {initials(member.name)}
              </div>
              <div>
                <div className="text-[16px] font-extrabold leading-snug text-ink">
                  {member.name}
                </div>
                <div className="mt-1 text-[13px] font-semibold text-fog">
                  {member.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamGrid;
