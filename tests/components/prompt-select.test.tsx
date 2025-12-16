import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PromptSelect } from "@/components/prompt-select";

test("renders placeholder when no selection", () => {
  const html = renderToStaticMarkup(
    <PromptSelect
      name="promptId"
      placeholder="选择提示词..."
      value={null}
      options={[
        { id: "1", title: "风景", body: "scenery" },
        { id: "2", title: "肖像", body: "portrait" },
      ]}
    />,
  );

  assert.match(html, /选择提示词\.\.\./);
  assert.match(html, /选择后将自动填充到下方输入框/);
  assert.equal(html.includes("type=\"hidden\""), false);
});

test("renders hidden input when value is chosen", () => {
  const html = renderToStaticMarkup(
    <PromptSelect
      name="promptId"
      value="2"
      options={[
        { id: "1", title: "风景", body: "scenery" },
        { id: "2", title: "肖像", body: "portrait" },
      ]}
    />,
  );

  assert.match(html, /value=\"2\"[^>]*>肖像/);
  assert.match(html, /type=\"hidden\" name=\"promptId\" value=\"2\"/);
});
