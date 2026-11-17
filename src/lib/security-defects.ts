import { z } from "zod";

export const defectCategories = [
  "Identity Verification",
  "Authentication",
  "Access Control",
  "Account Security",
  "Other Security Issues",
] as const;
export const defectPriorities = ["Low", "Medium", "High", "Critical"] as const;
export const defectStatuses = ["Open", "In Review", "In Progress", "Resolved", "Closed"] as const;
export const defectAttachmentLimit = 5 * 1024 * 1024;
export const defectAttachmentTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

export const defectFieldsSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(120),
    email: z.string().trim().email("Enter a valid email address.").max(254),
    phone: z
      .string()
      .trim()
      .min(6, "Enter a valid phone number.")
      .max(30)
      .refine(
        (value) => /^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 6,
        "Enter a valid phone number.",
      ),
    company: z.string().trim().max(160),
    category: z.enum(defectCategories),
    title: z.string().trim().min(5, "Give the issue a title of at least 5 characters.").max(160),
    description: z
      .string()
      .trim()
      .min(20, "Describe the issue in at least 20 characters.")
      .max(8000),
    priority: z.enum(defectPriorities),
  })
  .strict();
export const defectSubmissionSchema = defectFieldsSchema.extend({ id: z.string().uuid() });
export const defectUpdateSchema = z
  .object({
    id: z.string().uuid(),
    status: z.enum(defectStatuses),
    previousStatus: z.enum(defectStatuses),
  })
  .strict();

export type DefectFields = z.infer<typeof defectFieldsSchema>;
export type DefectStatus = (typeof defectStatuses)[number];
export type SecurityDefectTicket = {
  id: string;
  ticket_number: number;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  category: (typeof defectCategories)[number];
  title: string;
  description: string;
  priority: (typeof defectPriorities)[number];
  status: DefectStatus;
  created_at: string;
  updated_at: string;
  attachment_name: string | null;
};
export type DefectList = {
  rows: SecurityDefectTicket[];
  total: number;
  canReview: boolean;
  canManage: boolean;
};
export const defectTicketCode = (number: number) => `SID-${String(number).padStart(6, "0")}`;

export function defectAttachmentError(file: Pick<File, "name" | "size" | "type">): string | null {
  if (!file.size || file.size > defectAttachmentLimit) return "Choose a file no larger than 5 MB.";
  const extensions: Record<string, RegExp> = {
    "image/png": /\.png$/i,
    "image/jpeg": /\.jpe?g$/i,
    "image/webp": /\.webp$/i,
    "application/pdf": /\.pdf$/i,
  };
  if (!extensions[file.type]?.test(file.name)) return "Use a PNG, JPG, WebP or PDF attachment.";
  return null;
}
