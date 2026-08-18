/*--- Text Reveal + Fade In + Slide In ---*/
(function () {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let inited = false;
  let refreshQueued = false;
  let lastHeight = 0;

  // Mobile browsers fire resize when the address bar hides; refreshing there
  // fights the scroll instead of fixing anything.
  ScrollTrigger.config({ ignoreMobileResize: true });

  function gsapAtLeast(major, minor) {
    const parts = String(gsap.version || "0.0").split(".");
    const currentMajor = parseInt(parts[0], 10) || 0;
    const currentMinor = parseInt(parts[1], 10) || 0;
    return (
      currentMajor > major || (currentMajor === major && currentMinor >= minor)
    );
  }

  // clamp() keeps a start/end from landing outside the scrollable range, so
  // elements near the page bottom still fire. Added in GSAP 3.12.
  const supportsClamp = gsapAtLeast(3, 12);

  function clamp(position) {
    return supportsClamp ? "clamp(" + position + ")" : position;
  }

  // Anything already past its start line on load (hero content, or content
  // above a restored scroll position) has no scroll left to cross that line,
  // so it plays straight away instead of waiting for a trigger.
  function isPastStart(el, startRatio) {
    return el.getBoundingClientRect().top < window.innerHeight * startRatio;
  }

  function scheduleRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        refreshQueued = false;
        ScrollTrigger.refresh();
        lastHeight = document.documentElement.scrollHeight;
      });
    });
  }

  // Trigger positions are measured once and cached. Anything that changes page
  // height afterwards (lazy images, font swap, CMS embeds) leaves every trigger
  // below it pointing at a stale scroll position, so remeasure when that happens.
  function watchLayoutShifts() {
    lastHeight = document.documentElement.scrollHeight;

    window.addEventListener("load", scheduleRefresh);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleRefresh);
    }

    document.querySelectorAll("img").forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", scheduleRefresh, { once: true });
      img.addEventListener("error", scheduleRefresh, { once: true });
    });

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      const height = document.documentElement.scrollHeight;
      if (Math.abs(height - lastHeight) < 2) return;
      lastHeight = height;
      scheduleRefresh();
    });

    observer.observe(document.body);
  }

  function setInitialState() {
    if (reduceMotion) return;

    const fadeEls = document.querySelectorAll("[data-fade]");
    if (fadeEls.length) {
      gsap.set(fadeEls, { autoAlpha: 0, y: 32, willChange: "transform, opacity" });
    }

    const revealEls = document.querySelectorAll("[data-reveal]");
    if (revealEls.length) gsap.set(revealEls, { autoAlpha: 0, color: "#D6D6D6" });

    const slideEls = document.querySelectorAll("[data-slide]");
    if (slideEls.length) gsap.set(slideEls, { x: "15vw", willChange: "transform" });
  }

  function initReveal() {
    const elements = document.querySelectorAll("[data-reveal]");
    if (!elements.length) return Promise.resolve();

    if (reduceMotion) {
      elements.forEach((el) => gsap.set(el, { autoAlpha: 1, color: "#0a0a0a" }));
      return Promise.resolve();
    }

    return document.fonts.ready.then(() => {
      elements.forEach((el) => {
        const split = new SplitText(el, { type: "chars, words" });

        gsap.set(el, { autoAlpha: 1 });
        gsap.set(split.chars, { color: "#D6D6D6" });

        const stagger = 0.03;
        const tl = gsap.timeline(
          isPastStart(el, 0.8)
            ? {}
            : {
                scrollTrigger: {
                  trigger: el,
                  start: clamp("top 80%"),
                  end: clamp("top 30%"),
                  scrub: 0.3,
                  invalidateOnRefresh: true,
                },
              }
        );

        // Instant snap per character — scrub only moves the playhead, not the color.
        split.chars.forEach((char, i) => {
          tl.set(char, { color: "#0a0a0a" }, i * stagger);
        });
      });
    });
  }

  function initFade() {
    const fadeEls = document.querySelectorAll("[data-fade]");
    if (!fadeEls.length) return;

    if (reduceMotion) {
      gsap.set(fadeEls, { autoAlpha: 1, y: 0 });
      return;
    }

    fadeEls.forEach((el) => {
      const vars = {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        ease: "power2.out",
        force3D: true,
        overwrite: "auto",
        onComplete: () => gsap.set(el, { clearProps: "willChange" }),
      };

      if (!isPastStart(el, 0.9)) {
        vars.scrollTrigger = {
          trigger: el,
          start: clamp("top 90%"),
          toggleActions: "play none none none",
          invalidateOnRefresh: true,
        };
      }

      gsap.to(el, vars);
    });
  }

  function initSlide() {
    const slideEls = document.querySelectorAll("[data-slide]");
    if (!slideEls.length) return;

    if (reduceMotion) {
      gsap.set(slideEls, { x: 0 });
      return;
    }

    slideEls.forEach((el) => {
      const vars = {
        x: 0,
        duration: 1.8,
        ease: "power2.out",
        overwrite: "auto",
        force3D: true,
        onComplete: () => gsap.set(el, { clearProps: "willChange" }),
      };

      if (!isPastStart(el, 0.85)) {
        vars.scrollTrigger = {
          trigger: el,
          start: clamp("top 85%"),
          toggleActions: "play none none none",
          invalidateOnRefresh: true,
        };
      }

      // Initial x is already set in setInitialState(). This avoids Safari
      // snapping that can happen when fromTo re-applies start values.
      gsap.to(el, vars);
    });
  }

  function initEffects() {
    if (inited) return;
    inited = true;

    Promise.resolve(initReveal()).then(() => {
      initFade();
      initSlide();
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
  }

  // Expose so home.js can kick this off after the pin exists
  window.__paradigmaInitEffects = initEffects;

  function boot() {
    setInitialState();
    watchLayoutShifts();

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
