"use client";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Photos live in public/assets/. Sourced from Pexels (free for commercial use,
// no attribution required). Add or remove entries here and the dots, autoplay
// and arrows all follow — nothing else to change.
const slides = [
  { src: "/assets/hero-team-1.jpg", alt: "Hiring team shaking hands with a candidate across a meeting table" },
  { src: "/assets/hero-team-2.jpg", alt: "Colleagues smiling together around a laptop in the office" },
  { src: "/assets/hero-team-3.jpg", alt: "Recruiter and candidate shaking hands after an interview" },
  { src: "/assets/hero-team-4.jpg", alt: "Candidate being handed a pen to sign an offer letter" },
];

const AUTOPLAY_MS = 5000;

type HeroPhotoSliderProps = {
  /** Wrapper classes. Defaults to a full-bleed band; the hero overrides this to
   *  pin the slider behind the copy instead. */
  className?: string;
  /** Scrim drawn over the photos. Required when the slider sits behind text —
   *  the hero copy is dark slate and is unreadable on a bare photo. */
  overlayClassName?: string;
  /** Arrows compete with the hero copy on small screens, so they're opt-out. */
  showArrows?: boolean;
};

const HeroPhotoSlider = ({
  className = "relative z-10 mt-10 h-56 w-full sm:mt-14 sm:h-72 lg:h-96",
  overlayClassName,
  showArrows = true,
}: HeroPhotoSliderProps) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // A photo that 404s would otherwise render as a broken box over the hero.
  // Failed slides fall back to a neutral brand gradient instead.
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const go = useCallback(
    (next: number) => setIndex((next + slides.length) % slides.length),
    [],
  );

  // Autoplay pauses on hover and on focus-within so keyboard users aren't
  // yanked to another slide while tabbing through the arrows.
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className={`group overflow-hidden bg-slate-100 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Life at RecruitKr"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== index}
        >
          {failed[slide.src] ? (
            <div className="h-full w-full bg-gradient-to-br from-[#264a7f] via-[#2f5b98] to-[#69a44f]" />
          ) : (
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              // Only the first slide is above the fold on load; the rest can wait.
              priority={i === 0}
              sizes="100vw"
              className="object-cover object-center"
              onError={() => setFailed((f) => ({ ...f, [slide.src]: true }))}
            />
          )}
        </div>
      ))}

      {/* Scrim sits above the photos but below the controls. */}
      {overlayClassName ? <div aria-hidden className={`absolute inset-0 ${overlayClassName}`} /> : null}

      {/* Arrows stay hidden until hover/focus on pointer devices so they don't
          sit on top of the photo the whole time; always visible on touch. */}
      {showArrows ? (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-700 shadow-md backdrop-blur transition hover:bg-white focus-visible:opacity-100 sm:left-5 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-700 shadow-md backdrop-blur transition hover:bg-white focus-visible:opacity-100 sm:right-5 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronRight size={20} />
          </button>
        </>
      ) : null}

      {/* -mx-1 offsets the buttons' own padding so the dot row stays visually
          centred. Each button is a 40px square touch target with a small dot
          drawn inside it — an 8px dot on its own is unhittable on a phone. */}
      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to photo ${i + 1}`}
            aria-current={i === index}
            className="flex h-10 w-10 items-center justify-center"
          >
            {/* White dots read well straight on a photo, but vanish against the
                light scrim used in background mode — so follow the scrim. The
                white hairline ring keeps the dark dots legible where the scrim
                thins out and the photo shows through at full strength. */}
            <span
              className={`h-2 rounded-full transition-all duration-300 ${
                overlayClassName
                  ? i === index
                    ? "w-6 bg-[#264a7f] ring-1 ring-white/70"
                    : "w-2 bg-slate-400 ring-1 ring-white/70"
                  : i === index
                    ? "w-6 bg-white"
                    : "w-2 bg-white/60"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroPhotoSlider;
