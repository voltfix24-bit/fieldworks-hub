import { useState, useRef, useCallback } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef(0);
  const THRESHOLD = 70;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === 0) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPullY(Math.min(dy, 100));
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD) {
      setRefreshing(true);
      if (navigator.vibrate) navigator.vibrate(10);
      await onRefresh();
      setRefreshing(false);
    }
    setPullY(0);
    startY.current = 0;
  }, [pullY, onRefresh]);

  return { refreshing, pullY, onTouchStart, onTouchMove, onTouchEnd };
}
