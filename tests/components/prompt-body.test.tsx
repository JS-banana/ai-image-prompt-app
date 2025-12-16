import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PromptBody } from "@/components/prompt-body";

test("renders collapsed prompt with copy control", () => {
  const html = renderToStaticMarkup(<PromptBody body="long prompt body" />);

  assert.match(html, /Prompt/);
  assert.match(html, /复制/);
  assert.match(html, /line-clamp-3/);
});
