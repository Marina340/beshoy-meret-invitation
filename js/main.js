/* ═══════════════════════════════════════════════════════════
   Meret & Beshoy — Wedding Invitation
   Everything you normally need to change lives in CONFIG.
   Section wording lives in index.html.
   ═══════════════════════════════════════════════════════════ */

const CONFIG = {
  groom: "Beshoy",
  bride: "Meret",

  // Local date/time of the celebration (24h). Drives the countdown,
  // the calendar grid and the "Add To My Calendar" button.
  event: {
    date: "2026-10-01",
    startTime: "19:00",       // the ceremony
    endTime: "22:00",
    // IANA timezone of the venue — the countdown is then correct from anywhere.
    timezone: "Africa/Cairo",
    title: "Wedding of Meret & Beshoy",
    venue: "Saint George Coptic Orthodox Church, Faisal, Suez — reception at Pyramids Hall, Suez",
    details: "We joyfully invite you to celebrate our wedding day with us."
  },

  // The map widget. Either "lat,lng" (pinpoint, and the only form that accepts
  // a zoom level) or a plain search phrase. To pin it exactly: open Google
  // Maps, right-click the church, and click the numbers at the top of the menu
  // — that copies the coordinates. Paste them here in place of the text.
  maps: {
    // Both taken from the Google Maps links the couple shared.
    church: "29.979913,32.520191",   // St George, Faisal, Suez
    hall:   "29.962102,32.554449"    // Pyramids Hall, Suez
  },
  mapZoom: 16,

  // Drop an .mp3 into assets/audio/ and put its filename here.
  // If the file is missing, the music button simply never appears.
  music: "assets/audio/music.mp3",

  petals: { count: 16, enabled: true }
};

/* ═══════════ helpers ═══════════ */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const pad = (n) => String(n).padStart(2, "0");

/* Convert a wall-clock time in a given IANA timezone into a real UTC instant,
   so the countdown reads the same for a guest in Cairo and one in Sydney. */
function zonedToUTC(dateStr, timeStr, timeZone) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  // First guess: treat the wall clock as UTC, then correct by the zone offset.
  let ts = Date.UTC(y, mo - 1, d, h, mi, 0);
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(new Date(ts)).reduce((a, p) => (a[p.type] = p.value, a), {});
    const asUTC = Date.UTC(
      +parts.year, +parts.month - 1, +parts.day,
      +parts.hour % 24, +parts.minute, +parts.second
    );
    ts += Date.UTC(y, mo - 1, d, h, mi, 0) - asUTC;
  }
  return new Date(ts);
}

const START = zonedToUTC(CONFIG.event.date, CONFIG.event.startTime, CONFIG.event.timezone);
const END   = zonedToUTC(CONFIG.event.date, CONFIG.event.endTime,   CONFIG.event.timezone);

/* ═══════════ 1. Cover / envelope ═══════════ */
(function cover() {
  const cover = $("#cover");
  const btn = $("#openBtn");
  if (!cover || !btn) return;

  btn.addEventListener("click", () => {
    cover.classList.add("is-open");
    document.body.classList.remove("is-locked");
    window.scrollTo(0, 0);
    startMusic();          // the click is the user gesture browsers require
    setTimeout(() => { cover.style.display = "none"; }, 1200);
  }, { once: true });
})();

/* ═══════════ 2. Background music ═══════════ */
let audioReady = false;
const audio = $("#bgm");
const musicBtn = $("#musicBtn");

(function music() {
  if (!audio || !musicBtn || !CONFIG.music) return;

  audio.src = CONFIG.music;
  audio.volume = 0;

  audio.addEventListener("canplaythrough", () => {
    audioReady = true;
    musicBtn.hidden = false;
    requestAnimationFrame(() => musicBtn.classList.add("is-visible"));
  }, { once: true });

  // No audio file present (or unsupported) — stay silent, keep the button hidden.
  audio.addEventListener("error", () => { audioReady = false; musicBtn.hidden = true; });

  audio.load();

  musicBtn.addEventListener("click", () => {
    if (audio.paused) startMusic(); else fadeOut();
  });
})();

function fadeTo(target, ms = 1400) {
  const from = audio.volume;
  const t0 = performance.now();
  (function step(t) {
    const k = Math.min((t - t0) / ms, 1);
    audio.volume = from + (target - from) * k;
    if (k < 1) requestAnimationFrame(step);
    else if (target === 0) audio.pause();
  })(t0);
}

function startMusic() {
  if (!audioReady || !audio) return;
  audio.play().then(() => {
    musicBtn.classList.add("is-playing");
    fadeTo(0.55);
  }).catch(() => { /* autoplay blocked — the button is there for them */ });
}

function fadeOut() {
  musicBtn.classList.remove("is-playing");
  fadeTo(0, 700);
}

// Be a good guest: pause when the tab is hidden, resume when it returns.
document.addEventListener("visibilitychange", () => {
  if (!audio || !audioReady) return;
  if (document.hidden && !audio.paused) audio.pause();
  else if (!document.hidden && musicBtn.classList.contains("is-playing")) audio.play().catch(() => {});
});

/* ═══════════ 3. Countdown ═══════════ */
(function countdown() {
  const d = $("#cdD"), h = $("#cdH"), m = $("#cdM"), s = $("#cdS");
  if (!d) return;

  function tick() {
    let diff = START.getTime() - Date.now();
    if (diff < 0) diff = 0;
    const sec = Math.floor(diff / 1000);
    d.textContent = pad(Math.floor(sec / 86400));
    h.textContent = pad(Math.floor(sec / 3600) % 24);
    m.textContent = pad(Math.floor(sec / 60) % 60);
    s.textContent = pad(sec % 60);
  }
  tick();
  setInterval(tick, 1000);
})();

/* ═══════════ 4. Calendar grid with the day marked ═══════════ */
(function calendarGrid() {
  const host = $("#cal");
  if (!host) return;

  const [year, month, day] = CONFIG.event.date.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const lead = first.getDay();                       // 0 = Sunday
  const monthName = first.toLocaleString("en-US", { month: "long" });

  const head = ["S", "M", "T", "W", "T", "F", "S"]
    .map((d) => `<span class="cal__dow">${d}</span>`).join("");

  const blanks = Array.from({ length: lead }, () => `<span class="cal__cell"></span>`).join("");

  const cells = Array.from({ length: daysInMonth }, (_, i) => {
    const n = i + 1;
    const cls = n === day ? "cal__cell cal__cell--mark" : "cal__cell";
    return `<span class="${cls}">${n}</span>`;
  }).join("");

  host.innerHTML =
    `<p class="cal__title">${monthName} ${year}</p>` +
    `<div class="cal__grid">${head}${blanks}${cells}</div>`;
})();

/* ═══════════ 5. Map widgets + Add To My Calendar ═══════════ */
(function venues() {
  const pairs = [
    ["#mapChurch", "#linkChurch", CONFIG.maps.church],
    ["#mapHall",   "#linkHall",   CONFIG.maps.hall]
  ];

  const isCoords = (v) => /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(v);

  pairs.forEach(([frameSel, linkSel, query]) => {
    const q = encodeURIComponent(query);
    const frame = $(frameSel);
    const link = $(linkSel);

    // A &z= zoom silently returns a BLANK map for text queries — Google only
    // honours it for coordinates. So only send it when we have coordinates.
    const zoom = isCoords(query) ? `&z=${CONFIG.mapZoom}` : "";
    if (frame) frame.src = `https://www.google.com/maps?q=${q}${zoom}&output=embed`;

    // Directions, not just a pin — guests mostly want the route.
    if (link) link.href = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  });

  const calBtn = $("#calBtn");
  if (!calBtn) return;

  const stamp = (dt) => dt.toISOString().replace(/[-:]|\.\d{3}/g, "");

  calBtn.addEventListener("click", () => {
    const { title, venue, details } = CONFIG.event;

    // Phones handle Google Calendar links better than downloaded .ics files.
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.open(
        "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        `&text=${encodeURIComponent(title)}` +
        `&dates=${stamp(START)}/${stamp(END)}` +
        `&location=${encodeURIComponent(venue)}` +
        `&details=${encodeURIComponent(details)}`,
        "_blank", "noopener"
      );
      return;
    }

    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding Invitation//EN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@invitation`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(START)}`,
      `DTEND:${stamp(END)}`,
      `SUMMARY:${title}`,
      `LOCATION:${venue}`,
      `DESCRIPTION:${details}`,
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");

    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${CONFIG.groom}-${CONFIG.bride}-wedding.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();

/* ═══════════ 6. Scroll reveal ═══════════ */
(function reveal() {
  const items = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add("is-in"), i * 90);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  items.forEach((el) => io.observe(el));
})();

/* ═══════════ 7. Falling petals ═══════════ */
(function petals() {
  if (!CONFIG.petals.enabled) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Two layers: one over the burgundy cover, one over the invitation itself.
  [$("#coverPetals"), $("#petals")].forEach((wrap) => { if (wrap) fill(wrap); });

  function fill(wrap) {
  for (let i = 0; i < CONFIG.petals.count; i++) {
    const p = document.createElement("i");
    p.className = "petal";
    const size = 11 + Math.random() * 12;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.setProperty("--drift", `${(Math.random() - 0.5) * 180}px`);
    p.style.setProperty("--spin", `${300 + Math.random() * 500}deg`);
    p.style.animationDuration = `${11 + Math.random() * 12}s`;
    p.style.animationDelay = `${Math.random() * 16}s`;
    wrap.appendChild(p);
  }
  }
})();

/* ═══════════ 8. Photo album — 3D coverflow ═══════════ */
(function gallery() {
  const stage = $("#galStage");
  if (!stage) return;

  const cards = Array.from(stage.children);
  const dotsWrap = $("#galDots");
  let index = 0;

  cards.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "gal__dot";
    dot.setAttribute("aria-label", `Photo ${i + 1}`);
    dot.addEventListener("click", () => go(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function layout() {
    cards.forEach((card, i) => {
      let offset = i - index;
      const half = Math.floor(cards.length / 2);
      // Wrap around so the carousel feels endless in both directions.
      if (offset > half) offset -= cards.length;
      if (offset < -half) offset += cards.length;

      const abs = Math.abs(offset);
      card.style.transform =
        `translateX(${offset * 118}px) translateZ(${-abs * 170}px) ` +
        `rotateY(${offset * -32}deg) scale(${abs === 0 ? 1 : 0.9 - abs * 0.04})`;
      card.style.opacity = abs > 2 ? 0 : 1 - abs * 0.22;
      card.style.zIndex = String(50 - abs);
      card.style.pointerEvents = abs > 2 ? "none" : "auto";
    });
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
  }

  function go(i) {
    index = (i + cards.length) % cards.length;
    layout();
  }

  $("#galPrev").addEventListener("click", () => go(index - 1));
  $("#galNext").addEventListener("click", () => go(index + 1));
  cards.forEach((card, i) => card.addEventListener("click", () => { if (i !== index) go(i); }));

  // Swipe / drag
  let startX = null;
  const grab = (e) => { startX = (e.touches ? e.touches[0] : e).clientX; };
  const release = (e) => {
    if (startX === null) return;
    const dx = (e.changedTouches ? e.changedTouches[0] : e).clientX - startX;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    startX = null;
  };

  stage.addEventListener("touchstart", grab, { passive: true });
  stage.addEventListener("touchend", release, { passive: true });
  stage.addEventListener("mousedown", grab);
  stage.addEventListener("mouseup", release);
  stage.addEventListener("mouseleave", () => { startX = null; });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(index - 1);
    if (e.key === "ArrowRight") go(index + 1);
  });

  layout();
})();
