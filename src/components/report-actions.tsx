"use client";

import RecordForm, {DeleteRecord,options} from "./record-form";

type Report = {report_id:number;overall_rating:string;strengths:string|null;weaknesses:string|null;tactical_fit:string|null;notes:string|null;recommendation:string};
export default function ReportActions({report,onSaved,canManage}:{report:Report;onSaved:()=>void;canManage:boolean}) {
  if (!canManage) return null;
  const endpoint = `/api/reports/${report.report_id}`;
  return <div className="mt-3">
    <details><summary className="cursor-pointer text-sm text-accent">Edit report</summary>
      <RecordForm key={JSON.stringify(report)} title="Edit report" endpoint={endpoint} method="PATCH" onSaved={onSaved} description="Shortlist and Priority recommendations add or update the shortlist. Changing or deleting a report keeps existing shortlist entries; remove those separately." fields={[
        {name:"overall_rating",label:"Overall rating (1–10)",type:"number",value:report.overall_rating,min:1,max:10,step:"0.1",required:true},
        {name:"recommendation",label:"Recommendation",options:options("AVOID","MONITOR","SHORTLIST","PRIORITY"),value:report.recommendation,required:true},
        ...(["strengths","weaknesses","tactical_fit","notes"] as const).map(name=>({name,label:name.replaceAll("_"," "),type:"textarea",value:report[name]})),
      ]}/>
    </details>
    <DeleteRecord endpoint={endpoint} label="Delete report" warning="Permanently delete this scout report? Any shortlist entry will be kept." onDeleted={onSaved}/>
  </div>;
}
