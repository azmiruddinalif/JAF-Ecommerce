"use client";

import { useActionState } from "react";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { placeOrderAction, type CheckoutActionResult } from "@/lib/actions/checkout-actions";

const initialState: CheckoutActionResult = { success: false, message: "" };

export function CheckoutForm({ codEnabled }: { codEnabled: boolean }) {
  const [state, formAction, isPending] = useActionState(placeOrderAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.message && !state.success && (
        <p className="border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{state.message}</p>
      )}

      <div>
        <Label htmlFor="customerName">Full Name</Label>
        <Input id="customerName" name="customerName" required autoComplete="name" />
        <FieldError message={state.fieldErrors?.customerName} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="customerPhone">WhatsApp Phone Number</Label>
          <Input id="customerPhone" name="customerPhone" required autoComplete="tel" placeholder="01XXXXXXXXX" />
          <FieldError message={state.fieldErrors?.customerPhone} />
        </div>
        <div>
          <Label htmlFor="customerEmail">Email (optional)</Label>
          <Input id="customerEmail" name="customerEmail" type="email" autoComplete="email" />
          <FieldError message={state.fieldErrors?.customerEmail} />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" rows={3} required autoComplete="street-address" />
        <FieldError message={state.fieldErrors?.address} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" required autoComplete="address-level2" />
          <FieldError message={state.fieldErrors?.city} />
        </div>
        <div>
          <Label htmlFor="area">Area</Label>
          <Input id="area" name="area" required />
          <FieldError message={state.fieldErrors?.area} />
        </div>
      </div>

      <div>
        <Label htmlFor="deliveryInstructions">Delivery Instructions (optional)</Label>
        <Textarea id="deliveryInstructions" name="deliveryInstructions" rows={2} />
      </div>

      <div>
        <Label>Payment Method</Label>
        <div className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
          <label className="flex items-center gap-3">
            <input type="radio" name="paymentMethod" value="COD" defaultChecked disabled={!codEnabled} />
            Cash on Delivery
          </label>
        </div>
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={isPending} className="mt-2">
        {isPending ? "PLACING ORDER..." : "PLACE ORDER"}
      </Button>
    </form>
  );
}
