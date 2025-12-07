"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function AnimatedName() {
  const containerRef = useRef(null);

  const sentences = [
    "Mohamed Ayman Mohamed - 1200245 - Testing Lab",
    "Submitted to Eng Maram",
  ];

  useEffect(() => {
    const container = containerRef.current;
    let currentIndex = 0;

    function typeSentence() {
      container.innerHTML = "";

      const sentence = sentences[currentIndex];
      const letters = [];

      const words = sentence.split(" ");
      words.forEach((word, wordIndex) => {
        word.split("").forEach((char) => {
          const span = document.createElement("span");
          span.textContent = char;
          span.style.opacity = 0;
          container.appendChild(span);
          letters.push(span);
        });

        if (wordIndex !== words.length - 1) {
          const space = document.createElement("span");
          space.textContent = " ";
          space.style.opacity = 0;
          container.appendChild(space);
          letters.push(space);
        }
      });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.to(letters, {
            opacity: 0,
            duration: 0.1,
            stagger: 0.05,
            onComplete: () => {
              currentIndex = (currentIndex + 1) % sentences.length;
              typeSentence();
            },
          });
        },
      });

      tl.to(letters, {
        opacity: 1,
        duration: 0.15,
        stagger: 0.15,
        ease: "none",
      });
    }

    typeSentence();
  }, []);

  return <div ref={containerRef} className="text-white text-2xl font-mono" />;
}
