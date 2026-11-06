import type { Metadata } from "next";
import { BrandInquiryManagement } from "@/components/brand-inquiry-management";
export const metadata: Metadata = {
  title: "Brand Campaign Inquiries | AA100XTECH",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <BrandInquiryManagement />;
}
