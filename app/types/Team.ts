export type TeamRole = "viewer" | "collaborator" | "admin"

export type TeamMember = {
  email: string
  firstName: string
  lastName: string
  role: TeamRole
}

export type Team = {
  name: string
  slug: string
  owner: {
    email: string
    firstName: string
    lastName: string
  }
  members: TeamMember[]
}

export type TeamLight = {
  name: string
  slug: string
}
