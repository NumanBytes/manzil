import { prisma, type Path } from "@manzil/db"
import type {
  CreatePathInput,
  ListPathsQuery,
  Paginated,
  UpdatePathInput,
} from "@manzil/shared"
import { NotFoundError } from "../../lib/errors"

/**
 * Cursor pagination over the caller's own paths, newest first. The cursor is
 * the id of the last row returned, so pages stay stable as rows are added.
 */
export async function listPaths(
  userId: string,
  query: ListPathsQuery
): Promise<Paginated<Path>> {
  const { limit, cursor, isPublic } = query

  const items = await prisma.path.findMany({
    where: { userId, ...(isPublic === undefined ? {} : { isPublic }) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    // Fetch one extra row to learn whether another page exists without a
    // second count query.
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items

  return {
    items: page,
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
  }
}

/**
 * Scoping the lookup by userId rather than checking ownership afterwards means
 * another user's path is indistinguishable from one that does not exist.
 */
export async function getPath(userId: string, pathId: string): Promise<Path> {
  const path = await prisma.path.findFirst({ where: { id: pathId, userId } })
  if (!path) throw new NotFoundError("Path")
  return path
}

export async function createPath(userId: string, input: CreatePathInput): Promise<Path> {
  return prisma.path.create({
    data: { ...input, userId },
  })
}

export async function updatePath(
  userId: string,
  pathId: string,
  input: UpdatePathInput
): Promise<Path> {
  // Confirm ownership first; a bare update would happily edit another user's row.
  await getPath(userId, pathId)

  return prisma.path.update({
    where: { id: pathId },
    data: input,
  })
}

export async function deletePath(userId: string, pathId: string): Promise<void> {
  await getPath(userId, pathId)
  await prisma.path.delete({ where: { id: pathId } })
}
