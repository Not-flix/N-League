import { SectionTitle } from "@/components/section-title";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next =
    typeof searchParams.next === "string" ? searchParams.next : "/matches/new";
  const error = searchParams.error === "1";

  return (
    <div className="page-shell max-w-md">
      <SectionTitle title="ADMIN" subtitle="管理者ログイン" />
      <form
        method="POST"
        action="/api/auth/login"
        className="surface-card p-6 space-y-4"
      >
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="text-xs text-foreground-muted block mb-2">
            管理パスワード
          </label>
          <input type="password" name="password" required autoFocus />
        </div>
        {error && (
          <div className="text-sm text-danger">パスワードが違います</div>
        )}
        <button type="submit" className="btn-primary w-full">
          ログイン
        </button>
        <p className="text-xs text-foreground-dim">
          ログインすると半荘結果の入力・管理画面の操作が可能になります。
        </p>
      </form>
    </div>
  );
}
