/*--- Text Reveal + Fade In + Slide In ---*/
(function () {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let inited = false;

  const STAGGER = 0.12;

  // Elements sharing a parent animate together as one staggered batch,
  // triggered by whichever of them enters the viewport first.
  function groupSiblings(nodeList) {
    const groups = [];
    const byParent = new Map();

    nodeList.forEach((el) => {
      const parent = el.parentElement;
      if (!parent) {
        groups.push([el]);
        return;
      }
      let group = byParent.get(parent);
      if (!group) {
        group = [];
        byParent.set(parent, group);
        groups.push(group);
      }
      group.push(el);
    });

    return groups;
  }

  function staggerFor(group) {
    if (group.length < 2) return 0;
    const override = group[0].getAttribute("data-stagger");
    const parsed = override === null ? NaN : parseFloat(override);
    return isNaN(parsed) ? STAGGER : parsed;
  }

  function setInitialState() {
    if (reduceMotion) return;

    const fadeEls = document.querySelectorAll("[data-fade]");
    if (fadeEls.length) gsap.set(fadeEls, { autoAlpha: 0, y: 64 });

    const revealEls = document.querySelectorAll("[data-reveal]");
    if (revealEls.length) gsap.set(revealEls, { autoAlpha: 0 });

    const slideEls = document.querySelectorAll("[data-slide]");
    if (slideEls.length) gsap.set(slideEls, { x: "30vw" });
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
      gsap.set(fadeEls, { autoAlpha: 1, y: 0 });
      return;
    }

    groupSiblings(fadeEls).forEach((group) => {
      gsap.fromTo(
        group,
        { autoAlpha: 0, y: 64 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          stagger: staggerFor(group),
          overwrite: "auto",
          scrollTrigger: {
            trigger: group[0],
            start: "top 90%",
            once: true,
            invalidateOnRefresh: true,
          },
        }
      );
    });
  }

  function initSlide() {
    const slideEls = document.querySelectorAll("[data-slide]");
    if (!slideEls.length) return;

    if (reduceMotion) {
      gsap.set(slideEls, { x: 0 });
      return;
    }

    groupSiblings(slideEls).forEach((group) => {
      gsap.fromTo(
        group,
        { x: "30vw" },
        {
          x: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: staggerFor(group),
          force3D: true,
          overwrite: "auto",
          scrollTrigger: {
            trigger: group[0],
            start: "top 85%",
            once: true,
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
      initSlide();
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
