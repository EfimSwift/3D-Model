import { PrismaClient, ProductType } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import {
  encryptModelBuffer,
  getModelEncryptionKey,
  isEncryptedModelBlob,
} from "../src/lib/crypto/model-files";

const prisma = new PrismaClient();

const products = [
  {
    slug: "test-dragon",
    title: "Тест: Дракон (3D модель)",
    description:
      "Тестовая цифровая модель. Доступно 3D-превью всем. Полный архив ZIP — только после оплаты (пока через тестовую кнопку).",
    priceUah: 299,
    type: ProductType.DIGITAL,
    previewGlbPath: "/previews/test-dragon.glb",
    privateFilePath: "test-dragon.zip.enc",
    seedPlainName: "test-dragon.zip",
    seedContent:
      "PK\x03\x04Test archive: dragon model. Replace with real STL/OBJ/ZIP before launch.\n",
  },
  {
    slug: "test-robot",
    title: "Тест: Робот (3D модель)",
    description:
      "Вторая тестовая модель для проверки сценария «не оплатил — только превью» и «оплатил — скачал».",
    priceUah: 199,
    type: ProductType.DIGITAL,
    previewGlbPath: "/previews/test-robot.glb",
    privateFilePath: "test-robot.zip.enc",
    seedPlainName: "test-robot.zip",
    seedContent:
      "PK\x03\x04Test archive: robot model. Replace with real STL/OBJ/ZIP before launch.\n",
  },
  {
    slug: "test-figurine-wizard",
    title: "Фигурка «Маг» — на заказ",
    description:
      "Авторская фигурка под печать и ручную доводку. На карточке — витрина как у 3D, после оплаты заказ уходит в производство.",
    priceUah: 890,
    type: ProductType.PHYSICAL,
    coverImagePath: "/images/test-figurine-wizard.svg",
    privateFilePath: null,
    seedPlainName: null,
    seedContent: null,
  },
];

function ensureEncryptedPrivateModels() {
  getModelEncryptionKey();
  const dir = path.join(process.cwd(), "storage", "private");
  fs.mkdirSync(dir, { recursive: true });

  for (const p of products) {
    if (!p.seedPlainName || !p.privateFilePath || !p.seedContent) continue;

    const encPath = path.join(dir, p.privateFilePath);
    if (fs.existsSync(encPath)) {
      const existing = fs.readFileSync(encPath);
      if (isEncryptedModelBlob(existing)) continue;
    }

    const plain = Buffer.from(p.seedContent, "utf8");
    fs.writeFileSync(encPath, encryptModelBuffer(plain));

    const legacyPlain = path.join(dir, p.seedPlainName);
    if (fs.existsSync(legacyPlain)) {
      fs.unlinkSync(legacyPlain);
    }
  }
}

async function main() {
  ensureEncryptedPrivateModels();

  const adminHash = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@figurki.local" },
    update: {},
    create: {
      email: "admin@figurki.local",
      passwordHash: adminHash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
        priceUah: p.priceUah,
        type: p.type,
        previewGlbPath: p.previewGlbPath ?? null,
        coverImagePath: p.coverImagePath ?? null,
        privateFilePath: p.privateFilePath ?? null,
      },
      create: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        priceUah: p.priceUah,
        type: p.type,
        previewGlbPath: p.previewGlbPath ?? null,
        coverImagePath: p.coverImagePath ?? null,
        privateFilePath: p.privateFilePath ?? null,
      },
    });
  }

  console.log("Seed OK. Admin: admin@figurki.local / admin1234 → /staff/login");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
