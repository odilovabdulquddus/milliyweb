import { useEffect, useState } from "react";

export function Typewriter({
  words,
  className,
  typingSpeed = 90,
  pause = 1400,
}: {
  words: string[];
  className?: string;
  typingSpeed?: number;
  pause?: number;
}) {
  const [index, setIndex] = useState(0);
  const [sub, setSub] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (words.length === 0) return;
    const word = words[index % words.length];
    if (!deleting && sub === word.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && sub === 0) {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
      return;
    }
    const t = setTimeout(() => setSub((s) => s + (deleting ? -1 : 1)), deleting ? typingSpeed / 2 : typingSpeed);
    return () => clearTimeout(t);
  }, [sub, deleting, index, words, typingSpeed, pause]);

  return <span className={`caret ${className ?? ""}`}>{(words[index % words.length] ?? "").slice(0, sub)}</span>;
}