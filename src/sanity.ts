import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const folder = await prisma.folder.create({
    data: { name: "Reading List" },
  });
  console.log("Created folder:", folder);

  const bookmark = await prisma.bookmark.create({
    data: {
      title: "Prisma Docs",
      url: "https://www.prisma.io/docs",
      tags: ["reference", "orm"],
      folderId: folder.id,
    },
  });
  console.log("Created bookmark:", bookmark);

  const folderWithBookmarks = await prisma.folder.findUnique({
    where: { id: folder.id },
    include: { bookmarks: true },
  });
  console.log("Folder with bookmarks:", folderWithBookmarks);
}

main()
  .catch((error: unknown) => {
    console.error("Sanity check failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });