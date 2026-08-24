import { describe, expect, test } from "bun:test";
import { resolvers } from "./resolvers";
import { prisma } from "../db/prisma";

describe("createBookmark", () => {
    test("rejects an empty bookmark title", async () => {
        try {
            await resolvers.Mutation.createBookmark(
                {},
                {
                    title: "   ",
                    url: "https://example.com",
                    tags: [],
                    folderId: "folder-id",
                },
            );

            throw new Error("Expected createBookmark to throw");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);

            const graphqlError = error as {
                message: string;
                extensions?: {
                    code?: string;
                };
            };

            expect(graphqlError.message).toBe(
                "Bookmark title cannot be empty",
            );

            expect(graphqlError.extensions?.code).toBe(
                "INVALID_INPUT",
            );
        }
    });

    test("rejects an invalid URL", async () => {
        try {
            await resolvers.Mutation.createBookmark(
                {},
                {
                    title: "Valid title",
                    url: "not-a-valid-url",
                    tags: [],
                    folderId: "folder-id",
                },
            );

            throw new Error("Expected createBookmark to throw");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);

            const graphqlError = error as {
                message: string;
                extensions?: {
                    code?: string;
                };
            };

            expect(graphqlError.message).toBe("Invalid URL");
            expect(graphqlError.extensions?.code).toBe("INVALID_INPUT");
        }
    });

});

describe("updateBookmark", () => {
    test("rejects update when bookmark does not exist", async () => {
        try {
            await resolvers.Mutation.updateBookmark(
                {},
                {
                    id: "00000000-0000-0000-0000-000000000000",
                    title: "Updated title",
                },
            );

            throw new Error("Expected updateBookmark to throw");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);

            const graphqlError = error as {
                message: string;
                extensions?: {
                    code?: string;
                };
            };

            expect(graphqlError.message).toBe("Bookmark not found");
            expect(graphqlError.extensions?.code).toBe("NOT_FOUND");
        }
    });

    test("rejects an empty title", async () => {
        try {
            await resolvers.Mutation.updateBookmark(
                {},
                {
                    id: "1237a6ce-de20-4367-bdfb-b367b01799ad",
                    title: "   ",
                },
            );

            throw new Error("Expected updateBookmark to throw");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);

            const graphqlError = error as {
                message: string;
                extensions?: {
                    code?: string;
                };
            };

            expect(graphqlError.message).toBe(
                "Bookmark title cannot be empty",
            );

            expect(graphqlError.extensions?.code).toBe(
                "INVALID_INPUT",
            );
        }
    });

    test("rejects an invalid URL", async () => {
        try {
            await resolvers.Mutation.updateBookmark(
                {},
                {
                    id: "1237a6ce-de20-4367-bdfb-b367b01799ad",
                    url: "not-a-valid-url",
                },
            );

            throw new Error("Expected updateBookmark to throw");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);

            const graphqlError = error as {
                message: string;
                extensions?: {
                    code?: string;
                };
            };

            expect(graphqlError.message).toBe("Invalid URL");
            expect(graphqlError.extensions?.code).toBe(
                "INVALID_INPUT",
            );
        }
    });
});

describe("deleteBookmark", () => {
    test("rejects deletion when bookmark does not exist", async () => {
        try {
            await resolvers.Mutation.deleteBookmark(
                {},
                {
                    id: "00000000-0000-0000-0000-000000000000",
                },
            );

            throw new Error("Expected deleteBookmark to throw");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);

            const graphqlError = error as {
                message: string;
                extensions?: {
                    code?: string;
                };
            };

            expect(graphqlError.message).toBe("Bookmark not found");
            expect(graphqlError.extensions?.code).toBe("NOT_FOUND");
        }
    });

    test("deletes an existing bookmark", async () => {
        const folder = await prisma.folder.create({
            data: {
                name: "Delete Test Folder",
            },
        });

        const bookmark = await prisma.bookmark.create({
            data: {
                title: "Bookmark To Delete",
                url: "https://example.com/delete-test",
                tags: [],
                folderId: folder.id,
            },
        });

        const result = await resolvers.Mutation.deleteBookmark(
            {},
            {
                id: bookmark.id,
            },
        );

        expect(result).toBe(true);

        const deletedBookmark = await prisma.bookmark.findUnique({
            where: {
                id: bookmark.id,
            },
        });

        expect(deletedBookmark).toBeNull();

        await prisma.folder.delete({
            where: {
                id: folder.id,
            },
        });
    });
});

describe("moveBookmark", () => {
    test("rejects move when bookmark does not exist", async () => {
        try {
            await resolvers.Mutation.moveBookmark(
                {},
                {
                    id: "00000000-0000-0000-0000-000000000000",
                    folderId: "00000000-0000-0000-0000-000000000001",
                },
            );

            throw new Error("Expected moveBookmark to throw");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);

            const graphqlError = error as {
                message: string;
                extensions?: {
                    code?: string;
                };
            };

            expect(graphqlError.message).toBe("Bookmark not found");
            expect(graphqlError.extensions?.code).toBe("NOT_FOUND");
        }
    });

    test("rejects move when target folder does not exist", async () => {
        const folder = await prisma.folder.create({
            data: {
                name: "Move Test Folder",
            },
        });

        const bookmark = await prisma.bookmark.create({
            data: {
                title: "Bookmark To Move",
                url: "https://example.com/move-test",
                tags: [],
                folderId: folder.id,
            },
        });

        try {
            await resolvers.Mutation.moveBookmark(
                {},
                {
                    id: bookmark.id,
                    folderId: "00000000-0000-0000-0000-000000000000",
                },
            );

            throw new Error("Expected moveBookmark to throw");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);

            const graphqlError = error as {
                message: string;
                extensions?: {
                    code?: string;
                };
            };

            expect(graphqlError.message).toBe("Targeted folder not found");
            expect(graphqlError.extensions?.code).toBe("NOT_FOUND");
        } finally {
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
        }
    });
});

describe("bookmarks pagination", () => {
    test("paginates bookmarks using a cursor", async () => {
        const folder = await prisma.folder.create({
            data: {
                name: "Pagination Test Folder",
            },
        });

        const bookmarks = await Promise.all(
            ["Bookmark A", "Bookmark B", "Bookmark C", "Bookmark D"].map(
                (title) =>
                    prisma.bookmark.create({
                        data: {
                            title,
                            url: `https://example.com/${title
                                .toLowerCase()
                                .replace(" ", "-")}`,
                            tags: [],
                            folderId: folder.id,
                        },
                    }),
            ),
        );

        const firstPage = await resolvers.Query.bookmarks(
            {},
            {
                take: 2,
                folderId: folder.id,
            },
        );

        expect(firstPage).toHaveLength(2);

        const cursor = firstPage[1]?.id;

        expect(cursor).toBeDefined();

        const secondPage = await resolvers.Query.bookmarks(
            {},
            {
                take: 2,
                folderId: folder.id,
                cursor,
            },
        );

        expect(secondPage).toHaveLength(2);

        expect(secondPage[0]?.id).not.toBe(firstPage[0]?.id);
        expect(secondPage[0]?.id).not.toBe(firstPage[1]?.id);

        expect(secondPage[1]?.id).not.toBe(firstPage[0]?.id);
        expect(secondPage[1]?.id).not.toBe(firstPage[1]?.id);

        await prisma.bookmark.deleteMany({
            where: {
                id: {
                    in: bookmarks.map((bookmark) => bookmark.id),
                },
            },
        });

        await prisma.folder.delete({
            where: {
                id: folder.id,
            },
        });
    });
});