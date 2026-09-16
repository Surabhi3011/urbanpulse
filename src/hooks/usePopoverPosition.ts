import { useLayoutEffect, useState, type RefObject } from "react";

export interface PopoverPosition {
  top: number;
  left: number;
}

/** Computes a fixed-position anchor point just below a trigger element,
 * recalculated whenever it opens (and on scroll/resize while open). Using
 * `position: fixed` with a JS-computed offset -- rather than CSS `absolute`
 * relative to a parent -- means the popover can never be clipped or
 * mispositioned by an ancestor's overflow/transform/stacking context on any
 * particular page. */
export function usePopoverPosition(
  triggerRef: RefObject<HTMLElement | null>,
  open: boolean
): PopoverPosition | null {
  const [position, setPosition] = useState<PopoverPosition | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, triggerRef]);

  return position;
}
