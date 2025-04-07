# TimeSlice アプリケーション

時間管理のためのシンプルなウェブアプリケーションです。日々の業務や活動を時間枠で管理し、記録することができます。

## 機能

- 時間枠による活動の記録
- 活動内容、クライアント、目的、アクションなどの入力
- 前日のデータのインポート
- スプレッドシートとの連携
- プリセット機能による素早い入力
- モバイル対応レイアウト

## 技術スタック

- **フロントエンド**: Next.js, React, TypeScript
- **バックエンド**: Go, Gin
- **データ連携**: Googleスプレッドシート

## セットアップ

### 前提条件

- Node.js (v16以上)
- Go (v1.16以上)
- Googleアカウント（スプレッドシート連携用）

### インストール

1. リポジトリをクローン
   ```
   git clone https://github.com/yourusername/timeslice-app.git
   cd timeslice-app
   ```

2. バックエンドの依存関係をインストール
   ```
   go mod download
   ```

3. フロントエンドの依存関係をインストール
   ```
   cd web/frontend
   npm install
   ```

4. Googleスプレッドシート連携の設定
   - Googleクラウドコンソールでプロジェクトを作成
   - Google Sheets APIを有効化
   - サービスアカウントを作成し、キーをダウンロード
   - ダウンロードしたJSONを `credentials.json` としてプロジェクトルートに配置

### 起動方法

1. バックエンドの起動
   ```
   cd /path/to/timeslice-app
   go run cmd/main.go
   ```

2. フロントエンドの起動
   ```
   cd /path/to/timeslice-app/web/frontend
   npm run dev
   ```

3. ブラウザで http://localhost:3000 にアクセス

## 使用方法

1. 日付を選択
2. 開始時間を設定
3. 時間枠ごとに活動内容を入力
4. 保存ボタンでデータを保存
5. プリセットを利用して素早く入力

## ライセンス

MITライセンス 