import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardTitle } from "@/components/shared/primitives"
import { PATH_PROJECTS } from "@/lib/sample-data"
import { cn } from "@/lib/utils"

export function PathProjects() {
  return (
    <Card className="gap-3.5 p-[22px]">
      <CardTitle>Projects on this path</CardTitle>
      {PATH_PROJECTS.map((p, i) => (
        <div key={p.name} className={cn("flex flex-col gap-1", i > 0 && "border-t border-border pt-3.5")}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{p.name}</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[13px] font-semibold",
                p.status === "live" ? "bg-fill text-fill-foreground" : "bg-pin-soft text-pin-ink"
              )}
            >
              {p.status}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">{p.meta}</span>
        </div>
      ))}
      <form className="flex flex-col gap-1.5 border-t border-border pt-3.5">
        <Label htmlFor="log" className="leading-normal">
          What did you ship or decide today?
        </Label>
        <Input id="log" name="log" placeholder="Schema for paths and steps, first migration" className="h-11" />
        <Button type="submit" variant="outline" className="self-start">
          Log it
        </Button>
      </form>
    </Card>
  )
}
