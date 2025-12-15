"use client";

import { useState } from "react";

export function useImageUpload(options?: { maxSizeMB?: number }) {
  const maxSizeMB = options?.maxSizeMB ?? 5;
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<string | null>(null); // dataURL 或 url

  const clearUpload = () => {
    setUploadPreview(null);
    setImageSource(null);
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`图片过大，请小于 ${maxSizeMB}MB`);
    }

    await new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : null;
        if (!result) {
          reject(new Error("图片读取失败"));
          return;
        }
        setUploadPreview(result);
        setImageSource(result);
        resolve();
      };
      reader.onerror = () => {
        reject(new Error("图片读取失败"));
      };
      reader.readAsDataURL(file);
    });
  };

  const setImageFromHistory = (value: string | null) => {
    setImageSource(value);
    setUploadPreview(value);
  };

  return {
    uploadPreview,
    imageSource,
    clearUpload,
    handleUpload,
    setImageFromHistory,
  };
}

