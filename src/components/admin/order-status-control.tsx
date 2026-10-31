"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { updateOrderStatusAction, updatePaymentStatusAction } from "@/lib/actions/admin-order-actions";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export function OrderStatusControl({
  orderId,
  status,
  paymentStatus,
}: {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [restockOnCancel, setRestockOnCancel] = useState(status !== "DELIVERED");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <div className={`flex flex-col gap-3 ${isPending ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper-dim">
            Order Status
          </label>
          <Select
            value={status}
            onValueChange={(value) => {
              const nextStatus = value as OrderStatus;
              setErrorMsg(null);
              startTransition(async () => {
                const res = await updateOrderStatusAction(orderId, nextStatus, {
                  restoreStock: restockOnCancel,
                });
                if (!res.success) {
                  setErrorMsg(res.message);
                } else {
                  router.refresh();
                }
              });
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper-dim">
            Payment Status
          </label>
          <Select
            value={paymentStatus}
            onValueChange={(value) => {
              const nextStatus = value as PaymentStatus;
              setErrorMsg(null);
              startTransition(async () => {
                const res = await updatePaymentStatusAction(orderId, nextStatus);
                if (!res.success) {
                  setErrorMsg(res.message);
                } else {
                  router.refresh();
                }
              });
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {status !== "CANCELLED" && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-paper-dim">
          <Checkbox
            checked={restockOnCancel}
            onCheckedChange={(v) => setRestockOnCancel(Boolean(v))}
          />
          <span>
            If cancelled, restore resellable items to available stock (uncheck for damaged / non-resellable returns)
          </span>
        </label>
      )}

      {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
    </div>
  );
}
