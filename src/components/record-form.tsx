"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Field = {
  name: string; label: string; type?: string; required?: boolean;
  options?: Array<{value: string; label: string}>; value?: string | number | null;
  min?: number; max?: number; step?: string; maxLength?: number;
  readOnly?: boolean;
};
export const options = (...values: string[]) => values.map(value => ({value, label: value.replaceAll("_", " ")}));
export const buttonClass = "rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:border-accent disabled:opacity-50";

export default function RecordForm({title, endpoint, method = "POST", fields, onSaved, redirect, description}: {
  title: string; endpoint: string; method?: string; fields: Field[];
  onSaved?: () => void; redirect?: boolean; description?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return <form className="mt-4 space-y-4 rounded-xl border border-border-soft bg-surface p-4" onSubmit={async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = Object.fromEntries(fields.map(field => {
      const raw = String(data.get(field.name) ?? "").trim();
      return [field.name, raw === "" ? null : field.type === "number" ? Number(raw) : raw];
    }));
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch(endpoint, {method, headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save changes.");
      setMessage(result.message ?? "Saved successfully.");
      if (method === "POST") form.reset();
      onSaved?.(); router.refresh();
      if (redirect && result.player_id) router.push(`/players/${result.player_id}`);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not reach the server."); }
    finally { setBusy(false); }
  }}>
    <h3 className="font-display font-semibold">{title}</h3>
    {description && <p className="text-xs text-text-muted">{description}</p>}
    <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
      {fields.map(field => <label key={field.name} className="block text-sm">
        <span className="mb-1 block text-text-muted">{field.label}{field.required ? " *" : ""}</span>
        {field.options ? <select name={field.name} required={field.required} defaultValue={field.value ?? ""} className="w-full rounded-lg border border-border bg-pitch-900 p-2">
          <option value="">{field.required ? "Select…" : "None"}</option>
          {field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select> : field.type === "textarea" ? <textarea name={field.name} defaultValue={field.value ?? ""} maxLength={field.maxLength ?? 10000} className="w-full rounded-lg border border-border bg-pitch-900 p-2" /> :
          <input name={field.name} type={field.type ?? "text"} defaultValue={field.value ?? ""} readOnly={field.readOnly} required={field.required} min={field.min} max={field.max} step={field.step} maxLength={field.maxLength ?? 120} className="w-full rounded-lg border border-border bg-pitch-900 p-2" />}
      </label>)}
    </fieldset>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    {message && <p role="status" className="text-sm text-accent">{message}</p>}
    <button disabled={busy} className={buttonClass}>{busy ? "Saving…" : "Save"}</button>
  </form>;
}

export function DeleteRecord({endpoint, label, warning, redirect, onDeleted}: {
  endpoint: string; label: string; warning: string; redirect?: string; onDeleted?: () => void;
}) {
  const router = useRouter();
  const [busy,setBusy] = useState(false);
  const [confirm,setConfirm] = useState(false);
  const [error,setError] = useState("");
  return <div className="mt-3">
    {!confirm ? <button className={`${buttonClass} text-danger`} onClick={() => setConfirm(true)}>{label}</button> : <div className="space-y-2 rounded-lg border border-danger/40 p-3">
      <p className="text-sm">{warning}</p>
      <button disabled={busy} className={`${buttonClass} text-danger`} onClick={async () => {
        setBusy(true); setError("");
        try {
          const response = await fetch(endpoint,{method:"DELETE"}); const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? "Could not delete record.");
          if (result.warning) window.alert(result.warning);
          setConfirm(false); onDeleted?.(); router.refresh(); if (redirect) router.push(redirect);
        } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not reach server."); }
        finally {setBusy(false);}
      }}>{busy ? "Deleting…" : "Confirm delete"}</button>
      <button disabled={busy} className={`${buttonClass} ml-2`} onClick={() => setConfirm(false)}>Cancel</button>
    </div>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
  </div>;
}
