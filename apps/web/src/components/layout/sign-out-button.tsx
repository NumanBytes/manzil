"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

// `signOut` clears the session cookie in the browser, so this has to run on the
// client even though the rest of the dashboard shell is server-rendered.
export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-muted-foreground"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut />
      Sign out
    </Button>
  )
}
