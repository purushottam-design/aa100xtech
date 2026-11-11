"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowUpRight, Plus } from "lucide-react";

export function SocialAdProposalPanel({ children }: { children: ReactNode }) {
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const reveal = () => {
      if (window.location.hash === "#ad-proposal" && panel.current) panel.current.open = true;
    };
    const clicked = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('a[href="#ad-proposal"]') &&
        panel.current
      )
        panel.current.open = true;
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    document.addEventListener("click", clicked);
    return () => {
      window.removeEventListener("hashchange", reveal);
      document.removeEventListener("click", clicked);
    };
  }, []);
  return (
    <details ref={panel} id="ad-proposal" className="ads-proposal-panel ads-container">
      <summary>
        <span className="ads-icon">
          <ArrowUpRight aria-hidden="true" />
        </span>
        <span>
          <strong>Let’s build your next campaign.</strong>
          <span>Share your requirements for a customised advertising proposal.</span>
        </span>
        <Plus className="ads-panel-plus" aria-hidden="true" />
      </summary>
      {children}
    </details>
  );
}
