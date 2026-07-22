"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function AxisWordmark() {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative flex flex-col items-start select-none">
      {/* Brand Monospace Channel Header */}
      <div className="flex items-center gap-2 mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-signal-orange">
        <span className="inline-block size-2 rounded-full bg-signal-orange animate-pulse" />
        AXIS.ENGINE // OPERATIONAL TELEMETRY
      </div>

      {/* Hero AXIS Wordmark */}
      <div className="relative overflow-hidden py-1">
        <motion.h1
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="font-display text-7xl sm:text-8xl md:text-9xl font-black tracking-tight uppercase text-text-primary leading-none"
        >
          AXIS<span className="text-signal-orange">.</span>
        </motion.h1>

        {/* Scanline Sweep animation across wordmark */}
        {mounted && !shouldReduceMotion && (
          <motion.div
            initial={{ left: "-100%" }}
            animate={{ left: "200%" }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-y-0 w-28 bg-gradient-to-r from-transparent via-signal-cyan/40 to-transparent -skew-x-12 blur-[2px]"
          />
        )}
      </div>

      {/* Live Telemetry Status Readout Line */}
      <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs text-text-muted border-l-2 border-signal-orange/60 pl-3">
        <span className="flex items-center gap-1.5 text-signal-cyan font-bold">
          <span className="size-1.5 rounded-full bg-signal-cyan animate-pulse" />
          SYS.STATUS: LIVE
        </span>
        <span className="text-line">|</span>
        <span>3 WORKSPACES ACTIVE</span>
        <span className="text-line">|</span>
        <span>LAST SYNC <span className="text-text-primary">00:04s</span> AGO</span>
      </div>
    </div>
  );
}
