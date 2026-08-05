/*--- Horizontal scroll (homepage) ---*/
(function () {
  function signalReady() {
    window.__paradigmaHscrollReady = true;
    window.dispatchEvent(new Event("paradigma:hscroll-ready"));
    if (typeof window.__paradigmaInitEffects === "function") {
      window.__paradigmaInitEffects();
    }
  }

  function init() {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
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
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 768px)",
          mobile: "(max-width: 767px)",
        },
        (context) => {
          if (context.conditions.mobile) {
            signalReady();
            return;
          }

          const getScrollDistance = () =>
            Math.max(0, list.scrollWidth - component.offsetWidth);

          const tween = gsap.to(list, {
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

          return () => {
            if (tween.scrollTrigger) tween.scrollTrigger.kill();
            tween.kill();
          };
        }
      );
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
