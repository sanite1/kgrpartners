import { useState } from "react";
import SectionEyebrow from "@/components/shared/SectionEyebrow";
import { useSubmitPartnership } from "@/lib/network/api/partnership.api";
import type {
  PartnershipKind,
  PartnershipField,
} from "@/lib/network/types/partnership.types";
import { cn } from "@/lib/utils";

// text-base (16px) on mobile — anything smaller makes iOS Safari zoom in on focus
const inputClasses =
  "w-full box-border rounded-[10px] border border-input-line bg-white px-4 py-3.5 text-base font-medium text-ink outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:text-[15px]";
const labelClasses = "text-[13px] font-extrabold text-ink";
const errorClasses = "text-[12px] font-semibold text-red-600";

interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  optional?: boolean;
}

// Mirrors the paper "Partner / Investor Information Form", section A and B.
const CORPORATE_FIELDS: FieldDef[] = [
  { key: "cac", label: "CAC Registration Number (RC/BN)" },
  { key: "tin", label: "Tax Identification Number (TIN)" },
  { key: "address", label: "Registered Business Address" },
  { key: "website", label: "Company Website", optional: true },
  { key: "directors", label: "Name(s) of Director(s) / Signatories" },
  { key: "contactPerson", label: "Contact Person (Name & Role)" },
  {
    key: "interest",
    label: "Nature of Interest",
    type: "select",
    options: [
      "Investor",
      "Technical Partner",
      "Fleet Client",
      "Distributor",
      "Other",
    ],
  },
  {
    key: "investment",
    label: "Proposed Investment / Order Size",
    optional: true,
  },
  { key: "timeline", label: "Proposed Timeline", optional: true },
  {
    key: "hearAbout",
    label: "How Did You Hear About Us?",
    type: "select",
    options: ["Referral", "Event", "Online", "Other"],
  },
  {
    key: "references",
    label: "References / Past Partnerships",
    optional: true,
  },
  {
    key: "additional",
    label: "Other / Additional Information",
    type: "textarea",
    optional: true,
  },
];

const INDIVIDUAL_FIELDS: FieldDef[] = [
  {
    key: "idNumber",
    label: "Government-Issued ID Type & Number",
    placeholder: "e.g. NIN, Passport, Driver's License",
  },
  { key: "address", label: "Residential Address" },
  {
    key: "representing",
    label: "Are You Representing an Organization Informally?",
    type: "select",
    options: ["No", "Yes"],
  },
  {
    key: "interest",
    label: "Nature of Interest",
    type: "select",
    options: ["Investor", "Technical Partner", "Fleet Client", "Other"],
  },
  {
    key: "investment",
    label: "Proposed Investment / Order Size",
    optional: true,
  },
  { key: "timeline", label: "Proposed Timeline", optional: true },
  {
    key: "hearAbout",
    label: "How Did You Hear About Us?",
    type: "select",
    options: ["Referral", "Event", "Online", "Other"],
  },
  { key: "references", label: "References", optional: true },
  {
    key: "additional",
    label: "Other / Additional Information",
    type: "textarea",
    optional: true,
  },
];

const PartnershipForm = () => {
  const [kind, setKind] = useState<PartnershipKind>("corporate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [sentId, setSentId] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(false);

  const submitPartnership = useSubmitPartnership();
  const fields = kind === "corporate" ? CORPORATE_FIELDS : INDIVIDUAL_FIELDS;

  const set = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    if (name.trim().length < 2) {
      setError(
        kind === "corporate"
          ? "Enter the registered company / organization name"
          : "Enter your full name",
      );
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    const missing = fields.find(
      (f) => !f.optional && !(values[f.key] ?? "").trim(),
    );
    if (missing) {
      setError(`Please fill in "${missing.label}"`);
      return;
    }
    setError("");

    const sectionFields: PartnershipField[] = fields
      .map((f) => ({ label: f.label, value: (values[f.key] ?? "").trim() }))
      .filter((f) => f.value !== "");

    submitPartnership.mutate(
      {
        kind,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        sections: [
          {
            title:
              kind === "corporate"
                ? "Section A · Corporate Entity"
                : "Section B · Individual",
            fields: sectionFields,
          },
        ],
      },
      {
        onSuccess: (res) => {
          setSentId(res.data?.requestId ?? 0);
        },
        onError: (err) => {
          if (err.response?.status === 429) {
            setCooldown(true);
            window.setTimeout(() => setCooldown(false), 30_000);
          }
        },
      },
    );
  };

  if (sentId !== null) {
    return (
      <section id="partner-form" className="px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-[760px] rounded-[20px] border border-line bg-white p-8 text-center shadow-[0_12px_30px_rgba(13,31,21,0.07)] sm:p-12">
          <h2 className="m-0 text-[26px] font-extrabold tracking-[-0.5px] text-ink">
            Thank you, we have your form.
          </h2>
          <p className="mx-auto mt-3 max-w-[480px] text-[15px] font-medium leading-[1.7] text-bark">
            Your reference is{" "}
            <strong className="text-brand-600">#{sentId}</strong>. We will
            follow up to schedule an introductory call and begin our standard
            verification process.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="partner-form" className="px-5 py-16 sm:px-10">
      <div
        className="mx-auto flex max-w-[860px] flex-col gap-[18px] rounded-[20px] border border-line bg-white p-5 shadow-[0_12px_30px_rgba(13,31,21,0.07)] sm:p-9"
        data-aos="fade-up"
      >
        <div>
          <SectionEyebrow>PARTNER / INVESTOR INFORMATION FORM</SectionEyebrow>
          <h2 className="mb-0 mt-1.5 text-[24px] font-extrabold tracking-[-0.5px] text-ink sm:text-[28px]">
            Start the conversation
          </h2>
          <p className="mb-0 mt-2 text-[14px] font-medium leading-[1.7] text-bark">
            Complete the section that applies to you — corporate or individual.
            This helps us begin verification as quickly as possible.
          </p>
        </div>

        {/* corporate / individual chooser */}
        <div className="flex w-fit gap-1 rounded-xl border border-line bg-haze p-1">
          {(
            [
              ["corporate", "A · Corporate Entity"],
              ["individual", "B · Individual"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setKind(value);
                setValues({});
                setError("");
              }}
              className={cn(
                "cursor-pointer rounded-lg border-none px-4 py-2.5 text-[13.5px] font-extrabold transition-colors",
                kind === value
                  ? "cta-gradient text-forest-deep"
                  : "bg-transparent text-fog hover:text-bark",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="pf-name" className={labelClasses}>
              {kind === "corporate"
                ? "Registered Company / Organization Name"
                : "Full Name"}{" "}
              <span className="text-brand-500">*</span>
            </label>
            <input
              id="pf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="pf-email" className={labelClasses}>
              Email Address <span className="text-brand-500">*</span>
            </label>
            <input
              id="pf-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="pf-phone" className={labelClasses}>
              Phone Number
            </label>
            <input
              id="pf-phone"
              type="tel"
              placeholder="+234 ..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClasses}
            />
          </div>

          {fields.map((f) => (
            <div
              key={f.key}
              className={cn(
                "flex min-w-0 flex-col gap-1.5",
                f.type === "textarea" && "sm:col-span-2",
              )}
            >
              <label htmlFor={`pf-${f.key}`} className={labelClasses}>
                {f.label}{" "}
                {f.optional ? (
                  <span className="font-semibold text-fog">(optional)</span>
                ) : (
                  <span className="text-brand-500">*</span>
                )}
              </label>
              {f.type === "select" ? (
                <select
                  id={`pf-${f.key}`}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  className={inputClasses}
                >
                  <option value="">Select…</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  id={`pf-${f.key}`}
                  rows={3}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  className={cn(inputClasses, "resize-y")}
                />
              ) : (
                <input
                  id={`pf-${f.key}`}
                  type="text"
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  className={inputClasses}
                />
              )}
            </div>
          ))}
        </div>

        {error && <span className={errorClasses}>{error}</span>}
        {cooldown && (
          <p className="m-0 text-[13px] font-semibold text-solar-700">
            Too many submissions. Please wait a moment and try again.
          </p>
        )}

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={submitPartnership.isPending || cooldown}
            onClick={submit}
            className={cn(
              "cta-gradient cursor-pointer rounded-[10px] border-none px-8 py-4 text-[15px] font-extrabold text-forest-deep transition-transform",
              submitPartnership.isPending || cooldown
                ? "cursor-not-allowed opacity-60"
                : "hover:scale-[1.02]",
            )}
          >
            {submitPartnership.isPending ? "Submitting…" : "Submit form →"}
          </button>
          <span className="text-[12px] font-medium text-fog">
            Once received, we will follow up to schedule an introductory call.
          </span>
        </div>
      </div>
    </section>
  );
};

export default PartnershipForm;
