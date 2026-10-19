(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktop = () => matchMedia("(min-width: 981px)").matches;

  /* ---------- split headings ---------- */
  $$("[data-split]").forEach((el) => {
    let w = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const o = document.createElement("span"); o.className = "split-word";
            const i = document.createElement("span"); i.textContent = part; i.style.setProperty("--w", w++);
            o.appendChild(i); frag.appendChild(o);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) walk(c);
      });
    };
    walk(el);
    el.setAttribute("data-a", "none");
    el.style.opacity = 1; el.style.transform = "none";
  });
  $$("[data-stagger]").forEach((p) => {
    const base = Number(p.dataset.stagger) || 0;
    Array.from(p.children).forEach((c, i) => { if (!c.hasAttribute("data-a")) c.setAttribute("data-a", ""); c.style.setProperty("--d", base + i); });
  });

  /* ---------- reveal ---------- */
  const revealIO = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$("[data-count]", e.target).forEach(countUp);
      if (e.target.matches("[data-count]")) countUp(e.target);
      revealIO.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  $$("[data-a], .tile, .belt-line, .checklist").forEach((el) => revealIO.observe(el));

  /* ---------- count up ---------- */
  function countUp(el) {
    if (el.dataset.done) return; el.dataset.done = "1";
    const target = Number(el.dataset.count);
    const fmt = (v) => Math.round(v).toLocaleString("en-US");
    if (reduce) { el.textContent = fmt(target); return; }
    const t0 = performance.now(), dur = 1600;
    const step = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = fmt(target * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---------- nav ---------- */
  const nav = $("#nav"); const bar = $(".progress span");
  let lastY = scrollY;
  const navLinks = $$("#navlist a");
  const secs = navLinks.map((a) => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
  $(".nav-toggle").addEventListener("click", (e) => {
    const open = nav.classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", String(open));
  });
  navLinks.forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); $(".nav-toggle").setAttribute("aria-expanded", "false"); }));

  /* ---------- parallax + scroll-linked ---------- */
  const par = $$("[data-speed]");
  let ticking = false;
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    nav.classList.toggle("solid", y > 40);
    if (!nav.classList.contains("open")) nav.classList.toggle("hidden", y > lastY && y > 600);
    lastY = y;
    if (!reduce) par.forEach((el) => {
      if (y > innerHeight * 1.4) return;
      el.style.transform = `translate3d(0, ${(-y * Number(el.dataset.speed)).toFixed(1)}px, 0)`;
    });
    // current nav
    let cur = null; secs.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s; });
    navLinks.forEach((a) => a.setAttribute("aria-current", cur && a.getAttribute("href") === "#" + cur.id ? "true" : "false"));
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------- cursor glow ---------- */
  const glow = $(".glow");
  if (glow && !reduce && matchMedia("(hover: hover)").matches) {
    addEventListener("pointermove", (e) => { glow.classList.add("on"); glow.style.transform = `translate(${e.clientX - 210}px, ${e.clientY - 210}px)`; }, { passive: true });
    glow.style.left = "0"; glow.style.top = "0";
  }

  /* ---------- modules ---------- */
  const MODS = [
    ["classes", "Classes", [], true], ["booking", "Booking", ["classes"], true], ["attendance", "Attendance", ["booking"], true],
    ["membership", "Membership", [], true], ["pricing", "Membership pricing", ["membership"], true], ["credits", "Class credits", ["membership", "booking"], true],
    ["payments", "Payments", [], false], ["store", "Store", [], false], ["waiver", "Waiver", [], true],
    ["belt", "Belt", [], true], ["training", "Training time", [], true], ["progression", "Belt progression", ["belt", "training"], true],
    ["directory", "Member directory", [], true], ["line", "LINE Official Account", [], true], ["messages", "Messages", ["line"], false],
    ["ai", "AI assistant", ["messages"], false], ["theme", "Custom theme", [], false],
  ];
  const label = Object.fromEntries(MODS.map((m) => [m[0], m[1]]));
  const state = {};
  const modsEl = $("#mods"), log = $("#modlog");
  if (modsEl) {
    modsEl.innerHTML = MODS.map(([id, name, req, def]) => `<button type="button" class="mod" data-id="${id}" aria-pressed="${def}"><span class="sw" aria-hidden="true"></span><span class="t">${name}</span><span class="r">${req.length ? "Requires " + req.map((r) => label[r]).join(" + ") : "No dependencies"}<br>${def ? "On by default" : "Enable when needed"}</span></button>`).join("");
    const paint = () => $$(".mod", modsEl).forEach((b) => b.setAttribute("aria-pressed", String(!!state[b.dataset.id])));
    const reset = () => { MODS.forEach(([id, , , def]) => (state[id] = def)); paint(); };
    const dependents = (id) => MODS.filter((m) => m[2].includes(id)).map((m) => m[0]);
    const turnOff = (id, acc) => { if (!state[id]) return; state[id] = false; acc.push(id); dependents(id).forEach((d) => turnOff(d, acc)); };
    modsEl.addEventListener("click", (e) => {
      const b = e.target.closest(".mod"); if (!b) return; const id = b.dataset.id;
      if (state[id]) {
        const acc = []; turnOff(id, acc);
        log.textContent = acc.length > 1 ? `Turned off “${label[id]}”. These features were also disabled: ${acc.slice(1).map((a) => label[a]).join(", ")}.` : `Turned off “${label[id]}”. Its pages are hidden from navigation.`;
        acc.forEach((a) => { const el = $(`.mod[data-id="${a}"]`, modsEl); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); });
      } else {
        const missing = MODS.find((m) => m[0] === id)[2].filter((r) => !state[r]);
        if (missing.length) { log.textContent = `Enable ${missing.map((m) => label[m]).join(" and ")} before enabling ${label[id]}.`; b.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 300 }); return; }
        state[id] = true; log.textContent = `Turned on “${label[id]}”.`;
      }
      paint();
    });
    $("#mods-reset").addEventListener("click", () => { reset(); log.textContent = "Back to the product defaults for a new gym."; });
    $("#mods-qcgc") && $("#mods-qcgc").addEventListener("click", () => { MODS.forEach(([id]) => (state[id] = true)); paint(); log.textContent = "Suggested for QCGC: everything on, including Payments, Store (pro shop), Messages, AI assistant and Custom theme."; });
    reset();
  }

  /* ---------- checklist ---------- */
  const cl = $("#checklist");
  if (cl) {
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return; io.disconnect();
      const boxes = $$("[data-cl]", cl);
      boxes.forEach((b, i) => setTimeout(() => { b.classList.add("y"); b.textContent = "✓"; $("#cl-bar").style.width = ((i + 1) / boxes.length) * 100 + "%"; }, reduce ? 0 : 400 + i * 450));
    }, { threshold: 0.4 });
    io.observe(cl);
  }

  /* ---------- screen states ---------- */
  $$("[data-states]").forEach((box) => {
    const btns = $$(".states button", box);
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $$("[data-s]", box).forEach((s) => { if (s.tagName !== "BUTTON") s.classList.toggle("on", s.dataset.s === b.dataset.s); });
    }));
  });
  /* ---------- compare sliders ---------- */
  $$("[data-cmp]").forEach((c) => {
    const st = $(".cmp-stage", c), r = $(".cmp-range", c);
    const set = (v) => st.style.setProperty("--x", v + "%");
    r.addEventListener("input", () => set(r.value)); set(r.value);
    if (!reduce) {
      const io = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; io.disconnect();
        let t0 = null; const f = (t) => { t0 ??= t; const p = Math.min(1, (t - t0) / 1400); const v = 50 + Math.sin(p * Math.PI * 2) * 30 * (1 - p); set(v.toFixed(1)); if (p < 1) requestAnimationFrame(f); else set(r.value); }; requestAnimationFrame(f); }, { threshold: 0.5 });
      io.observe(c);
    }
  });
  $$("[data-allpos]").forEach((b) => b.addEventListener("click", () => {
    const v = b.dataset.allpos; $$(".cmp-range").forEach((r) => { r.value = v; r.dispatchEvent(new Event("input")); });
    $$("[data-allpos]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));
  $$("[data-mode]").forEach((b) => b.addEventListener("click", () => {
    const dark = b.dataset.mode === "dark";
    $$(".tp").forEach((t) => t.classList.toggle("dark", dark));
    $$("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));
  $$("[data-beltmode]").forEach((b) => b.addEventListener("click", () => {
    const belt = b.dataset.beltmode === "belt";
    $$(".dev.after .tp, .tp.belt-able").forEach((t) => t.classList.toggle("belt-blue", belt));
    $$("[data-beltmode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));
})();
