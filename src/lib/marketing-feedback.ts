import { toast } from "sonner";

export const marketingSuccessStyle = {
  backgroundColor: "#f0fdf4",
  color: "#166534",
  borderColor: "#86efac",
} as const;

export function showMarketingSuccess() {
  toast.success("Form submitted successfully!", {
    description: "Thank you! Our team will review your details and contact you.",
    position: "top-center",
    duration: 6000,
    closeButton: true,
    style: marketingSuccessStyle,
    classNames: { description: "!text-green-800" },
  });
}
