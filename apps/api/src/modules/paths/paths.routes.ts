import { Router } from "express"
import { type Path } from "@manzil/db"
import {
  createPathSchema,
  listPathsQuerySchema,
  pathIdParamSchema,
  updatePathSchema,
  type ApiSuccess,
  type Paginated,
} from "@manzil/shared"
import { requireAuth } from "../../middleware/require-auth"
import { validateBody } from "../../middleware/validate"
import { currentUser } from "../../lib/request"
import { parseOrThrow } from "../../lib/zod"
import * as pathsService from "./paths.service"

export const pathsRouter = Router()

pathsRouter.use(requireAuth)

pathsRouter.get("/", async (req, res) => {
  const query = parseOrThrow(listPathsQuerySchema, req.query)
  const page = await pathsService.listPaths(currentUser(req).id, query)
  const body: ApiSuccess<Paginated<Path>> = { data: page }
  res.json(body)
})

pathsRouter.post("/", validateBody(createPathSchema), async (req, res) => {
  const path = await pathsService.createPath(currentUser(req).id, req.body)
  const body: ApiSuccess<Path> = { data: path }
  res.status(201).json(body)
})

pathsRouter.get("/:id", async (req, res) => {
  const { id } = parseOrThrow(pathIdParamSchema, req.params)
  const path = await pathsService.getPath(currentUser(req).id, id)
  const body: ApiSuccess<Path> = { data: path }
  res.json(body)
})

pathsRouter.patch("/:id", validateBody(updatePathSchema), async (req, res) => {
  const { id } = parseOrThrow(pathIdParamSchema, req.params)
  const path = await pathsService.updatePath(currentUser(req).id, id, req.body)
  const body: ApiSuccess<Path> = { data: path }
  res.json(body)
})

pathsRouter.delete("/:id", async (req, res) => {
  const { id } = parseOrThrow(pathIdParamSchema, req.params)
  await pathsService.deletePath(currentUser(req).id, id)
  res.status(204).send()
})
