"use client";

import RecordForm, { DeleteRecord, type Field, options } from "./record-form";

const positionOptions = options("GK","CB","LB","RB","LWB","RWB","DM","CM","AM","LW","RW","ST");
type Player = {
  player_id: number; first_name: string; last_name: string; date_of_birth: string;
  nationality: string; primary_position: string; secondary_position: string | null;
  preferred_foot: string; height_cm: number | null; club_id: number | null;
};
export type ClubOption = {club_id: number; club_name: string};
const profileFields: Field[] = [
  {name:"first_name",label:"First name",required:true,maxLength:80},
  {name:"last_name",label:"Last name",required:true,maxLength:80},
  {name:"date_of_birth",label:"Date of birth",type:"date",required:true},
  {name:"nationality",label:"Nationality",required:true,maxLength:80},
  {name:"primary_position",label:"Primary position",options:positionOptions,required:true},
  {name:"secondary_position",label:"Secondary position",options:positionOptions},
  {name:"preferred_foot",label:"Preferred foot",options:options("LEFT","RIGHT","BOTH"),value:"RIGHT",required:true},
  {name:"height_cm",label:"Height (cm)",type:"number",min:140,max:220},
];
const date = (name:string,label:string,required=true): Field => ({name,label,type:"date",required});
const money = (name:string,label:string): Field => ({name,label,type:"number",min:0,step:"0.01"});

export function CreatePlayer() {
  return <details className="mt-5 rounded-xl border border-border-soft p-4"><summary className="cursor-pointer font-semibold text-accent">Add player</summary>
    <RecordForm title="New player" endpoint="/api/players" fields={profileFields} redirect description="Create the profile first, then record a transfer to assign a club." />
  </details>;
}

export function AddToShortlist({playerId, onSaved}: {playerId:number; onSaved?:()=>void}) {
  return <RecordForm title="Add to shortlist" endpoint="/api/shortlist" onSaved={onSaved} fields={[
    {name:"player_id",label:"Player ID",type:"number",value:playerId,required:true,min:1,readOnly:true},
    {name:"priority",label:"Priority",options:options("LOW","MEDIUM","HIGH"),value:"MEDIUM",required:true},
    {name:"status",label:"Status",options:options("WATCHING","RECOMMENDED","CONTACT_CLUB","NEGOTIATING","REJECTED","SIGNED"),value:"WATCHING",required:true},
    {name:"reason",label:"Reason",type:"textarea"},
  ]} />;
}

export default function PlayerManagement({player,clubs,isAdmin}: {player:Player;clubs:ClubOption[];isAdmin:boolean}) {
  const root = `/api/players/${player.player_id}`;
  const clubOptions = clubs.map(club => ({value:String(club.club_id),label:club.club_name}));
  const club = (name:string,label:string,required=false,value?:number|null):Field => ({name,label,type:"number",options:clubOptions,required,value});
  return <section className="mt-6 space-y-3" aria-label="Player actions">
    <details className="rounded-xl border border-border-soft p-4"><summary className="cursor-pointer font-semibold text-accent">Add to shortlist</summary><AddToShortlist playerId={player.player_id}/></details>
    {isAdmin && <>
      <details className="rounded-xl border border-border-soft p-4"><summary className="cursor-pointer font-semibold">Edit or delete player</summary>
        <RecordForm key={JSON.stringify(player)} title="Edit player" endpoint={root} method="PATCH" fields={profileFields.map(field=>({...field,value:player[field.name as keyof Player]}))}/>
        <DeleteRecord endpoint={root} label="Delete player" redirect="/players" warning="Permanently delete this player and all linked statistics, injuries, contracts, transfers, valuations, reports, and shortlist entries?"/>
      </details>
      <details className="rounded-xl border border-border-soft p-4"><summary className="cursor-pointer font-semibold">Record injury</summary><RecordForm title="New injury" endpoint={`${root}/injuries`} fields={[
        {name:"injury_type",label:"Injury type",required:true},{name:"body_area",label:"Body area",required:true,maxLength:80},date("injury_date","Injury date"),date("expected_return_date","Expected return",false),date("actual_return_date","Actual return",false),
        {name:"severity",label:"Severity",options:options("MINOR","MODERATE","MAJOR"),required:true},
        {name:"status",label:"Status",options:options("ACTIVE","RECOVERING","RECOVERED"),value:"ACTIVE",required:true},{name:"notes",label:"Notes",type:"textarea"},
      ]}/></details>
      <details className="rounded-xl border border-border-soft p-4"><summary className="cursor-pointer font-semibold">Add contract</summary><RecordForm title="New contract" endpoint={`${root}/contracts`} description="An active contract replaces the previous active contract. Club membership changes are recorded through transfers." fields={[
        club("club_id","Club",true,player.club_id),date("start_date","Start date"),date("end_date","End date"),money("weekly_salary","Weekly salary (EUR)"),money("release_clause","Release clause (EUR)"),
      ]}/></details>
      <details className="rounded-xl border border-border-soft p-4"><summary className="cursor-pointer font-semibold">Record transfer</summary><RecordForm title="New transfer" endpoint={`${root}/transfers`} description="Saving a transfer also updates the player's current club membership." fields={[
        club("from_club_id","From club",false,player.club_id),club("to_club_id","To club",true),date("transfer_date","Transfer date"),money("transfer_fee","Transfer fee (EUR)"),
        {name:"transfer_type",label:"Transfer type",options:options("PERMANENT","LOAN","FREE","LOAN_RETURN","ACADEMY_PROMOTION"),required:true},{name:"notes",label:"Notes",type:"textarea"},
      ]}/></details>
      <details className="rounded-xl border border-border-soft p-4"><summary className="cursor-pointer font-semibold">Add or update valuation</summary><RecordForm title="Market valuation" endpoint={`${root}/valuations`} description="A valuation on an existing date updates that date's value." fields={[
        date("valuation_date","Valuation date"),{...money("market_value","Market value (EUR)"),required:true},{name:"source_label",label:"Source",maxLength:120},
      ]}/></details>
    </>}
  </section>;
}
