/*--- Horizontal scroll (homepage) ---*/
(function () {
  function init() {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const component = document.querySelector(".hscroll_component");
    const list = document.querySelector(".hscroll_list");

    if (!component || !list || reduceMotion) return;

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

      mm.add("(min-width: 768px)", () => {
        const getScrollDistance = () =>
          list.scrollWidth - component.offsetWidth;

        const tween = gsap.to(list, {
          x: () => -getScrollDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: component,
            start: "top top",
            end: () => `+=${getScrollDistance()}`,
            scrub: 0.5,
            pin: true,
            invalidateOnRefresh: true,
          },
        });

        // Recalculate fade/reveal triggers from global.js now that
        // the pin spacer exists and pushes content below downward.
        ScrollTrigger.refresh();

        return () => {
          tween.scrollTrigger && tween.scrollTrigger.kill();
          tween.kill();
        };
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
