"use server"

import bcrypt from "bcryptjs"
import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { signupSchema, type SignupInput } from "@/lib/validations/auth"

type SignupResult = { success: true } | { success: false; error: string }

const SALT_ROUNDS = 12

export async function signup(input: SignupInput): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { name, email, password } = parsed.data
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

  try {
    await prisma.user.create({
      data: { name, email, password: hashedPassword },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { success: false, error: "An account with this email already exists" }
    }
    throw err
  }

  return { success: true }
}
