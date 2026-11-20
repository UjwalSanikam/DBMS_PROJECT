export const FORMATION_NAMES = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3", "5-3-2"] as const;
export type FormationName = (typeof FORMATION_NAMES)[number];
export interface PitchSlot { role: string; x: number; y: number }

// Rows run from goalkeeper to attack; coordinates are percentages of the pitch.
const ROWS: Record<FormationName, string[][]> = {
  "4-3-3": [["GK"], ["LB", "CB", "CB", "RB"], ["CM", "CDM", "CM"], ["LW", "ST", "RW"]],
  "4-4-2": [["GK"], ["LB", "CB", "CB", "RB"], ["LM", "CM", "CM", "RM"], ["ST", "ST"]],
  "4-2-3-1": [["GK"], ["LB", "CB", "CB", "RB"], ["CDM", "CDM"], ["LW", "CAM", "RW"], ["ST"]],
  "3-5-2": [["GK"], ["CB", "CB", "CB"], ["LWB", "CM", "CDM", "CM", "RWB"], ["ST", "ST"]],
  "3-4-3": [["GK"], ["CB", "CB", "CB"], ["LM", "CM", "CM", "RM"], ["LW", "ST", "RW"]],
  "5-3-2": [["GK"], ["LWB", "CB", "CB", "CB", "RWB"], ["CM", "CDM", "CM"], ["ST", "ST"]],
};

export const FORMATION_DESCRIPTIONS: Record<FormationName, string> = {
  "4-3-3": "Width in attack with a three-player midfield.",
  "4-4-2": "Two banks of four supporting a strike partnership.",
  "4-2-3-1": "A double pivot behind three creative attackers.",
  "3-5-2": "Control midfield with wing-backs and two forwards.",
  "3-4-3": "Three centre-backs and an expansive front three.",
  "5-3-2": "A deep defensive line with two outlets up front.",
};

export function formationSlots(formation: FormationName): PitchSlot[] {
  const rows = ROWS[formation];
  return rows.flatMap((roles, row) => roles.map((role, column) => ({
    role,
    x: roles.length === 1 ? 50 : 12 + column * 76 / (roles.length - 1),
    y: 88 - row * 74 / (rows.length - 1),
  })));
}

export interface TeamPlayer {
  player_id: number;
  first_name: string;
  last_name: string;
  primary_position: string;
  club_name: string | null;
  photo_url: string | null;
}
export interface SavedTeam {
  team_id: number;
  team_name: string;
  formation: FormationName;
  updated_at: string;
  players: (TeamPlayer & { slot_index: number })[];
}

/** Preserve every selected player, matching identical roles before filling gaps. */
export function changeFormation<T>(players: (T | null)[], previous: FormationName, next: FormationName): (T | null)[] {
  const oldSlots = formationSlots(previous);
  const newSlots = formationSlots(next);
  const result: (T | null)[] = Array(11).fill(null);
  const remaining = players.slice(0, 11).map((player, index) => ({ player, role: oldSlots[index].role })).filter((entry) => entry.player !== null);
  newSlots.forEach((slot, index) => {
    const match = remaining.findIndex((entry) => entry.role === slot.role);
    if (match !== -1) result[index] = remaining.splice(match, 1)[0].player;
  });
  newSlots.forEach((_, index) => {
    if (!result[index] && remaining.length) result[index] = remaining.shift()!.player;
  });
  return [...result, ...players.slice(11, 18)];
}
