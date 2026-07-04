import { defineConfig } from "vitepress";

export default defineConfig({
  title: "promptstash",
  description: "git for prompts — version, diff & share your LLM prompts, locally.",
  lang: "en-US",
  cleanUrls: true,
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "promptstash — git for prompts" }],
    ["meta", { name: "twitter:description", content: "Version, diff & share your LLM prompts, locally." }],
    ["meta", { property: "og:title", content: "promptstash — git for prompts" }],
    ["meta", { property: "og:description", content: "Version, diff & share your LLM prompts, locally." }],
    ["meta", { property: "og:type", content: "website" }],
  ],
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "Home", link: "/" },
      { text: "Docs", link: "/docs" },
      { text: "GitHub", link: "https://github.com/promptstash/promptstash" },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/promptstash/promptstash" }],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 promptstash contributors",
    },
  },
});