/*--- Horizontal scroll (homepage) ---*/
(function () {
  let signaled = false;

  function ready() {
    if (signaled) return;
    signaled = true;
    window.dispatchEvent(new Event("paradigma:hscroll-ready"));
  }

  function init() {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const component = document.querySelector(".hscroll_component");
    const list = document.querySelector(".hscroll_list");

    if (!component || !list || reduceMotion) {
      ready();
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
            ready();
            return;
          }

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
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          // Pin spacer is in the layout — tell global.js to create fade/reveal now
          ScrollTrigger.refresh();
          ready();

          return () => {
            tween.scrollTrigger && tween.scrollTrigger.kill();
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
