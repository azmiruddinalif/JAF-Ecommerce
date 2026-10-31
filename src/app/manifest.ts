import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JAF — Jerseys & Fashion",
    short_name: "JAF",
    description:
      "Shop authentic football jerseys, club kits, retro soccer classics, and manage store operations with the fast official JAF app.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0b09",
    theme_color: "#0a0b09",
    categories: ["shopping", "business", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.jpg",
        sizes: "2048x2038",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Shop All Jerseys",
        short_name: "Shop",
        description: "Browse authentic club and national kits",
        url: "/shop",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Admin Dashboard",
        short_name: "Admin",
        description: "Manage orders, catalog, and stocks",
        url: "/admin",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Jersey Stocks",
        short_name: "Stocks",
        description: "Update jersey sizes and stock quantities",
        url: "/admin/stocks",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Customer Orders",
        short_name: "Orders",
        description: "View and process customer orders",
        url: "/admin/orders",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
