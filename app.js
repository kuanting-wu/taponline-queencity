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
  const hday = $(".hday"), htrack = $("#htrack"), hbarEl = $("#hbar"), hclock = $("#hclock");
  const times = ["05:40 AM", "06:00 AM", "09:00 AM", "11:20 AM", "04:30 PM", "06:15 PM", "07:45 PM", "09:30 PM", "—"];
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
    // horizontal day
    if (hday && isDesktop()) {
      const r = hday.getBoundingClientRect(); const total = hday.offsetHeight - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      const max = htrack.scrollWidth - innerWidth + 80;
      htrack.style.transform = `translate3d(${(-p * max).toFixed(1)}px,0,0)`;
      hbarEl.style.width = p * 100 + "%";
      hclock.textContent = times[Math.min(times.length - 1, Math.floor(p * (times.length - 0.01)))];
    }
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
  if (!reduce && matchMedia("(hover: hover)").matches) {
    addEventListener("pointermove", (e) => { glow.classList.add("on"); glow.style.transform = `translate(${e.clientX - 210}px, ${e.clientY - 210}px)`; }, { passive: true });
    glow.style.left = "0"; glow.style.top = "0";
  }

  /* ---------- decorative generators ---------- */
  $$(".qr").forEach((q, qi) => {
    let seed = 7 + qi * 13; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const finder = (x, y) => {
      for (const [fx, fy] of [[0, 0], [14, 0], [0, 14]]) {
        const dx = x - fx, dy = y - fy;
        if (dx >= 0 && dx < 7 && dy >= 0 && dy < 7) return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0;
        if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) return 0;
      }
      return -1;
    };
    let html = "";
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) { const f = finder(x, y); if (f === -1 ? rnd() > 0.52 : f === 1) html += `<i style="grid-area:${y + 1}/${x + 1}"></i>`; }
    q.innerHTML = html;
  });
  $$("[data-heat]").forEach((h) => {
    const rows = JSON.parse(h.dataset.heat);
    let html = "<span></span>" + ["M", "T", "W", "T", "F", "S", "S"].map((d) => `<span style="text-align:center">${d}</span>`).join(""); let k = 0;
    rows.forEach(([label, vals]) => { html += `<span>${label}</span>`; vals.forEach((v) => { html += `<i style="opacity:${v === 0 ? 0.06 : 0.12 + v * 0.88};--i:${k++}"></i>`; }); });
    h.innerHTML = html;
  });
  $$(".yheat").forEach((h) => {
    let seed = 3, html = ""; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 26; c++) { const v = rnd(); const o = v > 0.42 ? 0.25 + (v - 0.42) * 1.3 : 0.07; html += `<i style="opacity:${Math.min(1, o).toFixed(2)}"></i>`; }
    h.innerHTML = html;
  });

  /* ---------- sticky story ---------- */
  const steps = $$(".story-steps .step"), screens = $$(".screens .screen"), sprog = $(".story-progress i");
  // mobile: inline copy of each screen
  steps.forEach((st, i) => {
    const wrap = document.createElement("div"); wrap.className = "inline-screen"; wrap.setAttribute("aria-hidden", "true");
    const phone = $(".story-stage .phone").cloneNode(false);
    phone.innerHTML = '<div class="notch"></div><div class="scr"><div class="status"><span>6:08</span><span>●●● ▮</span></div></div>';
    const scr = $(".scr", phone); const clone = screens[i].cloneNode(true); clone.classList.add("on", "in"); scr.appendChild(clone);
    wrap.appendChild(phone); st.appendChild(wrap);
  });
  const storyIO = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = Number(e.target.dataset.step);
      steps.forEach((s, k) => s.classList.toggle("on", k === i));
      screens.forEach((s, k) => s.classList.toggle("on", k === i));
      if (sprog) sprog.style.height = ((i + 1) / steps.length) * 100 + "%";
      const sig = $(".screens .screen.on .sig"); if (sig) { sig.closest(".screen").classList.remove("in"); void sig.offsetWidth; sig.closest(".screen").classList.add("in"); }
    });
  }, { rootMargin: "-45% 0px -45% 0px" });
  steps.forEach((s) => storyIO.observe(s));
  if (steps[0]) steps[0].classList.add("on");

  /* ---------- schedule demo ---------- */
  const SPRINGBORO = {
    Mon: [["6:00 AM", "No Gi BJJ", "bjj"], ["9:00 AM", "Judo", "other", 1], ["5:00 PM", "Kids No Gi", "kids"], ["6:15 PM", "No Gi Fundamentals", "bjj"], ["7:45 PM", "No Gi BJJ — All Levels", "bjj"], ["7:45 PM", "Striking", "str"]],
    Tue: [["6:00 AM", "No Gi BJJ", "bjj"], ["9:00 AM", "No Gi BJJ", "bjj", 1], ["5:00 PM", "Kids No Gi", "kids"], ["6:15 PM", "No Gi BJJ — All Levels", "bjj"], ["7:45 PM", "Wrestling", "other"], ["7:45 PM", "Striking", "str"]],
    Wed: [["6:00 AM", "No Gi BJJ", "bjj"], ["5:00 PM", "Kids No Gi BJJ", "kids"], ["6:15 PM", "No Gi Fundamentals", "bjj"], ["7:45 PM", "Striking", "str"]],
    Thu: [["6:00 AM", "No Gi BJJ", "bjj"], ["9:00 AM", "No Gi BJJ", "bjj", 1], ["5:00 PM", "Kids No Gi", "kids"], ["6:15 PM", "No Gi BJJ — All Levels", "bjj"], ["7:45 PM", "Wrestling", "other"], ["7:45 PM", "Striking", "str"]],
    Fri: [["6:00 AM", "No Gi BJJ", "bjj"], ["9:00 AM", "Judo", "other", 1], ["5:00 PM", "Women's Only No Gi BJJ", "bjj"], ["6:15 PM", "No Gi Competition Class", "bjj"], ["7:45 PM", "Striking", "str"]],
    Sat: [["10:00 AM", "No Gi BJJ", "bjj"], ["11:30 AM", "Striking", "str"]],
    Sun: [["10:00 AM", "Open Sparring", "open"], ["10:00 AM", "Open Mat", "open"]],
  };
  const MAINEVILLE = {
    Mon: [["6:00 AM", "Adults NoGi", "bjj"], ["11:30 AM", "Adults NoGi", "bjj"], ["5:30 PM", "Kids Gi", "kids"], ["6:30 PM", "Adults NoGi", "bjj"]],
    Tue: [["6:00 AM", "Adults NoGi", "bjj"], ["5:30 PM", "Kids NoGi", "kids"], ["6:30 PM", "Adults NoGi", "bjj"]],
    Wed: [["6:00 AM", "Adults NoGi", "bjj"], ["11:30 AM", "Adults NoGi", "bjj"], ["5:30 PM", "Kids Gi", "kids"], ["6:30 PM", "Adults NoGi", "bjj"]],
    Thu: [["6:00 AM", "Adults NoGi", "bjj"], ["6:30 PM", "Adults NoGi", "bjj"]],
    Fri: [["6:30 AM", "Open Mat", "open"]],
    Sat: [["8:30 AM", "Kids NoGi", "kids"], ["9:30 AM", "Adults NoGi", "bjj"]],
    Sun: [],
  };
  const lead = (name) => {
    if (/Women/.test(name)) return "Jettie Shofner";
    if (/Kids/.test(name)) return "Markus Wolfinbarger";
    if (/Wrestling/.test(name)) return "Germane Lindsey Jr.";
    if (/Judo/.test(name)) return "Cody Cummins";
    if (/Striking|Sparring/.test(name)) return "Jared Swain";
    if (/Open Mat/.test(name)) return "Unassigned";
    return "Ruben Vera";
  };
  const durationOf = (name) => (/Kids/.test(name) ? 60 : /Open/.test(name) ? 120 : 75);
  const people = ["Avery R.", "Jordan M.", "Riley K.", "Sam T.", "Casey L.", "Morgan P.", "Taylor B.", "Drew H.", "Jamie F.", "Alex P.", "Chris W.", "Quinn S."];
  const beltCls = ["bw", "bw", "bw", "bb", "bb", "bp", "bn", "bw", "bb", "bw", "bk", "bp"];
  let loc = "springboro", filt = "all", selected = null;
  const grid = $("#wkgrid"), detail = $("#demo-detail"), countEl = $("#demo-count");
  const renderWeek = () => {
    const data = loc === "springboro" ? SPRINGBORO : MAINEVILLE;
    let html = "", n = 0, shown = 0, k = 0;
    Object.entries(data).forEach(([day, list]) => {
      html += `<div class="col"><div class="dh"><span>${day.toUpperCase()}</span><span>${list.length}</span></div>`;
      if (!list.length) html += `<div class="ev open" style="cursor:default;border-left-style:dotted">Call for details</div>`;
      list.forEach(([t, name, cat, app], idx) => {
        n++;
        const match = filt === "all" || (filt === "other" ? ["other", "str"].includes(cat) : filt === "bjj" ? ["bjj", "open"].includes(cat) : cat === filt);
        if (!match) return; shown++;
        const id = `${day}-${idx}`;
        html += `<button type="button" class="ev ${cat === "kids" ? "kids" : ""} ${cat === "str" ? "str" : ""} ${cat === "open" ? "open" : ""} ${app ? "app" : ""}" data-id="${id}" data-day="${day}" data-t="${t}" data-n="${name}" aria-pressed="${selected === id}" style="--i:${k++}"><b>${t}</b>${name}</button>`;
      });
      html += "</div>";
    });
    grid.innerHTML = html;
    countEl.textContent = `${shown} of ${n} classes shown · ${loc === "springboro" ? "Springboro" : "Maineville"}`;
    $("#demo-gym").textContent = "QCGC · " + (loc === "springboro" ? "Springboro" : "Maineville");
    $("#demo-loc-url").textContent = loc;
  };
  const showDetail = (btn) => {
    const name = btn.dataset.n, t = btn.dataset.t, day = btn.dataset.day;
    const booked = 6 + ((name.length * 7 + t.length * 3) % 14), inn = Math.max(0, booked - 3 - (name.length % 4));
    const roster = people.slice(0, 6).map((p, i) => `<li><span class="av">${p.split(" ").map((s) => s[0]).join("")}</span><span>${p} <span class="belts" style="display:inline-flex;vertical-align:middle;margin-left:4px"><i class="${beltCls[(i + name.length) % beltCls.length]}"></i></span></span><span class="st-pill ${i < inn % 7 ? "w" : ""}">${i < inn % 7 ? "Checked in" : "Booked"}</span></li>`).join("");
    detail.innerHTML = `<div><span class="tag">${day} · ${t} · ${durationOf(name)} min</span><h5 style="margin-top:10px">${name}</h5>
      <p class="muted" style="font-size:12px;margin-top:6px">Coach · <b style="color:#fff">${lead(name)}</b> · ${loc === "springboro" ? "Springboro" : "Maineville"}</p>
      <div style="display:flex;gap:18px;margin:12px 0"><div><div style="font-family:var(--display);font-size:38px;line-height:1">${inn}</div><div class="mono" style="font-size:9px;color:var(--mid)">IN</div></div><div><div style="font-family:var(--display);font-size:38px;line-height:1;color:var(--silver)">${booked}</div><div class="mono" style="font-size:9px;color:var(--mid)">BOOKED</div></div><div><div style="font-family:var(--display);font-size:38px;line-height:1;color:var(--silver)">${durationOf(name)}</div><div class="mono" style="font-size:9px;color:var(--mid)">TRAINING MIN</div></div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="btn solid">Book member</span><span class="btn">Edit</span><span class="btn">Class notes</span><span class="btn ghost">Cancel class &amp; notify</span></div></div>
      <div><div class="mono" style="font-size:9px;color:var(--mid);letter-spacing:.14em;margin-bottom:6px">ROSTER · SAMPLE</div><ul class="roster">${roster}</ul></div>`;
  };
  grid.addEventListener("click", (e) => {
    const b = e.target.closest("button.ev"); if (!b) return;
    selected = b.dataset.id; $$("button.ev", grid).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); showDetail(b);
  });
  $$("[data-loc]").forEach((b) => b.addEventListener("click", () => { loc = b.dataset.loc; selected = null; $$("[data-loc]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); renderWeek(); }));
  $$("#demo-filter button").forEach((b) => b.addEventListener("click", () => { filt = b.dataset.f; $$("#demo-filter button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); renderWeek(); }));
  renderWeek();
  const first = $("button.ev", grid); if (first) { first.setAttribute("aria-pressed", "true"); selected = first.dataset.id; showDetail(first); }

  /* ---------- signature pad ---------- */
  const pad = $("#pad");
  if (pad) {
    const cv = $("canvas", pad), ctx = cv.getContext("2d"), ph = $(".ph", pad), ptsEl = $("#pad-pts");
    let drawing = false, pts = 0, last = null;
    const size = () => { const r = pad.getBoundingClientRect(), d = devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; ctx.scale(d, d); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#fafafa"; };
    size(); addEventListener("resize", () => { size(); pts = 0; ptsEl.textContent = "0 stroke points recorded"; ph.style.display = ""; });
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener("pointerdown", (e) => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); ph.style.display = "none"; });
    cv.addEventListener("pointermove", (e) => { if (!drawing) return; const p = pos(e); ctx.beginPath(); ctx.moveTo(...last); ctx.lineTo(...p); ctx.stroke(); last = p; pts++; ptsEl.textContent = `${pts} stroke points recorded`; });
    const end = () => { drawing = false; }; cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    $(".clr", pad).addEventListener("click", () => { ctx.clearRect(0, 0, cv.width, cv.height); pts = 0; ptsEl.textContent = "0 stroke points recorded"; ph.style.display = ""; });
    $("#minor").addEventListener("change", (e) => { $("#guardian").style.display = e.target.checked ? "block" : "none"; });
  }

  /* ---------- belt demo ---------- */
  const GOALS = { white: 150, blue: 300, purple: 300, brown: 250 }; // placeholder display goals
  const NEXT = { white: "blue", blue: "purple", purple: "brown", brown: "black" };
  const COLORS = { white: "var(--belt-white)", blue: "var(--belt-blue)", purple: "var(--belt-purple)", brown: "var(--belt-brown)" };
  let belt = "blue";
  const hrs = $("#hrs");
  const renderBelt = () => {
    const h = Number(hrs.value), g = GOALS[belt], p = Math.min(1, h / g);
    $("#hrsv").textContent = h; $("#ringv").textContent = Math.round(p * 100) + "%";
    $("#ringfg").style.strokeDashoffset = String(302 - 302 * p);
    $(".prog-ring").style.setProperty("--off", String(302 - 302 * p));
    $("#beltbar").style.background = COLORS[belt];
    $("#beltmsg").textContent = p >= 1 ? `Goal reached: shows on “Close to next belt”. A coach still awards ${NEXT[belt]} by hand.` : `${h} / ${g} hours toward the ${NEXT[belt]} display goal`;
  };
  if (hrs) {
    hrs.addEventListener("input", renderBelt);
    $$("#beltseg button").forEach((b) => b.addEventListener("click", () => { belt = b.dataset.b; $$("#beltseg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); renderBelt(); }));
    renderBelt();
  }

  /* ---------- inbox filter ---------- */
  $$('#inbox [data-if]').forEach((b) => b.addEventListener("click", () => {
    $$('#inbox [data-if]').forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $$("#inbox-list .inbox-item").forEach((it) => { it.style.display = b.dataset.if === "all" || it.dataset.k === b.dataset.if ? "" : "none"; });
  }));

  /* ---------- store ---------- */
  const STOCK = { "Black-S": 3, "Black-M": 6, "Black-L": 0, "Black-XL": 2, "White-S": 1, "White-M": 4, "White-L": 5, "White-XL": 0 };
  let color = "Black", sz = "M";
  const renderStore = () => {
    $$("#opt-size button").forEach((b) => { const s = STOCK[`${color}-${b.dataset.v}`]; b.classList.toggle("x", s === 0); b.classList.toggle("on", b.dataset.v === sz); b.setAttribute("aria-pressed", String(b.dataset.v === sz)); b.setAttribute("aria-label", `${b.dataset.v}${s === 0 ? ", sold out" : ""}`); });
    $$("#opt-color button").forEach((b) => { b.classList.toggle("on", b.dataset.v === color); b.setAttribute("aria-pressed", String(b.dataset.v === color)); });
    const s = STOCK[`${color}-${sz}`];
    $("#price").textContent = s === 0 ? "$ — · Sold out" : `$ — · ${s} left`;
    $("#shirt").style.background = color === "Black" ? "#1d1d1d" : "#ececec";
    $("#shirt span").style.color = color === "Black" ? "#fafafa" : "#111";
  };
  $$("#opt-size button").forEach((b) => b.addEventListener("click", () => { sz = b.dataset.v; renderStore(); }));
  $$("#opt-color button").forEach((b) => b.addEventListener("click", () => { color = b.dataset.v; renderStore(); }));
  if ($("#store")) renderStore();

  /* ---------- theme switcher ---------- */
  const THEMES = {
    qcgc: { brand: "#fafafa", font: "var(--display)", r: "4px", bg: "#0a0a0a", ink: "#fafafa", card: "#161616", line: "#2d2d2d" },
    dojo: { brand: "#c0392b", font: "Georgia, 'Times New Roman', serif", r: "4px", bg: "#ffffff", ink: "#111111", card: "#f5f5f5", line: "#e3e3e3" },
    ocean: { brand: "#0e7c86", font: "var(--sans)", r: "10px", bg: "#ffffff", ink: "#111111", card: "#f4f7f7", line: "#e1e8e8" },
    night: { brand: "#111827", font: "var(--sans)", r: "999px", bg: "#ffffff", ink: "#111827", card: "#f3f4f6", line: "#e5e7eb" },
    sunrise: { brand: "#d97706", font: "var(--sans)", r: "10px", bg: "#ffffff", ink: "#111111", card: "#fbf6ef", line: "#efe3d2" },
    purple: { brand: "#7c3aed", font: "var(--sans)", r: "999px", bg: "#ffffff", ink: "#111111", card: "#f6f3fd", line: "#e7e0f8" },
    minimal: { brand: "#1c1c1e", font: "var(--mono)", r: "4px", bg: "#ffffff", ink: "#1c1c1e", card: "#f5f5f5", line: "#e5e5e5" },
  };
  const lum = (hex) => { const c = hex.replace("#", "").match(/../g).map((x) => { const v = parseInt(x, 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const tp = $("#themephone");
  let shapeOverride = null;
  const applyTheme = (k) => {
    const t = THEMES[k]; if (!t || !tp) return;
    const on = lum(t.brand) > 0.5 ? "#0a0a0a" : "#ffffff";
    tp.style.setProperty("--tp-brand", t.brand); tp.style.setProperty("--tp-on", on); tp.style.setProperty("--tp-font", t.font);
    tp.style.setProperty("--tp-bg", t.bg); tp.style.setProperty("--tp-ink", t.ink); tp.style.setProperty("--tp-card", t.card); tp.style.setProperty("--tp-line", t.line);
    tp.style.setProperty("--tp-r", shapeOverride || t.r);
    $$("#shapeseg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.s === (shapeOverride || t.r))));
    const ratio = (1.05) / (lum(t.brand) + 0.05);
    const grade = ratio >= 4.5 ? "AA" : ratio >= 3 ? "Large text only" : "Too pale for white text";
    $("#contrast").textContent = `Brand ${t.brand.toUpperCase()} · White text ${ratio.toFixed(1)}:1 · ${grade}`;
  };
  $$("#themeseg button").forEach((b) => b.addEventListener("click", () => { shapeOverride = null; $$("#themeseg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); applyTheme(b.dataset.t); }));
  $$("#shapeseg button").forEach((b) => b.addEventListener("click", () => { shapeOverride = b.dataset.s; const cur = $('#themeseg [aria-pressed="true"]'); applyTheme(cur ? cur.dataset.t : "qcgc"); }));
  applyTheme("qcgc");

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
    $("#mods-qcgc").addEventListener("click", () => { MODS.forEach(([id]) => (state[id] = true)); paint(); log.textContent = "Suggested for QCGC: everything on, including Payments, Store (pro shop), Messages, AI assistant and Custom theme."; });
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
})();
