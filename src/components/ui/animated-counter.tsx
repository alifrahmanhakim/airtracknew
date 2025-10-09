
'use client';

import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  endValue: number;
  duration?: number;
  className?: string;
  decimals?: number;
}

export function AnimatedCounter({ endValue, duration = 1500, className, decimals = 0 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    let startTime: number;
    const startValue = 0;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (startTime === undefined) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const newCount = startValue + (endValue - startValue) * easedProgress;

      setCount(newCount);

      if (elapsed < duration) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [endValue, duration]);

  return <span className={className}>{count.toFixed(decimals)}</span>;
}
