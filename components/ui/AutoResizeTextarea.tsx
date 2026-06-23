"use client";

import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

type AutoResizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number;
};

/** 内容に合わせて高さが伸びる textarea。 */
export function AutoResizeTextarea({
  minRows = 2,
  value,
  onChange,
  className,
  ...props
}: AutoResizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function adjustHeight() {
    const el = ref.current;
    if (!el) return;
    el.style.overflow = "hidden";
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useLayoutEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      onChange={(e) => {
        onChange?.(e);
        adjustHeight();
      }}
      className={["overflow-hidden resize-none", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
