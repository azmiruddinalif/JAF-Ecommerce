import "server-only";
import { getStoreSettings } from "@/lib/data/settings";
import { STORE_CONTACT } from "@/lib/constants";

export interface SellerInfo {
  name: string;
  tagline: string;
  address: string;
  phones: string[];
  email: string;
}

export async function getSellerInfo(): Promise<SellerInfo> {
  try {
    const settings = await getStoreSettings();
    const info = settings.footerConfig?.shopInfo;
    const phones: string[] = [];
    if (info?.phone) phones.push(info.phone);
    if (info?.secondaryPhone) phones.push(info.secondaryPhone);

    return {
      name: "JAF",
      tagline: "We Are The Ion To Fashion",
      address: info?.address || STORE_CONTACT.address,
      phones: phones.length > 0 ? phones : [...STORE_CONTACT.phones],
      email: info?.email || STORE_CONTACT.email,
    };
  } catch {
    return {
      name: "JAF",
      tagline: "We Are The Ion To Fashion",
      address: STORE_CONTACT.address,
      phones: [...STORE_CONTACT.phones],
      email: STORE_CONTACT.email,
    };
  }
}

