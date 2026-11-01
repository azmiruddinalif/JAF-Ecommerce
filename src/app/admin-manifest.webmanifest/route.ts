// Web app manifest for the admin PWA only. It is linked exclusively from the
// /admin layout, so the storefront is never installable and "Download App"
// installs the admin panel (scoped to /admin) instead of the whole site.
export function GET() {
  const manifest = {
    id: "/admin",
    name: "JAF Admin",
    short_name: "JAF Admin",
    description:
      "Manage JAF orders, catalog, jersey stocks, and store settings.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    orientation: "any",
    background_color: "#0a0b09",
    theme_color: "#0a0b09",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Customer Orders",
        short_name: "Orders",
        description: "View and process customer orders",
        url: "/admin/orders",
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
        name: "Products",
        short_name: "Products",
        description: "Manage the jersey catalog",
        url: "/admin/products",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

