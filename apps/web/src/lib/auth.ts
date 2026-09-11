import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { credentialsSchema, type AuthenticatedUser } from "@manzil/shared"
import { applyUserToToken, authConfig } from "./auth.config"
import { ApiError, internalApiFetch } from "./api"

/**
 * The Node-side auth setup. Unlike auth.config.ts this may reach the network,
 * so it holds the real credential check and the Google account upsert — both of
 * which are HTTP calls to the Express API. The web app never touches the
 * database itself.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        try {
          const user = await internalApiFetch<AuthenticatedUser>(
            "/auth/verify-credentials",
            { method: "POST", body: JSON.stringify(parsed.data) }
          )
          return user
        } catch (error) {
          // A 401 is the API telling us the credentials are wrong, which
          // NextAuth expects as `null`. Anything else is a real fault and
          // should surface rather than look like a bad password.
          if (error instanceof ApiError && error.status === 401) return null
          throw error
        }
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    async jwt(params) {
      const { token, account, profile } = params

      // First hop of a Google sign-in: ask the API to create or find the user,
      // then carry its database id — not Google's — on the session.
      if (account?.provider === "google" && profile?.email) {
        const user = await internalApiFetch<AuthenticatedUser>("/auth/oauth-upsert", {
          method: "POST",
          body: JSON.stringify({
            email: profile.email,
            name: profile.name ?? profile.email,
            image: typeof profile.picture === "string" ? profile.picture : null,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          }),
        })

        token.sub = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image ?? undefined
        token.onboarded = user.onboarded
        return token
      }

      return applyUserToToken(params)
    },
  },
})
