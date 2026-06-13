# 麻雀リーグ管理サイト

仲間内の麻雀リーグ戦の成績・スケジュールを管理するための Web サイト。Mリーグ準拠のルールをベースに、半荘の素点を入力するだけでウマ・オカ計算 → 順位表に即時反映します。

- フレームワーク: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- 認証: 閲覧は誰でも、入力・編集はパスワード保護（HttpOnly Cookie ベースのシンプルな実装）
- データストア: 既定はローカル JSON ファイル / 環境変数を入れると Supabase（PostgreSQL）に自動切替
- デプロイ: Vercel 無料枠を想定

## 機能

| 画面 | 内容 |
|---|---|
| `/` トップ | 順位表サマリ / 直近の試合 / 次回スケジュール |
| `/standings` | 累計pt・半荘数・平均順位・トップ率・ラス率 |
| `/players/[id]` | 選手詳細（着順分布、試合履歴、累計推移） |
| `/matches` | 試合一覧 |
| `/matches/new` | 半荘結果入力（要ログイン）。素点を入力すると合計バリデーション＋計算プレビュー |
| `/schedule` | 対戦スケジュール一覧 |
| `/admin` | 選手追加・名前変更・参加/休止切替、スコアリング設定、スケジュール編集、試合の削除 |
| `/login` | 管理パスワードでログイン |

## ローカルでの起動

```bash
npm install
cp .env.example .env.local   # 値を編集
npm run dev
```

`.env.local` の最低限の値：

```env
ADMIN_PASSWORD=好きなパスワード
SESSION_SECRET=openssl rand -hex 32 などで生成した 32 文字以上のランダム文字列
```

これだけで `http://localhost:3000` で動きます。データは `data/league.json` に保存されます。

### 動作確認の流れ

1. `/login` から `ADMIN_PASSWORD` でログイン
2. `/admin` で選手を 4 人以上登録
3. `/matches/new` で半荘結果を入力
4. `/standings` で順位表が反映されることを確認

## Supabase に切り替える（本番デプロイ向け）

Vercel にデプロイすると、サーバーレス環境ではファイルが永続化されないため Supabase を使ってください。

### 1. Supabase プロジェクトを作る

1. <https://supabase.com> にサインアップ（無料）
2. 「New project」でプロジェクトを作成（リージョンは `Northeast Asia (Tokyo)` 推奨）
3. プロジェクト作成後、左メニュー「SQL Editor」を開く
4. このリポジトリの [`supabase/schema.sql`](./supabase/schema.sql) の中身を貼り付けて「Run」
5. 左メニュー「Project Settings → API」から以下を控える
   - **Project URL** → `SUPABASE_URL`
   - **Service role key**（secret）→ `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ Service role key は RLS をバイパスする強い権限を持ちます。サーバー側（Vercel 環境変数）でのみ使用し、絶対にクライアントへ露出させないでください。本リポジトリでは Server Component / Server Action 内でのみ参照しています。

### 2. `.env.local`（または Vercel の環境変数）に追加

```env
ADMIN_PASSWORD=好きなパスワード
SESSION_SECRET=ランダム文字列
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

`SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` の両方が入っていると自動的に Supabase ストアに切り替わります。片方でも欠けていればローカル JSON にフォールバックします。

## Vercel へのデプロイ

1. このリポジトリを GitHub に push
2. <https://vercel.com> にサインアップして「Add New → Project」
3. 該当リポジトリを選択 → そのまま Import
4. 「Environment Variables」に上記 4 つを追加
5. 「Deploy」をクリック

デプロイ後、`https://your-project.vercel.app` でアクセスできます。Vercel の無料プラン（Hobby）で十分動きます。

## スコアリングのカスタマイズ

`/admin` の「SCORING」セクションで、持ち点・返し点・ウマ（1〜4位）を変更できます。  
初期値は M-League 公式と同じ「25,000 点持ち / 30,000 点返し / ウマ +50 / +10 / -10 / -30」です（ウマにはオカ込みの値を直接入力します）。

例: 30,000 点持ち / 30,000 点返し / ウマ ±10 ±20 にしたい場合 →
- 持ち点 30000、返し点 30000、ウマ 20, 10, -10, -20 を入力

同順位（タイ）は自動的にウマを按分します。

## ディレクトリ構成

```
src/
  app/
    page.tsx                トップ
    standings/page.tsx      順位表
    matches/                試合一覧 + 新規入力（要認証）
      new/match-form.tsx    クライアントの入力フォーム
      new/actions.ts        サーバーアクション
    players/[id]/page.tsx   選手詳細
    schedule/page.tsx       スケジュール
    admin/                  管理画面（要認証）
    login/page.tsx          ログイン
    api/auth/login          パスワード検証 → Cookie 発行
    api/auth/logout
  components/               ヘッダー・フッター・テーブルなど
  lib/
    types.ts                エンティティの型
    scoring.ts              ウマ・オカ計算ロジック
    auth.ts                 セッション Cookie の発行・検証
    data.ts                 サーバー側のデータ取得まとめ
    format.ts               表示用フォーマッタ（クライアント可）
    store/
      types.ts              DataStore インターフェース
      file-store.ts         ローカル JSON 実装
      supabase-store.ts     Supabase 実装
      index.ts              環境変数で実装を選択
  proxy.ts                  認証ミドルウェア（Next.js 16 では middleware ではなく proxy）
supabase/
  schema.sql                Supabase 初期化スクリプト
```

## 環境変数まとめ

| 変数 | 必須 | 用途 |
|---|---|---|
| `ADMIN_PASSWORD` | ◯ | 半荘入力・管理画面へのログインに使うパスワード |
| `SESSION_SECRET` | ◯ | セッション Cookie の署名鍵（16文字以上） |
| `SUPABASE_URL` | △ | 入れると Supabase ストアに切替 |
| `SUPABASE_SERVICE_ROLE_KEY` | △ | 同上 |

## ライセンス

仲間内利用向けの個人プロジェクトです。
