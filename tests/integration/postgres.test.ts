import { describe, expect, test } from "bun:test";
import { prisma } from "../../src/db/prisma";

describe("PostgreSQL integration", () => {
  test("can create and read a folder and bookmark from PostgreSQL", async () => {
    const folder = await prisma.folder.create({
      data: {
        name: "Integration Test Folder",
      },
    });

    const bookmark = await prisma.bookmark.create({
      data: {
        title: "Integration Test Bookmark",
        url: "https://example.com/integration",
        tags: ["integration", "test"],
        folderId: folder.id,
      },
    });

    const result = await prisma.folder.findUnique({
      where: {
        id: folder.id,
      },
      include: {
        bookmarks: true,
      },
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe("Integration Test Folder");
    expect(result?.bookmarks).toHaveLength(1);
    expect(result?.bookmarks[0]?.id).toBe(bookmark.id);
    expect(result?.bookmarks[0]?.title).toBe(
      "Integration Test Bookmark",
    );
    expect(result?.bookmarks[0]?.url).toBe(
      "https://example.com/integration",
    );

    await prisma.bookmark.delete({
      where: {
        id: bookmark.id,
      },
    });

    await prisma.folder.delete({
      where: {
        id: folder.id,
      },
    });
  });
});