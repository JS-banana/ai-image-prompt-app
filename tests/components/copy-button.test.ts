import assert from "node:assert/strict";
import { test } from "node:test";
import { copyText } from "@/components/copy-button";

test("copyText writes to provided clipboard", async () => {
  const writes: string[] = [];
  const clipboard = {
    writeText: async (value: string) => {
      writes.push(value);
    },
  };

  await copyText("hello", clipboard);

  assert.deepEqual(writes, ["hello"]);
});

test("copyText throws when clipboard is missing", async () => {
  await assert.rejects(() => copyText("text", null), /Clipboard unavailable/);
});
