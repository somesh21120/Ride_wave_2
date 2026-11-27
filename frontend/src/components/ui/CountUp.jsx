import { useEffect, useRef, useState } from "react";

/**
 * Animated number: counts from the previous value to `value` in 600 ms (ease-out).
 * Non-numeric values are shown as they are. Respects prefers-reduced-motion.
 * <CountUp value={1840} prefix="₹" />
 */
const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CountUp = ({ value, prefix = "", suffix = "", decimals = 0, duration = 600 }) => {
  const target = Number(value);
  const isNumber = value !== null && value !== undefined && value !== "" && Number.isFinite(target);
  const [shown, setShown] = useState(isNumber && !reduceMotion() ? 0 : target);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!isNumber) return undefined;
    if (reduceMotion()) { setShown(target); return undefined; }
    const from = fromRef.current;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (target - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, isNumber, duration]);

  if (!isNumber) return <>{value ?? "-"}</>;
  const text = Number(shown).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{prefix}{text}{suffix}</span>;
};

export default CountUp;
