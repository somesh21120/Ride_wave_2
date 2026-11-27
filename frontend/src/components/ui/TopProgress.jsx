import { useState, useEffect, useRef } from "react";

let pendingCount = 0;
const listeners = new Set();

export function incrementPending() {
  pendingCount++;
  listeners.forEach(fn => fn(pendingCount));
}
export function decrementPending() {
  pendingCount = Math.max(0, pendingCount - 1);
  listeners.forEach(fn => fn(pendingCount));
}

const TopProgress = () => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const listener = (count) => {
      if (count > 0 && !timerRef.current) {
        timerRef.current = setTimeout(() => setVisible(true), 150);
      } else if (count === 0) {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        setVisible(false);
      }
    };
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  if (!visible) return null;
  return <div className="rw-top-progress" />;
};
export default TopProgress;