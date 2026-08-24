import { prisma } from "../db/prisma";
import { AppError } from "./errors";

type FolderWithBookmarks = {
  createdAt: Date;
};

type BookmarkWithDate = {
  createdAt: Date;
};

export const resolvers = {
  Query: {
    folders: async () => {
      return prisma.folder.findMany({
        orderBy: {
          createdAt: "asc",
        },
        include: {
          bookmarks: true
        }
      });
    },

    folder: async (_parent: unknown, args: { id: string }) => {
      return prisma.folder.findUnique({
        where: {
          id: args.id,
        },
        include: {
          bookmarks: true,
        },
      });
    },

    bookmarks: async (
      _parent: unknown,
      args: {
        folderId?: string;
        search?: string;
        take?: number;
        cursor?: string
      }) => {
      return prisma.bookmark.findMany({
        where: {
          ...(args.folderId ?
            {
              folderId: args.folderId
            }
            : {}),

          ...(args.search ?
            {
              title: {
                contains: args.search,
                mode: "insensitive"
              }
            }
            : {})
        },

        take: args.take,

        ...(args.cursor ?
          {
            cursor: {
              id: args.cursor
            },
            skip: 1,
          }
          : {}),
        orderBy: [
          { createdAt: "asc" },
          { id: "asc" }
        ]
      })
    }
  },

  Mutation: {
    createFolder: async (
      _parent: unknown,
      args: { name: string }
    ) => {
      if (!args.name.trim()) {
        throw new AppError("Folder name cannot be empty", "INVALID_INPUT");
      }
      return prisma.folder.create({
        data: {
          name: args.name.trim(),
        },
        include: {
          bookmarks: true,
        },
      });
    },

    createBookmark: async (
      _parent: unknown,
      args: {
        title: string;
        url: string;
        tags?: string[];
        folderId: string;
      }
    ) => {

      if (!args.title.trim()) {
        throw new AppError("Bookmark title cannot be empty", "INVALID_INPUT");
      }

      let parsedUrl: URL;

      try {
        parsedUrl = new URL(args.url);
      } catch {
        throw new AppError("Invalid URL", "INVALID_INPUT");
      }

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new AppError(
          "URL must use http or https",
          "INVALID_INPUT",
        );
      }
      return prisma.bookmark.create({
        data: {
          title: args.title.trim(),
          url: args.url,
          tags: args.tags ?? [],
          folderId: args.folderId,
        },
      });
    },

    updateBookmark: async (
      _parent: unknown,
      args: {
        id: string;
        title?: string;
        url?: string;
        tags?: string[];
      }
    ) => {

      const bookmark = await prisma.bookmark.findUnique({
        where: {
          id: args.id,
        },
      });

      if (!bookmark) {
        throw new AppError("Bookmark not found", "NOT_FOUND");
      }

      if (args.title !== undefined && !args.title.trim()) {
        throw new AppError(
          "Bookmark title cannot be empty",
          "INVALID_INPUT",
        );
      }

      if (args.url !== undefined) {
        let parsedUrl: URL;

        try {
          parsedUrl = new URL(args.url);
        } catch {
          throw new AppError("Invalid URL", "INVALID_INPUT")
        }
        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          throw new AppError(
            "URL must use http or https",
            "INVALID_INPUT",
          );
        }
      }

      return prisma.bookmark.update({
        where: {
          id: args.id,
        },
        data: {
          title: args.title?.trim(),
          url: args.url,
          tags: args.tags,
        },
      });
    },

    deleteBookmark: async (_parent: unknown, args: { id: string }): Promise<boolean> => {
      const bookmark = await prisma.bookmark.findUnique({
        where: {
          id: args.id,
        }
      });

      if (!bookmark) { throw new AppError("Bookmark not found", "NOT_FOUND"); }

      await prisma.bookmark.delete({ where: { id: args.id } })

      return true;
    },

    moveBookmark: async (_parent: unknown, args: {
      id: string;
      folderId: string;//target_folder_id 
    }) => {

      const bookmark = await prisma.bookmark.findUnique({
        where: {
          id: args.id,
        },
      });

      if (!bookmark) {
        throw new AppError("Bookmark not found", "NOT_FOUND");
      }

      const folder = await prisma.bookmark.findUnique({
        where: {
          id: args.folderId,
        },
      });

      if (!folder) {
        throw new AppError("Targeted folder not found", "NOT_FOUND");
      }

      const result = await prisma.bookmark.update({
        where: { id: args.id },
        data: { folderId: args.folderId }
      })
      return result;
    },
  },

  Folder: {
    createdAt: (folder: FolderWithBookmarks): string =>
      folder.createdAt.toISOString(),
  },

  Bookmark: {
    createdAt: (bookmark: BookmarkWithDate): string =>
      bookmark.createdAt.toISOString(),
  },
};
