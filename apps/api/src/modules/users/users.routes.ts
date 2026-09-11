import { Router } from "express"
import { onboardingSchema, type ApiSuccess, type CurrentUser } from "@manzil/shared"
import { requireAuth } from "../../middleware/require-auth"
import { validateBody } from "../../middleware/validate"
import { currentUser } from "../../lib/request"
import * as usersService from "./users.service"

export const usersRouter = Router()

// Everything below belongs to the signed-in user.
usersRouter.use(requireAuth)

usersRouter.get("/me", async (req, res) => {
  const user = await usersService.getCurrentUser(currentUser(req).id)
  const body: ApiSuccess<CurrentUser> = { data: user }
  res.json(body)
})

usersRouter.patch("/me/onboarding", validateBody(onboardingSchema), async (req, res) => {
  const user = await usersService.completeOnboarding(currentUser(req).id, req.body)
  const body: ApiSuccess<CurrentUser> = { data: user }
  res.json(body)
})
