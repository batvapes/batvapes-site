// prisma/prisma.config.ts

import { defineConfig } from "prisma/config";

export default defineConfig({
  // pad naar je schema (dit is de default, maar we zetten hem expliciet)
  schema: "prisma/schema.prisma",

  // HIER komt de database-URL, zonder 'db:' eronder
  datasource: {
    url: "file:./dev.db", // SQLite bestand in je project-root
  },
});
