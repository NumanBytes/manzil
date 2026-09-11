import bcrypt from "bcryptjs"
import { prisma } from "@manzil/db"
import type {
  AuthenticatedUser,
  OAuthUpsertInput,
  SignupPayload,
  VerifyCredentialsInput,
} from "@manzil/shared"
import { ConflictError } from "../../lib/errors"

const SALT_ROUNDS = 12

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  onboarded: true,
} as const

export async function signup(input: SignupPayload): Promise<AuthenticatedUser> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  })
  if (existing) {
    throw new ConflictError("An account with this email already exists")
  }

  const password = await bcrypt.hash(input.password, SALT_ROUNDS)

  return prisma.user.create({
    data: { name: input.name, email: input.email, password },
    select: authUserSelect,
  })
}

/**
 * Returns the user only when the password matches. Null covers both "no such
 * user" and "wrong password" on purpose — distinguishing them would let a
 * caller enumerate registered addresses.
 */
export async function verifyCredentials(
  input: VerifyCredentialsInput
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...authUserSelect, password: true },
  })

  // Accounts created through Google have no password and must not be
  // signed into with the credentials form.
  if (!user?.password) return null

  const matches = await bcrypt.compare(input.password, user.password)
  if (!matches) return null

  const { password: _password, ...safeUser } = user
  return safeUser
}

/**
 * Called when NextAuth completes a Google sign-in. The API owns every write to
 * the users table, so the web app never touches Prisma to link an account.
 */
export async function oauthUpsert(input: OAuthUpsertInput): Promise<AuthenticatedUser> {
  return prisma.user.upsert({
    where: { email: input.email },
    // An existing user may have signed up with a password first; refresh the
    // avatar but never overwrite their chosen name with the provider's.
    update: { image: input.image ?? undefined },
    create: {
      email: input.email,
      name: input.name,
      image: input.image ?? null,
    },
    select: authUserSelect,
  })
}
