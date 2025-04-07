# ビルドステージ
FROM golang:1.24-alpine AS builder

WORKDIR /app

# 依存関係をコピー
COPY go.mod go.sum ./
RUN go mod download

# ソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/timeslice-app cmd/main.go

# 実行ステージ
FROM alpine:latest

WORKDIR /app

# 必要なファイルをコピー
COPY --from=builder /app/timeslice-app /app/
COPY --from=builder /app/static /app/static/
COPY --from=builder /app/templates /app/templates/

# ポートを公開
EXPOSE 8080

# アプリケーションを実行
CMD ["/app/timeslice-app"] 