import { copyText } from "@/components/copy-button";
import { describe, expect, it } from "vitest";

describe("copyText", () => {
  it("writes to the provided clipboard", async () => {
    const writes: string[] = [];
    const clipboard = {
      writeText: async (value: string) => {
        writes.push(value);
      },
    } satisfies Pick<Clipboard, "writeText">;

    await copyText("hello", clipboard);

    expect(writes).toEqual(["hello"]);
  });

  it("throws when clipboard is missing", async () => {
    await expect(copyText("text", null)).rejects.toThrow(/Clipboard unavailable/);
  });
});
