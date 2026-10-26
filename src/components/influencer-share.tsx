"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
export function InfluencerShare({ name }: { name: string }) {
  const [status, setStatus] = useState("");
  return (
    <div>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            if (navigator.share)
              await navigator.share({
                title: `${name} | AA100X TECH Influencer Partner`,
                url: window.location.href,
              });
            else {
              await navigator.clipboard.writeText(window.location.href);
              setStatus("Profile link copied");
            }
          } catch (error) {
            if (!(error instanceof DOMException && error.name === "AbortError"))
              setStatus("Copy the profile URL from your address bar to share it.");
          }
        }}
      >
        <Share2 className="size-4" /> Share Profile
      </Button>
      <span role="status" className="mt-2 block text-xs text-muted-foreground">
        {status}
      </span>
    </div>
  );
}
