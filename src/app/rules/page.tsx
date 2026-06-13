import Link from "next/link";
import { SectionTitle } from "@/components/section-title";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ルール | Nリーグ",
  description: "Nリーグの公式ルール",
};

function formatUmaValue(v: number): string {
  if (v > 0) return `+${v}`;
  if (v < 0) return `${v}`;
  return "±0";
}

export default async function RulesPage() {
  const store = getStore();
  const config = await store.getConfig();
  const [u1, u2, u3, u4] = config.uma;
  const umaSum = config.uma.reduce((a, b) => a + b, 0);
  const oka = (config.returnPoints - config.startingPoints) * 4;
  const hasOka = oka !== 0 || umaSum !== 0;

  return (
    <div className="page-shell max-w-3xl space-y-10">
      <header>
        <SectionTitle title="RULES" subtitle="Nリーグ公式ルール" />
        <p className="text-sm text-foreground-muted leading-relaxed">
          基本ルールは{" "}
          <a
            href="https://m-league.jp/about"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Mリーグ公式ルール
          </a>
          に準拠します。本ページの「追加ルール」セクションが Nリーグ独自に上書き／追加する項目です。
        </p>
      </header>

      <section className="special-rule">
        <div className="special-rule__tape" aria-hidden="true" />
        <div className="special-rule__header">
          <span className="special-rule__pill">特殊ルール</span>
          <span className="special-rule__stamp" aria-hidden="true">
            強制
          </span>
        </div>
        <h2 className="special-rule__title">
          <span aria-hidden="true" className="special-rule__icon">
            🍱
          </span>
          <span>初戦ラス＝ランチ係</span>
        </h2>
        <p className="special-rule__body">
          その日の <strong>最初の1半荘</strong> で4位（ラス）だった者は、
          <strong>その日のランチを作成する義務</strong>
          を強制的に請け負うこととする。
        </p>
        <p className="special-rule__foot">
          辞退・代理・買い出しによる代替は不可。卓全員の合意があった場合に限り免除可とする。
          複数卓開催時は卓ごとに適用する。
        </p>
      </section>

      <RuleBlock title="基本">
        <Row label="形式">4人打ち / 東南戦（半荘戦）</Row>
        <Row label="持ち点 / 返し点">
          {config.startingPoints.toLocaleString()}点持ち /{" "}
          {config.returnPoints.toLocaleString()}点返し
        </Row>
        <Row label="順位点" highlight>
          <span className="font-semibold">
            1着 {formatUmaValue(u1)} / 2着 {formatUmaValue(u2)} / 3着{" "}
            {formatUmaValue(u3)} / 4着 {formatUmaValue(u4)}
          </span>
          {hasOka && (
            <small className="ml-2 text-foreground-dim">
              （オカ {oka >= 0 ? "+" : ""}
              {(oka / 1000).toFixed(1)} を1位が獲得）
            </small>
          )}
        </Row>
        <Row label="同点">
          同順位の者がいた場合は、その順位帯の順位点を均等に分配する
        </Row>
        <Row label="順位決定">
          合計ポイント順、同点時はシーズン内の上位順位回数で決定
        </Row>
      </RuleBlock>

      <RuleBlock title="採用役・基本ルール">
        <Row label="一発">あり</Row>
        <Row label="裏ドラ">あり</Row>
        <Row label="カンドラ / カン裏">あり（カンドラは即乗り）</Row>
        <Row label="赤ドラ" highlight>
          <strong className="text-positive">なし</strong>
          <small className="ml-2 text-foreground-dim">
            ※ Nリーグ独自（Mリーグは赤あり）
          </small>
        </Row>
        <Row label="喰いタン">あり</Row>
        <Row label="後付け">あり</Row>
        <Row label="ダブロン">あり（頭ハネなし、両者得点）</Row>
      </RuleBlock>

      <RuleBlock title="流局">
        <Row label="四風連打" highlight>
          <strong className="text-positive">あり</strong>
          <small className="ml-2 text-foreground-dim">※ Nリーグ独自</small>
        </Row>
        <Row label="九種九牌" highlight>
          <strong className="text-positive">あり</strong>
          <small className="ml-2 text-foreground-dim">※ Nリーグ独自</small>
        </Row>
        <Row label="流し満貫" highlight>
          <strong className="text-positive">あり</strong>
          <small className="ml-2 text-foreground-dim">※ Nリーグ独自</small>
        </Row>
      </RuleBlock>

      <RuleBlock title="オープンリーチ（Nリーグ独自）" accent>
        <Row label="先制オープンリーチ">
          <strong className="text-positive">2翻</strong>
        </Row>
        <Row label="追いかけオープンリーチ">1翻</Row>
        <Row label="フリテンオープンリーチ">1翻</Row>
        <p className="text-xs text-foreground-dim leading-relaxed pt-2">
          先制のみ通常リーチ（1翻）に対して特別に+1翻となります。追いかけ・フリテンは通常リーチと同じ扱い。
        </p>
      </RuleBlock>

      <RuleBlock title="槍槓（チャンカン）" accent>
        <Row label="ポン牌の加槓">通常通り槍槓あり</Row>
        <Row label="暗槓への槍槓" highlight>
          <strong>国士無双のみ可</strong>
          <small className="ml-2 text-foreground-dim">※ Nリーグ独自</small>
        </Row>
      </RuleBlock>

      <RuleBlock title="役満" accent>
        <p className="text-xs text-foreground-muted mb-3">
          以下はダブル役満として扱います。
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm">
          <li>四暗刻単騎</li>
          <li>
            国士無双13面待ち
            <small className="ml-2 text-foreground-dim">
              （フリテンツモ和了も可）
            </small>
          </li>
          <li>純正九蓮宝燈</li>
          <li>大四喜</li>
        </ul>
        <Row label="数え役満">
          <strong>13翻以上</strong>を数え役満として認める
        </Row>
      </RuleBlock>

      <RuleBlock title="ローカル役満" accent>
        <h3 className="font-bold text-base mb-1.5 headline">黒人無双</h3>
        <p className="text-sm leading-relaxed text-foreground-muted">
          2筒 / 4筒 / 8筒 と 東 / 西 / 南 / 北 のみを使用して面子・雀頭を構成し
          和了すると成立。
        </p>
        <p className="text-xs text-foreground-dim mt-2">鳴きあり。役満扱い。</p>
      </RuleBlock>

      <RuleBlock title="チョンボ">
        <Row label="ツモ切り和了">放棄（チョンボ扱い）</Row>
        <p className="text-xs text-foreground-dim leading-relaxed pt-1">
          点数の精算方法はその場で決定（マンガン罰符 / 親への満貫払い等、卓ごとに合意）。
        </p>
      </RuleBlock>

      <RuleBlock title="シーズン中のルール変更" accent>
        <ul className="list-disc list-inside space-y-1.5 text-sm leading-relaxed">
          <li>
            シーズンを通して、<strong>2 / 3 / 4位</strong>のメンバーは話し合いで
            <strong> 最大2つ</strong>のルール変更を申請可能
          </li>
          <li>
            ルール変更の決定権は <strong>シーズン4位</strong>の者に帰属する
          </li>
          <li>例：赤あり ⇄ 赤なしに変更、順位点の数値変更 など</li>
        </ul>
        <p className="text-xs text-foreground-dim mt-3 leading-relaxed">
          変更内容は管理者が{" "}
          <Link href="/admin" className="text-accent hover:underline">
            /admin
          </Link>{" "}
          の「スコアリング設定」に反映してください。本ページの「基本」セクションに即時反映されます。
        </p>
      </RuleBlock>

      <RuleBlock title="計算方法">
        <Row label="最終ポイント">
          (素点 − 返し点) ÷ 1000 + 順位点
        </Row>
        <Row label="同順位の処理">
          同順位の者が n 名いた場合、その順位帯の順位点合計を n で等分
        </Row>
        <p className="text-xs text-foreground-dim leading-relaxed pt-1">
          例：2着 / 3着が同点の場合、両者ともに ({formatUmaValue(u2)} +{" "}
          {formatUmaValue(u3)}) ÷ 2 ={" "}
          <span className="numeric font-bold">{formatUmaValue((u2 + u3) / 2)}</span>{" "}
          の順位点を得る。
        </p>
      </RuleBlock>

      <footer className="text-xs text-foreground-dim border-t border-border pt-6 leading-relaxed">
        本ページに記載のない事項は Mリーグ公式ルールに従います。
        運用上の解釈に迷った場合はその場のメンバーで合議し、シーズン4位の判断を最終とします。
      </footer>
    </div>
  );
}

function RuleBlock({
  title,
  children,
  accent = false,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section className="surface-card overflow-hidden">
      <div
        className={`px-5 py-3 border-b border-border ${
          accent
            ? "bg-[var(--mahjong-red-soft)] text-[var(--mahjong-red-dark)]"
            : "bg-background-elevated"
        }`}
      >
        <h2 className="font-bold headline text-base tracking-wider">{title}</h2>
      </div>
      <div className="p-5 space-y-2.5 text-sm">{children}</div>
    </section>
  );
}

function Row({
  label,
  children,
  highlight = false,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 py-1.5 border-b border-border last:border-b-0 ${
        highlight ? "bg-accent-soft -mx-5 px-5 rounded" : ""
      }`}
    >
      <span className="w-32 shrink-0 text-foreground-muted text-xs tracking-wider">
        {label}
      </span>
      <span className="flex-1">{children}</span>
    </div>
  );
}
