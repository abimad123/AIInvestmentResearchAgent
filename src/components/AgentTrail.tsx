"use client";

import React from "react";
import { CheckCircle2, Loader2, Circle, AlertCircle } from "lucide-react";

export interface AgentStep {
  id: string;
  label: string;
  status: "idle" | "running" | "completed" | "error";
  details?: string;
}

interface AgentTrailProps {
  steps: AgentStep[];
}

export function AgentTrail({ steps }: AgentTrailProps) {
  return (
    <div className="w-full bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm mb-8">
      <h3 className="text-sm font-semibold text-zinc-900 mb-5 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse" />
        Agent Reasoning Path
      </h3>

      <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-100">
        {steps.map((step) => {
          const isIdle = step.status === "idle";
          const isRunning = step.status === "running";
          const isCompleted = step.status === "completed";
          const isError = step.status === "error";

          return (
            <div
              key={step.id}
              className={`relative flex gap-4 transition-all duration-300 ${
                isIdle ? "opacity-40" : "opacity-100"
              }`}
            >
              {/* Icon Status */}
              <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white">
                {isCompleted && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                )}
                {isRunning && (
                  <Loader2 className="w-5 h-5 text-zinc-900 animate-spin" />
                )}
                {isIdle && (
                  <Circle className="w-4 h-4 text-zinc-300" />
                )}
                {isError && (
                  <AlertCircle className="w-5 h-5 text-red-500 fill-red-50" />
                )}
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold transition-all ${
                    isRunning ? "text-zinc-950" : isCompleted ? "text-zinc-800" : "text-zinc-500"
                  }`}
                >
                  {step.label}
                </p>
                {step.details && (
                  <p className="text-xs text-zinc-500 mt-1 font-medium bg-zinc-50 border border-zinc-100/50 rounded-lg px-2.5 py-1.5 inline-block max-w-full truncate">
                    {step.details}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
