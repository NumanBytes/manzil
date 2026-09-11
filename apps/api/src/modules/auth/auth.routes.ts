import { Router } from "express"
import rateLimit from "express-rate-limit"
import {
  oauthUpsertSchema,
  signupPayloadSchema,
  verifyCredentialsSchema,
  type ApiSuccess,
  type AuthenticatedUser,
} from "@manzil/shared"
import { validateBody } from "../../middleware/validate"
import { requireServiceToken } from "../../middleware/require-auth"
import * as authService from "./auth.service"

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  /**
   * Signups reach this API from the web app's server rather than the visitor's
   * browser, so every request shares one source address. Keying on the address
   * would let a single persistent attempt lock out every other user, so the
   * limit is applied per email address being registered.
   *
   * express.json() has already populated req.body by the time this runs.
   */
  keyGenerator: (req) => {
    const email = (req.body as { email?: unknown } | undefined)?.email
    return typeof email === "string" ? email.trim().toLowerCase() : "anonymous"
  },
  // The key is an email, not an IP, so skip the IP-shape validation.
  validate: { keyGeneratorIpFallback: false },
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many signup attempts for this email. Try again later.",
    },
  },
})

export const authRouter = Router()

/** Public: creates a password account. */
authRouter.post(
  "/signup",
  signupLimiter,
  validateBody(signupPayloadSchema),
  async (req, res) => {
    const user = await authService.signup(req.body)
    const body: ApiSuccess<AuthenticatedUser> = { data: user }
    res.status(201).json(body)
  }
)

/**
 * Internal: NextAuth's Credentials provider calls this during sign-in. A 401
 * here means "bad credentials", which the web app turns into a form error.
 */
authRouter.post(
  "/verify-credentials",
  requireServiceToken,
  validateBody(verifyCredentialsSchema),
  async (req, res) => {
    const user = await authService.verifyCredentials(req.body)

    if (!user) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
      })
      return
    }

    const body: ApiSuccess<AuthenticatedUser> = { data: user }
    res.json(body)
  }
)

/** Internal: NextAuth's signIn callback calls this after a successful Google login. */
authRouter.post(
  "/oauth-upsert",
  requireServiceToken,
  validateBody(oauthUpsertSchema),
  async (req, res) => {
    const user = await authService.oauthUpsert(req.body)
    const body: ApiSuccess<AuthenticatedUser> = { data: user }
    res.json(body)
  }
)
