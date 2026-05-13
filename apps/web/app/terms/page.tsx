import Link from 'next/link';

export const metadata = {
  title: '利用規約・免責事項 | トレ学',
};

export default function TermsPage() {
  return (
    <div className="min-h-svh bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            ← 戻る
          </Link>
          <span className="font-nunito font-bold">利用規約・免責事項</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8 text-sm leading-relaxed text-[var(--foreground)]">
        {/* 重要な注意書き */}
        <div className="rounded-2xl border-2 border-[#ffc800] bg-[#fff8e6] p-5">
          <h2 className="font-nunito mb-2 text-base font-extrabold text-[#ff9600]">
            ⚠️ 重要なお知らせ
          </h2>
          <p>
            本アプリは<strong>教育・学習目的のシミュレーション</strong>
            です。実際の金融商品への投資を推奨・助言するものではありません。
            掲載されている情報やシミュレーション結果は、実際の投資成果を保証するものではありません。
          </p>
        </div>

        <Section title="1. 本サービスについて">
          <p>
            「トレ学」（以下「本サービス」）は、デイトレードの基礎知識をゲーム形式で学ぶ
            <strong>教育目的の学習アプリ</strong>です。
            本サービスは金融商品取引法に基づく投資助言業の登録を受けておらず、
            投資判断の提供を目的としていません。
          </p>
        </Section>

        <Section title="2. 免責事項">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              本サービスで提供するコンテンツは教育目的であり、実際の投資成果を保証するものではありません。
            </li>
            <li>
              本サービスを利用した投資判断による損失について、運営者は一切の責任を負いません。
            </li>
            <li>
              チャートや問題のシナリオは学習用に作成されたものであり、
              特定の銘柄・市場に関する助言ではありません。
            </li>
            <li>本サービスの情報は予告なく変更・削除される場合があります。</li>
          </ul>
        </Section>

        <Section title="3. 利用条件">
          <ul className="list-disc space-y-2 pl-5">
            <li>本サービスは18歳以上の方を対象としています。</li>
            <li>アカウント登録にあたり、正確な情報を提供することに同意するものとします。</li>
            <li>
              本サービスを商業目的・営利目的で利用すること、
              およびリバースエンジニアリングを禁止します。
            </li>
          </ul>
        </Section>

        <Section title="4. 知的財産権">
          <p>
            本サービスのコンテンツ（テキスト・画像・UI デザイン等）の著作権は運営者に帰属します。
            無断複製・転載を禁止します。
          </p>
        </Section>

        <Section title="5. プライバシー">
          <p>
            本サービスはユーザーのメールアドレスおよび学習履歴を収集・保存します。
            これらの情報はサービス提供・改善のみに使用し、第三者への提供は行いません。
            データの管理には Supabase（米国）を使用しており、
            EU/米国間のデータ移転に関する標準契約条項（SCC）に準拠しています。
          </p>
        </Section>

        <Section title="6. 規約の変更">
          <p>
            本規約は予告なく変更される場合があります。
            変更後も本サービスを継続して利用した場合、変更後の規約に同意したものとみなします。
          </p>
        </Section>

        <p className="text-xs text-[var(--muted-foreground)]">最終更新: 2026年5月</p>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-nunito mb-3 text-base font-extrabold text-[var(--foreground)]">
        {title}
      </h2>
      {children}
    </section>
  );
}
