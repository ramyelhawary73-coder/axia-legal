import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "AXIA Legal — إدارة المكتب القانوني", short_name: "AXIA Legal",
    description: "مساحة عمل مكتبك القانوني. يلزم الاتصال للوصول إلى بيانات المكتب وحفظها.",
    lang: "ar", dir: "rtl", start_url: "/", scope: "/", display: "standalone",
    background_color: "#0B0C10", theme_color: "#0B0C10",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
