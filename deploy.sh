#!/bin/bash
# KOMIR v3 — 새 Vercel 프로젝트 배포

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR" || exit 1

echo "========================================"
echo "  KOMIR v3 → 새 Vercel 프로젝트 배포"
echo "  폴더: $PROJECT_DIR"
echo "========================================"
echo ""

if ! command -v node &>/dev/null; then
  echo "❌ Node.js 필요 — https://nodejs.org"
  read -p "엔터 종료..."; exit 1
fi

echo "✅ Node.js: $(node -v)"
echo ""
echo "🚀 배포 시작..."
echo "   ⚠️  처음 실행 시 Vercel이 프로젝트 이름을 물어봅니다"
echo "   → 추천 이름: komir-v3"
echo ""

if command -v vercel &>/dev/null; then
  vercel deploy --prod
else
  npx vercel@latest deploy --prod
fi

echo ""
echo "========================================"
echo "  배포 완료 후 Vercel 대시보드에서:"
echo "  Settings → Environment Variables 추가"
echo "  DATA_GO_KR_API_KEY = [관세청 API 키]"
echo "========================================"
read -p "엔터 종료..."
