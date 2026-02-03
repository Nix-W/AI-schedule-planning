"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CalendarEvent, EVENT_COLORS } from "@/types/calendar";

interface SearchBarProps {
  events: CalendarEvent[];
  onSelectResult: (event: CalendarEvent) => void;
}

export function SearchBar({ events, onSelectResult }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<CalendarEvent[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 搜索过滤逻辑
  const searchEvents = useCallback(
    (searchQuery: string): CalendarEvent[] => {
      if (!searchQuery.trim()) return [];

      const lowerQuery = searchQuery.toLowerCase();

      return events.filter((event) => {
        // 搜索标题
        if (event.title.toLowerCase().includes(lowerQuery)) return true;

        // 搜索地点
        if (event.location?.toLowerCase().includes(lowerQuery)) return true;

        // 搜索参与者
        if (
          event.attendees?.some((attendee) =>
            attendee.toLowerCase().includes(lowerQuery)
          )
        )
          return true;

        return false;
      });
    },
    [events]
  );

  // 实时搜索
  useEffect(() => {
    const filteredResults = searchEvents(query);
    setResults(filteredResults);
    setIsOpen(query.trim().length > 0);
  }, [query, searchEvents]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ESC 键清空并关闭
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // 选择搜索结果
  const handleSelectResult = (event: CalendarEvent) => {
    onSelectResult(event);
    setQuery("");
    setIsOpen(false);
  };

  // 格式化日期显示
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  // 格式化时间显示
  const formatTime = (event: CalendarEvent) => {
    if (event.isAllDay) return "全天";
    return `${event.start.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${event.end.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  // 高亮匹配文本
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <span className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5">
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    );
  };

  // 事件类型中文名
  const typeNames: Record<string, string> = {
    meeting: "会议",
    task: "任务",
    reminder: "提醒",
    personal: "个人",
    other: "其他",
  };

  return (
    <div ref={containerRef} className="relative">
      {/* 搜索输入框 */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="搜索日程..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100
                     placeholder-gray-400 dark:placeholder-slate-400 text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500
                       hover:text-gray-600 dark:hover:text-slate-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* 搜索结果列表 */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 border border-gray-200
                     dark:border-slate-700 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-slate-400 text-sm">
              <svg
                className="w-8 h-8 mx-auto mb-2 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              未找到相关日程
            </div>
          ) : (
            <ul className="py-1">
              {results.map((event) => (
                <li key={event.id}>
                  <button
                    onClick={() => handleSelectResult(event)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700
                               transition-colors flex items-start gap-3"
                  >
                    {/* 颜色标识 */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{
                        backgroundColor:
                          event.color || EVENT_COLORS[event.type || "other"],
                      }}
                    />

                    {/* 事件信息 */}
                    <div className="flex-1 min-w-0">
                      {/* 标题 */}
                      <div className="font-medium text-gray-800 dark:text-slate-100 truncate">
                        {highlightMatch(event.title, query)}
                      </div>

                      {/* 时间 */}
                      <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                        {formatDate(event.start)} · {formatTime(event)}
                      </div>

                      {/* 地点 */}
                      {event.location && (
                        <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                          </svg>
                          {highlightMatch(event.location, query)}
                        </div>
                      )}

                      {/* 参与者 */}
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                            />
                          </svg>
                          {event.attendees.map((a, i) => (
                            <span key={i}>
                              {highlightMatch(a, query)}
                              {i < event.attendees!.length - 1 && "、"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 类型标签 */}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: `${EVENT_COLORS[event.type || "other"]}20`,
                        color: EVENT_COLORS[event.type || "other"],
                      }}
                    >
                      {typeNames[event.type || "other"]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* 搜索提示 */}
          {results.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500">
              找到 {results.length} 条结果 · 按 ESC 关闭
            </div>
          )}
        </div>
      )}
    </div>
  );
}
