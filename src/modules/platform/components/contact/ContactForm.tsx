import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { useSubmitContact } from "@/lib/network/api/contact.api";
import type { ContactFormValues } from "@/lib/network/types/contact.types";
import { CONTACT_SUBJECTS } from "@/data/contact-data";
import { cn } from "@/lib/utils";

// Client-side mirror of the backend Joi rules — the 400 `fields` array
// from the server remains the source of truth and is mapped onto inputs.
const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be at most 200 characters"),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .max(50, "Phone number must be at most 50 characters")
    .optional()
    .or(z.literal("")),
  subject: z.string().max(300),
  message: z
    .string()
    .trim()
    .min(1, "Please tell us what you need")
    .max(5000, "Message must be at most 5000 characters"),
});

type ContactFormSchema = z.infer<typeof contactSchema>;

const FORM_FIELDS = ["name", "email", "message", "phone", "subject"] as const;

// text-base (16px) on mobile — anything smaller makes iOS Safari zoom in on focus
const inputClasses =
  "w-full box-border rounded-[10px] border border-input-line bg-white px-4 py-3.5 text-base font-medium text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:text-[15px]";

const labelClasses = "text-[13px] font-extrabold text-ink";

const errorClasses = "text-[12px] font-semibold text-red-600";

const ContactForm = () => {
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const submitContact = useSubmitContact();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ContactFormSchema>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: CONTACT_SUBJECTS[0],
      message: "",
    },
  });

  const onSubmit = (values: ContactFormSchema) => {
    const payload: ContactFormValues = {
      name: values.name,
      email: values.email,
      message: values.message,
      subject: values.subject,
      // extra context rides in metadata — extra top-level fields are rejected
      metadata: { source: "contact-page" },
    };
    if (values.phone) payload.phone = values.phone;

    submitContact.mutate(payload, {
      onSuccess: () => {
        setSent(true);
        reset();
      },
      onError: (error) => {
        const res = error.response;
        if (res?.status === 429) {
          // >5 submissions / 15 min / IP — pause the button for a while
          setCooldown(true);
          window.setTimeout(() => setCooldown(false), 30_000);
          return;
        }
        if (res?.status === 400 && res.data?.fields?.length) {
          for (const field of res.data.fields) {
            const path = String(field.path);
            if ((FORM_FIELDS as readonly string[]).includes(path)) {
              setError(path as keyof ContactFormSchema, {
                type: "server",
                message: field.message,
              });
            } else {
              setError("root", { type: "server", message: field.message });
            }
          }
        }
      },
    });
  };

  const isPending = submitContact.isPending;
  const showSent = sent && !isDirty;

  return (
    <div
      className="flex flex-col gap-[18px] rounded-[20px] border border-line bg-white p-5 shadow-[0_12px_30px_rgba(13,31,21,0.07)] sm:p-9"
      data-aos="fade-up"
    >
      <div>
        <SectionEyebrow>SEND A MESSAGE</SectionEyebrow>
        <h2 className="mb-0 mt-1.5 text-[24px] font-extrabold tracking-[-0.5px] text-ink sm:text-[28px]">
          Tell us what you need
        </h2>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="contact-name" className={labelClasses}>
              Full name
            </label>
            <input
              id="contact-name"
              type="text"
              placeholder="Adaeze Okafor"
              className={inputClasses}
              {...register("name")}
            />
            {errors.name && (
              <span className={errorClasses}>{errors.name.message}</span>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="contact-email" className={labelClasses}>
              Email address
            </label>
            <input
              id="contact-email"
              type="email"
              placeholder="you@example.com"
              className={inputClasses}
              {...register("email")}
            />
            {errors.email && (
              <span className={errorClasses}>{errors.email.message}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="contact-phone" className={labelClasses}>
              Phone number
            </label>
            <input
              id="contact-phone"
              type="tel"
              placeholder="+234 ..."
              className={inputClasses}
              {...register("phone")}
            />
            {errors.phone && (
              <span className={errorClasses}>{errors.phone.message}</span>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="contact-subject" className={labelClasses}>
              What is this about?
            </label>
            <select
              id="contact-subject"
              className={inputClasses}
              {...register("subject")}
            >
              {CONTACT_SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            {errors.subject && (
              <span className={errorClasses}>{errors.subject.message}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-message" className={labelClasses}>
            Message
          </label>
          <textarea
            id="contact-message"
            rows={5}
            placeholder="Tell us what you need"
            className={cn(inputClasses, "resize-y")}
            {...register("message")}
          />
          {errors.message && (
            <span className={errorClasses}>{errors.message.message}</span>
          )}
        </div>

        {errors.root && (
          <span className={errorClasses}>{errors.root.message}</span>
        )}

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isPending || cooldown}
            className={cn(
              "cta-gradient cursor-pointer rounded-[10px] border-none px-8 py-4 text-[15px] font-extrabold text-forest-deep transition-transform",
              isPending || cooldown
                ? "cursor-not-allowed opacity-60"
                : "hover:scale-[1.02]",
            )}
          >
            {isPending
              ? "Sending…"
              : showSent
                ? "Message sent ✓ We will reply soon"
                : "Send message →"}
          </button>
          <span className="text-[12px] font-medium text-fog">
            We reply within one business day. No spam, ever.
          </span>
        </div>

        {showSent && (
          <p className="m-0 text-[13px] font-semibold text-brand-600">
            Thanks — we've received your message.
          </p>
        )}
        {cooldown && (
          <p className="m-0 text-[13px] font-semibold text-solar-700">
            Too many messages — please wait a moment before sending another.
          </p>
        )}
      </form>
    </div>
  );
};

export default ContactForm;
