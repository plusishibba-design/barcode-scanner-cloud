# バーコードスキャナー - クラウド版

スマホでバーコードをスキャンして、Vercel Postgresクラウドデータベースに自動保存するシステムです。

## 機能

- カメラでバーコードスキャン（QRコード、JANコード等対応）
- Vercel Postgresにデータ保存
- リアルタイムダッシュボード
- どこからでもアクセス可能

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Vercel Postgresデータベースのセットアップ

1. Vercelアカウントにログイン
2. プロジェクトをVercelにデプロイ
3. Vercelダッシュボードで「Storage」→「Create Database」→「Postgres」を選択
4. データベースが自動的に環境変数に設定されます

### 3. ローカル開発

```bash
npm run dev
```

http://localhost:3000 でアクセス

### 4. Vercelにデプロイ

```bash
# Vercel CLIをインストール（初回のみ）
npm i -g vercel

# デプロイ
vercel
```

## 使い方

### スキャン

1. デプロイされたURLにアクセス
2. 「スキャン開始」をタップ
3. カメラが起動したらバーコードをスキャン
4. 自動的にクラウドに保存されます

### ダッシュボード

1. 「ダッシュボード」をタップ
2. スキャンした全データを表示
3. 総スキャン数、今日のスキャン数を確認

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: Vercel Postgres
- **デプロイ**: Vercel
- **バーコードスキャン**: html5-qrcode

## 対応バーコード形式

- QRコード
- JAN/EAN (商品バーコード)
- Code128
- Code39
- UPC-A/UPC-E

## ライセンス

MIT
