// src/motion/variants.ts
import type { Variants, Easing } from "framer-motion";

// Tuple typed as an Easing (cubic-bezier)
export const easeSnap: Easing = [0.22, 0.9, 0.23, 1];

export const pressable: Variants = {
  rest:  { y: 0, filter: "brightness(1)" },
  hover: {        filter: "brightness(1.06)" },
  press: { y: 1 }
};

export const menuReveal: Variants = {
  hidden: { y: 12, opacity: 0 },
  show:   { y: 0,  opacity: 1, transition: { duration: 0.22, ease: easeSnap } },
};

export const windowOpen: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.30, ease: easeSnap } },
  exit:   { opacity: 0, scale: 0.98, transition: { duration: 0.18, ease: easeSnap } },
};
