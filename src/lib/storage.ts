export type StorageMode = "local" | "remote";

export const getStorageMode = (): StorageMode =>
  process.env.NEXT_PUBLIC_STORAGE_MODE === "remote" ? "remote" : "local";
