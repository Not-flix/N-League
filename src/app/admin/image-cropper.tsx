"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const VIEW = 288; // プレビュー（CSSピクセル）
const OUT = 256; // 書き出しサイズ

type Offset = { x: number; y: number };

/**
 * 画像をドラッグで移動・スライダー/ホイールで拡大しながら
 * 正方形（円形マスク）にトリミングして JPEG data URL を返すモーダル。
 */
export function ImageCropper({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [minScale, setMinScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  // ファイルを読み込み、ビューポートを覆う最小スケールで中央に配置
  useEffect(() => {
    let cancelled = false;
    let created: ImageBitmap | null = null;
    (async () => {
      try {
        const bmp = await createImageBitmap(file);
        if (cancelled) {
          bmp.close?.();
          return;
        }
        created = bmp;
        const cover = VIEW / Math.min(bmp.width, bmp.height);
        setBitmap(bmp);
        setMinScale(cover);
        setScale(cover);
        setOffset({
          x: (VIEW - bmp.width * cover) / 2,
          y: (VIEW - bmp.height * cover) / 2,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
      created?.close?.();
    };
  }, [file]);

  // 画像がビューポートを必ず覆うよう移動量をクランプ
  const clampOffset = useCallback(
    (next: Offset, s: number): Offset => {
      if (!bitmap) return next;
      const w = bitmap.width * s;
      const h = bitmap.height * s;
      return {
        x: Math.min(0, Math.max(VIEW - w, next.x)),
        y: Math.min(0, Math.max(VIEW - h, next.y)),
      };
    },
    [bitmap],
  );

  // プレビュー描画
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    if (canvas.width !== VIEW * dpr) {
      canvas.width = VIEW * dpr;
      canvas.height = VIEW * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, VIEW, VIEW);
    ctx.drawImage(
      bitmap,
      offset.x,
      offset.y,
      bitmap.width * scale,
      bitmap.height * scale,
    );
  }, [bitmap, scale, offset]);

  function applyScale(nextScale: number, center?: { x: number; y: number }) {
    if (!bitmap) return;
    const s = Math.min(minScale * 5, Math.max(minScale, nextScale));
    // 指定した点（既定はビューポート中心）を基準にズーム
    const cx = center?.x ?? VIEW / 2;
    const cy = center?.y ?? VIEW / 2;
    setOffset((prev) => {
      const ratio = s / scale;
      const nx = cx - (cx - prev.x) * ratio;
      const ny = cy - (cy - prev.y) * ratio;
      return clampOffset({ x: nx, y: ny }, s);
    });
    setScale(s);
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }, scale));
  }
  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }
  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    applyScale(scale * (e.deltaY < 0 ? 1.1 : 1 / 1.1), {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  // Escでキャンセル
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  function handleConfirm() {
    if (!bitmap) return;
    const out = document.createElement("canvas");
    out.width = OUT;
    out.height = OUT;
    const ctx = out.getContext("2d");
    if (!ctx) {
      setError("canvas 2d context unavailable");
      return;
    }
    const k = OUT / VIEW;
    ctx.drawImage(
      bitmap,
      offset.x * k,
      offset.y * k,
      bitmap.width * scale * k,
      bitmap.height * scale * k,
    );
    onConfirm(out.toDataURL("image/jpeg", 0.82));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div
        className="surface-card w-full max-w-sm p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-semibold">アイコンをトリミング</div>

        {error ? (
          <div className="text-sm text-danger">{error}</div>
        ) : (
          <>
            <div
              className="relative mx-auto select-none"
              style={{ width: VIEW, height: VIEW }}
            >
              <canvas
                ref={canvasRef}
                width={VIEW}
                height={VIEW}
                style={{ width: VIEW, height: VIEW, touchAction: "none" }}
                className="block rounded-lg bg-background cursor-grab active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
              />
              {/* 円形マスク（実際の表示と同じ範囲を可視化） */}
              <div
                className="pointer-events-none absolute inset-0 rounded-lg"
                style={{
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0)",
                  background:
                    "radial-gradient(circle at center, transparent 49.5%, rgba(0,0,0,0.55) 50%)",
                }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/60" />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-foreground-muted">－</span>
              <input
                type="range"
                min={minScale}
                max={minScale * 5}
                step="any"
                value={scale}
                onChange={(e) => applyScale(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-foreground-muted">＋</span>
            </div>
            <p className="text-xs text-foreground-dim">
              ドラッグで位置調整、スライダー（またはホイール）で拡大できます。
            </p>
          </>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary text-sm py-1.5 px-4"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!bitmap}
            className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
          >
            決定
          </button>
        </div>
      </div>
    </div>
  );
}
