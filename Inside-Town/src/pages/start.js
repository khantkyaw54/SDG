import gsap from "gsap";

export function renderStart() {
    const app = document.querySelector("#app");

    app.innerHTML = `
    <main class="intro-page">
      <div class="intro-logo" aria-label="Inside Town">
        <span>I</span>
        <span>N</span>
        <span>S</span>
        <span>I</span>
        <span>D</span>
        <span>E</span>

        <span class="intro-space"></span>

        <span>T</span>
        <span>O</span>
        <span>W</span>
        <span>N</span>
      </div>

      <div class="intro-line"></div>

      <p class="intro-tagline">
        その街のいいお店を、地元の人から教えてもらう。
      </p>
    </main>
  `;

    const letters = document.querySelectorAll(
        ".intro-logo span:not(.intro-space)"
    );

    const line = document.querySelector(".intro-line");
    const tagline = document.querySelector(".intro-tagline");
    const page = document.querySelector(".intro-page");

    const tl = gsap.timeline();

    tl.from(letters, {
        y: 60,
        opacity: 0,
        stagger: 0.06,
        duration: 0.8,
        ease: "power4.out",
    });

    tl.from(
        line,
        {
            scaleX: 0,
            duration: 0.8,
            ease: "power3.inOut",
        },
        "-=0.3"
    );

    tl.from(
        tagline,
        {
            y: 20,
            opacity: 0,
            duration: 0.7,
            ease: "power2.out",
        },
        "-=0.4"
    );

    tl.to({}, { duration: 1 });

    tl.to(page, {
        opacity: 0,
        scale: 1.04,
        duration: 0.8,
    });
}