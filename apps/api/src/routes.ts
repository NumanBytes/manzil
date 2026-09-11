import { Router } from "express"
import { authRouter } from "./modules/auth/auth.routes"
import { usersRouter } from "./modules/users/users.routes"
import { pathsRouter } from "./modules/paths/paths.routes"

/**
 * Everything is mounted under /api/v1 so a future breaking change can ship
 * alongside the current API rather than replacing it.
 */
export const apiRouter = Router()

apiRouter.use("/auth", authRouter)
apiRouter.use("/users", usersRouter)
apiRouter.use("/paths", pathsRouter)

// Remaining domains from the schema — projects, coding logs, notes, weekly
// reports and the AI/RAG endpoints — follow the same module shape as `paths`.
