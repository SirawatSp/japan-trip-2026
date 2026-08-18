/* ============================================================
   秋の旅 — app logic
   ============================================================ */

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const yen = (n) => '¥' + Math.round(n).toLocaleString('en-US');
const baht = (n) => '฿' + Math.round(n).toLocaleString('en-US');

/* ---------- persistent state ---------- */
const store = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : structuredClone(fallback);
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
  renderShopping();
  renderBudget();
  renderExpenses();
  renderItinerary();
  renderStays();
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

function renderItinerary() {
  $('#itinerary-grid').innerHTML = itinerary.map((d, di) => `
    <article class="day-card" data-area="${d.area}">
      <div class="day-card-head">
        <span class="day-no">DAY ${d.day}</span>
        <div class="day-card-actions">
          <span class="day-cost mono" title="รวมราคาประมาณของวันนี้">${yen(dayCost(d))}</span>
          <button class="icon-btn day-map-btn" data-idx="${di}" title="ดูหมุดวันนี้บนแผนที่" aria-label="ดูบนแผนที่">📍</button>
          <button class="icon-btn day-del-btn" data-idx="${di}" title="ลบวันนี้ทั้งวัน" aria-label="ลบวันนี้">✕</button>
        </div>
      </div>
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
    </article>`).join('');

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

/* ============ ที่พัก (Airbnb) ============ */
let mapReady = false;
const stayOf = (id) => stays[id] || {};
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
  $('#stay-cap-input').value = stayCap;
  $('#stay-cap-calc').innerHTML = `× ${STAY_GUESTS} คน = <strong class="mono">${baht(cap)}</strong> ต่อคืนทั้งหลัง
    <span class="thb">(≈ ${yen(rate > 0 ? cap / rate : 0)}/คืน)</span> · รวมเพดานทั้งทริป ${stayNightsTotal()} คืน = <strong class="mono">${baht(cap * stayNightsTotal())}</strong>`;

  $('#stay-grid').innerHTML = STAYS.map((s) => {
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
  }).join('');

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

$('#stay-cap-input').addEventListener('change', (e) => {
  stayCap = +e.target.value || STAY_CAP_PER_PERSON_THB;
  persistAll();
  renderStays();
});

$('#stay-grid').addEventListener('change', (e) => {
  const priceInput = e.target.closest('.stay-price');
  const urlInput = e.target.closest('.stay-url');
  const id = (priceInput || urlInput || {}).dataset && (priceInput || urlInput).dataset.stay;
  if (!id) return;
  stays[id] = stays[id] || {};
  if (priceInput) stays[id].thb = +priceInput.value || 0;
  if (urlInput) stays[id].url = urlInput.value.trim();
  persistAll();
  renderStays();
  renderBudget();
});

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
    <span class="popup-day">${dayLabel(p)} · ${areaLabel(p.area)}</span>${p.type === 'museum' ? ' <span class="popup-tag">🏛 Museum</span>' : ''}${p.taniguchi ? ' <span class="popup-tag popup-tag-taniguchi">✏️ Taniguchi</span>' : ''}${p.type === 'stay' ? ' <span class="popup-tag popup-tag-stay">🛏</span>' : ''}
    ${placeTicket(p) ? `<div class="popup-ticket">🎫 ${esc(placeTicket(p))}</div>` : ''}
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
  const areaOk = activeArea === 'all'
    ? (activeType === 'taniguchi' ? true : p.area !== 'other')
    : p.area === activeArea;
  const typeOk = activeType === 'all'
    || (activeType === 'museum' && p.type === 'museum')
    || (activeType === 'taniguchi' && p.taniguchi === true)
    || (activeType === 'stay' && p.type === 'stay');
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
(function renderTransport() {
  $('#transport-list').innerHTML = TRANSPORT.map((seg, si) => `
    <div class="seg-card">
      <div class="seg-head"><span class="seg-day">${esc(seg.day)}</span><h3>${esc(seg.title)}</h3></div>
      <div class="seg-options">
        ${seg.options.map((o, oi) => `
        <div class="seg-opt">
          <div class="o-method">${esc(o.method)}<span class="o-note">${esc(o.note)}</span></div>
          <span class="o-time">${esc(o.time)}</span>
          <span class="o-price">${yen(o.price)}</span>
          <button class="btn-mini" data-seg="${si}" data-opt="${oi}">＋งบ</button>
        </div>`).join('')}
      </div>
    </div>`).join('');

  $('#rail-total').textContent = yen(RAIL_MAIN_TOTAL);

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
      <span class="s-price">${yen(item.price * item.qty)}</span>
      <button class="del-btn" data-del="${i}" aria-label="ลบ">✕</button>
    </div>`).join('') || '<p class="empty-note">ยังไม่มีของในลิสต์ — เพิ่มด้านบนเลย</p>';

  const t = shoppingTotals();
  $('#shop-summary').innerHTML = `
    <div class="sum-block"><span class="sum-label">ทั้งหมด</span><strong>${shopping.length} รายการ</strong></div>
    <div class="sum-block"><span class="sum-label">งบประมาณการ</span><strong>${yen(t.est)}</strong></div>
    <div class="sum-block"><span class="sum-label">ซื้อแล้ว</span><strong>${yen(t.bought)}</strong></div>
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
      </div>
      <div class="b-bar"><div class="b-bar-fill ${over ? 'over' : ''}" style="width:${pct}%"></div></div>
      <div class="b-nums">
        <span>ใช้ไป <span class="mono ${over ? 'b-over' : ''}">${yen(spent)}</span></span>
        <span>${over ? `เกิน <span class="mono b-over">${yen(spent - b.planned)}</span>` : `เหลือ <span class="mono">${yen(b.planned - spent)}</span>`}</span>
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
$('#rate-input').addEventListener('change', (e) => {
  rate = +e.target.value || TRIP.defaultRate;
  persistAll();
  renderShopping();
  renderExpenses();
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
