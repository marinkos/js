/*--- Horizontal scroll + data-slide (homepage) ---*/
(function () {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let slidesInited = false;

  function setSlideInitial() {
    const els = document.querySelectorAll("[data-slide]");
    if (!els.length || reduceMotion) return;
    gsap.set(els, { x: "30vw" });
  }

  function initSlides() {
    if (slidesInited) return;
    slidesInited = true;

    const els = document.querySelectorAll("[data-slide]");
    if (!els.length) return;

    if (reduceMotion) {
      gsap.set(els, { x: 0 });
      return;
    }

    els.forEach((el) => {
      gsap.fromTo(
        el,
        { x: "30vw" },
        {
          x: 0,
          duration: 1.5,
          ease: "power3.out",
          overwrite: "auto",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true,
          },
        }
      );
    });

    ScrollTrigger.refresh();
  }

  function signalReady() {
    window.__paradigmaHscrollReady = true;
    window.dispatchEvent(new Event("paradigma:hscroll-ready"));
    if (typeof window.__paradigmaInitEffects === "function") {
      window.__paradigmaInitEffects();
    }
    initSlides();
  }

  function init() {
    gsap.registerPlugin(ScrollTrigger);
    setSlideInitial();

    const component = document.querySelector(".hscroll_component");
    const list = document.querySelector(".hscroll_list");

    if (!component || !list || reduceMotion) {
      signalReady();
      return;
    }

    const images = list.querySelectorAll("img");

    Promise.all(
      Array.from(images).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((res) => {
              img.onload = img.onerror = res;
            })
      )
    ).then(() => {
      const getScrollDistance = () =>
        Math.max(0, list.scrollWidth - component.offsetWidth);

      // Skip pin if there's nothing to scroll horizontally
      if (getScrollDistance() <= 0) {
        signalReady();
        return;
      }

      gsap.to(list, {
        x: () => -getScrollDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: component,
          start: "top top",
          end: () => "+=" + getScrollDistance(),
          scrub: 0.5,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Wait 2 frames so pin-spacer is in the layout, then unlock effects
      ScrollTrigger.refresh();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          signalReady();
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });
})();
