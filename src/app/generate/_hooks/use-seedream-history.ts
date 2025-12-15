"use client";

import { useEffect, useState } from "react";
import type { HistoryItem } from "@/app/generate/_types";

const HISTORY_STORAGE_KEY = "seedream-history";
const IMAGE_HISTORY_LIMIT = 12;
const PROMPT_HISTORY_LIMIT = 5;

export function useSeedreamHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [imageHistory, setImageHistory] = useState<HistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as HistoryItem[];
        if (Array.isArray(parsed)) {
          setImageHistory(parsed.slice(0, IMAGE_HISTORY_LIMIT));
        }
      }
    } catch {
      /* ignore */
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  const pushHistoryItem = (historyItem: HistoryItem) => {
    setImageHistory((prev) => {
      const next = [historyItem, ...prev].slice(0, IMAGE_HISTORY_LIMIT);
      if (typeof window !== "undefined") {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });

    setHistory((prev) => {
      const next = [historyItem.prompt, ...prev];
      return next.slice(0, PROMPT_HISTORY_LIMIT);
    });
  };

  const clearHistory = () => {
    setHistory([]);
    setImageHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
  };

  return {
    history,
    imageHistory,
    historyLoaded,
    pushHistoryItem,
    clearHistory,
  };
}
