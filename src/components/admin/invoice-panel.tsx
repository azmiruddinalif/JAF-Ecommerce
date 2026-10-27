"use client";

import { useState, useTransition } from "react";
import { FileText, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { regenerateInvoiceAction } from "@/lib/actions/admin-invoice-actions";

export interface InvoicePanelProps {
  orderId: string;
  invoiceNumber: string | null;
  invoicePdfUrl: string | null;
  invoiceEmailSentAt: Date | null;
  invoiceEmailError: string | null;
  hasCustomerEmail: boolean;
  whatsappLink: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function InvoicePanel({
  orderId,
  invoiceNumber,
  invoicePdfUrl,
  invoiceEmailSentAt,
  invoiceEmailError,
  hasCustomerEmail,
  whatsappLink,
}: InvoicePanelProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  function regenerate() {
    setMessage(null);
    startTransition(async () => {
      const result = await regenerateInvoiceAction(orderId);
      setMessage({ text: result.message, success: result.success });
    });
  }

  return (
    <div className="border border-ink-border p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-paper-dim">Invoice</h2>

      {invoiceNumber ? (
        <p className="text-sm">{invoiceNumber}</p>
      ) : (
        <p className="text-sm text-paper-dim">No invoice generated yet.</p>
      )}

      {hasCustomerEmail && (
        <p className="mt-1 text-xs text-paper-dim">
          {invoiceEmailSentAt
            ? `Emailed ${dateTimeFormatter.format(invoiceEmailSentAt)}`
            : invoiceEmailError
              ? `Email failed: ${invoiceEmailError}`
              : "Not emailed yet."}
        </p>
      )}

      {message && (
        <p className={`mt-2 text-xs ${message.success ? "text-gold" : "text-danger"}`}>{message.text}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {invoicePdfUrl && (
          <a
            href={invoicePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-paper hover:text-gold"
          >
            <FileText size={14} /> Download PDF
          </a>
        )}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-paper hover:text-gold"
        >
          <MessageCircle size={14} /> Send via WhatsApp
        </a>
        <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={regenerate}>
          <RefreshCw size={14} className={isPending ? "animate-spin" : undefined} />
          {invoicePdfUrl ? "Regenerate & Resend" : "Generate Invoice"}
        </Button>
      </div>
    </div>
  );
}
