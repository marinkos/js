/*--- Text Reveal + Fade In ---*/
(function () {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function initReveal() {
    const elements = document.querySelectorAll("[data-reveal]");
    if (!elements.length) return;

    if (reduceMotion) {
      elements.forEach((el) => gsap.set(el, { autoAlpha: 1 }));
      return;
    }

    return document.fonts.ready.then(() => {
      elements.forEach((el) => {
        const split = new SplitText(el, { type: "chars, words" });

        gsap.set(el, { autoAlpha: 1 });
        gsap.set(split.chars, { opacity: 0.1 });

        gsap.to(split.chars, {
          opacity: 1,
          stagger: 0.03,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            end: "top 30%",
            scrub: 0.3,
            invalidateOnRefresh: true,
          },
        });
      });
    });
  }

  function initFade() {
    const fadeEls = document.querySelectorAll("[data-fade]");
    if (!fadeEls.length) return;

    if (reduceMotion) {
      gsap.set(fadeEls, { autoAlpha: 1 });
      return;
    }

    gsap.set(fadeEls, { autoAlpha: 0, y: 24 });

    fadeEls.forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        invalidateOnRefresh: true,
        onEnter: () =>
          gsap.to(el, {
            autoAlpha: 1,
            y: 0,
            duration: 1.2,
            ease: "power2.out",
            overwrite: true,
          }),
        onLeaveBack: () =>
          gsap.to(el, {
            autoAlpha: 0,
            y: 24,
            duration: 0.6,
            ease: "power1.in",
            overwrite: true,
          }),
      });
    });
  }

  let started = false;

  function start() {
    if (started) return;
    started = true;

    Promise.resolve(initReveal()).then(() => {
      initFade();
      ScrollTrigger.refresh();
    });
  }

  function boot() {
    // If the homepage pin exists, wait until home.js finishes setting it up
    // so fade/reveal start positions include the pin spacer.
    if (document.querySelector(".hscroll_component")) {
      window.addEventListener("paradigma:hscroll-ready", start, { once: true });
      // Fallback if home.js is missing on a page that still has the markup
      setTimeout(start, 3000);
      return;
    }
    start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
