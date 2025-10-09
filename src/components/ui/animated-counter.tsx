
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
  const startValueRef = useRef(0); // Start from 0

  useEffect(() => {
    startValueRef.current = 0; // Reset start value on re-render if needed
    startTimeRef.current = null; // Reset start time

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      
      const progress = timestamp - startTimeRef.current;
      const progressFraction = Math.min(progress / duration, 1);
      
      // Ease-out quad function for smoother animation
      const easedProgress = progressFraction * (2 - progressFraction);
      const currentValue = startValueRef.current + (endValue - startValueRef.current) * easedProgress;

      // Stop the animation exactly at the end value
      if (progressFraction >= 1) {
        setCount(endValue);
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
        return;
      }
      
      setCount(currentValue);

      if (progress < duration) {
        frameRef.current = requestAnimationFrame(animate);
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
