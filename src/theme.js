// src/theme.js
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const stored = localStorage.getItem("theme"); // "dark" | "light" | null

document.documentElement.classList.toggle(
  "dark",
  stored === "dark" || (!stored && prefersDark)
);

export function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}
