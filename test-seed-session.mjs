import { seedStep14TestSession } from './src/__tests__/e2e/helpers/seed-step14-session.ts'

async function main() {
  const seed = await seedStep14TestSession({
    additionalLanguages: ['de', 'fr']
  })

  console.log(JSON.stringify(seed, null, 2))
}

main().catch(console.error)
