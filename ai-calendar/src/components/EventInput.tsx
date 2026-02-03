"use client";

import { useState, useEffect } from "react";
import { ParsedEventData, ParseEventResult } from "@/types/calendar";

interface EventInputProps {
  onEventParsed: (event: ParsedEventData) => void;
  disabled?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function EventInput({
  onEventParsed,
  disabled,
  value: externalValue,
  onValueChange,
}: EventInputProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 同步外部值到内部状态
  useEffect(() => {
    if (externalValue !== undefined) {
      setInput(externalValue);
    }
  }, [externalValue]);

  const handleInputChange = (newValue: string) => {
    setInput(newValue);
    onValueChange?.(newValue);
  };

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || disabled || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/parse-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      const data: ParseEventResult = await res.json();

      if (data.success) {
        onEventParsed(data.data);
        setInput("");
        onValueChange?.("");
      } else {
        setError(data.error.message);
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入日程，如：明天下午3点和老王开会"
          disabled={loading || disabled}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-slate-700
                     bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100
                     placeholder-gray-400 dark:placeholder-slate-400"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim() || disabled}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium
                     hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors min-w-[100px]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              解析中
            </span>
          ) : (
            "添加"
          )}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
