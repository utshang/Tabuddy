import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tabuddy — Plan the trip, split the tab.",
    short_name: "Tabuddy",
    description: "Collaborative trip planning with built-in expense splitting.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#349ce1",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
    ],
  }
}
