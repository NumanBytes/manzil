/** The shape of the current user returned by GET /api/v1/users/me. */
export type CurrentUser = {
  id: string
  name: string
  email: string
  image: string | null
  onboarded: boolean
  currentRole: string | null
  yearsOfExp: number | null
  techStack: string[]
  goal: string | null
  learningStyle: string | null
  dailyHours: number | null
}

/** The minimal user record NextAuth needs back from the API to mint a session. */
export type AuthenticatedUser = {
  id: string
  name: string
  email: string
  image: string | null
  onboarded: boolean
}
