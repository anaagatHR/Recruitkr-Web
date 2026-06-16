"use client";
import { startTransition, useEffect, useState } from "react";
import { BriefcaseBusiness, Linkedin, Mail } from "lucide-react";

import { fetchTeamMembers, getCachedTeamMembers, type TeamMember } from "@/lib/team";

const INITIAL_TEAM_COUNT = 8;
const TEAM_COUNT_STEP = 8;

// Fallback sample team shown when the API has no data / fails to load, so the
// org chart (Boss -> Core Team -> Working Team) always renders something.
const DUMMY_TEAM: TeamMember[] = [
  {
    _id: "dummy-boss",
    name: "Aarav Sharma",
    role: "Founder & CEO",
    summary: "Leads RecruitKr's vision across hiring, growth, and candidate success.",
    image: "",
    linkedin: "",
    email: "",
  },
  {
    _id: "dummy-core-1",
    name: "Priya Nair",
    role: "Head of Recruitment",
    summary: "Drives end-to-end recruitment strategy and employer partnerships.",
    image: "",
    linkedin: "",
    email: "",
  },
  {
    _id: "dummy-core-2",
    name: "Rohan Mehta",
    role: "Operations Lead",
    summary: "Keeps hiring workflows fast, clear, and dependable for everyone.",
    image: "",
    linkedin: "",
    email: "",
  },
  {
    _id: "dummy-work-1",
    name: "Sneha Kapoor",
    role: "Talent Specialist",
    summary: "Connects candidates with the right opportunities every day.",
    image: "",
    linkedin: "",
    email: "",
  },
  {
    _id: "dummy-work-2",
    name: "Vikram Singh",
    role: "Candidate Success Associate",
    summary: "Supports candidates through interviews and onboarding.",
    image: "",
    linkedin: "",
    email: "",
  },
  {
    _id: "dummy-work-3",
    name: "Ananya Rao",
    role: "Employer Support",
    summary: "Helps employers find and hire the right people quickly.",
    image: "",
    linkedin: "",
    email: "",
  },
  {
    _id: "dummy-work-4",
    name: "Karan Verma",
    role: "Sourcing Associate",
    summary: "Builds strong candidate pipelines across industries.",
    image: "",
    linkedin: "",
    email: "",
  },
];

// Vertical trunk + a small pill label between tiers of the org chart.
// A row of up to 4 member cards that all connect up to the trunk above them.
const TierRow = ({
  members,
  lineColor,
  renderCard,
}: {
  members: TeamMember[];
  lineColor: string;
  renderCard: (member: TeamMember, isBoss?: boolean) => JSX.Element;
}) => {
  const single = members.length === 1;
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-6">
      {members.map((member, index) => {
        const isFirst = index === 0;
        const isLast = index === members.length - 1;
        return (
          <div key={member._id} className="relative flex flex-col items-center">
            {/* Horizontal bus line linking the cards across the row */}
            {!single && (
              <span
                className={`absolute top-0 h-px ${lineColor} ${
                  isFirst ? "left-1/2 right-0" : isLast ? "left-0 right-1/2" : "inset-x-0"
                }`}
              />
            )}
            {/* Vertical drop into each card */}
            <span className={`block h-8 w-px sm:h-10 ${lineColor}`} />
            <div className="w-full">{renderCard(member)}</div>
          </div>
        );
      })}
    </div>
  );
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.trim()[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

const TeamSection = () => {
  const cachedTeamMembers = getCachedTeamMembers();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(cachedTeamMembers);
  const [loading, setLoading] = useState(cachedTeamMembers.length === 0);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_TEAM_COUNT);

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        if (cachedTeamMembers.length === 0) {
          setLoading(true);
        }
        setError("");
        const response = await fetchTeamMembers();
        startTransition(() => {
          // Fall back to dummy data when the API returns nothing.
          setTeamMembers(response.length > 0 ? response : DUMMY_TEAM);
          setVisibleCount(INITIAL_TEAM_COUNT);
        });
      } catch (err) {
        // Don't surface an error; show dummy team so the section still renders.
        console.error("[TeamSection] failed to load team members", err);
        startTransition(() => {
          setTeamMembers((current) => (current.length > 0 ? current : DUMMY_TEAM));
        });
      } finally {
        setLoading(false);
      }
    };

    void loadTeamMembers();
  }, []);

  const displayedTeamMembers = teamMembers.slice(0, visibleCount);
  const hasMoreMembers = visibleCount < teamMembers.length;
  const lineColor = "bg-slate-300";

  // --- Boss detection by role keyword; everyone else flows into rows of 4 ---
  const BOSS_KEYWORDS = /(founder|co-?founder|ceo|chief executive|managing director|owner|president)/i;

  const bossIndex = (() => {
    const idx = displayedTeamMembers.findIndex((m) => BOSS_KEYWORDS.test(m.role || ""));
    return idx >= 0 ? idx : displayedTeamMembers.length > 0 ? 0 : -1;
  })();

  const boss = bossIndex >= 0 ? displayedTeamMembers[bossIndex] : undefined;
  const rest = displayedTeamMembers.filter((_, i) => i !== bossIndex);

  // Chunk the remaining members into rows of 4 for the org chart.
  const ROW_SIZE = 4;
  const reportRows: TeamMember[][] = [];
  for (let i = 0; i < rest.length; i += ROW_SIZE) {
    reportRows.push(rest.slice(i, i + ROW_SIZE));
  }

  const renderMemberCard = (member: TeamMember, isBoss = false) => {
    const initials = getInitials(member.name);
    const hasImage = Boolean(member.image);
    const actions = [
      member.linkedin
        ? { label: "LinkedIn", icon: Linkedin, href: member.linkedin }
        : null,
      member.email
        ? { label: "Email", icon: Mail, href: `mailto:${member.email}` }
        : null,
    ].filter(Boolean) as Array<{ label: string; icon: typeof Linkedin; href: string }>;

    return (
      <article
        className={`content-auto group flex h-full flex-col items-center rounded-2xl border bg-white p-3 text-center shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md sm:p-5 ${
          isBoss ? "border-teal-300 ring-1 ring-teal-200" : "border-slate-100"
        }`}
      >
        <div
          className={`flex items-center justify-center overflow-hidden rounded-full font-black uppercase ${
            isBoss ? "h-14 w-14 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-16 sm:w-16"
          } text-xs sm:text-base ${
            hasImage
              ? "bg-slate-100"
              : "bg-[linear-gradient(135deg,#0f766e_0%,#0ea5e9_100%)] text-white"
          }`}
        >
          {hasImage ? (
            <img
              src={member.image}
              alt={member.name}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="h-full w-full object-cover"
            />
          ) : (
            initials || "TM"
          )}
        </div>

        <h3 className="mt-2 line-clamp-2 text-xs font-bold leading-tight text-[hsl(var(--navy-deep))] sm:mt-3 sm:text-sm">
          {member.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.1em] text-teal-700 sm:text-xs">
          {member.role || "RecruitKr Team"}
        </p>

        {/* Summary only on larger screens to keep the 4-up rows compact */}
        <p className="mt-2 hidden text-xs leading-5 text-slate-600 sm:line-clamp-3 lg:block">
          {member.summary || "Helping candidates and employers move forward with confidence."}
        </p>

        <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:mt-3 sm:gap-2">
          {actions.length > 0 ? (
            actions.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={`${member._id}-${action.label}`}
                  href={action.href}
                  target={action.href.startsWith("http") ? "_blank" : undefined}
                  rel={action.href.startsWith("http") ? "noreferrer" : undefined}
                  aria-label={`${member.name} ${action.label}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:border-teal-300 hover:text-teal-700 sm:h-9 sm:w-9"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              );
            })
          ) : (
            <a
              href="/contact"
              aria-label={`${member.name} contact`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:border-teal-300 hover:text-teal-700 sm:h-9 sm:w-9"
            >
              <BriefcaseBusiness className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f6f9ff_0%,#eef4fb_44%,#ffffff_100%)] py-24">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl">
          <div className="inline-flex items-center rounded-sm bg-navy-deep px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white shadow-lg">
            RecruitKr Team
          </div>
          <h2 className="mt-6 max-w-3xl text-5xl font-black uppercase leading-none sm:text-6xl md:text-7xl">
            Meet The
            <span className="block text-gradient-teal">People Behind</span>
            <span className="block text-[hsl(var(--navy-deep))]">Your Hiring Growth</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Our team works across recruitment, employer support, and candidate success to make every hiring
            journey feel faster, clearer, and more dependable.
          </p>
        </div>

        {error && (
          <div className="mt-10 rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <article
                key={`team-loading-${index}`}
                className="rounded-[28px] border border-slate-100 bg-white p-6 text-center shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)]"
              >
                <div className="flex flex-col items-center">
                  <div className="h-28 w-28 animate-pulse rounded-full bg-slate-200" />
                  <div className="mt-5 h-7 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-28 animate-pulse rounded bg-slate-200" />
                  <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-slate-200" />
                  <div className="mt-6 flex gap-3">
                    {Array.from({ length: 3 }).map((__, iconIndex) => (
                      <div key={iconIndex} className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && boss && (
          <div className="mt-14">
            {/* Boss at the top */}
            <div className="mx-auto w-full max-w-xs">{renderMemberCard(boss, true)}</div>

            {/* Everyone else flows into connected rows of 4 */}
            {reportRows.map((row, rowIndex) => (
              <div key={`team-row-${rowIndex}`}>
                {/* Trunk from the node above into this row */}
                <div className="flex justify-center">
                  <span className={`block h-10 w-px ${lineColor}`} />
                </div>
                <TierRow members={row} lineColor={lineColor} renderCard={renderMemberCard} />
              </div>
            ))}
          </div>
        )}

        {!loading && teamMembers.length === 0 && (
          <div className="mt-14 rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-lg font-semibold text-[hsl(var(--navy-deep))]">No team members available right now</p>
            <p className="mt-2 text-sm text-slate-600">Please check back soon for updates from the RecruitKr team.</p>
          </div>
        )}

        {!loading && teamMembers.length > INITIAL_TEAM_COUNT && (
          <div className="mt-10 flex justify-center">
            {hasMoreMembers ? (
              <button
                type="button"
                onClick={() => setVisibleCount((current) => Math.min(current + TEAM_COUNT_STEP, teamMembers.length))}
                className="btn-gradient rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02]"
              >
                Show More Team Members
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setVisibleCount(INITIAL_TEAM_COUNT)}
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/30 hover:text-primary"
              >
                Show Less
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TeamSection;
