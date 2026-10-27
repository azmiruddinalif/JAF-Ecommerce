"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { centsToUnits } from "@/lib/money";
import { updateStoreSettingsAction, type SettingsActionResult } from "@/lib/actions/admin-settings-actions";
import type { StoreSettingsView } from "@/lib/data/settings";

const initialState: SettingsActionResult = { success: false, message: "" };

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-ink-border bg-ink-raised/40 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">{title}</h2>
      {description && <p className="mt-1 text-xs text-paper-dim">{description}</p>}
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function ImageField({
  name,
  label,
  currentUrl,
  compact = false,
}: {
  name: string;
  label: string;
  currentUrl: string | null;
  compact?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className={compact ? "flex flex-col gap-2" : "flex items-center gap-4"}>
        <div
          className={`relative shrink-0 overflow-hidden border border-ink-border bg-ink ${
            compact ? "aspect-3/4 w-full" : "h-20 w-28"
          }`}
        >
          {currentUrl ? (
            <Image src={currentUrl} alt={label} fill sizes="112px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-paper-dim">No image</div>
          )}
        </div>
        <div className="flex w-full flex-col gap-2">
          <input
            id={name}
            name={name}
            type="file"
            accept="image/*"
            className="w-full text-xs text-paper-dim file:mr-2 file:border file:border-ink-border file:bg-ink-raised file:px-2 file:py-1 file:text-xs"
          />
          {currentUrl && (
            <label className="flex items-center gap-2 text-xs text-paper-dim">
              <Checkbox name={`${name}Remove`} />
              Remove this image
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsForm({
  settings,
  products,
}: {
  settings: StoreSettingsView;
  products: { id: string; name: string; sku: string }[];
}) {
  const [state, formAction, isPending] = useActionState(updateStoreSettingsAction, initialState);
  const [slot1, slot2, slot3] = settings.heroShowcaseProductIds;

  return (
    <form action={formAction} className="flex flex-col gap-6" encType="multipart/form-data">
      {state.message && (
        <p
          className={`px-4 py-3 text-sm ${
            state.success
              ? "border border-gold/40 bg-gold/10 text-gold"
              : "border border-danger/40 bg-danger/10 text-danger"
          }`}
        >
          {state.message}
        </p>
      )}

      <SectionCard title="Announcement Bar" description="The thin banner above the navbar.">
        <div>
          <Label htmlFor="announcementText">Text</Label>
          <Input id="announcementText" name="announcementText" defaultValue={settings.announcementText} />
          <FieldError message={state.fieldErrors?.announcementText} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="announcementEnabled" defaultChecked={settings.announcementEnabled} />
          Show announcement bar
        </label>
      </SectionCard>

      <SectionCard title="Hero Section" description="The full-height banner at the top of the homepage.">
        <div>
          <Label htmlFor="heroHeadline">Headline</Label>
          <Input id="heroHeadline" name="heroHeadline" defaultValue={settings.heroHeadline} />
          <FieldError message={state.fieldErrors?.heroHeadline} />
        </div>
        <div>
          <Label htmlFor="heroSubheadline">Subheadline</Label>
          <Textarea id="heroSubheadline" name="heroSubheadline" rows={2} defaultValue={settings.heroSubheadline} />
          <FieldError message={state.fieldErrors?.heroSubheadline} />
        </div>
        <ImageField name="heroImage" label="Background Image" currentUrl={settings.heroImageUrl} />
        <div>
          <Label>Showcase Slider (3 slides)</Label>
          <p className="mb-3 text-xs text-paper-dim">
            Each slide can point at a product (leave &quot;Auto&quot; to fill it with a featured, or
            newest, product) and/or a custom image — set an image to use it instead of that
            product&apos;s own catalog photo for this slide.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { productField: "heroProduct1", imageField: "heroShowcase1Image", productId: slot1, imageUrl: settings.heroShowcaseImageUrls[0] },
              { productField: "heroProduct2", imageField: "heroShowcase2Image", productId: slot2, imageUrl: settings.heroShowcaseImageUrls[1] },
              { productField: "heroProduct3", imageField: "heroShowcase3Image", productId: slot3, imageUrl: settings.heroShowcaseImageUrls[2] },
            ].map((slot, i) => (
              <div key={slot.productField} className="border border-ink-border p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-paper-dim">
                  Slide {i + 1}
                </p>
                <Select name={slot.productField} defaultValue={slot.productId ?? ""} className="mb-3">
                  <option value="">Auto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
                <ImageField
                  name={slot.imageField}
                  label="Custom image (optional)"
                  currentUrl={slot.imageUrl}
                  compact
                />
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Editorial Section"
        description="The large two-column fashion editorial block on the homepage."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="editorialEyebrow">Eyebrow</Label>
            <Input id="editorialEyebrow" name="editorialEyebrow" defaultValue={settings.editorialEyebrow} />
          </div>
          <div>
            <Label htmlFor="editorialCtaLabel">Button Label</Label>
            <Input id="editorialCtaLabel" name="editorialCtaLabel" defaultValue={settings.editorialCtaLabel} />
          </div>
        </div>
        <div>
          <Label htmlFor="editorialHeading">Heading</Label>
          <Input id="editorialHeading" name="editorialHeading" defaultValue={settings.editorialHeading} />
        </div>
        <div>
          <Label htmlFor="editorialBody">Body</Label>
          <Textarea id="editorialBody" name="editorialBody" rows={3} defaultValue={settings.editorialBody} />
        </div>
        <ImageField name="editorialImage" label="Editorial Image" currentUrl={settings.editorialImageUrl} />
      </SectionCard>

      <SectionCard
        title="Brand Statement"
        description="The centered 'WE ARE THE ION TO FASHION' statement section."
      >
        <div>
          <Label htmlFor="brandStatementHeading">Heading</Label>
          <Input
            id="brandStatementHeading"
            name="brandStatementHeading"
            defaultValue={settings.brandStatementHeading}
          />
        </div>
        <div>
          <Label htmlFor="brandStatementBody">Body</Label>
          <Textarea
            id="brandStatementBody"
            name="brandStatementBody"
            rows={3}
            defaultValue={settings.brandStatementBody}
          />
        </div>
      </SectionCard>

      <SectionCard title="Final CTA" description="The closing conversion section before the footer.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="finalCtaHeadingLine1">Heading Line 1</Label>
            <Input id="finalCtaHeadingLine1" name="finalCtaHeadingLine1" defaultValue={settings.finalCtaHeadingLine1} />
          </div>
          <div>
            <Label htmlFor="finalCtaHeadingLine2">Heading Line 2</Label>
            <Input id="finalCtaHeadingLine2" name="finalCtaHeadingLine2" defaultValue={settings.finalCtaHeadingLine2} />
          </div>
        </div>
        <div>
          <Label htmlFor="finalCtaButtonLabel">Button Label</Label>
          <Input id="finalCtaButtonLabel" name="finalCtaButtonLabel" defaultValue={settings.finalCtaButtonLabel} />
        </div>
        <ImageField name="finalCtaImage" label="Background Image (optional)" currentUrl={settings.finalCtaImageUrl} />
      </SectionCard>

      <SectionCard title="Delivery & Payment">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="deliveryFeeCents">Delivery Fee (৳)</Label>
            <Input
              id="deliveryFeeCents"
              name="deliveryFeeCents"
              type="number"
              step="0.01"
              defaultValue={centsToUnits(settings.deliveryFeeCents)}
            />
            <FieldError message={state.fieldErrors?.deliveryFeeCents} />
          </div>
          <div>
            <Label htmlFor="freeDeliveryThresholdCents">Free Delivery Above (৳)</Label>
            <Input
              id="freeDeliveryThresholdCents"
              name="freeDeliveryThresholdCents"
              type="number"
              step="0.01"
              defaultValue={centsToUnits(settings.freeDeliveryThresholdCents)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="codEnabled" defaultChecked={settings.codEnabled} />
          Enable Cash on Delivery
        </label>
      </SectionCard>

      <Button type="submit" variant="primary" size="lg" disabled={isPending} className="self-start">
        {isPending ? "SAVING..." : "SAVE SETTINGS"}
      </Button>
    </form>
  );
}
