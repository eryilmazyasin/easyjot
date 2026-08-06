import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EasyJot — Zahmetsiz Bütçe Takibi",
    short_name: "EasyJot",
    description: "Tek cümleyle harcamalarını kaydet, bütçeni anında takip et.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1e9",
    theme_color: "#17352c",
    orientation: "portrait",
    icons: [
      {
        src: "/easyjot-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/easyjot-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
