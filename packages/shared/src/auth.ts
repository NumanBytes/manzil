import { z } from "zod"

export const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

/**
 * What the API accepts on POST /api/v1/auth/signup. The confirmation field is a
 * form concern, so it is checked in the browser and dropped before the request.
 */
export const signupPayloadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

/** Body of POST /api/v1/auth/verify-credentials, called by NextAuth's Credentials provider. */
export const verifyCredentialsSchema = credentialsSchema

/** Body of POST /api/v1/auth/oauth-upsert, called by NextAuth's signIn callback. */
export const oauthUpsertSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  image: z.string().url().nullish(),
  provider: z.string().min(1),
  providerAccountId: z.string().min(1),
})

export type SignupInput = z.infer<typeof signupSchema>
export type SignupPayload = z.infer<typeof signupPayloadSchema>
export type VerifyCredentialsInput = z.infer<typeof verifyCredentialsSchema>
export type OAuthUpsertInput = z.infer<typeof oauthUpsertSchema>
