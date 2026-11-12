import { useState, type FormEvent, type ReactNode } from 'react'
import { getErrorMessage, getFieldErrors } from '../../api/client'
import { useFilterOptions } from '../../hooks/useFilterOptions'
import { formatEnum } from '../../lib/format'
import type { Server, ServerInput } from '../../types/server'
import { useToast } from '../ui/Toast'
import {
  emptyValues, toFormValues, toServerInput, validateServerForm,
  type FormErrors, type ServerFormValues,
} from './serverFormModel'

interface Props {
  initial?: Server
  submitLabel: string
  onSubmit: (input: ServerInput) => Promise<void>
  onCancel: () => void
}

interface FieldProps {
  id: keyof ServerFormValues
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: (a11y: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
}

function Field({ id, label, error, required, hint, children }: FieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}{required && <span className="ml-0.5 text-rose-400" aria-hidden="true">*</span>}
      </label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy })}
      {error
        ? <p id={`${id}-error`} className="mt-1 text-xs text-rose-400">{error}</p>
        : hint && <p id={`${id}-hint`} className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <fieldset className="card p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export default function ServerForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const options = useFilterOptions()
  const toast = useToast()
  const [values, setValues] = useState<ServerFormValues>(initial ? toFormValues(initial) : emptyValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const set = (name: keyof ServerFormValues) =>
    (e: { target: { value: string } }) => {
      setValues((v) => ({ ...v, [name]: e.target.value }))
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
    }

  const select = (name: keyof ServerFormValues, choices: string[] | undefined, a11y: object) => (
    <select className="input" value={values[name]} onChange={set(name)} {...a11y}>
      {(choices ?? [values[name]]).map((c) => <option key={c} value={c}>{formatEnum(c)}</option>)}
    </select>
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validateServerForm(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      document.getElementById(Object.keys(found)[0])?.focus()
      return
    }
    setSubmitting(true)
    try {
      await onSubmit(toServerInput(values))
    } catch (err) {
      const fieldErrors = getFieldErrors(err) as FormErrors
      setErrors(fieldErrors)
      toast.error(Object.keys(fieldErrors).length > 0 ? 'Please fix the highlighted fields' : getErrorMessage(err))
      const firstField = Object.keys(fieldErrors)[0]
      if (firstField) document.getElementById(firstField)?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Section title="General information" description="Identity and ownership of the server.">
        <Field id="hostname" label="Hostname" required error={errors.hostname}>
          {(a) => <input {...a} className="input" value={values.hostname} onChange={set('hostname')} placeholder="e.g. jenkins-agent-prod-01" autoComplete="off" />}
        </Field>
        <Field id="ipAddress" label="IP address" error={errors.ipAddress} hint="IPv4 or IPv6">
          {(a) => <input {...a} className="input" value={values.ipAddress} onChange={set('ipAddress')} placeholder="10.0.0.12" autoComplete="off" />}
        </Field>
        <Field id="organization" label="Organization / team" error={errors.organization}>
          {(a) => <input {...a} className="input" value={values.organization} onChange={set('organization')} placeholder="Platform Engineering" />}
        </Field>
        <Field id="purpose" label="Purpose" required error={errors.purpose}>
          {(a) => select('purpose', options?.purposes, a)}
        </Field>
      </Section>

      <Section title="Infrastructure information" description="Where the server runs and what it runs.">
        <Field id="environment" label="Environment" required error={errors.environment}>
          {(a) => select('environment', options?.environments, a)}
        </Field>
        <Field id="location" label="Location" required error={errors.location}>
          {(a) => select('location', options?.locations, a)}
        </Field>
        <Field id="operatingSystem" label="Operating system" required error={errors.operatingSystem}>
          {(a) => select('operatingSystem', options?.operatingSystems, a)}
        </Field>
        <Field id="osVersion" label="OS version" error={errors.osVersion}>
          {(a) => <input {...a} className="input" value={values.osVersion} onChange={set('osVersion')} placeholder="22.04" />}
        </Field>
        <Field id="ecuFamily" label="ECU family" error={errors.ecuFamily} hint="EC2 instance family or VM family">
          {(a) => <input {...a} className="input" value={values.ecuFamily} onChange={set('ecuFamily')} placeholder="m5.xlarge" />}
        </Field>
        <Field id="slavePool" label="Slave pool" error={errors.slavePool} hint="Associated Jenkins agent pool (optional)">
          {(a) => <input {...a} className="input" value={values.slavePool} onChange={set('slavePool')} placeholder="linux-builders" />}
        </Field>
      </Section>

      <Section title="Resources" description="Allocated capacity. Leave blank if unknown.">
        <Field id="cpuCores" label="CPU cores" error={errors.cpuCores}>
          {(a) => <input {...a} className="input" type="number" min={0} step={1} inputMode="numeric" value={values.cpuCores} onChange={set('cpuCores')} />}
        </Field>
        <Field id="memoryGb" label="Memory (GB)" error={errors.memoryGb}>
          {(a) => <input {...a} className="input" type="number" min={0} step={1} inputMode="numeric" value={values.memoryGb} onChange={set('memoryGb')} />}
        </Field>
        <Field id="diskGb" label="Disk (GB)" error={errors.diskGb}>
          {(a) => <input {...a} className="input" type="number" min={0} step={1} inputMode="numeric" value={values.diskGb} onChange={set('diskGb')} />}
        </Field>
      </Section>

      <Section title="Additional information" description="Lifecycle status and free-form notes.">
        <Field id="status" label="Status" required error={errors.status}>
          {(a) => select('status', options?.statuses, a)}
        </Field>
        <div className="sm:col-span-2">
          <Field id="description" label="Description" error={errors.description}>
            {(a) => <textarea {...a} className="input min-h-24" rows={4} value={values.description} onChange={set('description')} />}
          </Field>
        </div>
      </Section>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
