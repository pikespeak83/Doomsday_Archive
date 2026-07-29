import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Vendored from reactbits.dev (TextType, MIT), trimmed for grid-down use:
 * gsap replaced with a CSS-blink cursor, no external deps.
 */
export default function TextType({
  text,
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  showCursor = true,
  cursorCharacter = "_",
  className = "",
  cursorClassName = ""
}) {
  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);
  const [displayed, setDisplayed] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    let timeout;
    const current = textArray[textIndex] ?? "";

    const step = () => {
      if (deleting) {
        if (displayed === "") {
          setDeleting(false);
          if (textIndex === textArray.length - 1 && !loop) return;
          setTextIndex((prev) => (prev + 1) % textArray.length);
          setCharIndex(0);
        } else {
          timeout = setTimeout(() => setDisplayed((prev) => prev.slice(0, -1)), deletingSpeed);
        }
      } else if (charIndex < current.length) {
        timeout = setTimeout(() => {
          setDisplayed((prev) => prev + current[charIndex]);
          setCharIndex((prev) => prev + 1);
        }, typingSpeed);
      } else if (textArray.length > 1 || loop) {
        if (!loop && textIndex === textArray.length - 1) return;
        timeout = setTimeout(() => setDeleting(true), pauseDuration);
      }
    };

    if (!startedRef.current && charIndex === 0 && !deleting && displayed === "") {
      startedRef.current = true;
      timeout = setTimeout(step, initialDelay);
    } else {
      step();
    }
    return () => clearTimeout(timeout);
  }, [charIndex, displayed, deleting, textIndex, textArray, typingSpeed, deletingSpeed, pauseDuration, loop, initialDelay]);

  return (
    <span className={`text-type ${className}`}>
      <span>{displayed}</span>
      {showCursor && <span className={`tt-cursor ${cursorClassName}`}>{cursorCharacter}</span>}
    </span>
  );
}
