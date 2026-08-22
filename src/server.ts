import { createSchema, createYoga } from "graphql-yoga";
import { readFile } from "node:fs/promises";
import { resolvers } from "./graphql/resolvers";

const typeDefs = await readFile(
  new URL("./graphql/schema.graphql", import.meta.url),
  "utf8",
);

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({
  schema,
});

const server = Bun.serve({
  port: 4000,
  fetch: yoga,
});

console.log(`GraphQL server running at http://localhost:${server.port}/graphql`);