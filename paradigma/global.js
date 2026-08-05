/*--- Text Reveal + Fade In ---*/
(function () {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let inited = false;

  function setInitialState() {
    if (reduceMotion) return;

    const fadeEls = document.querySelectorAll("[data-fade]");
    if (fadeEls.length) gsap.set(fadeEls, { autoAlpha: 0, y: 64 });

    const revealEls = document.querySelectorAll("[data-reveal]");
    if (revealEls.length) gsap.set(revealEls, { autoAlpha: 0 });
  }

  function initReveal() {
    const elements = document.querySelectorAll("[data-reveal]");
    if (!elements.length) return Promise.resolve();

    if (reduceMotion) {
      elements.forEach((el) => gsap.set(el, { autoAlpha: 1 }));
      return Promise.resolve();
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
      gsap.set(fadeEls, { autoAlpha: 1, y: 0, scale: 1 });
      return;
    }

    fadeEls.forEach((el) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 64, scale: 0.97 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 1.6,
          ease: "power3.out",
          overwrite: "auto",
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true,
          },
        }
      );
    });
  }

  function initEffects() {
    if (inited) return;
    inited = true;

    Promise.resolve(initReveal()).then(() => {
      initFade();
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
  }

  // Expose so home.js can kick this off after the pin exists
  window.__paradigmaInitEffects = initEffects;

  function boot() {
    setInitialState();

    const hasHscroll = !!document.querySelector(".hscroll_component");

    if (!hasHscroll) {
      initEffects();
      return;
    }

    // Pin may already be ready if home.js finished first
    if (window.__paradigmaHscrollReady) {
      initEffects();
      return;
    }

    window.addEventListener("paradigma:hscroll-ready", initEffects, {
      once: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
