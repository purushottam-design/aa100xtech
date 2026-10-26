import type { Metadata } from "next";
import { InfluencerManagement } from "@/components/influencer-management";
export const metadata: Metadata = {
  title: "Influencer Management | AA100X TECH",
  robots: { index: false, follow: false },
};
export default function InfluencerAdminPage() {
  return <InfluencerManagement />;
}
