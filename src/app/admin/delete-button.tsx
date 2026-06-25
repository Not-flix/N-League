"use client";

import { useTransition } from "react";

export function DeleteButton({
  action,
  id,
  confirmMessage,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  confirmMessage: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (typeof window !== "undefined" && !window.confirm(confirmMessage)) {
      return;
    }
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      await action(fd);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="btn-secondary text-xs py-1.5 text-danger border-danger/40 disabled:opacity-50"
    >
      {isPending ? "削除中…" : "削除"}
    </button>
  );
}
