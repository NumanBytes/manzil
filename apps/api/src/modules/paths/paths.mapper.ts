import type { Path } from "@manzil/db"
import type { LearningStyle, MasteryLevel, PathDto } from "@manzil/shared"

/**
 * Converts a database row into the shape the API promises its clients.
 *
 * Mapping explicitly rather than returning the Prisma row directly buys two
 * things. Dates become ISO strings here instead of silently at `res.json()`
 * time, so the declared response type matches what is actually sent. And the
 * database schema is free to gain columns without leaking them to clients —
 * a new internal field only appears in the API once it is added below.
 *
 * This function is also the drift alarm: if a column is renamed or its type
 * changes, this stops compiling, rather than the mismatch surfacing in the
 * browser.
 */
export function toPathDto(path: Path): PathDto {
  return {
    id: path.id,
    title: path.title,
    description: path.description,
    goal: path.goal,
    masteryLevel: path.masteryLevel as MasteryLevel,
    learningStyle: path.learningStyle as LearningStyle,
    isPublic: path.isPublic,
    isAIGenerated: path.isAIGenerated,
    targetDate: path.targetDate.toISOString(),
    dailyHours: path.dailyHours,
    driftDays: path.driftDays,
    lastActivityAt: path.lastActivityAt?.toISOString() ?? null,
    createdAt: path.createdAt.toISOString(),
    updatedAt: path.updatedAt.toISOString(),
    userId: path.userId,
  }
}
