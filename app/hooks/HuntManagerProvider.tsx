import type { ReactNode } from "react"
import { HuntManagerContext, useHuntManagerInternal } from "~/hooks/huntManagerHook"

type Props = {
  slug: string
  children: ReactNode
}

export const HuntManagerProvider = ({ slug, children }: Props) => {
  const value = useHuntManagerInternal(slug)

  return (
    <HuntManagerContext value={value}>
      {children}
    </HuntManagerContext>
  )
}
