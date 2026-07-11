import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

loadEnv({ path: path.resolve(__dirname, '.env.local') })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Migrate 需要非 pooled 的直連連線
  datasource: {
    url: env('DIRECT_URL'),
  },
})
