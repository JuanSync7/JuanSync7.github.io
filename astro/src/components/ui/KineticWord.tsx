import { useEffect, useRef, useState } from 'react';

interface Props {
  word: string;
  altWord?: string;
  delay?: number;
  loop?: boolean;
  /** Must be a literal prefix of `word`; the prefix renders struck-through, the rest unstruck. */
  strikePrefix?: string;
  /** Must be a literal prefix of `altWord`; the prefix renders underlined, the rest plain. */
  underlinePrefix?: string;
  variant?: 1 | 2;
}

const SCRAMBLE_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

export default function KineticWord({
  word,
  altWord,
  delay = 1500,
  loop = false,
  strikePrefix,
  underlinePrefix,
  variant,
}: Props) {
  const [text, setText] = useState(word);
  const [glitching, setGlitching] = useState(false);
  const [settled, setSettled] = useState(true);
  const currentRef = useRef(word);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const glitchTo = (target: string, cb?: () => void) => {
      if (cancelled) return;
      setGlitching(true);
      setSettled(false);
      if (settleTimer.current) clearTimeout(settleTimer.current);
      let count = 0;
      const interval = setInterval(() => {
        if (cancelled) {
          clearInterval(interval);
          return;
        }
        count++;
        const progress = count / 14;
        const scrambled = target
          .split('')
          .map((c, i) => {
            if (i / target.length < progress) return c;
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join('');
        setText(scrambled);
        if (count >= 14) {
          clearInterval(interval);
          setText(target);
          currentRef.current = target;
          setGlitching(false);
          settleTimer.current = setTimeout(() => {
            if (!cancelled) setSettled(true);
          }, 1000);
          cb?.();
        }
      }, 55);
    };

    const startLoop = () => {
      if (cancelled) return;
      const pause = 3000 + Math.random() * 3000;
      setTimeout(() => {
        if (cancelled) return;
        const next = currentRef.current === word ? altWord ?? word : word;
        glitchTo(next, () => {
          if (loop) startLoop();
        });
      }, pause);
    };

    const timer = setTimeout(() => {
      const target = altWord ?? word;
      glitchTo(target, () => {
        if (loop) startLoop();
      });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [word, altWord, delay, loop]);

  const isOriginal = !glitching && currentRef.current === word;
  const isAlt = !glitching && currentRef.current === (altWord ?? word);

  if (strikePrefix && isOriginal && !glitching) {
    const rest = currentRef.current.substring(strikePrefix.length);
    return (
      <span className="hf-kinetic">
        <span
          className={`hf-strike ${settled ? 'hf-struck' : ''}`}
          style={{ marginRight: '20px' }}
        >
          {strikePrefix.trim()}
          <span className="hf-strike-line" />
        </span>
        {rest}
      </span>
    );
  }

  if (underlinePrefix && isAlt && !glitching) {
    const rest = currentRef.current.substring(underlinePrefix.length);
    return (
      <span className="hf-kinetic">
        <span className={`hf-underline-prefix ${settled ? 'hf-underlined' : ''}`}>
          {underlinePrefix.trim()}
        </span>{' '}
        {rest}
      </span>
    );
  }

  const glitchClass = glitching ? (variant === 2 ? 'hf-kinetic-active-2' : 'hf-kinetic-active') : '';
  return <span className={`hf-kinetic ${glitchClass}`}>{text}</span>;
}
