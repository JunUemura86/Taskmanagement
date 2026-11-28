# ⑤ EC2 用のポート（セキュリティグループ）
# セキュリティグループは EC2 の前に立つ門番。許可した通信だけを通す。
# このアプリにはログインがないので、自宅の IP からのポート 80（http）だけを通す。
# SSH（22）は開けない。EC2 に入るときは Session Manager を使う。
#
# 8080 と 5173 を開けない理由：
#   ブラウザ ──80──▶ nginx ─┬─ 画面（ビルド済みのファイル）をそのまま返す
#                            └─ /api/* だけ Spring Boot（8080）へ中継する
# - 5173（Vite）は手元で開発するときだけ使う。EC2 では npm run build で作ったファイルを
#   nginx がポート 80 で返すので、5173 は使わない。
# - 8080（Spring Boot）は、nginx から EC2 の中の Docker ネットワークを通って呼ばれるだけ。
#   開けると nginx を通らずに API を直接呼べる入口が増えるので、開けない。
# - 5432（PostgreSQL）も同じく EC2 の中だけで使うので、開けない。

resource "aws_security_group" "web" {
  name        = "${var.project_name}-web-sg"
  description = "Allow HTTP from my IP only"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-web-sg"
  }
}

# 入ってくる通信：自宅の IP からのポート 80 だけ
resource "aws_vpc_security_group_ingress_rule" "http_from_my_ip" {
  security_group_id = aws_security_group.web.id
  description       = "HTTP from my IP"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = var.my_ip_cidr
}

# 出ていく通信：すべて許可（GitHub からの clone、コンテナイメージの取得、Session Manager に必要）
resource "aws_vpc_security_group_egress_rule" "all_outbound" {
  security_group_id = aws_security_group.web.id
  description       = "All outbound"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}
