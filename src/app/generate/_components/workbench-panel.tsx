"use client";

import { useMemo } from "react";
import type { ActiveMenu, ApiKeyStatus } from "@/app/generate/_types";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ModelConfigItem } from "@/lib/data/models";
import type { PromptOption } from "@/lib/data/prompts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MIN_SEEDREAM_PIXELS, normalizeModelName } from "@/app/generate/_domain/seedream";

type WorkbenchPanelProps = {
  prompt: {
    value: string;
    onChange: (value: string) => void;
    options: PromptOption[];
    search: string;
    onSearchChange: (value: string) => void;
    onSelectOption: (option: PromptOption) => void;
    recent: string[];
    onPickRecent: (value: string) => void;
  };
  upload: {
    preview: string | null;
    onUploadFile: (file: File) => void;
    onClear: () => void;
  };
  model: {
    list: ModelConfigItem[];
    selectedIds: string[];
    onSelect: (id: string) => void;
  };
  size: {
    value: string;
    options: string[];
    customValue: string;
    onCustomChange: (value: string) => void;
    onSelect: (value: string) => void;
    onApplyCustom: () => void;
  };
  apiKey: {
    status: ApiKeyStatus | null;
    sourceLabel: string;
    draft: string;
    onDraftChange: (value: string) => void;
    visible: boolean;
    setVisible: (value: boolean) => void;
    saving: boolean;
    onSave: () => void;
    onClear: () => void;
  };
  menu: {
    active: ActiveMenu;
    toggle: (menu: Exclude<ActiveMenu, null>) => void;
    close: () => void;
  };
  generate: {
    loading: boolean;
    onGenerate: () => void;
    error: string | null;
  };
};

export function WorkbenchPanel({
  prompt,
  upload,
  model,
  size,
  apiKey,
  menu,
  generate,
}: WorkbenchPanelProps) {
  const filteredPrompts = useMemo(() => {
    if (!prompt.search.trim()) return prompt.options;
    const keyword = prompt.search.toLowerCase();
    return prompt.options.filter(
      (p) =>
        p.title.toLowerCase().includes(keyword) ||
        p.body.toLowerCase().includes(keyword),
    );
  }, [prompt.options, prompt.search]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">提示词工作台</label>
        <div className="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-inner">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Prompt
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <button
                type="button"
                onClick={() => prompt.onChange("")}
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold hover:bg-white"
              >
                清空
              </button>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(prompt.value || "")}
                className="rounded-full border border-slate-200 px-3 py-1 font-semibold hover:bg-white"
              >
                复制
              </button>
              <label className="flex cursor-pointer items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-semibold hover:bg-white">
                上传
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload.onUploadFile(file);
                  }}
                />
              </label>
            </div>
          </div>
          <textarea
            value={prompt.value}
            onChange={(e) => prompt.onChange(e.target.value)}
            className="h-56 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
            placeholder="可直接输入，或通过右下角图标从提示词库/模型/分辨率入口快速选择"
          />

          {upload.preview ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
              <span className="text-[11px] text-slate-600">已选图片</span>
              <div className="relative h-14 w-14 overflow-hidden rounded-md bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={upload.preview}
                  alt="上传预览"
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={upload.onClear}
                className="text-xs text-slate-500 underline"
              >
                移除
              </button>
            </div>
          ) : null}

          <div className="mt-2 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              {prompt.value.length} 字 · Seedream 4.5 · 分辨率 {size.value} · Key{" "}
              {apiKey.sourceLabel}
            </div>
            <div className="flex items-center gap-2">
              <Popover
                open={menu.active === "prompt"}
                onOpenChange={(open) => {
                  if (open) {
                    menu.toggle("prompt");
                  } else {
                    menu.close();
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                  >
                    📚 提示库
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-72">
                  <div className="flex items-center gap-2">
                    <input
                      value={prompt.search}
                      onChange={(e) => prompt.onSearchChange(e.target.value)}
                      placeholder="搜索提示词"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={menu.close}
                      className="text-xs text-slate-500"
                    >
                      关闭
                    </button>
                  </div>
                  <div className="mt-2 max-h-56 space-y-1 overflow-y-auto text-sm">
                    {filteredPrompts.length === 0 ? (
                      <div className="text-xs text-slate-500">无匹配提示词</div>
                    ) : (
                      filteredPrompts.slice(0, 30).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            prompt.onSelectOption(p);
                            menu.close();
                          }}
                          className="w-full rounded-lg px-2 py-1 text-left hover:bg-slate-100"
                        >
                          <div className="font-medium text-slate-800">
                            {p.title}
                          </div>
                          <div className="line-clamp-1 text-xs text-slate-500">
                            {p.body}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover
                open={menu.active === "model"}
                onOpenChange={(open) => {
                  if (open) {
                    menu.toggle("model");
                  } else {
                    menu.close();
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                  >
                    🖥️ 模型
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-64">
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
                    选择模型
                    <button
                      type="button"
                      onClick={menu.close}
                      className="text-xs text-slate-500"
                    >
                      关闭
                    </button>
                  </div>
                  <div className="space-y-2">
                    {model.list.map((m) => {
                      const active = model.selectedIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            model.onSelect(m.id);
                            menu.close();
                          }}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <span>{normalizeModelName(m.modelName)}</span>
                          <span className="text-[11px] opacity-80">
                            {m.resolution ?? "2K"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover
                open={menu.active === "size"}
                onOpenChange={(open) => {
                  if (open) {
                    menu.toggle("size");
                  } else {
                    menu.close();
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                  >
                    📐 分辨率
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-64">
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
                    分辨率
                    <button
                      type="button"
                      onClick={menu.close}
                      className="text-xs text-slate-500"
                    >
                      关闭
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {size.options.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          size.onSelect(item);
                          menu.close();
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm ${
                          size.value === item
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <input
                      value={size.customValue}
                      onChange={(e) => size.onCustomChange(e.target.value)}
                      placeholder="自定义，如 2048x2048"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={size.onApplyCustom}
                      className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      使用自定义
                    </button>
                    <p>
                      需 ≥ {MIN_SEEDREAM_PIXELS.toLocaleString()} 像素（约 2K
                      起）。
                    </p>
                  </div>
                </PopoverContent>
              </Popover>

              <Dialog
                open={menu.active === "apikey"}
                onOpenChange={(open) => {
                  if (open) {
                    menu.toggle("apikey");
                    return;
                  }
                  menu.close();
                  apiKey.setVisible(false);
                }}
              >
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                  >
                    🔑 API Key
                  </button>
                </DialogTrigger>
                <DialogContent className="w-[min(92vw,28rem)]">
                  <div className="mb-4 flex items-center justify-between">
                    <DialogTitle>API Key（火山 Ark）</DialogTitle>
                    <DialogClose asChild>
                      <button
                        type="button"
                        className="text-sm text-slate-500 hover:text-slate-800"
                      >
                        关闭
                      </button>
                    </DialogClose>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      当前来源：{apiKey.sourceLabel}
                      {apiKey.status?.activeSource === "user"
                        ? "（仅本浏览器）"
                        : apiKey.status?.activeSource === "server"
                          ? "（部署环境变量）"
                          : ""}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                          Volcengine Ark
                        </span>
                        <button
                          type="button"
                          onClick={() => apiKey.setVisible(!apiKey.visible)}
                          className="text-[11px] text-slate-500 underline"
                        >
                          {apiKey.visible ? "隐藏" : "显示"}
                        </button>
                      </div>
                      <input
                        value={apiKey.draft}
                        onChange={(e) => apiKey.onDraftChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            apiKey.onSave();
                          }
                        }}
                        autoFocus
                        type={apiKey.visible ? "text" : "password"}
                        placeholder="粘贴你的 Ark API Key（Seedream/Deepseek 通用）"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={apiKey.saving}
                      onClick={apiKey.onSave}
                      className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {apiKey.saving ? "保存中..." : "保存并使用"}
                    </button>
                    <button
                      type="button"
                      disabled={
                        apiKey.saving ||
                        (apiKey.status ? !apiKey.status.userKey : false)
                      }
                      onClick={apiKey.onClear}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      清除浏览器 Key
                    </button>
                    <p className="text-[11px] text-slate-500">
                      Key 会写入浏览器 Cookie（httpOnly），不会写入数据库；如部署已配置{" "}
                      <span className="font-mono">volcengine_api_key</span>{" "}
                      可无需填写。
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>历史</span>
          <div className="flex flex-wrap gap-2">
            {prompt.recent.length === 0 ? (
              <span className="text-slate-400">暂无</span>
            ) : (
              prompt.recent.map((h, idx) => (
                <button
                  key={`${h}-${idx}`}
                  type="button"
                  onClick={() => prompt.onPickRecent(h)}
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 hover:border-slate-300"
                >
                  {h.slice(0, 16)}…
                </button>
              ))
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={generate.loading}
            onClick={generate.onGenerate}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {generate.loading ? "生成中..." : "生成"}
          </button>
        </div>
      </div>

      {generate.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {generate.error}
        </div>
      ) : null}
    </div>
  );
}
