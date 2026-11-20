import {z} from "zod";

const date = z.iso.date();
const optionalDate = date.nullable().optional();
const optionalMoney = z.number().min(0).max(999999999999.99).nullable().optional();
const club = z.number().int().positive();
const currency = z.string().regex(/^[A-Z]{3}$/).optional();
const notes = z.string().max(10000).nullable().optional();
export const injuryInput = z.object({
  injury_type:z.string().trim().min(1).max(120),body_area:z.string().trim().min(1).max(80),
  injury_date:date,expected_return_date:optionalDate,actual_return_date:optionalDate,
  severity:z.enum(["MINOR","MODERATE","MAJOR"]),status:z.enum(["ACTIVE","RECOVERING","RECOVERED"]).optional(),notes,
}).refine(p=>(!p.expected_return_date || p.expected_return_date >= p.injury_date) && (!p.actual_return_date || p.actual_return_date >= p.injury_date),"Return dates cannot precede the injury date.");
export const contractInput = z.object({
  club_id:club,start_date:date,end_date:date,weekly_salary:z.number().min(0).max(9999999999.99).nullable().optional(),release_clause:optionalMoney,currency,
  contract_status:z.enum(["ACTIVE","EXPIRED","TERMINATED"]).optional(),
}).refine(p=>p.end_date>p.start_date,"Contract end must be after its start date.");
export const transferInput = z.object({
  from_club_id:club.nullable().optional(),to_club_id:club.nullable().optional(),transfer_date:date,
  transfer_fee:optionalMoney,currency,transfer_type:z.enum(["PERMANENT","LOAN","FREE","LOAN_RETURN","ACADEMY_PROMOTION"]),notes,
}).refine(p=>p.to_club_id == null || p.from_club_id !== p.to_club_id,"From and to clubs must be different.");
export const valuationInput = z.object({valuation_date:date,market_value:z.number().min(0).max(999999999999.99),currency,source_label:z.string().max(120).nullable().optional()});
export const shortlistInput = z.object({
  player_id:club,priority:z.enum(["LOW","MEDIUM","HIGH"]).optional(),
  status:z.enum(["WATCHING","RECOMMENDED","CONTACT_CLUB","NEGOTIATING","REJECTED","SIGNED"]).optional(),reason:notes,
});
