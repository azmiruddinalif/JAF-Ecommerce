import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JAF Admin — Store & Inventory Manager",
    short_name: "JAF Admin",
    description:
      "Manage JAF products, jersey stocks, orders, categories, and storefront content from a fast mobile-first app.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0b09",
    theme_color: "#0a0b09",
    categories: ["business", "shopping", "productivity"],
    icons: [
      {
        src: "/logo-mark.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-mark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Orders",
        short_name: "Orders",
        description: "View and manage customer orders",
        url: "/admin/orders",
        icons: [{ src: "/logo-mark.png", sizes: "192x192" }],
      },
      {
        name: "Products",
        short_name: "Products",
        description: "Manage catalog products",
        url: "/admin/products",
        icons: [{ src: "/logo-mark.png", sizes: "192x192" }],
      },
      {
        name: "Manage Stocks",
        short_name: "Stocks",
        description: "Update jersey sizes and stock quantities",
        url: "/admin/stocks",
        icons: [{ src: "/logo-mark.png", sizes: "192x192" }],
      },
      {
        name: "Add New Product",
        short_name: "New Product",
        description: "Create a new product listing",
        url: "/admin/products/new",
        icons: [{ src: "/logo-mark.png", sizes: "192x192" }],
      },
    ],
  };
}

