import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import BoltMark from "@/components/shared/BoltMark";
import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { useSubmitConversion } from "@/lib/network/api/conversion.api";
import type { SubmitConversionPayload } from "@/lib/network/types/conversion.types";
import {
  CONVERSION_SECTIONS,
  TOP_LEVEL_FIELD_IDS,
  type ConversionField,
} from "@/data/conversion-data";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "kgr-conversion-draft";

const inputClasses =
  "w-full box-border rounded-[10px] border border-input-line bg-white px-4 py-3 text-base font-medium text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:text-[15px]";

const loadDraft = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
};

const ConversionWizard = () => {
  const [values, setValues] = useState<Record<string, string>>(loadDraft);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const submitConversion = useSubmitConversion();

  // autosave the draft so a 45-field form survives leaving the page
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    } catch {
      // storage full or blocked; the form still works without drafts
    }
  }, [values]);

  const section = CONVERSION_SECTIONS[step];
  const lastStep = CONVERSION_SECTIONS.length - 1;

  const setValue = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => (prev[id] ? { ...prev, [id]: "" } : prev));
  };

  // only the contact essentials are validated; technical fields are optional
  const validateStep = (index: number): boolean => {
    if (index !== 0) return true;
    const next: Record<string, string> = {};
    const name = (values.contactPerson ?? "").trim();
    const email = (values.emailAddress ?? "").trim();
    if (name.length < 2) next.contactPerson = "Please enter your name";
    if (name.length > 200)
      next.contactPerson = "Name must be at most 200 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.emailAddress = "Enter a valid email address";
    if ((values.phoneNumber ?? "").length > 50)
      next.phoneNumber = "Phone number must be at most 50 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goTo = (index: number) => {
    if (index > step && !validateStep(step)) return;
    setStep(Math.max(0, Math.min(lastStep, index)));
    document
      .getElementById("online-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = () => {
    if (!validateStep(0)) {
      setStep(0);
      return;
    }

    // group answered technical fields under their section title, so the
    // console shows the sheet the way it was filled. the four top-level
    // fields (name/email/phone/remarks) travel outside the sections.
    const topLevel = TOP_LEVEL_FIELD_IDS as readonly string[];
    const sections = CONVERSION_SECTIONS.map((s) => ({
      title: s.title,
      fields: s.fields
        .filter((field) => !topLevel.includes(field.id))
        .map((field) => ({
          label: field.label,
          value: (values[field.id] ?? "").trim(),
        }))
        .filter((f) => f.value !== ""),
    })).filter((s) => s.fields.length > 0);

    const payload: SubmitConversionPayload = {
      name: values.contactPerson.trim(),
      email: values.emailAddress.trim(),
      sections,
    };
    if (values.phoneNumber?.trim()) payload.phone = values.phoneNumber.trim();
    if (values.remarks?.trim()) payload.remarks = values.remarks.trim();

    submitConversion.mutate(payload, {
      onSuccess: () => {
        setSent(true);
        setValues({});
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      },
      onError: (error) => {
        const res = error.response;
        if (res?.status === 400 && res.data?.fields?.length) {
          const next: Record<string, string> = {};
          for (const field of res.data.fields) {
            const path = String(field.path);
            if (path === "name") next.contactPerson = field.message;
            if (path === "email") next.emailAddress = field.message;
            if (path === "phone") next.phoneNumber = field.message;
            if (path === "remarks") next.remarks = field.message;
          }
          if (Object.keys(next).length) {
            setErrors(next);
            setStep(next.remarks ? lastStep : 0);
          }
        }
      },
    });
  };

  const renderField = (field: ConversionField) => {
    const value = values[field.id] ?? "";
    const error = errors[field.id];
    const required =
      field.id === "contactPerson" || field.id === "emailAddress";
    return (
      <div
        key={field.id}
        className={cn(
          "flex min-w-0 flex-col gap-1.5",
          field.type === "textarea" && "sm:col-span-2",
        )}
      >
        <label
          htmlFor={`cv-${field.id}`}
          className="text-[13px] font-extrabold text-ink"
        >
          {field.label}
          {required && <span className="text-brand-500"> *</span>}
        </label>
        {field.type === "select" ? (
          <select
            id={`cv-${field.id}`}
            value={value}
            onChange={(e) => setValue(field.id, e.target.value)}
            className={inputClasses}
          >
            <option value="">No preference / not sure</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : field.type === "textarea" ? (
          <textarea
            id={`cv-${field.id}`}
            rows={5}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => setValue(field.id, e.target.value)}
            className={cn(inputClasses, "resize-y")}
          />
        ) : (
          <input
            id={`cv-${field.id}`}
            type={field.id === "emailAddress" ? "email" : "text"}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => setValue(field.id, e.target.value)}
            className={inputClasses}
          />
        )}
        {error && (
          <span className="text-[12px] font-semibold text-red-600">
            {error}
          </span>
        )}
      </div>
    );
  };

  if (sent) {
    return (
      <div
        id="online-form"
        className="flex scroll-mt-24 flex-col items-center gap-5 rounded-[20px] border border-line bg-white p-10 text-center shadow-[0_12px_30px_rgba(13,31,21,0.07)] sm:p-14"
      >
        <span className="cta-gradient flex h-16 w-16 items-center justify-center rounded-2xl">
          <BoltMark fill="#04170C" width={22} height={29} />
        </span>
        <h2 className="m-0 text-[26px] font-extrabold tracking-[-0.5px] text-ink sm:text-[30px]">
          Sheet received. Over to our engineers.
        </h2>
        <p className="m-0 max-w-[480px] text-[15px] font-medium leading-[1.7] text-bark">
          Thanks, we've received your technical information sheet. We reply
          within one business day, and we may ask for photos of the vehicle.
        </p>
        <Link
          to="/technology"
          className="rounded-lg bg-ink px-7 py-3.5 text-[14px] font-extrabold text-white hover:text-white"
        >
          See how conversion works →
        </Link>
      </div>
    );
  }

  return (
    <div
      id="online-form"
      className="scroll-mt-24 rounded-[20px] border border-line bg-white p-5 shadow-[0_12px_30px_rgba(13,31,21,0.07)] sm:p-9"
    >
      {/* stepper */}
      <div className="mb-8 flex items-center">
        {CONVERSION_SECTIONS.map((s, i) => (
          <div
            key={s.title}
            className={cn("flex items-center", i < lastStep && "flex-1")}
          >
            <button
              type="button"
              onClick={() => goTo(i)}
              title={s.title}
              aria-label={`Step ${i + 1}: ${s.title}`}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-full border-2 text-[13px] font-extrabold transition-colors sm:h-10 sm:w-10 sm:text-[14px]",
                i < step
                  ? "cta-gradient border-transparent text-forest-deep"
                  : i === step
                    ? "border-brand-500 bg-white text-brand-600"
                    : "border-line bg-white text-fog",
              )}
            >
              {i < step ? <Check size={16} strokeWidth={3} /> : i + 1}
            </button>
            {i < lastStep && (
              <span
                className={cn(
                  "mx-1.5 h-0.5 flex-1 sm:mx-2",
                  i < step ? "bg-brand-400" : "bg-line",
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mb-6">
        <SectionEyebrow>{`STEP ${step + 1} OF ${lastStep + 1}`}</SectionEyebrow>
        <h2 className="mb-0 mt-1.5 text-[24px] font-extrabold tracking-[-0.5px] text-ink sm:text-[28px]">
          {section.title}
        </h2>
        {section.description && (
          <p className="mb-0 mt-2 text-[14px] font-medium leading-[1.6] text-sage">
            {section.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {section.fields.map(renderField)}
      </div>

      <div className="mt-8 flex flex-col-reverse items-stretch gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[12px] font-medium text-fog">
          Your answers save automatically in this browser.
        </span>
        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="cursor-pointer rounded-[10px] border border-line bg-white px-6 py-3.5 text-[14px] font-extrabold text-ink transition-colors hover:border-brand-500"
            >
              ← Back
            </button>
          )}
          {step < lastStep ? (
            <button
              type="button"
              onClick={() => goTo(step + 1)}
              className="flex-1 cursor-pointer rounded-[10px] border-none bg-ink px-8 py-3.5 text-[14px] font-extrabold text-white transition-transform hover:scale-[1.02] sm:flex-none"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              disabled={submitConversion.isPending}
              onClick={handleSubmit}
              className={cn(
                "cta-gradient flex-1 cursor-pointer rounded-[10px] border-none px-8 py-3.5 text-[14px] font-extrabold text-forest-deep sm:flex-none",
                submitConversion.isPending
                  ? "cursor-not-allowed opacity-60"
                  : "transition-transform hover:scale-[1.02]",
              )}
            >
              {submitConversion.isPending ? "Sending…" : "Submit sheet →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversionWizard;
