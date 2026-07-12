import { api } from "../api";
import type { ApiResponse, ApiErrorResponse } from "../types/api.types";
import type {
  ContactFormValues,
  SubmitContactData,
} from "../types/contact.types";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

const BASE = "/api/contact";
const COMPANY_ID = import.meta.env.VITE_CONTACT_COMPANY_ID;

// ────────────────────────────── RAW API FUNCTIONS ──────────────────────────────

// POST /api/contact/:companyId — public, no auth, CORS-open.
// Service returns ApiResponse(201, "Message received", { id }).
// Errors: 400 ValidationError (+fields[]), 403 company inactive,
// 404 company not found, 429 >5 submissions/15min/IP, 500 generic.
export const submitContactFn = (
  payload: ContactFormValues,
): Promise<ApiResponse<SubmitContactData>> =>
  api.post<ApiResponse<SubmitContactData>>(`${BASE}/${COMPANY_ID}`, payload);

// ────────────────────────────── REACT QUERY: Query Keys ──────────────────────────────

export const contactKeys = {
  all: ["contact"] as const,
} as const;

// ────────────────────────────── Error helper ──────────────────────────────

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.message || error.message;
  }
  return "An unexpected error occurred";
};

// ────────────────────────────── REACT QUERY: Mutations ──────────────────────────────

export const useSubmitContact = () =>
  useMutation<
    ApiResponse<SubmitContactData>,
    AxiosError<ApiErrorResponse>,
    ContactFormValues
  >({
    mutationFn: (payload) => submitContactFn(payload),
    onError: (error) => {
      // 400 with a fields[] array is mapped to inputs by the form itself —
      // the fields array is the source of truth, so no toast here.
      const data = error.response?.data;
      if (error.response?.status === 400 && data?.fields?.length) return;
      // 403 / 404 / 429 / 500 → render the backend message as-is.
      toast.error(getErrorMessage(error));
    },
  });
