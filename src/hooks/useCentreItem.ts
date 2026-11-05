"use client";

import { useEffect, useState, type MutableRefObject } from "react";

/**
 * Phones have no hover, so the item nearest the middle of the screen becomes
 * "active" instead, following the reader down a list and back up. Returns its
 * index, or -1 when nothing is near the middle (and always -1 from `sm` up,
 * where hover does the job).
 *
 * Used by the marketing feature cards (highlight) and the team cards (which
 * intro video plays).
 */
export function useCentreItem(refs: MutableRefObject<Array<HTMLElement | null>>) {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const phone = window.matchMedia("(max-width: 639px)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      // Only items whose centre is in the middle 60% of the screen qualify, so
      // one just peeking in at an edge never activates.
      let best = -1;
      let bestDistance = window.innerHeight * 0.3;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - mid);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const detach = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const sync = () => {
      detach();
      if (!phone.matches) {
        setActive(-1);
        return;
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      update();
    };

    sync();
    phone.addEventListener("change", sync);
    return () => {
      phone.removeEventListener("change", sync);
      detach();
    };
  }, [refs]);

  return active;
}
