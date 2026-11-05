"use client";
import { startTransition, useEffect, useRef, useState, type MutableRefObject } from "react";
import { motion, MotionConfig, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { BriefcaseBusiness, Linkedin, Mail, Play, Volume2, VolumeX } from "lucide-react";

import TeamConstellation from "@/components/team/TeamConstellation";
import { useCentreItem } from "@/hooks/useCentreItem";
import { fetchTeamMembers, getCachedTeamMembers, type TeamMember } from "@/lib/team";

const INITIAL_TEAM_COUNT = 8;
const TEAM_COUNT_STEP = 8;

// The team as shown while the CRM's `teammembers` collection is empty (it is
// today, so this is what the live page renders). As soon as the CRM returns
// members, its list replaces this one entirely.
// Photos and intros live in public/team/: portraits were cut from each intro
// video, and summaries follow what each person says in their intro.
const DUMMY_TEAM: TeamMember[] = [
  { _id: "team-sachin", name: "Sachin Kumar", role: "Founder, CEO and Managing Director", summary: "Founded RecruitKr. Takes care of day-to-day operations and management, along with employer relations and customer satisfaction.", image: "/team/sachin-kumar.jpg", video: "/team/sachin-kumar.mp4", linkedin: "", email: "" },
  { _id: "team-krishna", name: "Krishna Devi", role: "Full time director", summary: "Guides day-to-day direction and key decisions to keep the company moving forward.", image: "", linkedin: "", email: "" },
  { _id: "team-nisha", name: "Nisha", role: "Client relationship", summary: "Learns what partner companies actually need, not just a job title but the person who will fit and stay, and stays with them through profiles, interview feedback and everything in between.", image: "/team/nisha.jpg", video: "/team/nisha.mp4", linkedin: "", email: "" },
  { _id: "team-komal", name: "Komal", role: "Data management", summary: "Keeps the information behind every hire correct and secure, from candidate records to client requirements and interview feedback, and builds the reports the team runs on.", image: "/team/komal.jpg", video: "/team/komal.mp4", linkedin: "", email: "" },
  { _id: "team-aarti", name: "Aarti", role: "Data management", summary: "Keeps every candidate's profile, skills, salary and notice period in one place, so an urgent client role is matched with a single search.", image: "/team/aarti.jpg", video: "/team/aarti.mp4", linkedin: "", email: "" },
  { _id: "team-ayush", name: "Ayush", role: "Social media intern", summary: "Plans posts, creates reels and schedules the week's content for RecruitKr's social channels, and keeps an eye on comments and engagement.", image: "/team/ayush.jpg", video: "/team/ayush.mp4", linkedin: "", email: "" },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.trim()[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** The card whose intro is playing lights up in brand green; cards at rest carry no shadow. */
const PLAYING_GLOW =
  "data-[playing=true]:bg-white/[0.1] data-[playing=true]:shadow-[0_0_0_1px_#69a44f,0_30px_60px_-30px_rgba(105,164,79,0.7)]"; // taste-skill-ignore: active-state highlight only

/** "web developer" → "Web developer": roles arrive in whatever case the CRM stored. */
const sentenceCase = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

/**
 * Portrait frame: photo (or large initials until one is uploaded), with the
 * intro video layered on top. The video loads nothing until it first plays
 * (preload="none") and fades in over the photo while `playing`.
 *
 * Auto-play (hover, focus, or centred on a phone) is always muted, because
 * browsers refuse sound without a tap. The speaker button is that tap: it
 * plays the intro with sound and keeps it playing until pressed again.
 */
const MemberPortrait = ({
  member,
  playing,
  withSound,
  onToggleSound,
  lead,
}: {
  member: TeamMember;
  playing: boolean;
  withSound: boolean;
  onToggleSound: () => void;
  lead?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const hasImage = Boolean(member.image) && !imageFailed;
  const hasVideo = Boolean(member.video) && !videoFailed;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.muted = !withSound;
      void video.play().catch(() => {
        // Sound refused (no gesture yet): fall back to a muted play.
        video.muted = true;
        void video.play().catch(() => {});
      });
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [playing, withSound]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-[#1f3d6b] ${
        lead ? "aspect-[4/5] sm:max-w-[340px]" : "aspect-[4/5]"
      }`}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.image}
          alt={member.name}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className={`absolute inset-0 flex items-center justify-center font-display font-extrabold tracking-[-0.04em] text-white/90 ${
            lead ? "text-7xl sm:text-8xl" : "text-6xl"
          }`}
        >
          {getInitials(member.name) || "RK"}
        </span>
      )}

      {hasVideo && (
        <video
          ref={videoRef}
          src={member.video}
          poster={hasImage ? member.image : undefined}
          preload="none"
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
          aria-label={`${member.name}'s intro video`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            playing ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {hasVideo && !playing && (
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#0c1c38]/75 px-2.5 py-1 text-xs font-semibold text-white">
          <Play size={12} aria-hidden className="fill-current" /> Intro video
        </span>
      )}

      {hasVideo && (
        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={withSound}
          aria-label={withSound ? `Stop ${member.name}'s intro` : `Play ${member.name}'s intro with sound`}
          className="absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#0c1c38]/80 text-white transition-colors hover:bg-[#69a44f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a9d68d]"
        >
          {withSound ? <Volume2 size={18} aria-hidden /> : <VolumeX size={18} aria-hidden />}
        </button>
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
    <div className={`flex gap-2 ${className}`}>
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#69a44f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a9d68d]"
          >
            <Icon className="h-4 w-4" aria-hidden />
          </a>
        );
      })}
    </div>
  );
};

/**
 * One team member. Plays its intro while hovered or focused (desktop), or
 * while it's the card nearest the middle of the screen (phone, see
 * useCentreItem). Leans gently toward the cursor; rises in once on scroll.
 */
const MemberCard = ({
  member,
  index,
  centred,
  cardRefs,
  lead,
}: {
  member: TeamMember;
  index: number;
  centred: boolean;
  cardRefs: MutableRefObject<Array<HTMLElement | null>>;
  lead?: boolean;
}) => {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [withSound, setWithSound] = useState(false);
  // Phone autoplay on scroll is motion the visitor didn't ask for; skip it
  // under reduced motion (hover, focus and the sound button still work).
  const playing = hovered || focused || withSound || (centred && !reduceMotion);

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 180, damping: 18 });
  const rotateY = useSpring(tiltY, { stiffness: 180, damping: 18 });

  return (
    <motion.article
      ref={(el) => {
        cardRefs.current[index] = el;
      }}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: lead ? 0 : (index % 4) * 0.07 }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        tiltX.set(0);
        tiltY.set(0);
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || reduceMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        tiltY.set(((event.clientX - rect.left) / rect.width - 0.5) * 6);
        tiltX.set(((event.clientY - rect.top) / rect.height - 0.5) * -6);
      }}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      data-playing={playing}
      className={`group rounded-3xl bg-white/[0.06] p-3 transition-[background-color,box-shadow] duration-300 ${PLAYING_GLOW} ${
        lead ? "grid gap-5 sm:grid-cols-[minmax(0,340px)_minmax(0,1fr)] sm:items-center sm:gap-10 sm:p-5" : "flex h-full flex-col"
      }`}
    >
      <MemberPortrait
        member={member}
        playing={playing}
        withSound={withSound}
        onToggleSound={() => setWithSound((on) => !on)}
        lead={lead}
      />
      <div className={lead ? "px-1 pb-1" : "flex flex-1 flex-col px-1 pb-1 pt-4"}>
        <h3 className={`font-display font-extrabold leading-tight text-white ${lead ? "text-3xl sm:text-4xl" : "text-lg"}`}>
          {member.name}
        </h3>
        <p className={`mt-1 font-semibold text-[#a9d68d] ${lead ? "text-base" : "text-sm"}`}>
          {sentenceCase(member.role) || "RecruitKr Team"}
        </p>
        <p className={`mt-3 text-white/80 ${lead ? "max-w-xl text-base leading-relaxed" : "line-clamp-3 text-sm leading-6"}`}>
          {member.summary || "Helping candidates and employers move forward with confidence."}
        </p>
        <SocialLinks member={member} className={lead ? "mt-5" : "mt-auto pt-4"} />
      </div>
    </motion.article>
  );
};

const TeamSection = () => {
  // Seed empty to match SSR; the sessionStorage cache is read after mount so the
  // first client render matches the server (avoids a hydration mismatch).
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_TEAM_COUNT);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const centred = useCentreItem(cardRefs);

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
  cardRefs.current.length = displayed.length;

  return (
    // reducedMotion="user": framer-motion drops the rise-in and tilt for
    // visitors who ask for less motion; content still appears.
    <MotionConfig reducedMotion="user">
      <section className="relative overflow-hidden bg-[#16305a] pb-16 sm:pb-24">
        {/* Hero: a live network of people (three.js) behind the title. */}
        {/* text-white here: the h1's heading-plain reset makes it inherit colour. */}
        <header className="relative isolate overflow-hidden text-white">
          <TeamConstellation />
          <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-36 text-center sm:px-6 sm:pb-24 sm:pt-44">
            {/* h1: this section is the main content of /our-team, its only consumer. */}
            <h1 className="heading-plain font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl">
              The people behind your hiring growth
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              Our team works across recruitment, employer support, and candidate success to make every hiring journey
              feel faster, clearer, and more dependable.
              {teamMembers.some((member) => member.video) &&
                " Hover over anyone, or stop on their card on your phone, to watch their introduction."}
            </p>
          </div>
        </header>

        <div className="container relative mx-auto px-4 sm:px-6">
          {loading && (
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`team-loading-${index}`} className="rounded-3xl bg-white/[0.06] p-3">
                  <div className="aspect-[4/5] animate-pulse rounded-2xl bg-white/10" />
                  <div className="mt-4 h-5 w-32 animate-pulse rounded bg-white/15" />
                  <div className="mt-2 h-4 w-24 animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          )}

          {/* Leader across the top, everyone else in an even grid below. */}
          {!loading && displayed.length > 0 && (
            <div className="mx-auto max-w-6xl">
              <MemberCard member={displayed[0]} index={0} centred={centred === 0} cardRefs={cardRefs} lead />

              {displayed.length > 1 && (
                <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {displayed.slice(1).map((member, i) => (
                    <MemberCard
                      key={member._id}
                      member={member}
                      index={i + 1}
                      centred={centred === i + 1}
                      cardRefs={cardRefs}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && teamMembers.length === 0 && (
            <div className="mx-auto mt-4 max-w-md rounded-3xl bg-white/[0.06] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-white">No team members available right now</p>
              <p className="mt-2 text-sm text-white/75">Please check back soon for updates from the RecruitKr team.</p>
            </div>
          )}

          {!loading && teamMembers.length > INITIAL_TEAM_COUNT && (
            <div className="mt-10 flex justify-center">
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => Math.min(c + TEAM_COUNT_STEP, teamMembers.length))}
                  className="min-h-[48px] rounded-full bg-white px-6 text-sm font-semibold text-[#16305a] transition-colors hover:bg-[#e6eef9]"
                >
                  Show more team members
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setVisibleCount(INITIAL_TEAM_COUNT)}
                  className="min-h-[48px] rounded-full bg-white/10 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Show less
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </MotionConfig>
  );
};

export default TeamSection;
