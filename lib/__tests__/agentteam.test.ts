import { describe, expect, it } from "vitest";
import { encodeTeamCode, decodeTeamCode, type AgentTeam } from "../agentteam";

const team: AgentTeam = {
  v: 1,
  id: "t-abc123",
  anchor: "PRSM-AAABBBCCCDDDEEEFFFGGG",
  agents: [
    { id: "a1", role: "engineer", flavor: "architect" },
    { id: "a2", role: "marketer" },
  ],
};

describe("agent team codec", () => {
  it("round-trips a team through encode/decode", () => {
    const code = encodeTeamCode(team);
    expect(code.startsWith("PRSM-TEAM-")).toBe(true);
    const back = decodeTeamCode(code);
    expect(back).not.toBeNull();
    expect(back!.id).toBe("t-abc123");
    expect(back!.anchor).toBe(team.anchor);
    expect(back!.agents.map((a) => a.role)).toEqual(["engineer", "marketer"]);
    expect(back!.agents[0].flavor).toBe("architect");
    expect(back!.agents[1].flavor).toBeUndefined();
  });

  it("returns null on malformed input", () => {
    expect(decodeTeamCode("nonsense")).toBeNull();
    expect(decodeTeamCode("PRSM-TEAM-")).toBeNull();
  });
});
