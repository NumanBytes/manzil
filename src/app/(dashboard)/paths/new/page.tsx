import { requireUser } from "@/lib/session"
import { getDraft } from "@/lib/data/journey"
import { NewPathWizard } from "@/components/paths/new-path-wizard"
import { PathDraftView } from "@/components/paths/path-draft-view"
import { pathStats } from "@/lib/pace"
import type { NewPathAnswers } from "@/lib/validations/paths"

export default async function NewPathPage({ searchParams }: { searchParams: Promise<{ draft?: string }> }) {
  const user = await requireUser()
  const { draft: draftId } = await searchParams
  const draft = draftId ? await getDraft(user.id, draftId) : null

  if (draft) {
    const stats = pathStats(draft)
    const weeks = Math.ceil(stats.totalHours / Math.max(0.5, draft.weeklyHours))
    return (
      <PathDraftView
        draft={{
          id: draft.id,
          title: draft.title,
          goal: draft.goal,
          summary: draft.description ?? "",
          weeks,
          hours: Math.round(stats.totalHours),
          stops: [{ label: "Start", state: "here" }, ...draft.milestones.map((m) => ({ label: m.title, state: "ahead" as const })), { label: draft.goal, state: "ahead" }],
          milestones: draft.milestones.map((m) => {
            const h = m.steps.reduce((a, s) => a + (s.estimatedHours ?? 1), 0)
            return {
              title: m.title,
              why: m.description ?? "",
              meta: `${m.steps.length} steps · ${Math.round(h)} h · about ${Math.max(1, Math.round(h / Math.max(0.5, draft.weeklyHours)))} weeks`,
              steps: m.steps.map((s) => ({ kind: s.kind, title: s.title, hours: s.estimatedHours ?? 1 })),
            }
          }),
        }}
        answers={draft.answers as NewPathAnswers}
      />
    )
  }

  return (
    <NewPathWizard
      profile={{
        roleToday: user.currentRole ?? "",
        years: user.yearsOfExp ?? 0,
        confident: user.techStack.join(", "),
        goal: user.goal ?? "",
        dailyHours: user.dailyHours ?? 1,
      }}
    />
  )
}
