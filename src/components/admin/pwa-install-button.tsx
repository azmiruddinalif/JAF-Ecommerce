"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, Laptop, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    __jafDeferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.__jafDeferredPwaPrompt = e as BeforeInstallPromptEvent;
  });
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== "undefined" ? (window.__jafDeferredPwaPrompt ?? null) : null),
  );
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => reg.update())
        .catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (window.__jafDeferredPwaPrompt) {
      setDeferredPrompt(window.__jafDeferredPwaPrompt);
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__jafDeferredPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    }

    function onAppInstalled() {
      window.__jafDeferredPwaPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowGuideModal(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function triggerInstall() {
    const activePrompt = deferredPrompt ?? window.__jafDeferredPwaPrompt;
    if (activePrompt) {
      await activePrompt.prompt();
      const choice = await activePrompt.userChoice;
      if (choice.outcome === "accepted") {
        window.__jafDeferredPwaPrompt = null;
        setDeferredPrompt(null);
      }
      return;
    }
    setShowGuideModal(true);
  }

  return {
    isStandalone,
    hasNativePrompt: Boolean(deferredPrompt),
    showGuideModal,
    setShowGuideModal,
    triggerInstall,
  };
}

export function PwaInstallGuideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 backdrop-blur-xs sm:items-center">
      <div className="w-full max-w-md border border-ink-border bg-ink-raised p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between border-b border-ink-border pb-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192.png"
              alt="JAF App Logo"
              className="size-9 rounded-sm border border-gold-bright/40 bg-ink object-cover shadow-[0_0_12px_rgba(74,222,128,0.2)]"
            />
            <div>
              <h3 className="font-display text-lg leading-none text-paper">
                DOWNLOAD JAF APP
              </h3>
              <p className="mt-0.5 text-[11px] text-paper-dim">
                Install as a standalone app on Phone or Desktop
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-paper-dim hover:text-paper"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Android / Desktop Chrome & Edge */}
          <div className="border border-ink-border bg-ink p-3.5">
            <div className="mb-2 flex items-center gap-2 font-semibold uppercase tracking-wider text-gold-bright">
              <Laptop size={14} />
              <span>Desktop (Chrome / Edge) &amp; Android</span>
            </div>
            <ol className="space-y-1.5 text-paper-dim">
              <li>
                1. Click the <strong className="text-paper">Install icon</strong> in the right side
                of your browser address bar (or open the <strong className="text-paper">⋮</strong>{" "}
                browser menu).
              </li>
              <li>
                2. Select <strong className="text-paper">&ldquo;Install JAF&rdquo;</strong> or{" "}
                <strong className="text-paper">&ldquo;Install App&rdquo;</strong>.
              </li>
            </ol>
          </div>

          {/* iOS Safari */}
          <div className="border border-ink-border bg-ink p-3.5">
            <div className="mb-2 flex items-center gap-2 font-semibold uppercase tracking-wider text-gold-bright">
              <Smartphone size={14} />
              <span>iPhone &amp; iPad (Safari)</span>
            </div>
            <ol className="space-y-1.5 text-paper-dim">
              <li>
                1. Tap the <strong className="text-paper">Share</strong> button at the bottom of
                Safari.
              </li>
              <li>
                2. Scroll down and tap{" "}
                <strong className="text-paper">&ldquo;Add to Home Screen&rdquo;</strong>, then tap{" "}
                <strong className="text-paper">Add</strong>.
              </li>
            </ol>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onClose}
          className="mt-4 w-full py-2.5"
        >
          Got It
        </Button>
      </div>
    </div>
  );
}

export function PwaInstallButton({
  className,
  label = "Download App",
  variant = "outline",
}: {
  className?: string;
  label?: string;
  variant?: "primary" | "secondary" | "outline";
}) {
  const { isStandalone, showGuideModal, setShowGuideModal, triggerInstall } = usePwaInstall();

  if (isStandalone) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-400",
          className,
        )}
      >
        <CheckCircle2 size={14} />
        <span>App Installed</span>
      </span>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size="sm"
        onClick={triggerInstall}
        className={cn("gap-2", className)}
      >
        <Download size={14} />
        <span>{label}</span>
      </Button>
      <PwaInstallGuideModal open={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </>
  );
}

