"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NLogo } from "./n-logo";

const NAV_ITEMS = [
  { href: "/", label: "TOP" },
  { href: "/standings", label: "順位表" },
  { href: "/matches", label: "試合結果" },
  { href: "/titles", label: "タイトル" },
  { href: "/schedule", label: "スケジュール" },
  { href: "/rules", label: "ルール" },
  { href: "/matches/new", label: "結果入力" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30">
      <div className="page-shell flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3" onClick={close}>
          <NLogo size={30} />
          <span className="headline text-lg sm:text-xl font-bold tracking-wider">
            Nリーグ
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-foreground-muted hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="ml-2 px-3 py-2 text-xs font-semibold text-foreground-dim hover:text-accent border border-border-strong rounded-md"
          >
            管理
          </Link>
        </nav>

        <div ref={wrapperRef} className="md:hidden relative">
          <button
            type="button"
            aria-label="メニュー"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="p-2 text-foreground-muted"
          >
            <span
              className={`block w-6 h-0.5 bg-current transition-transform ${
                open ? "translate-y-2 rotate-45" : "mb-1.5"
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-current transition-opacity ${
                open ? "opacity-0" : "mb-1.5"
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-current transition-transform ${
                open ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-48 surface-card overflow-hidden z-40">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="block px-4 py-3 text-sm border-b border-border last:border-b-0 hover:bg-background-elevated"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/admin"
                onClick={close}
                className="block px-4 py-3 text-sm hover:bg-background-elevated text-accent"
              >
                管理画面
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
