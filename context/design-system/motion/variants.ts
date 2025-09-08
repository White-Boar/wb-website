/** Framer Motion reusable variants  */
export const fadeInUp = {
  hidden: { opacity: 0, translateY: 24 },
  show:   { opacity: 1, translateY: 0, transition: { duration: .2, ease: [.25, .8, .25, 1] } }
};

export const slideFade = (dir: "left" | "right" = "left") => ({
  hidden: { opacity: 0, x: dir === "left" ? -24 : 24 },
  show:   { opacity: 1, x: 0, transition: { duration: .25, ease: [.25, .8, .25, 1] } }
});

export const staggerChildren = {
  hidden: { opacity: 1 },
  show: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    } 
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { duration: .3, ease: [.25, .8, .25, 1] } }
};

export const slideUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: .4, ease: [.25, .8, .25, 1] } }
};
