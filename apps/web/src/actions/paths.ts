"use server"

import { revalidatePath } from "next/cache"
import { createPathSchema, type CreatePathFormInput, type PathDto } from "@manzil/shared"
import { ApiError, api } from "@/lib/api"

type CreateResult = { success: true; path: PathDto } | { success: false; error: string }
type DeleteResult = { success: true } | { success: false; error: string }

// Takes the form's raw values and validates here, on the server. The browser
// may also validate for a faster error message, but this is the check that
// counts — a Server Action is a public endpoint.
export async function createPath(input: CreatePathFormInput): Promise<CreateResult> {
  const parsed = createPathSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  let path: PathDto
  try {
    path = await api.post<PathDto>("/paths", parsed.data)
  } catch (error) {
    if (error instanceof ApiError) {
      // The API phrases its validation and conflict messages for humans, so
      // prefer a field-level message and fall back to the general one.
      return { success: false, error: error.firstDetail ?? error.message }
    }
    throw error
  }

  // The list is a Server Component reading from the API, so Next has to be told
  // its cached render is stale.
  revalidatePath("/paths")
  return { success: true, path }
}

export async function deletePath(id: string): Promise<DeleteResult> {
  try {
    await api.delete<void>(`/paths/${id}`)
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message }
    }
    throw error
  }

  revalidatePath("/paths")
  return { success: true }
}
