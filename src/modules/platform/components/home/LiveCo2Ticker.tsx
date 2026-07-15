import { useEffect, useState } from "react";
import {
  CO2_ANCHOR_TONNES,
  CO2_ANCHOR_MS,
  CO2_TONNES_PER_YEAR,
} from "@/data/impact-data";

const TONNES_PER_MS = CO2_TONNES_PER_YEAR / (365 * 24 * 60 * 60 * 1000);

const currentTonnes = () =>
  CO2_ANCHOR_TONNES + Math.max(0, Date.now() - CO2_ANCHOR_MS) * TONNES_PER_MS;

// The verified figure plus a live accrual at the documented yearly rate,
// ticking every second so the number is visibly never standing still.
const LiveCo2Ticker = () => {
  const [tonnes, setTonnes] = useState(currentTonnes);

  useEffect(() => {
    const id = window.setInterval(() => setTonnes(currentTonnes()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const whole = Math.floor(tonnes);
  const fraction = (tonnes - whole).toFixed(4).slice(2);

  return (
    <span className="tabular-nums">
      {whole.toLocaleString("en-NG")}
      <span className="text-[0.55em]">.{fraction}</span>t
    </span>
  );
};

export default LiveCo2Ticker;
