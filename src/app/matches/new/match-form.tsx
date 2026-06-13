"use client";

import { useMemo, useState, useTransition } from "react";
import type { Player, ScoringConfig } from "@/lib/types";
import {
  calculateResults,
  validateSeats,
  type RawSeat,
} from "@/lib/scoring";
import { formatPoints } from "@/lib/format";
import { submitMatch } from "./actions";

type SeatState = { playerId: string; rawScore: string };

const EMPTY_SEAT: SeatState = { playerId: "", rawScore: "" };

function defaultPlayedAt(): string {
  const now = new Date();
  const tz = now.getTimezoneOffset();
  const local = new Date(now.getTime() - tz * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export type MatchFormInitial = {
  matchId: string;
  playedAt: string;
  note?: string;
  seats: SeatState[];
};

export function MatchForm({
  players,
  config,
  initial,
}: {
  players: Player[];
  config: ScoringConfig;
  initial?: MatchFormInitial;
}) {
  const [seats, setSeats] = useState<SeatState[]>(
    () =>
      initial?.seats ?? [
        { ...EMPTY_SEAT },
        { ...EMPTY_SEAT },
        { ...EMPTY_SEAT },
        { ...EMPTY_SEAT },
      ],
  );
  const [playedAt, setPlayedAt] = useState(
    () => initial?.playedAt ?? defaultPlayedAt(),
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const isEditing = Boolean(initial?.matchId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsedSeats: RawSeat[] = useMemo(
    () =>
      seats.map((s) => ({
        playerId: s.playerId,
        rawScore: s.rawScore === "" ? Number.NaN : Number(s.rawScore),
      })),
    [seats],
  );

  const seatStatuses = useMemo(() => {
    return seats.map((seat, idx) => ({
      hasPlayer: seat.playerId !== "",
      hasScore: seat.rawScore !== "" && !Number.isNaN(Number(seat.rawScore)),
      duplicate: seats.some(
        (other, i) => i !== idx && other.playerId && other.playerId === seat.playerId,
      ),
    }));
  }, [seats]);

  const sumScore = parsedSeats.reduce(
    (acc, s) => acc + (Number.isFinite(s.rawScore) ? s.rawScore : 0),
    0,
  );
  const expectedSum = config.startingPoints * 4;
  const allFilled = seatStatuses.every((s) => s.hasPlayer && s.hasScore);
  const validation = allFilled ? validateSeats(parsedSeats, config) : null;
  const canPreview = allFilled && validation === null;
  const preview = canPreview ? calculateResults(parsedSeats, config) : null;

  const playersById = new Map(players.map((p) => [p.id, p]));

  function updateSeat(idx: number, patch: Partial<SeatState>) {
    setSeats((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function handleSubmit() {
    setSubmitError(null);
    if (!canPreview) return;
    startTransition(async () => {
      try {
        await submitMatch({
          matchId: initial?.matchId,
          playedAt: new Date(playedAt).toISOString(),
          note: note.trim() || undefined,
          seats: parsedSeats,
        });
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="surface-card p-5 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-foreground-muted block mb-2">
            対局日時
          </label>
          <input
            type="datetime-local"
            value={playedAt}
            onChange={(e) => setPlayedAt(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-foreground-muted block mb-2">
            メモ（任意）
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例：第3節 第1半荘"
          />
        </div>
      </div>

      <div className="space-y-3">
        {seats.map((seat, idx) => {
          const status = seatStatuses[idx];
          return (
            <div
              key={idx}
              className={`surface-card p-4 grid grid-cols-12 gap-3 items-center ${
                status.duplicate ? "border-danger" : ""
              }`}
            >
              <div className="col-span-12 sm:col-span-1 text-xs text-foreground-dim tracking-widest">
                SEAT {idx + 1}
              </div>
              <div className="col-span-7 sm:col-span-6">
                <select
                  value={seat.playerId}
                  onChange={(e) => updateSeat(idx, { playerId: e.target.value })}
                >
                  <option value="">-- 選手を選択 --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {status.duplicate && (
                  <div className="text-xs text-danger mt-1">
                    同じ選手が他の席にも選ばれています
                  </div>
                )}
              </div>
              <div className="col-span-5 sm:col-span-5">
                <input
                  type="number"
                  inputMode="numeric"
                  step={100}
                  value={seat.rawScore}
                  onChange={(e) =>
                    updateSeat(idx, { rawScore: e.target.value })
                  }
                  placeholder="素点（例: 32400）"
                  className="numeric text-right"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground-muted tracking-widest">
            合計点（期待値 {expectedSum.toLocaleString()}）
          </span>
          <span
            className={`numeric font-bold ${
              !allFilled
                ? "text-foreground-dim"
                : sumScore === expectedSum
                  ? "text-accent"
                  : "text-danger"
            } headline`}
          >
            {Number.isFinite(sumScore) ? sumScore.toLocaleString() : "—"}
          </span>
        </div>
        {validation && (
          <div className="text-sm text-danger">
            {validation.kind === "wrong-sum" &&
              `合計が ${expectedSum.toLocaleString()} になっていません（現在 ${validation.actual.toLocaleString()}）`}
            {validation.kind === "duplicate-player" &&
              "同じ選手が重複しています"}
            {validation.kind === "wrong-count" && "4人ぶん入力してください"}
          </div>
        )}
      </div>

      {preview && (
        <div className="surface-card p-5">
          <div className="text-xs text-foreground-muted tracking-widest mb-3">
            計算プレビュー
          </div>
          <div className="space-y-2">
            {preview.map((r) => (
              <div
                key={r.playerId}
                className="flex items-center gap-3 px-3 py-2 rounded-md bg-background-elevated"
              >
                <span className={`rank-pill rank-${r.rank}`}>{r.rank}</span>
                <span className="flex-1 font-semibold">
                  {playersById.get(r.playerId)?.name ?? "—"}
                </span>
                <span className="numeric text-sm text-foreground-muted">
                  {r.rawScore.toLocaleString()}
                </span>
                <span
                  className={`numeric font-bold w-20 text-right ${
                    r.finalPoints > 0
                      ? "text-positive"
                      : r.finalPoints < 0
                        ? "text-negative"
                        : ""
                  }`}
                >
                  {formatPoints(r.finalPoints)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {submitError && (
        <div className="text-sm text-danger">{submitError}</div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canPreview || isPending}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? "保存中…"
            : isEditing
              ? "編集内容を保存"
              : "この内容で保存"}
        </button>
      </div>
    </div>
  );
}
