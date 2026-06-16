"use client";
import { useEffect, useRef, useState } from "react";

type TypingTextProps = {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
  className?: string;
};

/**
 * Cycles through phrases with a type-on / delete-off effect and a blinking caret.
 * SSR-safe (renders the first phrase as the initial markup, so no-JS and crawlers
 * still see meaningful text) and respects `prefers-reduced-motion`.
 */
const TypingText = ({
  phrases,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseMs = 1600,
  className,
}: TypingTextProps) => {
  const [text, setText] = useState(phrases[0] ?? "");
  const [animate, setAnimate] = useState(false);
  const phraseIndex = useRef(0);
  const charIndex = useRef(phrases[0]?.length ?? 0);
  // Start in "deleting" mode: the first phrase renders fully (SSR-friendly), then
  // the animation deletes it and types the next one. Starting at `false` here
  // would increment charIndex past the phrase length and freeze on phrase 1.
  const deleting = useRef(true);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || phrases.length <= 1) return;
    setAnimate(true);
  }, [phrases.length]);

  useEffect(() => {
    if (!animate) return;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = phrases[phraseIndex.current];

      if (!deleting.current) {
        charIndex.current += 1;
        setText(current.slice(0, charIndex.current));
        if (charIndex.current === current.length) {
          deleting.current = true;
          timer = setTimeout(tick, pauseMs);
          return;
        }
        timer = setTimeout(tick, typingSpeed);
      } else {
        charIndex.current -= 1;
        setText(current.slice(0, charIndex.current));
        if (charIndex.current === 0) {
          deleting.current = false;
          phraseIndex.current = (phraseIndex.current + 1) % phrases.length;
          timer = setTimeout(tick, typingSpeed);
          return;
        }
        timer = setTimeout(tick, deletingSpeed);
      }
    };

    timer = setTimeout(tick, pauseMs);
    return () => clearTimeout(timer);
  }, [animate, phrases, typingSpeed, deletingSpeed, pauseMs]);

  return (
    <span className={className} aria-live="polite">
      {text}
      <span
        aria-hidden="true"
        className="ml-1 inline-block w-[0.06em] animate-pulse self-stretch bg-current align-[-0.1em]"
        style={{ height: "0.95em" }}
      />
    </span>
  );
};

export default TypingText;
