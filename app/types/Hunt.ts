export type Role = "admin" | "contributor" | "viewer" | null

export type MatchType = "default" | "exact" | "regex"

export type StepFollowedBy = {
  nextStepId: string
  matchType: MatchType
  matchValue: string | null
  regexPattern: string | null
}

export type StepType =
  | "start"
  | "text"
  | "image"
  | "text-with-image"
  | "qr-code"
  | "wait-input"
  | "multi-directional"
  | "geo"
  | "ar"
  | "final"
  | "go-to-step"

export type GeoType = "boundary" | "point"
export type InputType = "text" | "number" | "color" | "date"
export type StepGame = "collect" | "dig"

export type GeoCoordinate = { lat: number; lng: number }

export type Step = {
  id: string
  name: string
  type: StepType
  description?: string
  content?: string
  imageUrl?: string
  videoUrl?: string
  ValidationButtonText?: string
  code?: string
  inputType?: InputType
  placeholder?: string
  FinalMessage?: string
  FinalImageUrl?: string
  FinalVideoUrl?: string
  FinalButtonText?: string
  geoType?: GeoType
  boundaryCoordinates?: GeoCoordinate[]
  pointCoordinates?: GeoCoordinate
  radius?: number
  stepGame?: StepGame
}

export type HuntStep = {
  id: string
  step: Step
  followedBy: StepFollowedBy[]
}

export type HuntState = {
  createdAt: string
  name: string
  slug: string
  steps: HuntStep[]
}

export type FieldLock = {
  stepId: string
  field: string
  user: { email: string; firstName: string; lastName: string }
}

export type HuntLight = {
  createdAt: string
  coverKey: string | null
  id: string
  name: string
  slug: string
  isCreator: boolean
  isOwner: boolean
  ownerType: "user" | "team"
  teamSlug: string | null
  teamRole: Role
  createdBy: { firstName: string; lastName: string } | null
  maxNodes?: number
}