"use client";
import { startTransition, useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, Linkedin, Mail, Sparkles } from "lucide-react";

import { fetchTeamMembers, getCachedTeamMembers, type TeamMember } from "@/lib/team";

const INITIAL_TEAM_COUNT = 8;
const TEAM_COUNT_STEP = 8;

// Fallback sample team shown when the API has no data / fails to load, so the
// section always renders something (a leader + the rest of the team).
const DUMMY_TEAM: TeamMember[] = [
  { _id: "dummy-boss", name: "Sachin Kumar", role: "CEO and Managing Director", summary: "Sets RecruitKr's vision and steers the company across hiring, growth, and long-term strategy.", image: "", linkedin: "", email: "" },
  { _id: "dummy-core-1", name: "Krishna Devi", role: "Full time director", summary: "Guides day-to-day direction and key decisions to keep the company moving forward.", image: "", linkedin: "", email: "" },
  { _id: "dummy-core-2", name: "Ajay Sharma", role: "web developer", summary: "Builds and maintains the RecruitKr platform, shipping fast and reliable features.", image: "", linkedin: "", email: "" },
  { _id: "dummy-work-1", name: "Neha Verma", role: "operation & deployment", summary: "Runs smooth operations and handles deployments so everything stays live and stable.", image: "", linkedin: "", email: "" },
  { _id: "dummy-work-2", name: "Mohd. Siddhiq", role: "marketing & lead generation", summary: "Drives marketing campaigns and generates quality leads to grow the business.", image: "", linkedin: "", email: "" },
  { _id: "dummy-work-3", name: "Mohammad Saad Farooqui", role: "finance compriance", summary: "Manages finances and keeps the company compliant with every regulation.", image: "", linkedin: "", email: "" },
  { _id: "dummy-work-4", name: "Kinshuk Gujar", role: "research & analyze", summary: "Researches the market and analyzes data to power smarter hiring decisions.", image: "", linkedin: "", email: "" },
  { _id: "dummy-work-5", name: "Paridhi", role: "business developer", summary: "Builds partnerships and opens new opportunities to expand RecruitKr's reach.", image: "", linkedin: "", email: "" },
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
  // Media priority: video (hover/tap to play) → photo → initials. A broken
  // image URL falls back to initials instead of the browser's broken-img icon.
  const [imageFailed, setImageFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const hasVideo = Boolean(member.video) && !videoFailed;
  const hasImage = Boolean(member.image) && !imageFailed;

  const playVideo = () => {
    // Play with sound (never mute). Browsers may block un-gestured autoplay on
    // hover — the catch keeps that silent; a tap/click always counts as a
    // gesture and will play.
    void videoRef.current?.play().catch(() => {});
  };
  const stopVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };
  const toggleVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) playVideo();
    else stopVideo();
  };

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-extrabold uppercase ring-2 ring-white/20 transition-all duration-300 group-hover:ring-[#69a44f] ${dims} ${
        hasVideo || hasImage ? "bg-white/10" : "bg-[linear-gradient(135deg,#3a6bb0_0%,#69a44f_100%)] text-white"
      }`}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          src={member.video}
          poster={hasImage ? member.image : undefined}
          preload="metadata"
          loop
          playsInline
          onMouseEnter={playVideo}
          onMouseLeave={stopVideo}
          onClick={toggleVideo}
          onError={() => setVideoFailed(true)}
          className="h-full w-full cursor-pointer object-cover"
          aria-label={`${member.name} intro video`}
        />
      ) : hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.image}
          alt={member.name}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(member.name) || "TM"
      )}
    </div>
  );
};

const SocialLinks = ({ member, className = "" }: { member: TeamMember; className?: string }) => {
  const actions = [
    member.linkedin ? { label: "LinkedIn", icon: Linkedin, href: member.linkedin } : null,
    member.email ? { label: "Email", icon: Mail, href: `mailto:${member.email}` } : null,
  ].filter(Boolean) as Array<{ label: string; icon: typeof Linkedin; href: string }>;

  const list = actions.length > 0 ? actions : [{ label: "Contact", icon: BriefcaseBusiness, href: "/contact" }];

  return (
    <div className={`mt-3 flex justify-center gap-2 ${className}`}>
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition-colors hover:border-[#69a44f] hover:bg-[#69a44f] hover:text-white sm:h-9 sm:w-9"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
};

/**
 * Glass card on the navy band. White boxes on navy read as holes punched in the
 * section; a translucent panel with white type keeps the band continuous and
 * lets the brand green do the work on hover.
 */
const TeamCard = ({ member }: { member: TeamMember }) => (
  <article className="group flex h-full w-full flex-col items-center rounded-2xl border border-white/15 bg-white/[0.07] p-3 text-center backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-[#69a44f]/60 hover:bg-white/[0.12] hover:shadow-[0_22px_45px_-24px_rgba(105,164,79,0.8)] sm:p-5">
    <Avatar member={member} size="md" />
    <h3 className="mt-2.5 line-clamp-2 text-[13px] font-bold leading-tight text-white sm:mt-3 sm:text-sm">
      {member.name}
    </h3>
    <p className="mt-1 line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.1em] text-[#a9d68d] sm:text-[11px]">
      {member.role || "RecruitKr Team"}
    </p>
    {/* Summary is desktop-only: at two cards across on a phone it pushed each
        tile past 200px for a line of copy the name and role already imply. */}
    <p className="mt-2 hidden text-xs leading-5 text-white/70 sm:line-clamp-3 sm:block">
      {member.summary || "Helping candidates and employers move forward with confidence."}
    </p>
    <div className="mt-auto pt-2.5 sm:pt-3">
      <SocialLinks member={member} />
    </div>
  </article>
);

/**
 * The first member, given the width of the row: portrait beside the name, role
 * and full summary rather than squeezed into the same tile as everyone else.
 * Replaces the old "two cards centred over a drawn tree connector", which only
 * lined up when the team was exactly eight people.
 */
const TeamLeadCard = ({ member }: { member: TeamMember }) => (
  <article className="group flex flex-col items-center gap-4 rounded-3xl border border-white/15 bg-white/[0.09] p-4 text-center backdrop-blur transition-all duration-300 hover:border-[#69a44f]/60 hover:bg-white/[0.13] sm:flex-row sm:gap-7 sm:p-7 sm:text-left">
    <Avatar member={member} size="lg" />
    <div className="min-w-0 flex-1">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#69a44f]/40 bg-[#69a44f]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a9d68d]">
        Leadership
      </span>
      <h3 className="mt-2.5 font-heading text-lg font-extrabold leading-tight text-white sm:text-2xl">
        {member.name}
      </h3>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#a9d68d] sm:text-xs">
        {member.role || "RecruitKr Team"}
      </p>
      <p className="mt-2.5 text-xs leading-[1.6] text-white/75 sm:text-sm">
        {member.summary || "Helping candidates and employers move forward with confidence."}
      </p>
      <SocialLinks member={member} className="sm:justify-start" />
    </div>
  </article>
);

const TeamSection = () => {
  // Seed empty to match SSR; the sessionStorage cache is read after mount so the
  // first client render matches the server (avoids a hydration mismatch).
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_TEAM_COUNT);

  useEffect(() => {
    const cachedTeamMembers = getCachedTeamMembers();
    if (cachedTeamMembers.length > 0) {
      setTeamMembers(cachedTeamMembers);
      setLoading(false);
    }
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

  // Surface leaders (founder/CEO etc.) first so they land in the top row.
  const BOSS_KEYWORDS = /(founder|co-?founder|ceo|chief executive|managing director|owner|president)/i;
  const ordered = [...teamMembers].sort((a, b) => {
    const aBoss = BOSS_KEYWORDS.test(a.role || "") ? 0 : 1;
    const bBoss = BOSS_KEYWORDS.test(b.role || "") ? 0 : 1;
    return aBoss - bBoss;
  });

  const displayed = ordered.slice(0, visibleCount);
  const hasMore = visibleCount < teamMembers.length;

  return (
    // Navy band, matching the marketing hero. The heading here is white end to
    // end, and white type needs a dark surface — on the pale gradient this
    // section used to carry it would have been white-on-white. The member cards
    // are solid white and read as well on navy as they did on the tint.
    <section className="relative overflow-hidden bg-[#16305a] py-12 sm:py-20 lg:py-24">
      <div aria-hidden className="absolute inset-0 opacity-60">
        <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-[#69a44f]/20 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
            <Sparkles size={13} /> RecruitKr Team
          </span>
          <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-white sm:mt-5 sm:text-4xl lg:text-5xl">
            The people behind your hiring growth
          </h2>
          <span className="mx-auto mt-4 block h-1 w-12 rounded-full bg-gradient-to-r from-white via-[#a9d68d] to-[#69a44f] sm:mt-5 sm:w-16" />
          <p className="mx-auto mt-3 max-w-xl text-[13px] leading-relaxed text-white/85 sm:mt-4 sm:text-base">
            Our team works across recruitment, employer support, and candidate success to make every hiring
            journey feel faster, clearer, and more dependable.
          </p>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={`team-loading-${index}`}
                className="rounded-2xl border border-white/15 bg-white/[0.07] p-3 text-center sm:p-5"
              >
                <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-white/15 sm:h-[72px] sm:w-[72px]" />
                <div className="mx-auto mt-4 h-4 w-24 animate-pulse rounded bg-white/15" />
                <div className="mx-auto mt-2 h-3 w-20 animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {/* Lead member across the top, everyone else in an even grid below. */}
        {!loading && displayed.length > 0 && (
          <div className="mx-auto mt-8 max-w-6xl sm:mt-12">
            <TeamLeadCard member={displayed[0]} />

            {displayed.length > 1 && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {displayed.slice(1).map((member) => (
                  <TeamCard key={member._id} member={member} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && teamMembers.length === 0 && (
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-dashed border-white/25 bg-white/[0.07] px-6 py-12 text-center backdrop-blur">
            <p className="text-lg font-semibold text-white">No team members available right now</p>
            <p className="mt-2 text-sm text-white/70">Please check back soon for updates from the RecruitKr team.</p>
          </div>
        )}

        {/* Show more / less */}
        {!loading && teamMembers.length > INITIAL_TEAM_COUNT && (
          <div className="mt-8 flex justify-center sm:mt-10">
            {hasMore ? (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => Math.min(c + TEAM_COUNT_STEP, teamMembers.length))}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#16305a] shadow-[0_14px_30px_-16px_rgba(0,0,0,0.8)] transition-transform hover:scale-[1.02]"
              >
                Show more team members
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setVisibleCount(INITIAL_TEAM_COUNT)}
                className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:border-white/60 hover:bg-white/20"
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
