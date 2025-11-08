import { z } from 'zod'

const EnvSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'staging', 'production']),
})

const validation = EnvSchema.safeParse(process.env)
if (!validation.success) {
  throw new Error(validation.error.message)
}

const ENV = validation.data

export { ENV }
