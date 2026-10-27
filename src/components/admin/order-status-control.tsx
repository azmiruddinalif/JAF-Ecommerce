"use client";

import { useTransition } from "react";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [isPending, startTransition] = useTransition();

  return (
    <div className={`flex flex-wrap gap-4 ${isPending ? "opacity-70" : ""}`}>
      <div>
        <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper-dim">Order Status</label>
        <Select
          defaultValue={status}
          onValueChange={(value) => {
            const nextStatus = value as OrderStatus;
            startTransition(() => {
              void updateOrderStatusAction(orderId, nextStatus);
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
        <label className="mb-1 block text-[11px] uppercase tracking-wider text-paper-dim">Payment Status</label>
        <Select
          defaultValue={paymentStatus}
          onValueChange={(value) => {
            const nextStatus = value as PaymentStatus;
            startTransition(() => {
              void updatePaymentStatusAction(orderId, nextStatus);
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
  );
}
