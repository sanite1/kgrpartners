// Mirrors the backend's public contact endpoint contract
// (CONTACT_FORM_INTEGRATION.md): POST /api/contact/:companyId — no auth.
// Validation rules enforced server-side (Joi) and mirrored client-side (zod):
//   name    required, 2–200 chars
//   email   required, valid email
//   message required, 1–5000 chars
//   phone   optional, max 50 chars
//   subject optional, max 300 chars
//   metadata optional, free-form primitives — extra top-level fields are REJECTED

export interface ContactFormValues {
  name: string;
  email: string;
  message: string;
  phone?: string;
  subject?: string;
  metadata?: Record<string, string | number>;
}

// 201 body: { message: "Message received", data: { id } }
export interface SubmitContactData {
  id: string;
}
