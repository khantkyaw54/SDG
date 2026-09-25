import { useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

export default function Start() {
    const pageRef = useRef(null);
    const logoRef = useRef(null);
    const taglineRef = useRef(null);

    const navigate = useNavigate();

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                onComplete: () => {
                    navigate("/select");
                },
            });

            tl.fromTo(
                logoRef.current,
                {
                    opacity: 0,
                    scale: 0.7,
                    y: 30,
                },
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 1,
                    ease: "power4.out",
                }
            );

            tl.fromTo(
                taglineRef.current,
                {
                    opacity: 0,
                    y: 20,
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    ease: "power2.out",
                },
                "-=0.3"
            );

            tl.to({}, { duration: 1 });

            tl.to(pageRef.current, {
                opacity: 0,
                scale: 1.05,
                duration: 0.7,
                ease: "power2.inOut",
            });
        }, pageRef);

        return () => {
            ctx.revert();
        };
    }, [navigate]);

    return (
        <main className="start-page" ref={pageRef}>
            <div className="start-page__content">
                <h1 ref={logoRef} className="start-page__logo">
                    INSIDE TOWN
                </h1>

                <p ref={taglineRef} className="start-page__tagline">
                    その街のいいお店を、
                    <br />
                    地元の人から教えてもらう。
                </p>
            </div>
        </main>
    );
}