"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import {
  uploadRecipeImageAction,
  deleteRecipeImageAction,
} from "@/app/actions/images";
import { IMAGE_MAX_COUNT } from "@/lib/image-constants";
import type { RecipeImage } from "@/types";

type ImageUploaderProps = {
  /** 編集対象レシピ ID。未指定（新規作成）の場合はファイルを保留する。 */
  recipeId?: string | null;
  /** 既存画像（編集モード） */
  images: RecipeImage[];
  onImagesChange: (images: RecipeImage[]) => void;
  /** 保留中ファイル（新規作成モード） */
  pendingFiles: File[];
  onPendingFilesChange: (files: File[]) => void;
};

export function ImageUploader({
  recipeId,
  images,
  onImagesChange,
  pendingFiles,
  onPendingFilesChange,
}: ImageUploaderProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = images.length + pendingFiles.length;
  const remaining = IMAGE_MAX_COUNT - total;

  function handleSelect(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const files = Array.from(fileList).slice(0, remaining);
    if (files.length === 0) {
      setError(`画像は ${IMAGE_MAX_COUNT} 枚までです`);
      return;
    }

    if (!recipeId) {
      // 新規作成モード: 保存後にまとめてアップロードするため保留
      onPendingFilesChange([...pendingFiles, ...files]);
      return;
    }

    // 編集モード: 即時アップロード
    startTransition(async () => {
      const uploaded: RecipeImage[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const result = await uploadRecipeImageAction(recipeId, fd);
        if (result.ok) {
          uploaded.push(result.data);
        } else {
          setError(result.error);
          break;
        }
      }
      if (uploaded.length > 0) {
        onImagesChange([...images, ...uploaded]);
      }
    });
  }

  function removeExisting(imageId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteRecipeImageAction(imageId);
      if (result.ok) {
        onImagesChange(images.filter((img) => img.id !== imageId));
      } else {
        setError(result.error);
      }
    });
  }

  function removePending(index: number) {
    onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {images.map((img) => (
          <Thumb
            key={img.id}
            src={img.url}
            onRemove={() => removeExisting(img.id)}
            disabled={pending}
          />
        ))}
        {pendingFiles.map((file, i) => (
          <PendingThumb
            key={`${file.name}-${i}`}
            file={file}
            onRemove={() => removePending(i)}
          />
        ))}

        {remaining > 0 && (
          <label
            className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border text-muted hover:bg-black/5 ${
              pending ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <span className="text-xl leading-none">＋</span>
            <span className="mt-1 text-[10px]">画像を追加</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              disabled={pending}
              onChange={(e) => {
                handleSelect(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      <p className="text-xs text-muted">
        JPEG / PNG / WebP・5MB 以内・最大 {IMAGE_MAX_COUNT} 枚
        {pending && "（アップロード中...）"}
      </p>

      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function Thumb({
  src,
  onRemove,
  disabled,
}: {
  src: string;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
      {src && (
        <Image src={src} alt="" fill sizes="80px" className="object-cover" />
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="画像を削除"
        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80 disabled:opacity-60"
      >
        ×
      </button>
    </div>
  );
}

function PendingThumb({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [url] = useState(() => URL.createObjectURL(file));

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
      {url && (
        // 一時的な object URL のため next/image ではなく img を使用
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      )}
      <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] text-white">
        未保存
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="画像を削除"
        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
      >
        ×
      </button>
    </div>
  );
}
