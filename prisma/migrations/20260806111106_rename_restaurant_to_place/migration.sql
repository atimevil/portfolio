-- Restaurant -> Place 로 이름 변경 + 맛집/쇼핑 구분(type)과 사진(photo) 추가.
-- Prisma는 rename을 감지하지 못해 DROP+CREATE를 생성하므로(=데이터 유실),
-- 이 마이그레이션은 손으로 작성했다. ALTER만 사용하므로 기존 행은 그대로 보존된다.

ALTER TABLE "Restaurant" RENAME TO "Place";
ALTER TABLE "Place" RENAME COLUMN "menus" TO "items";

-- 인덱스/시퀀스 이름도 Prisma가 기대하는 새 이름으로 맞춘다(안 하면 drift로 잡힘).
ALTER INDEX "Restaurant_pkey" RENAME TO "Place_pkey";
ALTER INDEX "Restaurant_placeId_key" RENAME TO "Place_placeId_key";
ALTER SEQUENCE "Restaurant_id_seq" RENAME TO "Place_id_seq";

-- 기존 행은 전부 맛집이므로 기본값 'food'로 채워진다.
ALTER TABLE "Place" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'food';
ALTER TABLE "Place" ADD COLUMN "photo" TEXT;
