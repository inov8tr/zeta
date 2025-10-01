"use client";

import { useTransition, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookConsultation } from "@/app/(server)/consultation-actions";
import { Button } from "@/components/ui/Button";

const Schema = z.object({
  full_name: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Enter a valid email."),
  phone: z.string().optional(),
  preferred_start: z.string().min(1, "Pick a date/time."),
  duration_minutes: z.coerce.number().int().min(15).max(180).default(30),
  timezone: z.string().default("Asia/Seoul"),
  notes: z.string().max(2000).optional(),
});
type FormValues = z.infer<typeof Schema>;

interface Props {
  dictionary?: {
    form?: {
      fullName?: string;
      email?: string;
      phone?: string;
      duration?: string;
      start?: string;
      timezone?: string;
      notes?: string;
      submit?: string;
      submitting?: string;
      success?: string;
      error?: string;
      optional?: string;
    };
  };
}

const ConsultationServerForm = ({ dictionary }: Props) => {
  const [pending, startTransition] = useTransition();
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema) as Resolver<FormValues>,
    defaultValues: { timezone: "Asia/Seoul", duration_minutes: 30 },
  });

  const onSubmit = (values: FormValues) => {
    setOk(null);
    setErr(null);
    startTransition(async () => {
      const res = await bookConsultation(values);
      if (res?.error) {
        setErr(res.error);
      } else {
        setOk("Thanks! We’ll confirm shortly by email.");
        form.reset({ timezone: "Asia/Seoul", duration_minutes: 30 });
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className="block text-sm font-medium text-neutral-800">{dictionary?.form?.fullName ?? "Full name"}</span>
          <input className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2" {...form.register("full_name")} />
          {form.formState.errors.full_name && (
            <p className="text-sm text-red-600">{form.formState.errors.full_name.message}</p>
          )}
        </label>
        <label>
          <span className="block text-sm font-medium text-neutral-800">{dictionary?.form?.email ?? "Email"}</span>
          <input className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2" type="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
          )}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className="block text-sm font-medium text-neutral-800">{dictionary?.form?.phone ?? "Phone"}</span>
          <input className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2" placeholder={dictionary?.form?.optional ?? "Optional"} {...form.register("phone")} />
        </label>
        <label>
          <span className="block text-sm font-medium text-neutral-800">{dictionary?.form?.duration ?? "Duration (minutes)"}</span>
          <input className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2" type="number" min={15} max={180} {...form.register("duration_minutes", { valueAsNumber: true })} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label>
          <span className="block text-sm font-medium text-neutral-800">{dictionary?.form?.start ?? "Preferred start (local time)"}</span>
          <input className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2" type="datetime-local" {...form.register("preferred_start")} />
          {form.formState.errors.preferred_start && (
            <p className="text-sm text-red-600">{form.formState.errors.preferred_start.message}</p>
          )}
        </label>
        <label>
          <span className="block text-sm font-medium text-neutral-800">{dictionary?.form?.timezone ?? "Timezone"}</span>
          <input className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2" placeholder="Asia/Seoul" {...form.register("timezone")} />
        </label>
      </div>

      <label>
        <span className="block text-sm font-medium text-neutral-800">{dictionary?.form?.notes ?? "Notes"}</span>
        <textarea className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2" rows={4} placeholder="Anything specific you want to cover?" {...form.register("notes")} />
      </label>

      <Button type="submit" disabled={pending}>{pending ? (dictionary?.form?.submitting ?? "Booking…") : (dictionary?.form?.submit ?? "Book consultation")}</Button>
      {ok && <p className="text-green-700">{dictionary?.form?.success ?? ok}</p>}
      {err && <p className="text-red-700">{dictionary?.form?.error ?? err}</p>}
    </form>
  );
};

export default ConsultationServerForm;
