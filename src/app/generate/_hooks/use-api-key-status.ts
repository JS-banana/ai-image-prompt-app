"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiKeyStatus } from "@/app/generate/_types";

export function useApiKeyStatus() {
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKeySaving, setApiKeySaving] = useState(false);

  const apiKeySourceLabel = useMemo(() => {
    if (apiKeyStatus?.activeSource === "user") return "浏览器";
    if (apiKeyStatus?.activeSource === "server") return "服务端";
    if (apiKeyStatus?.activeSource === "none") return "未配置";
    return "未知";
  }, [apiKeyStatus?.activeSource]);

  const refreshApiKeyStatus = async () => {
    try {
      const resp = await fetch("/api/apikey", { cache: "no-store" });
      const data = (await resp.json().catch(() => null)) as ApiKeyStatus | null;
      if (!resp.ok || !data) return null;
      setApiKeyStatus(data);
      return data;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    void refreshApiKeyStatus();
  }, []);

  const saveApiKeyDraft = async () => {
    const trimmed = apiKeyDraft.trim();
    if (!trimmed) {
      throw new Error("请先粘贴 Ark API Key");
    }

    setApiKeySaving(true);
    try {
      const resp = await fetch("/api/apikey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const data = (await resp.json().catch(() => null)) as
        | (ApiKeyStatus & { ok?: boolean; error?: string })
        | null;

      if (!resp.ok) {
        throw new Error(data?.error || `保存失败（HTTP ${resp.status}）`);
      }

      if (data) {
        setApiKeyStatus(data);
      } else {
        await refreshApiKeyStatus();
      }

      setApiKeyDraft("");
      setApiKeyVisible(false);
      return data;
    } finally {
      setApiKeySaving(false);
    }
  };

  const clearApiKey = async () => {
    setApiKeySaving(true);
    try {
      const resp = await fetch("/api/apikey", { method: "DELETE" });
      const data = (await resp.json().catch(() => null)) as
        | (ApiKeyStatus & { ok?: boolean; error?: string })
        | null;

      if (!resp.ok) {
        throw new Error(data?.error || `清除失败（HTTP ${resp.status}）`);
      }

      if (data) {
        setApiKeyStatus(data);
      } else {
        await refreshApiKeyStatus();
      }

      setApiKeyDraft("");
      setApiKeyVisible(false);
      return data;
    } finally {
      setApiKeySaving(false);
    }
  };

  return {
    apiKeyStatus,
    apiKeySourceLabel,
    apiKeyDraft,
    setApiKeyDraft,
    apiKeyVisible,
    setApiKeyVisible,
    apiKeySaving,
    refreshApiKeyStatus,
    saveApiKeyDraft,
    clearApiKey,
  };
}
