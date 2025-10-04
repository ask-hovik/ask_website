// src/nav.ts
const toggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
const nav = document.querySelector<HTMLElement>("#site-nav");

if (toggle && nav) {
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a"));

  const setOpen = (open: boolean) => {
    nav.dataset.open = String(open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);

    if (open) {
      nav.setAttribute("tabindex", "-1");
      nav.focus({ preventScroll: true });
    } else {
      nav.removeAttribute("tabindex");
      toggle.focus();
    }
  };

  // initialize
  setOpen(false);

  // mark active link
  const here = location.pathname.replace(/index\.html?$/, "");
  for (const a of links) {
    const url = new URL(a.getAttribute("href")!, location.href);
    const path = url.pathname.replace(/index\.html?$/, "");
    if (path === here) a.classList.add("active");
  }

  // toggle on click
  toggle.addEventListener("click", () => {
    const open = nav.dataset.open === "true";
    setOpen(!open);
  });

  // close when a link is clicked
  links.forEach((a) => a.addEventListener("click", () => setOpen(false)));

  // close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.dataset.open === "true") setOpen(false);
  });

  // close if clicking outside header/menu
  document.addEventListener("click", (e) => {
    const open = nav.dataset.open === "true";
    if (!open) return;
    const target = e.target as Node;
    const header = document.querySelector(".site-header");
    if (header && !header.contains(target)) setOpen(false);
  });
}
