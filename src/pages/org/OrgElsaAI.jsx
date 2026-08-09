import ElsaAI from '../user/ElsaAI'

// Organization view of ELSA AI reuses the same module set as the End-User app
// (spec: "Organization adds load grid + feeders" on top of the base zones).
export default function OrgElsaAI() {
  return <ElsaAI variant="org" />
}
