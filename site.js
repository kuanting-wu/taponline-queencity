(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  $$("[data-split]").forEach((el) => {
    let w = 0;
    const walk = (node) => Array.from(node.childNodes).forEach((c) => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { f.appendChild(document.createTextNode(" ")); return; }
          const o = document.createElement("span"); o.className = "split-word";
          const i = document.createElement("span"); i.textContent = p; i.style.setProperty("--w", w++);
          o.appendChild(i); f.appendChild(o);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1) walk(c);
    });
    walk(el); el.setAttribute("data-a", "none"); el.style.opacity = 1; el.style.transform = "none";
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
  $$("[data-a]").forEach((el) => io.observe(el));
  const nav = $("#nav"), bar = $(".progress span"), links = $$("#navlist a");
  const secs = links.map((a) => { const h = a.getAttribute("href"); return h.startsWith("#") ? document.getElementById(h.slice(1)) : null; });
  $(".nav-toggle").addEventListener("click", (e) => { const o = nav.classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", String(o)); });
  links.forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); $(".nav-toggle").setAttribute("aria-expanded", "false"); }));
  let lastY = scrollY, tick = false;
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    nav.classList.toggle("solid", y > 40);
    if (!nav.classList.contains("open")) nav.classList.toggle("hidden", y > lastY && y > 600);
    lastY = y;
    let cur = -1; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    links.forEach((a, i) => a.setAttribute("aria-current", String(i === cur)));
    tick = false;
  };
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  const lb = $("#lb");
  if (lb) {
    let img = null;
    $$(".zoom").forEach((b) => b.addEventListener("click", () => { if (!img) { img = document.createElement("img"); lb.appendChild(img); } img.src = b.dataset.full; img.alt = b.getAttribute("aria-label").replace(/^Enlarge /, ""); lb.showModal(); }));
    $(".lb-x", lb).addEventListener("click", () => lb.close());
    lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  }
  $$("[data-cmp]").forEach((c) => {
    const st = $(".cmp-stage", c), r = $(".cmp-range", c);
    const set = (v) => st.style.setProperty("--x", v + "%");
    r.addEventListener("input", () => set(r.value)); set(r.value);
    const drag = (e) => { const b = st.getBoundingClientRect(); const v = Math.max(0, Math.min(100, ((e.clientX - b.left) / b.width) * 100)); r.value = v; set(v.toFixed(1)); };
    st.addEventListener("pointerdown", (e) => { drag(e); st.setPointerCapture(e.pointerId); st.addEventListener("pointermove", drag); });
    st.addEventListener("pointerup", () => st.removeEventListener("pointermove", drag));
    if (!reduce) {
      const o = new IntersectionObserver((es) => { if (!es[0].isIntersecting) return; o.disconnect();
        let t0 = null; const f = (t) => { t0 ??= t; const p = Math.min(1, (t - t0) / 1400); set((50 + Math.sin(p * Math.PI * 2) * 30 * (1 - p)).toFixed(1)); if (p < 1) requestAnimationFrame(f); else set(r.value); }; requestAnimationFrame(f); }, { threshold: 0.5 });
      o.observe(c);
    }
  });
  $$("[data-allpos]").forEach((b) => b.addEventListener("click", () => {
    $$(".cmp-range").forEach((r) => { r.value = b.dataset.allpos; r.dispatchEvent(new Event("input")); });
    $$("[data-allpos]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));
})();
