import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Prisma, PrismaClient } from "../src/generated/prisma/client"
import { LESSONS, PROBLEMS, TOPICS } from "./seed-data"

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })

async function main() {
  for (const [i, [title, slug, difficulty, pattern]] of PROBLEMS.entries()) {
    const data = { order: i + 1, title, url: `https://leetcode.com/problems/${slug}/`, difficulty, pattern }
    await prisma.problem.upsert({ where: { slug }, create: { slug, ...data }, update: data })
  }

  for (const [i, [slug, track, title, prompt, lessonNumber]] of TOPICS.entries()) {
    const data = { track, title, prompt, lessonNumber: lessonNumber ?? null, order: i + 1 }
    await prisma.topic.upsert({ where: { slug }, create: { slug, ...data }, update: data })
  }

  for (const [i, [module, title]] of LESSONS.entries()) {
    const number = i + 1
    const existing = await prisma.lesson.findUnique({ where: { number } })
    if (!existing) {
      await prisma.lesson.create({ data: { number, module, title } })
    } else if (existing.title !== title || existing.module !== module) {
      // A renamed lesson gets regenerated.
      await prisma.lesson.update({ where: { number }, data: { module, title, content: Prisma.DbNull, generatedAt: null } })
    }
  }

  console.log(`Seeded ${PROBLEMS.length} problems, ${TOPICS.length} topics, ${LESSONS.length} lessons.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
