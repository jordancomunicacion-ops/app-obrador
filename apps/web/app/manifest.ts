import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "App Cocina OTEYZERENA",
    short_name: "Cocina",
    description: "Gestión de cocina y checklists operativos",
    start_url: "/dashboard/today",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    orientation: "portrait",
    icons: [
      { src: "/logo-icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logo-icon.png", sizes: "any", type: "image/png", purpose: "maskable" },
    ],
  };
}
