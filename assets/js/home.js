(function () {
  "use strict";

  const root = document.documentElement;
  const header = document.getElementById("home-header");
  const themeToggle = document.getElementById("theme-toggle");
  const appsSection = document.getElementById("apps");
  const appsContainer = document.getElementById("apps-content");
  const loadingMessage = document.getElementById("apps-loading");

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function updateThemeControl(theme) {
    if (!themeToggle) return;
    const isDark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? themeToggle.dataset.lightLabel : themeToggle.dataset.darkLabel);
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    updateThemeControl(theme);
  }

  updateThemeControl(currentTheme());
  themeToggle?.addEventListener("click", function () {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  });

  function updateHeader() {
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const revealItems = document.querySelectorAll("[data-reveal]");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) { item.classList.add("is-visible"); });
  } else {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14 });

    revealItems.forEach(function (item, index) {
      item.style.transitionDelay = `${Math.min(index % 3, 2) * 90}ms`;
      observer.observe(item);
    });
  }

  function addStoreLink(container, url, label) {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `${label} ↗`;
    container.appendChild(link);
  }

  function createProject(app, index) {
    const project = document.createElement("article");
    project.className = `home-project ${index % 2 === 0 ? "home-project--book" : "home-project--up"} is-visible`;

    const kicker = document.createElement("div");
    kicker.className = "home-project-kicker";
    const category = document.createElement("span");
    category.textContent = app.target || "MinorLab product";
    const status = document.createElement("span");
    status.textContent = "Live";
    kicker.append(category, status);

    const title = document.createElement("h3");
    title.textContent = app.name || "MinorLab App";
    const description = document.createElement("p");
    description.textContent = app.description || "A thoughtful tool for everyday life.";

    const links = document.createElement("div");
    links.className = "home-project-links";
    addStoreLink(links, app.ios_url, "iOS");
    addStoreLink(links, app.macos_url, "macOS");
    addStoreLink(links, app.android_url, "Android");
    addStoreLink(links, app.web_url, "Web");

    project.append(kicker, title, description, links);
    if (app.icon_url) {
      const image = document.createElement("img");
      image.className = "home-project-image";
      image.src = app.icon_url;
      image.alt = "";
      image.loading = "lazy";
      project.appendChild(image);
    } else {
      const visual = document.createElement("div");
      visual.className = index % 2 === 0 ? "home-book-visual" : "home-up-visual";
      visual.setAttribute("aria-hidden", "true");
      if (index % 2 !== 0) visual.textContent = "↑";
      project.appendChild(visual);
    }
    return project;
  }

  async function loadApps() {
    if (!appsSection || !appsContainer) return;
    const endpoint = appsSection.dataset.appsEndpoint;
    const key = appsSection.dataset.appsKey;
    if (!endpoint || !key) {
      if (loadingMessage) loadingMessage.hidden = true;
      return;
    }

    try {
      const response = await fetch(endpoint, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const apps = await response.json();
      if (!Array.isArray(apps) || apps.length === 0) return;
      appsContainer.replaceChildren(...apps.map(createProject));
      appsContainer.dataset.source = "supabase";
    } catch (_error) {
      appsContainer.dataset.source = "fallback";
    } finally {
      if (loadingMessage) loadingMessage.hidden = true;
    }
  }

  // Static fallback cards keep BookLab and UpNow visible if the API is unavailable.
  loadApps();
}());
