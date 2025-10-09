'use client';

import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  endValue: number;
  duration?: number;
  className?: string;
  decimals?: number;
}

export function AnimatedCounter({ endValue, duration = 1000, className, decimals = 0 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      
      const progress = timestamp - startTimeRef.current;
      const progressFraction = Math.min(progress / duration, 1);
      
      // Ease-out quad function for smoother animation
      const easedProgress = progressFraction * (2 - progressFraction);
      const currentValue = easedProgress * endValue;
      
      setCount(currentValue);

      if (progress < duration) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    startTimeRef.current = null;
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [endValue, duration]);

  return <span className={className}>{count.toFixed(decimals)}</span>;
}
