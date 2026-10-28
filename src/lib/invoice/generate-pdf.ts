import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
// pdf-lib's standard fonts only support WinAnsi encoding, which can't render
// the Bengali Taka glyph (৳) that lib/money's formatCents produces — drawing
// it would throw. formatCentsBDT spells out "BDT" instead.
import { formatCentsBDT as formatCents } from "@/lib/money";
import { STORE_CONTACT } from "@/lib/constants";

export interface InvoiceOrder {
  orderNumber: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  city: string;
  area: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  createdAt: Date;
  items: {
    productName: string;
    size: string;
    sku: string;
    quantity: number;
    unitPriceCents: number;
    subtotalCents: number;
  }[];
}

const PAGE_WIDTH = 595.28; // A4 portrait, points
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const INK = rgb(0.04, 0.043, 0.035);
const DIM = rgb(0.4, 0.42, 0.38);
const GOLD = rgb(0.09, 0.64, 0.29);
const LINE = rgb(0.85, 0.85, 0.83);

const dateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

// pdf-lib's standard fonts can only encode WinAnsi (roughly Latin-1). Customer
// name/address/email are free text and may contain other scripts (Bengali is
// common for this store's customers) — encoding those would throw and fail
// the whole checkout. Replace anything outside the safe range rather than
// crash; the full original text is still stored on the order and shown
// correctly everywhere else (admin, email).
function safe(value: string): string {
  return Array.from(value)
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code <= 0xff ? ch : "?";
    })
    .join("");
}

function wrapText(value: string, f: PDFFont, size: number, maxWidth: number): string[] {
  const words = safe(value).split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && f.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateInvoicePdf(order: InvoiceOrder): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function newPageIfNeeded(minY: number) {
    if (y < minY) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function text(
    value: string,
    x: number,
    options: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {}
  ) {
    page.drawText(safe(value), {
      x,
      y,
      size: options.size ?? 10,
      font: options.font ?? font,
      color: options.color ?? INK,
    });
  }

  function hr(target: PDFPage, atY: number) {
    target.drawLine({
      start: { x: MARGIN, y: atY },
      end: { x: PAGE_WIDTH - MARGIN, y: atY },
      thickness: 0.75,
      color: LINE,
    });
  }

  // Header
  text("JAF", MARGIN, { size: 24, font: bold });
  page.drawText("INVOICE", {
    x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize("INVOICE", 18),
    y,
    size: 18,
    font: bold,
    color: GOLD,
  });
  y -= 18;
  text("We Are The Ion To Fashion", MARGIN, { size: 9, color: DIM });
  y -= 14;

  const sellerWidth = PAGE_WIDTH - MARGIN * 2;
  for (const line of wrapText(STORE_CONTACT.address, font, 7.5, sellerWidth)) {
    text(line, MARGIN, { size: 7.5, color: DIM });
    y -= 10;
  }
  text(
    `${STORE_CONTACT.phones.join(" · ")} · ${STORE_CONTACT.email}`,
    MARGIN,
    { size: 7.5, color: DIM }
  );
  y -= 20;
  hr(page, y);
  y -= 24;

  // Invoice meta (left) + Bill To (right)
  const metaTop = y;
  text("Invoice Number", MARGIN, { size: 8, color: DIM });
  y -= 12;
  text(order.invoiceNumber, MARGIN, { size: 10, font: bold });
  y -= 16;
  text("Order Number", MARGIN, { size: 8, color: DIM });
  y -= 12;
  text(order.orderNumber, MARGIN, { size: 10 });
  y -= 16;
  text("Date", MARGIN, { size: 8, color: DIM });
  y -= 12;
  text(dateFormatter.format(order.createdAt), MARGIN, { size: 10 });

  const billX = PAGE_WIDTH / 2 + 20;
  let billY = metaTop;
  function billText(value: string, size = 10, f: PDFFont = font, color = INK) {
    page.drawText(safe(value), { x: billX, y: billY, size, font: f, color });
    billY -= size + 4;
  }
  billText("Bill To", 8, bold, DIM);
  billText(order.customerName, 10, bold);
  billText(order.customerPhone, 10);
  if (order.customerEmail) billText(order.customerEmail, 10);
  billText(order.address, 10);
  billText(`${order.area}, ${order.city}`, 10);

  y = Math.min(y, billY) - 20;
  hr(page, y);
  y -= 20;

  // Table header
  const col = { item: MARGIN, size: 290, qty: 350, price: 400, subtotal: 480 };
  text("ITEM", col.item, { size: 8, font: bold, color: DIM });
  text("SIZE", col.size, { size: 8, font: bold, color: DIM });
  text("QTY", col.qty, { size: 8, font: bold, color: DIM });
  text("PRICE", col.price, { size: 8, font: bold, color: DIM });
  text("SUBTOTAL", col.subtotal, { size: 8, font: bold, color: DIM });
  y -= 10;
  hr(page, y);
  y -= 18;

  for (const item of order.items) {
    newPageIfNeeded(MARGIN + 160);
    const name = item.productName.length > 34 ? `${item.productName.slice(0, 31)}...` : item.productName;
    text(name, col.item, { size: 10 });
    text(item.size, col.size, { size: 10 });
    text(String(item.quantity), col.qty, { size: 10 });
    text(formatCents(item.unitPriceCents), col.price, { size: 10 });
    text(formatCents(item.subtotalCents), col.subtotal, { size: 10 });
    y -= 20;
  }

  newPageIfNeeded(MARGIN + 160);
  hr(page, y);
  y -= 22;

  function totalsRow(label: string, value: string, f: PDFFont = font, color = INK, size = 10) {
    text(label, col.price, { size, font: f, color });
    text(value, col.subtotal, { size, font: f, color });
    y -= 16;
  }
  totalsRow("Subtotal", formatCents(order.subtotalCents));
  totalsRow("Delivery", order.deliveryFeeCents === 0 ? "Free" : formatCents(order.deliveryFeeCents));
  if (order.discountCents > 0) {
    totalsRow("Discount", `-${formatCents(order.discountCents)}`);
  }
  y -= 4;
  hr(page, y);
  y -= 18;
  totalsRow("Total", formatCents(order.totalCents), bold, GOLD, 12);

  y -= 24;
  hr(page, y);
  y -= 20;
  text("Payment Method: Cash on Delivery", MARGIN, { size: 9, color: DIM });
  y -= 14;
  text("Thank you for shopping with JAF.", MARGIN, { size: 9, color: DIM });

  return pdf.save();
}
