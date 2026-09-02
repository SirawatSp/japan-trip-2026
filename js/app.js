/* ============================================================
   秋の旅 — app logic
   ============================================================ */

const $ = (sel) => document.querySelector(sel);
/* เขียน/ผูก event แบบไม่ล้มถ้าหา element ไม่เจอ —
   ป้องกันกรณี HTML ที่ถูกแคชไว้เป็นเวอร์ชันเก่ากว่า JS แล้วทำให้สคริปต์ตายทั้งไฟล์
   (บั๊กแบบนี้เคยทำให้ปุ่มย่อ/ขยายทั้งหมดใช้ไม่ได้มาแล้ว) */
const setHTML = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; return el; };
const on = (sel, evt, fn) => { const el = $(sel); if (el) el.addEventListener(evt, fn); return el; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const yen = (n) => '¥' + Math.round(n).toLocaleString('en-US');
const baht = (n) => '฿' + Math.round(n).toLocaleString('en-US');
/* แปลงเยน → บาท ด้วยเรตปัจจุบันในหมวดงบ · ใช้คู่กับ yen() เพื่อให้ทุกตัวเลขมีบาทกำกับ */
const toThb = (y) => (rate > 0 ? baht(y * rate) : '฿—');
const yenThb = (y) => `${yen(y)} <span class="thb">≈${toThb(y)}</span>`;

/* ---------- persistent state ---------- */
const store = {
  /* ค่าที่บันทึกไว้ต้องเป็น "ชนิดเดียวกับ" ค่าตั้งต้น ไม่งั้นถือว่าข้อมูลเสียแล้วใช้ค่าตั้งต้นแทน —
     กัน localStorage ที่เพี้ยน (แก้มือ / เวอร์ชันเก่า / ซิงค์ผิดรูป) ทำให้ทั้งเว็บพัง
     หมายเหตุ: อาเรย์ว่างถือว่าใช้ได้ เพราะผู้ใช้อาจลบรายการออกจนหมดเองจริง ๆ */
  sameShape(val, fallback) {
    if (Array.isArray(fallback)) return Array.isArray(val);
    if (fallback !== null && typeof fallback === 'object') {
      return val !== null && typeof val === 'object' && !Array.isArray(val);
    }
    return typeof val === typeof fallback;
  },
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return structuredClone(fallback);
      const val = JSON.parse(raw);
      return this.sameShape(val, fallback) ? val : structuredClone(fallback);
    } catch { return structuredClone(fallback); }
  },
  save(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
};

let shopping = store.load('jt26_shopping', DEFAULT_SHOPPING);
let planned = store.load('jt26_planned', DEFAULT_BUDGET);
let expenses = store.load('jt26_expenses', []);
let rate = store.load('jt26_rate', TRIP.defaultRate);
let itinerary = store.load('jt26_itinerary', DEFAULT_ITINERARY);
/* ที่พัก: { [stayId]: { thb: ราคาต่อคืนทั้งหลัง, url: ลิงก์ที่จองจริง } } + เพดานต่อคน/คืน */
let stays = store.load('jt26_stays', {});
let stayCap = store.load('jt26_staycap', STAY_CAP_PER_PERSON_THB);

function persistAll() {
  store.save('jt26_shopping', shopping);
  store.save('jt26_planned', planned);
  store.save('jt26_expenses', expenses);
  store.save('jt26_rate', rate);
  store.save('jt26_itinerary', itinerary);
  store.save('jt26_stays', stays);
  store.save('jt26_staycap', stayCap);
  TripSync.push({ shopping, planned, expenses, rate, itinerary, stays, stayCap });
}

TripSync.init((remote) => {
  if (remote.shopping) shopping = remote.shopping;
  if (remote.planned) planned = remote.planned;
  if (remote.expenses) expenses = remote.expenses;
  if (typeof remote.rate === 'number') rate = remote.rate;
  if (remote.itinerary) itinerary = normalizeItinerary(remote.itinerary);
  if (remote.stays) stays = remote.stays;
  if (typeof remote.stayCap === 'number') stayCap = remote.stayCap;
  store.save('jt26_shopping', shopping);
  store.save('jt26_planned', planned);
  store.save('jt26_expenses', expenses);
  store.save('jt26_rate', rate);
  store.save('jt26_itinerary', itinerary);
  store.save('jt26_stays', stays);
  store.save('jt26_staycap', stayCap);
  $('#rate-input').value = rate;
  $('#exp-cat').innerHTML = planned.map((b) => `<option>${esc(b.cat)}</option>`).join('');
  /* เรตอาจถูกแก้จากอีกเครื่องผ่าน sync — วาดใหม่ทุกส่วนที่มีตัวเลขบาทเหมือนตอนแก้เรตเอง */
  renderMoneyViews();
});

/* ============ countdown ============ */
(function countdown() {
  const el = $('#countdown-days');
  const label = document.querySelector('.countdown-label');
  const now = new Date();
  const start = new Date(TRIP.start + 'T00:00:00');
  const end = new Date(TRIP.end + 'T23:59:59');
  const days = Math.ceil((start - now) / 86400000);
  if (now >= start && now <= end) {
    el.textContent = '🎌';
    label.textContent = 'กำลังเที่ยวอยู่ตอนนี้!';
  } else if (now > end) {
    el.textContent = '✈';
    label.textContent = 'ทริปจบแล้ว — วางแผนรอบหน้ากัน';
  } else {
    el.textContent = days;
  }
})();

/* ============ itinerary (fully editable timetable) ============ */
/* รูปแบบเก่าเก็บรายการเป็นสตริง — แปลงเป็น { t, act, note, cost } ให้อัตโนมัติ */
const TAG_HINTS = [
  ['nature', /เดินเขา|ทะเลสาบ|บึง|น้ำตก|ภูเขา|ยอด|สวน|หุบเขา|ป่า|Goshiki|Chuzenji|Kegon|Irohazaka|Akechidaira|Ryuzu|Jododaira|Issaikyo|Hibara|Inawashiro|Urabandai|Hanamiyama|Shinobu|แอปเปิล|แปะก๊วย/i],
  ['move',   /ชินคันเซ็น|รถไฟ|บัส|สนามบิน|บินกลับ|เช็คอิน|เช็คเอาท์|ล็อกเกอร์|ออกจาก|กลับ|ถึง |Shinkansen|Line|N'EX|Skyliner|Sky Access|Monorail/i],
  ['food',   /ข้าว|กิน|เกี๊ยวซ่า|ราเมง|คาเฟ่|เสบียง|มื้อ|อาหาร/i],
  ['other',  /เช็คพยากรณ์|เตรียมของ|พัก|ตื่น|นอน|ทางเลือก|อาบน้ำ/i],
];
function guessTag(text) {
  for (const [tag, re] of TAG_HINTS) if (re.test(text)) return tag;
  return 'city';
}
function normalizeItem(item) {
  if (typeof item === 'string') {
    const m = item.match(/^\s*(\d{1,2}[:.]\d{2})\s*(.*)$/);
    const base = m ? { t: m[1].replace('.', ':'), act: m[2] } : { t: '', act: item };
    return { ...base, note: '', cost: 0, tag: guessTag(base.act) };
  }
  const act = item.act || '';
  return {
    t: item.t || '', act, note: item.note || '', cost: +item.cost || 0,
    tag: ITEM_TAGS[item.tag] ? item.tag : guessTag(act + ' ' + (item.note || '')),
  };
}
function normalizeItinerary(list) {
  return (Array.isArray(list) ? list : []).map((d) => ({ ...d, items: (d.items || []).map(normalizeItem) }));
}
itinerary = normalizeItinerary(itinerary);

const dayCost = (d) => d.items.reduce((sum, i) => sum + (+i.cost || 0), 0);
function tagCounts(items) {
  const c = {};
  items.forEach((i) => { c[i.tag] = (c[i.tag] || 0) + 1; });
  return c;
}
function tagBar(items) {
  const c = tagCounts(items);
  const total = items.length || 1;
  const segs = ITEM_TAG_KEYS.filter((k) => c[k]).map((k) =>
    `<span class="tag-seg" style="width:${(c[k] / total) * 100}%;background:${ITEM_TAGS[k].color}" title="${ITEM_TAGS[k].th} ${c[k]}"></span>`).join('');
  const counts = ITEM_TAG_KEYS.filter((k) => c[k]).map((k) =>
    `<span class="tag-count" title="${ITEM_TAGS[k].th}">${ITEM_TAGS[k].icon} ${c[k]}</span>`).join('');
  return `<div class="tag-bar">${segs}</div><div class="tag-counts">${counts}</div>`;
}
const tripPlanCost = () => itinerary.reduce((sum, d) => sum + dayCost(d), 0);

/* ที่พักคืนนั้นของแต่ละวัน — DAY n ตรงกับคืนวันที่ (19+n) ต.ค. 2026 เทียบกับ STAYS.checkIn */
function overnightOf(day) {
  const iso = `2026-10-${String(19 + day).padStart(2, '0')}`;
  return STAYS.find((s) => s.checkIn <= iso && iso < s.checkOut) || null;
}
const overnightLabel = (day) => {
  const s = overnightOf(day);
  if (!s) return null;
  return (s.city || '').replace(/\s*\(คืนแรก\)\s*/, '');
};

/* ย่อ/ขยายการ์ดรายวัน — จำสถานะไว้ใน localStorage */
const savedCollapsed = store.load('jt26_collapsed_days', []);
let collapsedDays = new Set(Array.isArray(savedCollapsed) ? savedCollapsed : []);
function saveCollapsedDays() { store.save('jt26_collapsed_days', [...collapsedDays]); }


function renderItinerary() {
  $('#itinerary-grid').innerHTML = itinerary.map((d, di) => {
    const collapsed = collapsedDays.has(d.day);
    const stayCity = overnightLabel(d.day);
    return `
    <article class="day-card ${collapsed ? 'day-card-collapsed' : ''}" data-area="${d.area}">
      <div class="day-card-head">
        <span class="day-no">DAY ${d.day}</span>
        <div class="day-card-actions">
          <span class="day-cost mono" title="รวมราคาประมาณของวันนี้">${yenThb(dayCost(d))}</span>
          <button class="icon-btn day-map-btn" data-idx="${di}" title="ดูหมุดวันนี้บนแผนที่" aria-label="ดูบนแผนที่">📍</button>
          <button class="icon-btn day-collapse-btn" data-idx="${di}" data-day="${d.day}" title="${collapsed ? 'ขยายดูรายละเอียด' : 'ย่อเหลือแค่สรุป'}" aria-label="ย่อ/ขยาย">${collapsed ? '▸' : '▾'}</button>
          <button class="icon-btn day-del-btn" data-idx="${di}" title="ลบวันนี้ทั้งวัน" aria-label="ลบวันนี้">✕</button>
        </div>
      </div>

      <div class="day-summary-line">
        <span class="day-summary-date mono">${esc(d.date)}</span>
        <span class="day-summary-area">${esc(AREA_LABELS[d.area] || d.area)}</span>
        <span class="day-summary-title">${esc(d.title)}</span>
        ${stayCity ? `<span class="day-summary-stay">🛏 ค้างคืนที่ ${esc(stayCity)}</span>` : `<span class="day-summary-stay day-summary-stay-none">✈ ไม่ค้างคืน</span>`}
      </div>

      <div class="day-card-body">
        <div class="day-date-row">
          <input class="day-date-input mono" data-idx="${di}" value="${esc(d.date)}" aria-label="วันที่">
          <select class="day-area-select" data-idx="${di}" aria-label="พื้นที่ของวันนี้">
            ${Object.keys(AREA_LABELS).map((a) => `<option value="${a}" ${a === d.area ? 'selected' : ''}>${AREA_LABELS[a]}</option>`).join('')}
          </select>
        </div>
        <input class="day-title-input" data-idx="${di}" value="${esc(d.title)}" aria-label="หัวข้อของวันนี้">
        ${tagBar(d.items)}

        <div class="day-table" role="table">
          <div class="day-tr day-th" role="row"><span>เวลา</span><span>กิจกรรม / รายละเอียด</span><span>¥</span><span></span></div>
          ${d.items.map((item, ii) => `
          <div class="day-tr" role="row">
            <div class="day-time-cell">
              <input class="day-t-input mono" data-idx="${di}" data-item="${ii}" value="${esc(item.t)}" placeholder="09:00" aria-label="เวลา">
              <select class="day-tag-select" data-idx="${di}" data-item="${ii}" data-tag="${item.tag}" aria-label="ประเภทกิจกรรม" title="${ITEM_TAGS[item.tag].th}">
                ${ITEM_TAG_KEYS.map((k) => `<option value="${k}" ${k === item.tag ? 'selected' : ''}>${ITEM_TAGS[k].icon}</option>`).join('')}
              </select>
            </div>
            <div class="day-act-cell">
              <input class="day-act-input" data-idx="${di}" data-item="${ii}" value="${esc(item.act)}" placeholder="กิจกรรม" aria-label="กิจกรรม">
              <input class="day-note-input" data-idx="${di}" data-item="${ii}" value="${esc(item.note)}" placeholder="+ รายละเอียด / หมายเหตุ" aria-label="รายละเอียด">
            </div>
            <input class="day-cost-input mono" type="number" min="0" step="100" data-idx="${di}" data-item="${ii}" value="${item.cost || ''}" placeholder="0" aria-label="ราคาประมาณ">
            <button class="icon-btn item-del-btn" data-idx="${di}" data-item="${ii}" aria-label="ลบแถวนี้">✕</button>
          </div>`).join('')}
        </div>

        <div class="day-card-foot">
          <button class="btn-mini add-item-btn" data-idx="${di}">＋ เพิ่มแถว</button>
          <button class="btn-mini day-budget-btn" data-idx="${di}" title="บันทึกยอดรวมของวันนี้เป็นรายจ่าย">＋งบ ${yen(dayCost(d))}</button>
        </div>
      </div>
    </article>`;
  }).join('');

  const allItems = itinerary.flatMap((d) => d.items);
  const allCounts = tagCounts(allItems);
  $('#plan-legend').innerHTML = ITEM_TAG_KEYS.map((k) =>
    `<span class="legend-item"><span class="legend-dot" style="background:${ITEM_TAGS[k].color}"></span>${ITEM_TAGS[k].icon} ${ITEM_TAGS[k].th} <strong>${allCounts[k] || 0}</strong></span>`).join('')
    + `<span class="legend-note">นับจากจำนวนรายการในตาราง — เปลี่ยนป้ายของแต่ละแถวได้จากช่องไอคอนข้างเวลา</span>`;

  $('#plan-total').innerHTML = `รวมราคาประมาณจากแผนรายวันทั้งหมด
    <strong class="mono">${yen(tripPlanCost())}</strong>
    <span class="thb">≈ ${baht(tripPlanCost() * rate)}</span>
    <span class="plan-total-note">ค่าโดยประมาณต่อคน (ยังไม่รวมที่พัก) · ยอดนี้ยังไม่ถูกนับเข้างบจนกว่าจะกด「＋งบ」ในแต่ละวัน</span>`;
}

/* แจ้งเตือนเมื่อแผนเริ่มต้นในโค้ดใหม่กว่าที่บันทึกไว้ในเครื่อง — ไม่ทับของผู้ใช้เอง */
function checkItineraryVersion() {
  const savedV = store.load('jt26_itinerary_v', 0);
  const hasSaved = localStorage.getItem('jt26_itinerary') !== null;
  const banner = $('#itinerary-update');
  if (!hasSaved) { store.save('jt26_itinerary_v', ITINERARY_VERSION); banner.hidden = true; return; }
  banner.hidden = savedV >= ITINERARY_VERSION;
}

$('#itinerary-update').addEventListener('click', (e) => {
  if (e.target.closest('#load-new-plan')) {
    if (!confirm('โหลดแผนเริ่มต้นชุดใหม่ทับของเดิม? การแก้ไขที่ทำไว้เองจะหายไป')) return;
    itinerary = normalizeItinerary(structuredClone(DEFAULT_ITINERARY));
    store.save('jt26_itinerary_v', ITINERARY_VERSION);
    persistAll();
    renderItinerary();
  } else if (!e.target.closest('#keep-my-plan')) {
    return;
  } else {
    store.save('jt26_itinerary_v', ITINERARY_VERSION);
  }
  checkItineraryVersion();
});

renderItinerary();
checkItineraryVersion();

$('#collapse-all-btn')?.addEventListener('click', () => {
  itinerary.forEach((d) => collapsedDays.add(d.day));
  saveCollapsedDays();
  renderItinerary();
});
$('#expand-all-btn')?.addEventListener('click', () => {
  collapsedDays.clear();
  saveCollapsedDays();
  renderItinerary();
});


/* ============ ที่พัก (Airbnb) ============ */
let mapReady = false;
/* ดึงพิกัดจากสิ่งที่ผู้ใช้วางมา — รองรับทั้ง "lat,lng" ตรง ๆ และลิงก์ Google Maps หลายรูปแบบ
   ⚠️ ลิงก์ย่อ (goo.gl / maps.app.goo.gl) อ่านไม่ได้ เพราะพิกัดไม่ได้อยู่ในตัวลิงก์
      ต้องเปิดลิงก์ก่อนแล้วคัดลอก URL เต็มจากแถบที่อยู่ หรือคัดลอกพิกัดมาวาง */
function parseLatLng(input) {
  const str = String(input || '').trim();
  if (!str) return null;
  if (/(goo\.gl|maps\.app\.goo\.gl)/i.test(str)) return { short: true };
  const pats = [
    /[?&](?:q|query|daddr|ll|center)=(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/i,  // ?q=lat,lng
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,                                    // !3d..!4d..
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,                                        // @lat,lng,zoom
    /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/,                          // lat,lng
  ];
  for (const re of pats) {
    const m = str.match(re);
    if (m) {
      const lat = +m[1], lng = +m[2];
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

const stayOf = (id) => stays[id] || {};
/* พิกัดที่ผู้ใช้ปักเอง (ถ้ามี) ถือว่าสำคัญกว่าพิกัดสถานีที่ตั้งไว้ในข้อมูล */
const stayCoords = (s) => {
  const c = stayOf(s.id).coords;
  return c && Number.isFinite(c.lat) && Number.isFinite(c.lng) ? c : null;
};
const capPerNight = () => stayCap * STAY_GUESTS;              // ฿ ต่อคืน ทั้งหลัง
const stayNightly = (id) => +stayOf(id).thb || 0;             // ฿ ต่อคืน ทั้งหลัง
const stayTotalThb = (s) => stayNightly(s.id) * s.nights;
const stayLink = (s) => stayOf(s.id).url || (s.pick && s.pick.url) || '';
const staysTotalThb = () => STAYS.reduce((sum, s) => sum + stayTotalThb(s), 0);
const staysTotalYen = () => (rate > 0 ? staysTotalThb() / rate : 0);
const stayNightsTotal = () => STAYS.reduce((sum, s) => sum + s.nights, 0);

/* บล็อกราคาที่โผล่ใน popup ของหมุดที่พัก */
function stayPopupBlock(p) {
  const s = STAYS.find((x) => x.id === p.stayId);
  if (!s) return '';
  const nightly = stayNightly(s.id);
  const priceLine = nightly
    ? `${baht(nightly)}/${mt('stayNights').replace(/s$/, '')} · ${baht(nightly / STAY_GUESTS)}${mt('stayPerPerson')} ${nightly > capPerNight() ? '⚠️' : '✓'}`
    : mt('stayNoPrice');
  const link = stayLink(s) || airbnbSearch(p.query || s.searchQuery, s.checkIn, s.checkOut, capPerNight());
  return `<div class="popup-ticket">🛏 ${s.checkIn} → ${s.checkOut} · ${s.nights} ${mt('stayNights')} · ${esc(priceLine)}</div>
    <a class="popup-link" href="${esc(link)}" target="_blank" rel="noopener">${mt('stayBook')} ↗</a>`;
}

function renderStays() {
  const cap = capPerNight();
  { const el = $('#stay-cap-input'); if (el) el.value = stayCap; }
  $('#stay-cap-calc').innerHTML = `× ${STAY_GUESTS} คน = <strong class="mono">${baht(cap)}</strong> ต่อคืนทั้งหลัง
    <span class="thb">(≈ ${yen(rate > 0 ? cap / rate : 0)}/คืน)</span> · รวมเพดานทั้งทริป ${stayNightsTotal()} คืน = <strong class="mono">${baht(cap * stayNightsTotal())}</strong>`;

  setHTML('#stay-grid', STAYS.map((s) => {
    const nightly = stayNightly(s.id);
    const over = nightly > cap;
    const perPerson = nightly / STAY_GUESTS;
    const search = airbnbSearch(s.searchQuery, s.checkIn, s.checkOut, cap);
    const picked = stayOf(s.id).url;
    return `
    <article class="stay-card" data-area="${s.area}">
      <div class="stay-head">
        <div>
          <h3>${esc(s.city)} <span class="jp">${esc(s.ja)}</span></h3>
          <div class="stay-dates mono">${esc(s.checkIn)} → ${esc(s.checkOut)} · ${s.nights} คืน · ${s.days}</div>
        </div>
        <span class="stay-badge ${s.pick || picked ? 'has-pick' : ''}">${s.pick || picked ? '★ มีตัวเลือกแล้ว' : 'ยังไม่เลือก'}</span>
      </div>
      <div class="stay-station">🚉 ${esc(s.station)}</div>
      <p class="stay-note">${esc(s.note)}</p>

      ${s.candidates ? `<div class="stay-cands">
        ${s.candidates.map((c) => `
        <div class="stay-cand">
          <div class="stay-cand-head"><strong>${esc(c.name)}</strong> <span class="jp">${esc(c.ja)}</span></div>
          <div class="stay-cand-why">${esc(c.why)}</div>
          <a class="p-link" href="${esc(airbnbSearch(c.query, s.checkIn, s.checkOut, cap))}" target="_blank" rel="noopener">ค้นหาย่านนี้ใน Airbnb ↗</a>
        </div>`).join('')}
      </div>` : ''}

      <div class="stay-links">
        ${s.pick ? `<a class="btn-mini" href="${esc(s.pick.url)}" target="_blank" rel="noopener">↗ ${esc(s.pick.label)}</a>` : ''}
        ${picked ? `<a class="btn-mini" href="${esc(picked)}" target="_blank" rel="noopener">↗ ลิงก์ที่บันทึกไว้</a>` : ''}
        <a class="btn-mini" href="${esc(search)}" target="_blank" rel="noopener">🔍 ค้นหาที่กรองไว้แล้ว (4 คน · ห้องน้ำ 1+ · ≤${baht(cap)}/คืน)</a>
      </div>

      <div class="stay-inputs">
        <label>ราคา ฿/คืน (ทั้งหลัง)
          <input type="number" class="stay-price mono" data-stay="${s.id}" min="0" step="100" value="${nightly || ''}" placeholder="กรอกราคาที่เห็นใน Airbnb">
        </label>
        <label>ลิงก์ห้องที่เลือก (ถ้ามี)
          <input type="url" class="stay-url" data-stay="${s.id}" value="${esc(picked || '')}" placeholder="วางลิงก์ Airbnb ที่นี่">
        </label>
        <label class="stay-pin-label">📍 พิกัดที่พักจริง (ปักหมุดเอง)
          <input type="text" class="stay-pin" data-stay="${s.id}"
                 value="${stayCoords(s) ? `${stayCoords(s).lat},${stayCoords(s).lng}` : ''}"
                 placeholder="วางลิงก์ Google Maps แบบเต็ม หรือ 35.6896,139.7006">
          <span class="stay-pin-state">${stayCoords(s)
            ? `✓ ปักหมุดจริงแล้ว — <button type="button" class="linkish stay-pin-clear" data-stay="${s.id}">กลับไปใช้หมุดสถานี</button>`
            : 'ยังไม่ได้ปัก — ตอนนี้หมุดอยู่ที่สถานี/ย่านโดยประมาณ'}</span>
        </label>
      </div>

      <div class="stay-verdict ${nightly ? (over ? 'over' : 'ok') : 'empty'}">
        ${nightly
          ? `${over ? '⚠️ เกินเพดาน' : '✓ อยู่ในเพดาน'} — <span class="mono">${baht(perPerson)}</span>/คน/คืน
             · รวม ${s.nights} คืน <span class="mono">${baht(stayTotalThb(s))}</span>
             <span class="thb">(≈ ${yen(rate > 0 ? stayTotalThb(s) / rate : 0)})</span>
             ${over ? `· เกินไป <span class="mono">${baht(perPerson - stayCap)}</span>/คน/คืน` : `· เหลืออีก <span class="mono">${baht(stayCap - perPerson)}</span>/คน/คืน`}`
          : 'ยังไม่ได้กรอกราคา — เปิดลิงก์ด้านบนไปดูราคาจริงแล้วกรอกกลับมา'}
      </div>
    </article>`;
  }).join(''));

  const totalThb = staysTotalThb();
  const totalYen = staysTotalYen();
  const capTotal = cap * stayNightsTotal();
  const priced = STAYS.filter((s) => stayNightly(s.id) > 0);
  const filled = priced.length;
  const pricedNights = priced.reduce((sum, s) => sum + s.nights, 0);
  const stayBudget = planned.find((b) => b.cat === STAY_BUDGET_CAT);
  $('#stay-total').innerHTML = `
    <div class="sum-block"><span class="sum-label">กรอกราคาแล้ว</span><strong>${filled}/${STAYS.length} ที่พัก</strong><span class="sum-label">${stayNightsTotal()} คืน</span></div>
    <div class="sum-block"><span class="sum-label">รวมค่าที่พัก</span><strong>${baht(totalThb)}</strong><span class="sum-label thb">≈ ${yen(totalYen)}</span></div>
    <div class="sum-block"><span class="sum-label">ตกคนละ (ทั้งทริป)</span><strong>${baht(totalThb / STAY_GUESTS)}</strong><span class="sum-label">${pricedNights ? baht(totalThb / STAY_GUESTS / pricedNights) + '/คืน (เฉลี่ยจาก ' + pricedNights + ' คืนที่กรอกแล้ว)' : '—'}</span></div>
    <div class="sum-block"><span class="sum-label">${totalThb > capTotal ? 'เกินเพดานรวม' : 'ต่ำกว่าเพดานรวม'}</span><strong class="${totalThb > capTotal ? 'b-over' : ''}">${baht(Math.abs(capTotal - totalThb))}</strong><span class="sum-label">เพดาน ${baht(capTotal)}</span></div>
    ${stayBudget ? `<div class="sum-block"><span class="sum-label">เทียบงบที่ตั้งไว้</span><strong class="${totalYen > stayBudget.planned ? 'b-over' : ''}">${yen(stayBudget.planned)}</strong><span class="sum-label">${totalYen > stayBudget.planned ? 'ค่าที่พักจริงเกินงบหมวดนี้' : 'ยอดนี้ไหลเข้าหมวด「ที่พัก」ให้แล้ว'}</span></div>` : ''}`;

  /* หมุดที่พักบนแผนที่ต้องโชว์ราคาล่าสุดด้วย */
  if (mapReady) {
    markers.forEach((m) => { if (m._place.type === 'stay') m.setPopupContent(popupHtml(m._place)); });
  }
}

on('#stay-cap-input', 'change', (e) => {
  stayCap = +e.target.value || STAY_CAP_PER_PERSON_THB;
  persistAll();
  renderStays();
});

on('#stay-grid', 'change', (e) => {
  const priceInput = e.target.closest('.stay-price');
  const urlInput = e.target.closest('.stay-url');
  const pinInput = e.target.closest('.stay-pin');
  const field = priceInput || urlInput || pinInput;
  const id = field && field.dataset.stay;
  if (!id) return;
  stays[id] = stays[id] || {};
  if (priceInput) stays[id].thb = +priceInput.value || 0;
  if (urlInput) stays[id].url = urlInput.value.trim();
  if (pinInput) {
    const raw = pinInput.value.trim();
    if (!raw) {
      delete stays[id].coords;
    } else {
      const parsed = parseLatLng(raw);
      if (parsed && parsed.short) {
        alert('ลิงก์ย่อ (goo.gl / maps.app.goo.gl) อ่านพิกัดไม่ได้ เพราะตัวเลขพิกัดไม่ได้อยู่ในลิงก์\n\n'
          + 'วิธีทำ: เปิดลิงก์นั้นในเบราว์เซอร์ก่อน แล้วคัดลอก URL เต็มจากแถบที่อยู่มาวางแทน\n'
          + 'หรือคลิกขวาบนหมุดใน Google Maps แล้วเลือกคัดลอกพิกัด (จะได้เลขแบบ 35.6896, 139.7006)');
        renderStays();
        return;
      }
      if (!parsed) {
        alert('อ่านพิกัดจากข้อความนี้ไม่ได้\n\nใส่ได้สองแบบ:\n'
          + '1) ลิงก์ Google Maps แบบเต็ม (ที่มี @35.68…,139.70… อยู่ใน URL)\n'
          + '2) พิกัดตรง ๆ เช่น 35.6896,139.7006');
        renderStays();
        return;
      }
      stays[id].coords = parsed;
    }
  }
  persistAll();
  renderStays();
  renderBudget();
  syncStayPins();
});

/* ปุ่มยกเลิกหมุดที่ปักเอง */
on('#stay-grid', 'click', (e) => {
  const btn = e.target.closest('.stay-pin-clear');
  if (!btn) return;
  const id = btn.dataset.stay;
  if (stays[id]) delete stays[id].coords;
  persistAll();
  renderStays();
  syncStayPins();
});

/* ย้ายหมุดที่พักบนแผนที่ให้ตรงกับพิกัดที่ปักเอง */
function syncStayPins() {
  if (!mapReady) return;
  STAYS.forEach((s) => {
    const c = stayCoords(s);
    let marker = markers.find((m) => m._place.type === 'stay' && m._place.stayId === s.id && !m._place.query);

    /* ที่พักที่มีแต่ "ย่านตัวเลือก" (เช่นโตเกียว) ยังไม่มีหมุดของตัวเอง —
       สร้างให้ตอนที่ผู้ใช้ปักพิกัดจริงเข้ามาเท่านั้น */
    if (!marker) {
      if (!c) return;
      const place = {
        name: `ที่พัก ${s.city}`, ja: s.ja, area: s.area, lat: c.lat, lng: c.lng,
        day: { utsunomiya: 1 }[s.id] || 3, type: 'stay', stayId: s.id, url: stayLink(s),
        desc: `🛏 ${s.nights} คืน · ${s.checkIn} → ${s.checkOut} · ${STAY_GUESTS} คน — ${s.station}`,
        en: { name: `${s.en.city} stay`, desc: `🛏 ${s.nights} nights · ${s.checkIn} → ${s.checkOut} · ${STAY_GUESTS} guests` },
      };
      PLACES.push(place);
      marker = L.marker([c.lat, c.lng], { icon: pinIcon(AREA_COLORS[s.area]) });
      marker._place = place;
      marker.bindPopup(popupHtml(place));
      markers.push(marker);
    }

    const target = c || { lat: s.lat, lng: s.lng };
    marker._place.lat = target.lat;
    marker._place.lng = target.lng;
    marker._place.pinnedByUser = !!c;
    marker.setLatLng([target.lat, target.lng]);
    marker.setPopupContent(popupHtml(marker._place));
  });
  refreshMap();
}

/* ============ map ============ */
const map = L.map('leaflet-map', { scrollWheelZoom: false });

/* ---------- base maps ----------
   ป้ายชื่อบนตัวแผนที่มาจาก tile server ไม่ใช่โค้ดเรา — OSM ใช้ชื่อท้องถิ่น (ญี่ปุ่น) เสมอ
   จึงต้องสลับไปใช้ tile ของ Esri ที่ป้ายเป็นอังกฤษ มีให้เลือก 2 แบบเผื่อบางโซนอ่านยาก */
const ESRI_ATTR = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>';
const BASEMAPS = {
  'en-street': {
    label: 'EN · Street',
    make: () => L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      { attribution: ESRI_ATTR + ' — Esri, HERE, Garmin, USGS, NGA', maxZoom: 19 }),
  },
  'en-light': {
    label: 'EN · Light',
    make: () => L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { attribution: ESRI_ATTR + ' — Esri, HERE, Garmin', maxZoom: 16, maxNativeZoom: 16 }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16, maxNativeZoom: 16 }),
    ]),
  },
  'local': {
    label: '日本語 · OSM',
    make: () => L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 }),
  },
};
Object.values(BASEMAPS).forEach((b) => { b.layer = b.make(); });

/* ---------- map language (EN default, persisted) ---------- */
let mapLang = store.load('jt26_maplang', 'en');
let basemapKey = store.load('jt26_basemap', mapLang === 'en' ? 'en-street' : 'local');
if (!BASEMAPS[basemapKey]) basemapKey = 'en-street';

function setBasemap(key, remember = true) {
  if (!BASEMAPS[key]) return;
  Object.entries(BASEMAPS).forEach(([k, b]) => {
    if (k !== key && map.hasLayer(b.layer)) map.removeLayer(b.layer);
  });
  if (!map.hasLayer(BASEMAPS[key].layer)) BASEMAPS[key].layer.addTo(map);
  basemapKey = key;
  if (remember) store.save('jt26_basemap', key);
  document.querySelectorAll('#basemap-picker button').forEach((b) =>
    b.classList.toggle('active', b.dataset.basemap === key));
}
setBasemap(basemapKey, false);
const mt = (key) => MAP_UI[mapLang][key];
const areaLabel = (area) => (mapLang === 'en' ? AREA_LABELS_EN : AREA_LABELS)[area];
const placeName = (p) => (mapLang === 'en' && p.en ? p.en.name : p.name);
const placeDesc = (p) => (mapLang === 'en' && p.en ? p.en.desc : p.desc);
const placeTicket = (p) => (mapLang === 'en' && p.en && p.en.ticket ? p.en.ticket : p.ticket);

function pinIcon(color) {
  return L.divIcon({
    className: 'pin-marker',
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="14.5" r="5.5" fill="#fffdf7"/></svg>`,
    iconSize: [30, 40], iconAnchor: [15, 40], popupAnchor: [0, -38],
  });
}

const dayLabel = (p) => (p.day ? `DAY ${p.day}` : mt('outsideTrip'));
/* search in the map language: EN name for English, Thai name + kanji for Thai */
const searchUrl = (p) => (mapLang === 'en'
  ? `https://www.google.com/search?q=${encodeURIComponent(placeName(p) + ' Japan')}&hl=en`
  : `https://www.google.com/search?q=${encodeURIComponent(p.name + ' ' + p.ja)}`);
const gmapsUrl = (p) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}&hl=${mapLang}`;

function popupHtml(p) {
  return `
    ${p.img ? `<img class="popup-img" src="${esc(p.img)}" alt="${esc(placeName(p))}" loading="lazy">` : ''}
    <div class="popup-title">${esc(placeName(p))}</div>
    <div class="popup-ja">${esc(p.ja)}</div>
    <div class="popup-desc">${esc(placeDesc(p))}</div>
    <span class="popup-day">${dayLabel(p)} · ${areaLabel(p.area)}</span>${p.type === 'museum' ? ' <span class="popup-tag">🏛 Museum</span>' : ''}${p.taniguchi ? ' <span class="popup-tag popup-tag-taniguchi">✏️ Taniguchi</span>' : ''}${p.type === 'stay' ? ' <span class="popup-tag popup-tag-stay">🛏</span>' : ''}${p.type === 'car' ? ' <span class="popup-tag popup-tag-car">🚗</span>' : ''}${p.type === 'cam' ? ' <span class="popup-tag popup-tag-cam">🔴 LIVE</span>' : ''}
    ${placeTicket(p) ? `<div class="popup-ticket">🎫 ${esc(placeTicket(p))}</div>` : ''}
    ${p.pinnedByUser ? '<div class="popup-pinned">📍 หมุดนี้คือตำแหน่งที่พักจริงที่ปักไว้เอง</div>' : ''}
    ${p.type === 'stay' ? stayPopupBlock(p) : ''}
    <a class="popup-link" href="${esc(p.url || searchUrl(p))}" target="_blank" rel="noopener">${p.url ? mt('official') : mt('search')} ↗</a>
    <a class="popup-link" href="${esc(gmapsUrl(p))}" target="_blank" rel="noopener">${mt('directions')} ↗</a>`;
}

const markers = PLACES.map((p) => {
  const m = L.marker([p.lat, p.lng], { icon: pinIcon(AREA_COLORS[p.area]) });
  m.bindPopup(popupHtml(p));
  m._place = p;
  return m;
});

mapReady = true;

const routeLine = L.polyline(ROUTE, {
  color: '#2b2118', weight: 2.5, dashArray: '7 7', opacity: .55,
});

let activeArea = 'all';
let activeType = 'all'; // 'all' | 'museum' | 'taniguchi'

function placeMatches(p) {
  /* ตัวกรองที่รวมสถานที่นอกเส้นทางทริปไว้ด้วย จึงต้องยอมให้ area 'other' ผ่าน */
  const includesNationwide = activeType === 'taniguchi' || activeType === 'spot' || activeType === 'cam';
  const areaOk = activeArea === 'all'
    ? (includesNationwide ? true : p.area !== 'other')
    : p.area === activeArea;
  const typeOk = activeType === 'all'
    || (activeType === 'museum' && p.type === 'museum')
    || (activeType === 'taniguchi' && p.taniguchi === true)
    || (activeType === 'stay' && p.type === 'stay')
    || (activeType === 'car' && p.type === 'car')
    || (activeType === 'spot' && p.type === 'spot')
    || (activeType === 'cam' && p.type === 'cam');
  return areaOk && typeOk;
}

function refreshMap() {
  markers.forEach((m) => {
    const show = placeMatches(m._place);
    if (show && !map.hasLayer(m)) m.addTo(map);
    if (!show && map.hasLayer(m)) map.removeLayer(m);
  });
  if ($('#route-toggle').checked && activeArea === 'all' && activeType === 'all') {
    if (!map.hasLayer(routeLine)) routeLine.addTo(map);
  } else if (map.hasLayer(routeLine)) {
    map.removeLayer(routeLine);
  }
  const visible = markers.filter((m) => map.hasLayer(m));
  if (visible.length) {
    map.fitBounds(L.featureGroup(visible).getBounds().pad(0.15));
  }
  renderPlaceList();
}

function renderPlaceList() {
  const list = PLACES.filter(placeMatches);
  $('#place-list').innerHTML = list.map((p) => `
    <div class="place-item" data-area="${p.area}" data-lat="${p.lat}" data-lng="${p.lng}">
      ${p.img ? `<img class="place-thumb" src="${esc(p.img)}" alt="" loading="lazy">` : ''}
      <div class="place-item-body">
        <div class="p-name">${esc(placeName(p))} <span class="popup-ja">${esc(p.ja)}</span>${p.type === 'museum' ? ' <span class="popup-tag">🏛</span>' : ''}${p.taniguchi ? ' <span class="popup-tag popup-tag-taniguchi">✏️</span>' : ''}</div>
        <div class="p-meta">${dayLabel(p)} · ${areaLabel(p.area)} — ${esc(placeDesc(p))}</div>
        ${placeTicket(p) ? `<div class="p-ticket">🎫 ${esc(placeTicket(p))}</div>` : ''}
        <a class="p-link" href="${esc(p.url || searchUrl(p))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${p.url ? mt('official') : mt('search')} ↗</a>
        <a class="p-link" href="${esc(gmapsUrl(p))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${mt('directions')} ↗</a>
      </div>
    </div>`).join('') || `<p class="empty-note">${mt('empty')}</p>`;
}

$('#map-filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button.chip');
  if (!btn || !btn.dataset.filter) return; // ignore the language toggle sharing this row
  activeArea = btn.dataset.filter;
  document.querySelectorAll('#map-filters button.chip[data-filter]').forEach((b) => b.classList.toggle('active', b === btn));
  refreshMap();
});
$('#route-toggle').addEventListener('change', refreshMap);

/* ---------- map language switch (EN ⇄ ไทย) ---------- */
function applyMapLang() {
  const ui = MAP_UI[mapLang];
  document.querySelector('#map .section-desc').textContent = ui.sectionDesc;
  $('#map-filters [data-filter="all"]').textContent = ui.all;
  const otherChip = $('#map-filters [data-filter="other"]');
  otherChip.innerHTML = `<span class="dot" data-area="other"></span>${esc(ui.other)}`;
  $('#route-toggle').parentElement.lastChild.textContent = ' ' + ui.route;
  $('#type-filters [data-type="all"]').textContent = ui.allTypes;
  $('#type-filters [data-type="museum"]').textContent = ui.museum;
  $('#type-filters [data-type="taniguchi"]').textContent = ui.taniguchi;
  document.querySelectorAll('#map-lang button').forEach((b) =>
    b.classList.toggle('active', b.dataset.lang === mapLang));
  document.querySelectorAll('#basemap-picker button').forEach((b) =>
    b.classList.toggle('active', b.dataset.basemap === basemapKey));
  markers.forEach((m) => m.setPopupContent(popupHtml(m._place)));
  renderPlaceList();
}

$('#basemap-picker').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-basemap]');
  if (!btn) return;
  setBasemap(btn.dataset.basemap);
});

$('#map-lang').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-lang]');
  if (!btn || btn.dataset.lang === mapLang) return;
  mapLang = btn.dataset.lang;
  store.save('jt26_maplang', mapLang);
  /* สลับภาษา = สลับ tile ให้ตรงกันด้วย แต่ถ้าผู้ใช้เลือก basemap เองไว้แล้วก็เคารพตัวเลือกนั้น */
  if (mapLang === 'en' && basemapKey === 'local') setBasemap('en-street');
  else if (mapLang === 'th' && basemapKey !== 'local') setBasemap('local');
  applyMapLang();
});

$('#type-filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button.chip');
  if (!btn || !btn.dataset.type) return;
  activeType = btn.dataset.type;
  document.querySelectorAll('#type-filters button.chip[data-type]').forEach((b) => b.classList.toggle('active', b === btn));
  refreshMap();
});

$('#place-list').addEventListener('click', (e) => {
  const item = e.target.closest('.place-item');
  if (!item) return;
  const lat = +item.dataset.lat, lng = +item.dataset.lng;
  map.flyTo([lat, lng], 13, { duration: .8 });
  const marker = markers.find((m) => m._place.lat === lat && m._place.lng === lng);
  if (marker && map.hasLayer(marker)) setTimeout(() => marker.openPopup(), 850);
});

/* itinerary 📍 button → focus map on that day's pins */
function jumpMapToDay(day) {
  const dayPlaces = PLACES.filter((p) => p.day === day);
  document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
  if (!dayPlaces.length) return;
  activeArea = 'all';
  document.querySelectorAll('#map-filters button.chip[data-filter]').forEach((b) =>
    b.classList.toggle('active', b.dataset.filter === 'all'));
  refreshMap();
  setTimeout(() => {
    map.fitBounds(L.latLngBounds(dayPlaces.map((p) => [p.lat, p.lng])).pad(0.3));
    const first = markers.find((m) => m._place === dayPlaces[0]);
    if (first) first.openPopup();
  }, 450);
}

$('#itinerary-grid').addEventListener('click', (e) => {
  const mapBtn = e.target.closest('.day-map-btn');
  if (mapBtn) { jumpMapToDay(itinerary[+mapBtn.dataset.idx].day); return; }

  const collapseBtn = e.target.closest('.day-collapse-btn');
  if (collapseBtn) {
    const day = +collapseBtn.dataset.day;
    if (collapsedDays.has(day)) collapsedDays.delete(day); else collapsedDays.add(day);
    saveCollapsedDays();
    renderItinerary();
    return;
  }

  const delDayBtn = e.target.closest('.day-del-btn');
  if (delDayBtn) {
    const idx = +delDayBtn.dataset.idx;
    if (!confirm(`ลบ "${itinerary[idx].date} — ${itinerary[idx].title}" ทั้งวันเลยไหม?`)) return;
    itinerary.splice(idx, 1);
    persistAll();
    renderItinerary();
    return;
  }

  const addItemBtn = e.target.closest('.add-item-btn');
  if (addItemBtn) {
    itinerary[+addItemBtn.dataset.idx].items.push({ t: '', act: 'รายการใหม่', note: '', cost: 0, tag: 'other' });
    persistAll();
    renderItinerary();
    return;
  }

  const dayBudgetBtn = e.target.closest('.day-budget-btn');
  if (dayBudgetBtn) {
    const d = itinerary[+dayBudgetBtn.dataset.idx];
    const amount = dayCost(d);
    if (!amount) return;
    expenses.push({
      name: `แผน DAY ${d.day} — ${d.title}`.slice(0, 80),
      amount,
      cat: 'ตั๋วเข้าชม/กิจกรรม',
      day: DAY_OPTIONS[d.day] || DAY_OPTIONS[0],
    });
    persistAll();
    dayBudgetBtn.classList.add('added');
    dayBudgetBtn.textContent = '✓ เข้างบแล้ว';
    renderBudget();
    renderExpenses();
    return;
  }

  const itemDelBtn = e.target.closest('.item-del-btn');
  if (itemDelBtn) {
    itinerary[+itemDelBtn.dataset.idx].items.splice(+itemDelBtn.dataset.item, 1);
    persistAll();
    renderItinerary();
  }
});

$('#itinerary-grid').addEventListener('change', (e) => {
  const idx = +e.target.dataset.idx;
  if (Number.isNaN(idx)) return;
  const ii = +e.target.dataset.item;
  if (e.target.matches('.day-date-input')) itinerary[idx].date = e.target.value;
  else if (e.target.matches('.day-area-select')) itinerary[idx].area = e.target.value;
  else if (e.target.matches('.day-title-input')) itinerary[idx].title = e.target.value;
  else if (e.target.matches('.day-t-input')) itinerary[idx].items[ii].t = e.target.value;
  else if (e.target.matches('.day-act-input')) itinerary[idx].items[ii].act = e.target.value;
  else if (e.target.matches('.day-note-input')) itinerary[idx].items[ii].note = e.target.value;
  else if (e.target.matches('.day-cost-input')) itinerary[idx].items[ii].cost = +e.target.value || 0;
  else if (e.target.matches('.day-tag-select')) itinerary[idx].items[ii].tag = e.target.value;
  else return;
  persistAll();
  if (e.target.matches('.day-area-select') || e.target.matches('.day-cost-input') || e.target.matches('.day-tag-select')) renderItinerary();
});

$('#add-day-btn').addEventListener('click', () => {
  const nextDay = itinerary.length ? Math.max(...itinerary.map((d) => d.day)) + 1 : 1;
  itinerary.push({ day: nextDay, date: 'วันที่ใหม่', area: 'tokyo', title: 'แผนวันใหม่', items: [{ t: '', act: 'รายการใหม่', note: '', cost: 0, tag: 'other' }] });
  persistAll();
  renderItinerary();
});

$('#reset-itinerary-btn').addEventListener('click', () => {
  if (!confirm('รีเซ็ตแผนรายวันทั้งหมดกลับเป็นค่าเริ่มต้น? การแก้ไขทั้งหมดจะหายไป')) return;
  itinerary = normalizeItinerary(structuredClone(DEFAULT_ITINERARY));
  store.save('jt26_itinerary_v', ITINERARY_VERSION);
  persistAll();
  renderItinerary();
  checkItineraryVersion();
});

refreshMap();
applyMapLang();

/* ============ transport ============ */
let transportBound = false;
function renderTransport() {
  $('#transport-list').innerHTML = TRANSPORT.map((seg, si) => `
    <div class="seg-card">
      <div class="seg-head"><span class="seg-day">${esc(seg.day)}</span><h3>${esc(seg.title)}</h3></div>
      <div class="seg-options">
        ${seg.options.map((o, oi) => `
        <div class="seg-opt">
          <div class="o-method">${esc(o.method)}<span class="o-note">${esc(o.note)}</span></div>
          <span class="o-time">${esc(o.time)}</span>
          <span class="o-price">${yenThb(o.price)}</span>
          <button class="btn-mini" data-seg="${si}" data-opt="${oi}">＋งบ</button>
        </div>`).join('')}
      </div>
    </div>`).join('');

  { const el = $('#rail-total'); if (el) el.innerHTML = yenThb(RAIL_MAIN_TOTAL); }

  /* 'DAY 3 · 22 ต.ค.' -> 'D3 · 22 ต.ค.' ให้ตรงกับตัวเลือกวันในเครื่องคิดงบ */
  const fareDayOption = (label) => {
    const m = /^DAY (\d+) · (.+)$/.exec(label);
    const opt = m && `D${m[1]} · ${m[2]}`;
    return DAY_OPTIONS.includes(opt) ? opt : 'ก่อนทริป';
  };

  /* ตารางค่ารถไฟรายเส้นทาง — ทุกแถวลิงก์ไปเช็คราคาสดใน Google Maps */
  const transitUrl = (from, to) =>
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=transit&hl=th`;

  setHTML('#fare-legs', RAIL_FARES.map((leg, li) => {
    const cheapest = Math.min(...leg.options.map((o) => o.price));
    return `
    <article class="fare-leg">
      <div class="fare-leg-head">
        <div>
          <h4>${esc(leg.leg)}</h4>
          <span class="fare-day">${esc(leg.day)}</span>
        </div>
        <a class="btn-mini" href="${transitUrl(leg.from, leg.to)}" target="_blank" rel="noopener">🔎 เช็คราคาสด ↗</a>
      </div>
      <table class="fare-table">
        <thead><tr><th>วิธี</th><th>เวลา</th><th>เปลี่ยนขบวน</th><th class="fare-num">ราคา/คน</th></tr></thead>
        <tbody>
          ${leg.options.map((o, oi) => `
          <tr class="${o.price === cheapest ? 'fare-cheap' : ''}">
            <td>
              <span class="fare-method">${esc(o.method)}</span>
              <span class="conf-tag conf-${o.conf}">${o.conf === 'src' ? 'อ้างอิงแล้ว' : 'ประมาณการ'}</span>
              <span class="fare-note">${esc(o.note)}</span>
            </td>
            <td class="fare-time">${esc(o.time)}</td>
            <td class="fare-xfer">${esc(o.xfer)}</td>
            <td class="fare-num"><span class="mono">${yenThb(o.price)}</span>
              <span class="fare-four">×4 = ${yenThb(o.price * 4)}</span>
              <button class="btn-mini fare-add" data-leg="${li}" data-opt="${oi}">＋งบ</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </article>`;
  }).join(''));

  setHTML('#fare-local-list', RAIL_LOCAL_NOTES.map((n) =>
    `<li><strong>${esc(n.what)}</strong> — ${esc(n.detail)}</li>`).join(''));

  on('#fare-legs', 'click', (e) => {
    const btn = e.target.closest('.fare-add');
    if (!btn) return;
    const leg = RAIL_FARES[+btn.dataset.leg];
    const opt = leg.options[+btn.dataset.opt];
    if (btn.classList.contains('added')) return;
    expenses.push({ name: `${leg.leg} — ${opt.method} (4 คน)`, amount: opt.price * 4, cat: 'เดินทาง', day: fareDayOption(leg.day) });
    persistAll();
    btn.classList.add('added');
    btn.textContent = '✓ แล้ว';
    renderBudget();
    renderExpenses();
  });

  /* ร้านเช่ารถรอบสถานี Fukushima */
  setHTML('#rental-grid', CAR_RENTALS.map((r, i) => `
    <article class="rental-card">
      <div class="rental-head">
        <a class="rental-name" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)} ↗</a>
        <span class="jp rental-ja">${esc(r.ja)}</span>
      </div>
      <div class="rental-walk">🚶 ${esc(r.walk)}</div>
      <p class="rental-note">${esc(r.note)}</p>
      <div class="rental-actions">
        <a class="btn-mini" href="${esc(r.url)}" target="_blank" rel="noopener">ไปหน้าจอง ↗</a>
        <a class="btn-mini" href="https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}&hl=th" target="_blank" rel="noopener">เปิดใน Google Maps ↗</a>
        <button class="btn-mini rental-map-btn" data-i="${i}">📍 ดูบนแผนที่</button>
      </div>
    </article>`).join(''));

  setHTML('#rental-sites', CAR_BOOKING_SITES.map((s) =>
    `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join(''));

  const c2 = CAR_PLAN;
  setHTML('#rental-price-note', `<strong>ราคาอ้างอิง:</strong> เว็บเทียบราคารายงานรถเล็กในจังหวัดฟุกุชิมะเริ่มราว
    <span class="mono">US$37–51/วัน</span> (≈ <span class="mono">¥5,500–7,600</span>) แล้วแต่เจ้าและวันที่ —
    แผนของเราตั้งงบไว้ที่ <span class="mono">${yen(c2.carPerDay)}/วัน</span> เพราะ 4 คนต้องขยับไปรถขนาดกลาง/แวกอนให้พอกับกระเป๋า
    และ 23–24 ต.ค. เป็นเสาร์-อาทิตย์ช่วงใบไม้เปลี่ยนสีซึ่งราคาขึ้น ·
    ตัวเลขนี้แก้ได้ที่ <span class="mono">CAR_PLAN.carPerDay</span> ใน <span class="mono">js/data.js</span> เมื่อได้ราคาจริงแล้ว`);

  /* คุ้มไหมถ้าเช่ารถช่วง Fukushima */
  const c = CAR_PLAN;
  const carTotal = c.carPerDay * c.days + c.fuel + c.parking;
  const carEach = carTotal / c.guests;
  const publicEach = c.publicHike + c.publicLake;
  const saveEach = publicEach - carEach;
  setHTML('#car-note', `
    <h3>🚗 คุ้มไหมถ้าเช่ารถ ${c.days} วันตอนอยู่ Fukushima (23–24 ต.ค.)?</h3>
    <table class="mini-table">
      <tr><td>ค่ารถ ${c.days} วัน (รถกลาง/แวกอน พอ 4 คน + กระเป๋า)</td><td class="mono">${yenThb(c.carPerDay * c.days)}</td></tr>
      <tr><td>น้ำมัน (Urabandai ไป-กลับ + ขึ้น Skyline)</td><td class="mono">${yenThb(c.fuel)}</td></tr>
      <tr><td>ที่จอดนอกที่พัก (Jododaira ฯลฯ)</td><td class="mono">${yenThb(c.parking)}</td></tr>
      <tr><td><strong>รวมต่อคัน</strong></td><td class="mono"><strong>${yenThb(carTotal)}</strong></td></tr>
      <tr><td><strong>หาร ${c.guests} คน</strong></td><td class="mono"><strong>${yenThb(carEach)}/คน</strong></td></tr>
      <tr><td>ถ้าไม่เช่ารถ: Sky Access ${yen(c.publicHike)} + ค่ารถวันทะเลสาบ ~${yen(c.publicLake)}</td><td class="mono">${yenThb(publicEach)}/คน</td></tr>
    </table>
    <p><strong>เช่ารถถูกกว่าประมาณ ${yen(saveEach)} ต่อคน (≈ ${baht(saveEach * rate)})</strong>
    และที่พัก Fukushima มีที่จอดรถอยู่แล้ว จึงไม่มีค่าจอดรายคืนเพิ่ม</p>
    <p class="note">⚠️ เงื่อนไขก่อนตัดสินใจ: ต้องมี<strong>ใบขับขี่สากลแบบอนุสัญญาเจนีวา 1949</strong> (ทำที่กรมการขนส่งฯ ใช้ได้ 1 ปี) พร้อมใบขับขี่ไทยตัวจริง · ญี่ปุ่นขับเลนซ้าย พวงมาลัยขวา ·
    Bandai-Azuma Skyline และ Lake Line ไม่มีค่าผ่านทาง แต่ทางโค้งเยอะและ<strong>ประตูอาจปิดกลางคืน 17:00–07:00</strong> ถ้าเสี่ยงถนนลื่น ·
    ปลาย ต.ค. บนเขา 1,600 ม. อาจมีน้ำแข็งช่วงเช้ามืด · จองรถล่วงหน้าเพราะเป็นเสาร์-อาทิตย์ฤดูใบไม้แดง · ยืนยันกับเจ้าของ Airbnb ว่าที่จอดฟรีและรถขนาดไหนเข้าได้</p>`);

  if (!transportBound) {
  on('#rental-grid', 'click', (e) => {
    const btn = e.target.closest('.rental-map-btn');
    if (!btn) return;
    const r = CAR_RENTALS[+btn.dataset.i];
    document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
    activeType = 'car';
    document.querySelectorAll('#type-filters button.chip[data-type]').forEach((b) =>
      b.classList.toggle('active', b.dataset.type === 'car'));
    refreshMap();
    setTimeout(() => {
      map.flyTo([r.lat, r.lng], 16, { duration: .8 });
      const marker = markers.find((m) => m._place.lat === r.lat && m._place.lng === r.lng);
      if (marker && map.hasLayer(marker)) setTimeout(() => marker.openPopup(), 850);
    }, 400);
  });



  $('#transport-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-mini');
    if (!btn || btn.classList.contains('added')) return;
    const seg = TRANSPORT[+btn.dataset.seg];
    const opt = seg.options[+btn.dataset.opt];
    expenses.push({ name: `${seg.title} — ${opt.method}`, amount: opt.price, cat: 'เดินทาง', day: seg.day });
    persistAll();
    btn.classList.add('added');
    btn.textContent = '✓ แล้ว';
    renderBudget();
    renderExpenses();
  });
  transportBound = true;
  }
}
renderTransport();


/* ============ คลังสถานที่จากการค้นคว้า ============ */
(function renderSpots() {
  const grid = $('#spot-grid');
  if (!grid) return;

  const FIT_LABEL = {
    good:    { th: 'เข้ากรอบ 21–25 ต.ค.', cls: 'fit-good' },
    stretch: { th: 'ไปได้แต่ฝืน',          cls: 'fit-stretch' },
    no:      { th: 'อยู่นอกกรอบทริป',      cls: 'fit-no' },
  };
  const fitOf = (sp) => FIT_LABEL[sp.fit || 'good'];
  /* รูปจริงตามฤดู: ลิงก์ค้นรูป ไม่ฝังภาพที่ยืนยันต้นทางไม่ได้ */
  const photoUrl = (sp) => 'https://www.google.com/search?tbm=isch&q=' +
    encodeURIComponent(sp.photoQuery || `${sp.ja} 紅葉 10月`);

  let activeBase = 'all';

  const counts = RESEARCH_SPOTS.reduce((a, sp) => { a[sp.base] = (a[sp.base] || 0) + 1; return a; }, {});
  $('#spot-filters').innerHTML =
    `<button class="chip active" data-base="all">ทั้งหมด (${RESEARCH_SPOTS.length})</button>` +
    Object.keys(SPOT_BASES).map((k) =>
      `<button class="chip" data-base="${k}">${esc(SPOT_BASES[k].th)} (${counts[k] || 0})</button>`).join('');

  function draw() {
    const list = RESEARCH_SPOTS.filter((sp) => activeBase === 'all' || sp.base === activeBase);
    const baseHead = activeBase === 'all' ? '' :
      `<div class="spot-base-note card"><strong>เดินทางไปฐานนี้:</strong> ${esc(SPOT_BASES[activeBase].access)}</div>`;
    grid.innerHTML = baseHead + list.map((sp) => {
      const fit = fitOf(sp);
      return `
      <article class="spot-card ${fit.cls}-card">
        <div class="spot-head">
          <div>
            <h3>${sp.requested ? '<span class="req-tag" title="จากลิสต์ที่ส่งมา">★</span> ' : ''}${esc(sp.name)}</h3>
            <span class="jp spot-ja">${esc(sp.ja)}</span>
            <span class="spot-base">${esc(SPOT_BASES[sp.base].th)}</span>
          </div>
          <span class="fit-tag ${fit.cls}">${fit.th}</span>
        </div>
        <p class="spot-highlight">${sp.highlight}</p>
        <div class="spot-needs">${(sp.need || []).map((n) =>
          `<span class="need-tag" title="${esc(SPOT_NEEDS[n].en)}">${SPOT_NEEDS[n].icon} ${esc(SPOT_NEEDS[n].th)}</span>`).join('')}</div>
        <div class="spot-access">
          <h4>วิธีไป</h4>
          <ol>${(sp.access || []).map((a) => `<li>${a}</li>`).join('')}</ol>
        </div>
        <p class="spot-season">${sp.season}</p>
        ${sp.warn ? `<p class="spot-warn">${sp.warn}</p>` : ''}
        <div class="spot-actions">
          <a class="btn-mini" href="${photoUrl(sp)}" target="_blank" rel="noopener">📷 รูปช่วง ต.ค. ↗</a>
          <a class="btn-mini" href="https://www.google.com/maps/search/?api=1&query=${sp.lat},${sp.lng}&hl=th" target="_blank" rel="noopener">🗺 Google Maps ↗</a>
          <a class="btn-mini" href="${esc(sp.url)}" target="_blank" rel="noopener">ข้อมูลทางการ ↗</a>
          <button class="btn-mini spot-map-btn" data-lat="${sp.lat}" data-lng="${sp.lng}">📍 ดูบนแผนที่</button>
        </div>
      </article>`;
    }).join('');
  }
  draw();

  $('#spot-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('button.chip[data-base]');
    if (!btn) return;
    activeBase = btn.dataset.base;
    document.querySelectorAll('#spot-filters button.chip[data-base]').forEach((b) =>
      b.classList.toggle('active', b.dataset.base === activeBase));
    draw();
  });

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.spot-map-btn');
    if (!btn) return;
    document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
    activeType = 'spot';
    document.querySelectorAll('#type-filters button.chip[data-type]').forEach((b) =>
      b.classList.toggle('active', b.dataset.type === 'spot'));
    refreshMap();
    setTimeout(() => {
      map.flyTo([+btn.dataset.lat, +btn.dataset.lng], 11, { duration: .8 });
    }, 400);
  });

  $('#spot-photo-note').innerHTML = `<h3>📷 เรื่องรูปภาพ</h3>
    <p>ปุ่ม <strong>「รูปช่วง ต.ค.」</strong> ของแต่ละจุดเปิดการค้นรูปด้วย<strong>ชื่อภาษาญี่ปุ่นของสถานที่ + 紅葉 (ใบไม้เปลี่ยนสี) + 10月</strong>
    จึงได้รูปจริงที่คนถ่ายในเดือนตุลาคมและเป็นปัจจุบันเสมอ ไม่ใช่รูปเก่าที่ฝังตายไว้</p>
    <p class="note">เหตุผลที่ไม่ฝังรูปลงหน้าเว็บโดยตรง: เครื่องที่สร้างเว็บนี้ถูกนโยบายเครือข่ายบล็อกไม่ให้เข้า
    <span class="mono">commons.wikimedia.org</span>, <span class="mono">upload.wikimedia.org</span>,
    <span class="mono">flickr.com</span> และ <span class="mono">wikipedia.org</span> — จึง<strong>ยืนยันไม่ได้ว่า URL รูปไหนมีอยู่จริงหรือเป็นภาพของสถานที่นั้นจริง</strong>
    ถ้าฝังไปแบบเดา จะได้รูปเสียหรือรูปผิดที่ · ถ้าอยากได้รูปฝังในหน้านี้ ส่งลิงก์รูปที่เลือกเองมาได้เลย เดี๋ยวใส่ให้</p>`;
})();


/* ============ กล้องสด + อากาศเรียลไทม์ ============ */
(function renderCams() {
  const grid = $('#cam-grid');
  if (!grid) return;

  /* ค้นกล้องสดบน YouTube โดยกรองเฉพาะ Live (sp=EgJAAQ%3D%3D คือฟิลเตอร์ Live ของ YouTube) */
  const camSearchUrl = (c) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(c.q)}&sp=EgJAAQ%253D%253D`;

  /* รหัสสภาพอากาศของ Open-Meteo (WMO) — แปลเป็นไทยเฉพาะที่เจอจริงในญี่ปุ่นฤดูใบไม้ร่วง/หนาว */
  const WMO = {
    0: '☀️ แจ่มใส', 1: '🌤 แดดจัดเป็นส่วนใหญ่', 2: '⛅ มีเมฆบางส่วน', 3: '☁️ เมฆมาก',
    45: '🌫 หมอก', 48: '🌫 หมอกน้ำแข็งเกาะ',
    51: '🌦 ฝนละอองเบา', 53: '🌦 ฝนละออง', 55: '🌦 ฝนละอองหนัก',
    61: '🌧 ฝนเบา', 63: '🌧 ฝน', 65: '🌧 ฝนหนัก',
    66: '🧊 ฝนเยือกแข็ง', 67: '🧊 ฝนเยือกแข็งหนัก',
    71: '🌨 หิมะเบา', 73: '❄️ หิมะ', 75: '❄️ หิมะหนัก', 77: '❄️ เม็ดหิมะ',
    80: '🌧 ฝนซู่', 81: '🌧 ฝนซู่แรง', 82: '⛈ ฝนซู่หนักมาก',
    85: '🌨 หิมะโปรย', 86: '❄️ หิมะโปรยหนัก',
    95: '⛈ พายุฝนฟ้าคะนอง', 96: '⛈ พายุลูกเห็บ', 99: '⛈ พายุลูกเห็บรุนแรง',
  };

  grid.innerHTML = LIVE_CAMS.map((c) => `
    <article class="cam-card" data-cam="${esc(c.id)}">
      <div class="cam-head">
        <div>
          <h3>${esc(c.name)}</h3>
          <span class="jp cam-ja">${esc(c.ja)}</span>
        </div>
        <span class="cam-weather" data-lat="${c.lat}" data-lng="${c.lng}">…</span>
      </div>
      <p class="cam-why">${esc(c.why)}</p>
      ${c.youtubeId ? `<div class="cam-embed"><iframe src="https://www.youtube.com/embed/${esc(c.youtubeId)}" title="${esc(c.name)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>` : ''}
      <div class="cam-actions">
        <a class="btn-mini" href="${camSearchUrl(c)}" target="_blank" rel="noopener">🔴 หากล้องสดจุดนี้ ↗</a>
        <a class="btn-mini" href="https://tomarigi.me/spots" target="_blank" rel="noopener">🗺 Tomarigi ↗</a>
        <button class="btn-mini cam-map-btn" data-lat="${c.lat}" data-lng="${c.lng}">📍 ดูบนแผนที่</button>
      </div>
    </article>`).join('');

  $('#cam-dirs').innerHTML = CAM_DIRECTORIES.map((d) =>
    `<a href="${esc(d.url)}" target="_blank" rel="noopener" title="${esc(d.note)}">${esc(d.name)} ↗</a>`).join('');

  $('#cam-note').innerHTML = `<strong>เรื่องกล้องสด:</strong> กล้องสดของญี่ปุ่นเกือบทั้งหมดคือ <strong>YouTube Live</strong> —
    เว็บรวมอย่าง <span class="mono">tomarigi.me</span> ก็ดึงจาก YouTube เหมือนกัน และ<strong>ไม่มี public API ให้ต่อ</strong> (เป็นเว็บที่นักพัฒนาคนเดียวทำขึ้น)
    ผมจึงไม่ฝังรหัสวิดีโอแบบเดา เพราะเครื่องที่สร้างเว็บนี้เข้า youtube.com ไม่ได้ ยืนยันไม่ได้ว่ารหัสไหนยังไลฟ์อยู่ — ถ้าใส่มั่วจะได้กล่องดำ ·
    ปุ่ม <strong>「หากล้องสดจุดนี้」</strong> ค้นด้วยชื่อญี่ปุ่น + <span class="mono">ライブカメラ</span> พร้อมกรองเฉพาะ Live จึงได้ผลจริงเสมอและไม่มีวันตาย ·
    <strong>เจอกล้องที่ถูกใจแล้วส่ง link มา</strong> เดี๋ยวผมใส่ <span class="mono">youtubeId</span> ให้ แล้วมันจะฝังเล่นในการ์ดนี้เลย
    <br><strong>เรื่องอากาศ:</strong> ตัวเลขดึงสดจาก <span class="mono">Open-Meteo</span> (ฟรี ไม่ต้องใช้ API key) โดยเบราว์เซอร์ของคุณเรียกตรง ไม่ผ่านเซิร์ฟเวอร์ตัวกลาง ·
    พยากรณ์ล่วงหน้าได้ราว 2 สัปดาห์ ดังนั้นตัวเลขจะมีความหมายจริง ๆ เมื่อใกล้วันเดินทาง ตอนนี้แสดงอากาศ ณ ปัจจุบันของแต่ละจุด`;

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.cam-map-btn');
    if (!btn) return;
    document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
    activeType = 'cam';
    document.querySelectorAll('#type-filters button.chip[data-type]').forEach((b) =>
      b.classList.toggle('active', b.dataset.type === 'cam'));
    refreshMap();
    setTimeout(() => map.flyTo([+btn.dataset.lat, +btn.dataset.lng], 10, { duration: .8 }), 400);
  });

  /* ดึงอากาศปัจจุบันของทุกจุดพร้อมกันในคำขอเดียว (Open-Meteo รับหลายพิกัดคั่นด้วย comma) */
  const lats = LIVE_CAMS.map((c) => c.lat).join(',');
  const lngs = LIVE_CAMS.map((c) => c.lng).join(',');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}`
    + '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min'
    + '&timezone=Asia%2FTokyo&forecast_days=1';

  const showWeatherOff = () => grid.querySelectorAll('.cam-weather').forEach((el) => {
    el.textContent = 'ดูอากาศไม่ได้ตอนนี้'; el.classList.add('cam-weather-off');
  });

  /* ห่อ fetch ไว้ทั้งก้อน — ถ้าสภาพแวดล้อมไม่มี fetch หรือ throw ทันที
     จะได้ไม่ทำให้สคริปต์ทั้งไฟล์ตายยกแผง (ส่วนที่อยู่ถัดจากนี้จะไม่ถูกผูก event) */
  if (typeof fetch !== 'function') { showWeatherOff(); return; }
  try {
    fetch(url)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((data) => {
      /* หลายพิกัด = array, พิกัดเดียว = object — รองรับทั้งสองแบบ */
      const list = Array.isArray(data) ? data : [data];
      list.forEach((d, i) => {
        const card = grid.children[i];
        const el = card && card.querySelector('.cam-weather');
        if (!el || !d || !d.current) return;
        const t = Math.round(d.current.temperature_2m);
        const desc = WMO[d.current.weather_code] || '';
        const hi = d.daily && Math.round(d.daily.temperature_2m_max[0]);
        const lo = d.daily && Math.round(d.daily.temperature_2m_min[0]);
        el.innerHTML = `<strong>${t}°C</strong> ${desc}`
          + (Number.isFinite(hi) ? `<span class="cam-hilo">↑${hi}° ↓${lo}°</span>` : '');
        /* เตือนถ้าหนาวจัด/มีหิมะ — สำคัญกับวันเดินเขา */
        if (t <= 3 || (d.current.weather_code >= 71 && d.current.weather_code <= 86)) {
          el.classList.add('cam-weather-cold');
        }
      });
    })
    .catch(showWeatherOff);
  } catch { showWeatherOff(); }
})();

/* ============ events ============ */
const STATUS_LABEL = { hit: 'ทันทริป ✓', miss: 'พลาด', tba: 'รอประกาศ' };
let eventFilter = 'all';

function renderEvents() {
  const list = EVENTS.filter((ev) => {
    if (eventFilter === 'all') return true;
    if (eventFilter === 'hit') return ev.status === 'hit';
    return ev.area === eventFilter;
  });
  $('#event-grid').innerHTML = list.map((ev) => `
    <article class="event-card" data-area="${ev.area}">
      <span class="event-status ${ev.status}">${STATUS_LABEL[ev.status]}</span>
      <h3>${esc(ev.title)}</h3>
      <div class="event-date">📅 ${esc(ev.dateText)}</div>
      <p class="event-desc">${esc(ev.desc)}</p>
      <a class="event-link" href="${esc(ev.url)}" target="_blank" rel="noopener">ดูรายละเอียด ↗</a>
    </article>`).join('') || '<p class="empty-note">ไม่มี event ตามตัวกรองนี้</p>';
}

$('#event-filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button.chip');
  if (!btn) return;
  eventFilter = btn.dataset.efilter;
  document.querySelectorAll('#event-filters button.chip').forEach((b) => b.classList.toggle('active', b === btn));
  renderEvents();
});

$('#event-sources').innerHTML = EVENT_SOURCES.map((s) =>
  `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join('');

renderEvents();

/* ============ shopping list ============ */
function shoppingTotals() {
  const est = shopping.reduce((s, i) => s + i.price * i.qty, 0);
  const bought = shopping.filter((i) => i.bought).reduce((s, i) => s + i.price * i.qty, 0);
  return { est, bought };
}

function renderShopping() {
  $('#shop-list').innerHTML = shopping.map((item, i) => `
    <div class="shop-item ${item.bought ? 'bought' : ''}">
      <input type="checkbox" data-i="${i}" ${item.bought ? 'checked' : ''} aria-label="ซื้อแล้ว">
      <span class="s-name">${esc(item.name)} ${item.qty > 1 ? `<span class="mono">×${item.qty}</span>` : ''}</span>
      <span class="s-cat">${esc(item.cat)}</span>
      <span class="s-price">${yenThb(item.price * item.qty)}</span>
      <button class="del-btn" data-del="${i}" aria-label="ลบ">✕</button>
    </div>`).join('') || '<p class="empty-note">ยังไม่มีของในลิสต์ — เพิ่มด้านบนเลย</p>';

  const t = shoppingTotals();
  $('#shop-summary').innerHTML = `
    <div class="sum-block"><span class="sum-label">ทั้งหมด</span><strong>${shopping.length} รายการ</strong></div>
    <div class="sum-block"><span class="sum-label">งบประมาณการ</span><strong>${yen(t.est)}</strong><span class="sum-label thb">≈ ${toThb(t.est)}</span></div>
    <div class="sum-block"><span class="sum-label">ซื้อแล้ว</span><strong>${yen(t.bought)}</strong><span class="sum-label thb">≈ ${toThb(t.bought)}</span></div>
    <div class="sum-block"><span class="sum-label">คิดเป็นเงินบาท (ประมาณการ)</span><strong class="thb">${baht(t.est * rate)}</strong></div>`;
  renderBudget(); // bought total feeds ช้อปปิ้ง
}

$('#shopping-form').addEventListener('submit', (e) => {
  e.preventDefault();
  shopping.push({
    name: $('#shop-name').value.trim(),
    price: +$('#shop-price').value || 0,
    qty: +$('#shop-qty').value || 1,
    cat: $('#shop-cat').value,
    bought: false,
  });
  persistAll();
  e.target.reset();
  $('#shop-qty').value = 1;
  renderShopping();
});

$('#shop-list').addEventListener('click', (e) => {
  if (e.target.matches('input[type="checkbox"]')) {
    shopping[+e.target.dataset.i].bought = e.target.checked;
    persistAll();
    renderShopping();
  }
  const del = e.target.closest('.del-btn');
  if (del) {
    shopping.splice(+del.dataset.del, 1);
    persistAll();
    renderShopping();
  }
});

/* ============ budget ============ */
function spentByCat(cat) {
  let s = expenses.filter((x) => x.cat === cat).reduce((a, x) => a + x.amount, 0);
  if (cat === 'ช้อปปิ้ง') s += shoppingTotals().bought;
  if (cat === STAY_BUDGET_CAT) s += staysTotalYen();
  return s;
}

function renderBudget() {
  $('#budget-grid').innerHTML = planned.map((b, i) => {
    const spent = spentByCat(b.cat);
    const pct = b.planned > 0 ? Math.min((spent / b.planned) * 100, 100) : (spent > 0 ? 100 : 0);
    const over = spent > b.planned;
    return `
    <div class="budget-card">
      <div class="b-head">
        <span class="b-name">${esc(b.cat)}</span>
        <input class="b-plan-input" type="number" min="0" value="${b.planned}" data-plan="${i}" aria-label="งบที่ตั้งไว้">
        <span class="b-plan-thb thb">≈${toThb(b.planned)}</span>
      </div>
      <div class="b-bar"><div class="b-bar-fill ${over ? 'over' : ''}" style="width:${pct}%"></div></div>
      <div class="b-nums">
        <span>ใช้ไป <span class="mono ${over ? 'b-over' : ''}">${yenThb(spent)}</span></span>
        <span>${over ? `เกิน <span class="mono b-over">${yenThb(spent - b.planned)}</span>` : `เหลือ <span class="mono">${yenThb(b.planned - spent)}</span>`}</span>
      </div>
    </div>`;
  }).join('');

  const totalPlanned = planned.reduce((s, b) => s + b.planned, 0);
  const totalSpent = planned.reduce((s, b) => s + spentByCat(b.cat), 0);
  $('#budget-total').innerHTML = `
    <div class="sum-block"><span class="sum-label">งบทั้งทริป</span><strong>${yen(totalPlanned)}</strong><span class="sum-label thb">≈ ${baht(totalPlanned * rate)}</span></div>
    <div class="sum-block"><span class="sum-label">ใช้ไปแล้ว</span><strong>${yen(totalSpent)}</strong><span class="sum-label thb">≈ ${baht(totalSpent * rate)}</span></div>
    <div class="sum-block"><span class="sum-label">${totalSpent > totalPlanned ? 'เกินงบ!' : 'คงเหลือ'}</span><strong class="${totalSpent > totalPlanned ? 'b-over' : ''}">${yen(Math.abs(totalPlanned - totalSpent))}</strong><span class="sum-label thb">≈ ${baht(Math.abs(totalPlanned - totalSpent) * rate)}</span></div>`;
}

$('#budget-grid').addEventListener('change', (e) => {
  const input = e.target.closest('.b-plan-input');
  if (!input) return;
  planned[+input.dataset.plan].planned = +input.value || 0;
  persistAll();
  renderBudget();
});

/* rate */
$('#rate-input').value = rate;
/* ทุกส่วนที่แสดงตัวเลขบาท ต้องวาดใหม่เมื่อเรตเปลี่ยน ไม่งั้นตัวเลขค้างเป็นเรตเก่า */
function renderMoneyViews() {
  renderShopping();
  renderExpenses();
  renderBudget();
  renderItinerary();
  renderStays();
  renderTransport();
}

on('#rate-input', 'change', (e) => {
  rate = +e.target.value || TRIP.defaultRate;
  persistAll();
  renderMoneyViews();
});

/* expense form selects */
$('#exp-cat').innerHTML = planned.map((b) => `<option>${esc(b.cat)}</option>`).join('');
$('#exp-day').innerHTML = DAY_OPTIONS.map((d) => `<option>${esc(d)}</option>`).join('');

$('#expense-form').addEventListener('submit', (e) => {
  e.preventDefault();
  expenses.push({
    name: $('#exp-name').value.trim(),
    amount: +$('#exp-amount').value || 0,
    cat: $('#exp-cat').value,
    day: $('#exp-day').value,
  });
  persistAll();
  e.target.reset();
  renderBudget();
  renderExpenses();
});

function renderExpenses() {
  $('#expense-list').innerHTML = expenses.map((x, i) => `
    <div class="expense-item">
      <span class="e-day">${esc(x.day)}</span>
      <span class="e-name">${esc(x.name)}</span>
      <span class="e-cat">${esc(x.cat)}</span>
      <span class="e-amount">${yen(x.amount)} <span class="thb" style="font-size:.74rem">≈${baht(x.amount * rate)}</span></span>
      <button class="del-btn" data-del="${i}" aria-label="ลบ">✕</button>
    </div>`).join('') || '<p class="empty-note">ยังไม่มีรายจ่าย — เพิ่มจากฟอร์มด้านบน หรือกด「＋งบ」ในหมวดการเดินทาง</p>';
}

$('#expense-list').addEventListener('click', (e) => {
  const del = e.target.closest('.del-btn');
  if (!del) return;
  expenses.splice(+del.dataset.del, 1);
  persistAll();
  renderBudget();
  renderExpenses();
});

renderStays();
renderShopping();
renderExpenses();
renderBudget();
