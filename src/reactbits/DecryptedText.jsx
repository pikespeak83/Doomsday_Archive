import { useEffect, useRef, useState } from "react";

/**
 * Vendored from reactbits.dev (DecryptedText, MIT) and trimmed for offline
 * grid-down use: no external deps, animates on mount, sequential reveal.
 */
export default function DecryptedText({
  text,
  speed = 34,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*()_+=<>[]",
  className = "",
  encryptedClassName = "",
  startDelay = 0,
  onComplete
}) {
  const [display, setDisplay] = useState(() => scramble(text, 0, characters));
  const [revealed, setRevealed] = useState(0);
  const timer = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setRevealed(0);
    const start = setTimeout(() => {
      timer.current = setInterval(() => {
        setRevealed((prev) => {
          const next = prev + 1;
          if (next >= text.length) {
            clearInterval(timer.current);
            if (!doneRef.current) {
              doneRef.current = true;
              setTimeout(() => onComplete?.(), 60);
            }
          }
          return Math.min(next, text.length);
        });
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      clearInterval(timer.current);
    };
  }, [text, speed, startDelay]);

  useEffect(() => {
    setDisplay(scramble(text, revealed, characters));
    if (revealed < text.length) {
      // keep scrambling the unrevealed tail between reveal ticks
      const jitter = setTimeout(() => setDisplay(scramble(text, revealed, characters)), speed / 2);
      return () => clearTimeout(jitter);
    }
  }, [revealed, text, characters, speed]);

  return (
    <span style={{ display: "inline-block", whiteSpace: "pre-wrap" }}>
      {display.split("").map((char, i) => (
        <span key={i} className={i < revealed ? className : encryptedClassName}>
          {char}
        </span>
      ))}
    </span>
  );
}

function scramble(text, revealedCount, characters) {
  return text
    .split("")
    .map((char, i) => {
      if (i < revealedCount || char === " ") return char;
      return characters[Math.floor(Math.random() * characters.length)];
    })
    .join("");
}
