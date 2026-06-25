"use client";
import { startTransition, useEffect, useState } from "react";
import { BriefcaseBusiness, Linkedin, Mail, Sparkles } from "lucide-react";

import { fetchTeamMembers, getCachedTeamMembers, type TeamMember } from "@/lib/team";

const INITIAL_TEAM_COUNT = 8;
const TEAM_COUNT_STEP = 8;

// Fallback sample team shown when the API has no data / fails to load, so the
// section always renders something (a leader + the rest of the team).
const DUMMY_TEAM: TeamMember[] = [
  { _id: "dummy-boss", name: "Aarav Sharma", role: "Founder & CEO", summary: "Leads RecruitKr's vision across hiring, growth, and candidate success.", image: "", linkedin: "", email: "" },
  { _id: "dummy-core-1", name: "Priya Nair", role: "Head of Recruitment", summary: "Drives end-to-end recruitment strategy and employer partnerships.", image: "", linkedin: "", email: "" },
  { _id: "dummy-core-2", name: "Rohan Mehta", role: "Operations Lead", summary: "Keeps hiring workflows fast, clear, and dependable for everyone.", image: "", linkedin: "", email: "" },
  { _id: "dummy-work-1", name: "Sneha Kapoor", role: "Talent Specialist", summary: "Connects candidates with the right opportunities every day.", image: "", linkedin: "", email: "" },
  { _id: "dummy-work-2", name: "Vikram Singh", role: "Candidate Success", summary: "Supports candidates through interviews and onboarding.", image: "", linkedin: "", email: "" },
  { _id: "dummy-work-3", name: "Ananya Rao", role: "Employer Support", summary: "Helps employers find and hire the right people quickly.", image: "", linkedin: "", email: "" },
  { _id: "dummy-work-4", name: "Karan Verma", role: "Sourcing Associate", summary: "Builds strong candidate pipelines across industries.", image: "", linkedin: "", email: "" },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.trim()[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

const Avatar = ({ member, size }: { member: TeamMember; size: "lg" | "md" }) => {
  const dims = size === "lg" ? "h-24 w-24 text-2xl" : "h-16 w-16 text-base sm:h-[72px] sm:w-[72px]";
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-extrabold uppercase ${dims} ${
        member.image ? "bg-slate-100" : "bg-[linear-gradient(135deg,#264a7f_0%,#69a44f_100%)] text-white"
      }`}
    >
      {member.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.image} alt={member.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        getInitials(member.name) || "TM"
      )}
    </div>
  );
};

const SocialLinks = ({ member }: { member: TeamMember }) => {
  const actions = [
    member.linkedin ? { label: "LinkedIn", icon: Linkedin, href: member.linkedin } : null,
    member.email ? { label: "Email", icon: Mail, href: `mailto:${member.email}` } : null,
  ].filter(Boolean) as Array<{ label: string; icon: typeof Linkedin; href: string }>;

  const list = actions.length > 0 ? actions : [{ label: "Contact", icon: BriefcaseBusiness, href: "/contact" }];

  return (
    <div className="mt-3 flex justify-center gap-2">
      {list.map((action) => {
        const Icon = action.icon;
        const external = action.href.startsWith("http");
        return (
          <a
            key={`${member._id}-${action.label}`}
            href={action.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            aria-label={`${member.name} ${action.label}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#69a44f] hover:text-[#4d7a38]"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
};

const TeamSection = () => {
  const cachedTeamMembers = getCachedTeamMembers();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(cachedTeamMembers);
  const [loading, setLoading] = useState(cachedTeamMembers.length === 0);
  const [visibleCount, setVisibleCount] = useState(INITIAL_TEAM_COUNT);

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        if (cachedTeamMembers.length === 0) setLoading(true);
        const response = await fetchTeamMembers();
        startTransition(() => {
          setTeamMembers(response.length > 0 ? response : DUMMY_TEAM);
          setVisibleCount(INITIAL_TEAM_COUNT);
        });
      } catch (err) {
        console.error("[TeamSection] failed to load team members", err);
        startTransition(() => setTeamMembers((current) => (current.length > 0 ? current : DUMMY_TEAM)));
      } finally {
        setLoading(false);
      }
    };
    void loadTeamMembers();
  }, []);

  const displayed = teamMembers.slice(0, visibleCount);
  const hasMore = visibleCount < teamMembers.length;

  // Surface the leader (founder/CEO) as a featured card; the rest go in a grid.
  const BOSS_KEYWORDS = /(founder|co-?founder|ceo|chief executive|managing director|owner|president)/i;
  const bossIndex = (() => {
    const idx = displayed.findIndex((m) => BOSS_KEYWORDS.test(m.role || ""));
    return idx >= 0 ? idx : displayed.length > 0 ? 0 : -1;
  })();
  const boss = bossIndex >= 0 ? displayed[bossIndex] : undefined;
  const rest = displayed.filter((_, i) => i !== bossIndex);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f6f9ff_0%,#eef4fb_44%,#ffffff_100%)] py-16 sm:py-20 lg:py-24">
      <div aria-hidden className="absolute inset-0 opacity-60">
        <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#264a7f] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
            <Sparkles size={13} /> RecruitKr Team
          </span>
          <h2 className="mt-5 font-heading text-3xl font-extrabold tracking-tight text-[hsl(var(--navy-deep))] sm:text-4xl lg:text-5xl">
            The people behind your{" "}
            <span className="text-gradient-teal">hiring growth</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Our team works across recruitment, employer support, and candidate success to make every hiring
            journey feel faster, clearer, and more dependable.
          </p>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`team-loading-${index}`} className="rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm">
                <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-slate-200 sm:h-[72px] sm:w-[72px]" />
                <div className="mx-auto mt-4 h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="mx-auto mt-2 h-3 w-20 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* Featured leader */}
        {!loading && boss && (
          <div className="mx-auto mt-12 max-w-lg">
            <article className="relative overflow-hidden rounded-3xl border border-[#264a7f]/15 bg-white p-6 text-center shadow-[0_8px_30px_rgba(38,74,127,0.08)] sm:p-8">
              <span className="absolute right-4 top-4 rounded-full bg-[#69a44f]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#4d7a38]">
                Leadership
              </span>
              <div className="flex flex-col items-center">
                <Avatar member={boss} size="lg" />
                <h3 className="mt-4 text-lg font-extrabold text-[hsl(var(--navy-deep))]">{boss.name}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">
                  {boss.role || "RecruitKr Team"}
                </p>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                  {boss.summary || "Leading RecruitKr's mission to make hiring faster and more human."}
                </p>
                <SocialLinks member={boss} />
              </div>
            </article>
          </div>
        )}

        {/* Team grid — 2 cols on phone, scaling up */}
        {!loading && rest.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:mt-8 sm:grid-cols-3 lg:grid-cols-4">
            {rest.map((member) => (
              <article
                key={member._id}
                className="group flex h-full flex-col items-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:shadow-md sm:p-5"
              >
                <Avatar member={member} size="md" />
                <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-tight text-[hsl(var(--navy-deep))]">
                  {member.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.1em] text-teal-700 sm:text-[11px]">
                  {member.role || "RecruitKr Team"}
                </p>
                <p className="mt-2 hidden text-xs leading-5 text-slate-600 sm:line-clamp-3 lg:block">
                  {member.summary || "Helping candidates and employers move forward with confidence."}
                </p>
                <div className="mt-auto pt-3">
                  <SocialLinks member={member} />
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && teamMembers.length === 0 && (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-[hsl(var(--navy-deep))]">No team members available right now</p>
            <p className="mt-2 text-sm text-slate-600">Please check back soon for updates from the RecruitKr team.</p>
          </div>
        )}

        {/* Show more / less */}
        {!loading && teamMembers.length > INITIAL_TEAM_COUNT && (
          <div className="mt-10 flex justify-center">
            {hasMore ? (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => Math.min(c + TEAM_COUNT_STEP, teamMembers.length))}
                className="btn-gradient rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02]"
              >
                Show more team members
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setVisibleCount(INITIAL_TEAM_COUNT)}
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/30 hover:text-primary"
              >
                Show less
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TeamSection;
