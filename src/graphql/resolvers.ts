import { prisma } from "../db/prisma";

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
  },

  Mutation: {
    createFolder: async (
      _parent: unknown,
      args: { name: string }
    ) => {
      return prisma.folder.create({
        data: {
          name: args.name,
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
      return prisma.bookmark.create({
        data: {
          title: args.title,
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
      return prisma.bookmark.update({
        where: {
          id: args.id,
        },
        data: {
          title: args.title,
          url: args.url,
          tags: args.tags,
        },
      });
    },
    
    deleteBookmark: async (_parent: unknown,args:{id: string}): Promise<boolean>=>{
      const bookmark = await prisma.bookmark.findUnique({where: {
        id: args.id,
      }});

      if(!bookmark){throw new Error("bookmark not found")}

      await prisma.bookmark.delete({where:{id: args.id}})

      return true;
    },

    moveBookmark: async(_parent: unknown, args: {
      id: string;
      folderId: string;//target_folder_id 
    })=>{
      const result = prisma.bookmark.update({
        where: {id: args.id},
        data:{folderId:args.folderId}
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
