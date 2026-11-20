import { z } from "zod";

export const positions = ["GK", "CB", "LB", "RB", "LWB", "RWB", "DM", "CM", "AM", "LW", "RW", "ST"] as const;
export const playerInput = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  date_of_birth: z.iso.date().refine(value => value <= new Date().toISOString().slice(0, 10), "Birth date cannot be in the future."),
  nationality: z.string().trim().min(1).max(80),
  primary_position: z.enum(positions),
  secondary_position: z.enum(positions).nullable().default(null),
  preferred_foot: z.enum(["LEFT", "RIGHT", "BOTH"]),
  height_cm: z.number().int().min(140).max(220).nullable().default(null),
});
