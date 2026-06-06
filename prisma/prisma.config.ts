// prisma/prisma.config.ts
import { defineConfig } from "prisma";

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
