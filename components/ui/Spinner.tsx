type SpinnerProps = {
  className?: string;
  label?: string;
};

/** アクセシブルなローディングスピナー。 */
export function Spinner({ className, label = "読み込み中" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={[
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        className ?? "h-5 w-5",
      ].join(" ")}
    />
  );
}
