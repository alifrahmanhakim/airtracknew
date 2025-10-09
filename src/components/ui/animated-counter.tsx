
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
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset start time whenever the endValue changes to restart animation
    startTimeRef.current = null;
    
    const easeOutQuad = (t: number) => t * (2 - t);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = timestamp - startTimeRef.current;
      const progressFraction = Math.min(progress / duration, 1);
      const easedProgress = easeOutQuad(progressFraction);

      const currentValue = easedProgress * endValue;

      if (progressFraction < 1) {
        setCount(currentValue);
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue); // Ensure it ends exactly on the end value
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    // Cleanup function to cancel the animation frame when the component unmounts or re-renders
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [endValue, duration]);

  return <span className={className}>{count.toFixed(decimals)}</span>;
}
