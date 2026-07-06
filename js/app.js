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

function persistAll() {
  store.save('jt26_shopping', shopping);
  store.save('jt26_planned', planned);
  store.save('jt26_expenses', expenses);
  store.save('jt26_rate', rate);
  store.save('jt26_itinerary', itinerary);
  TripSync.push({ shopping, planned, expenses, rate, itinerary });
}

TripSync.init((remote) => {
  if (remote.shopping) shopping = remote.shopping;
  if (remote.planned) planned = remote.planned;
  if (remote.expenses) expenses = remote.expenses;
  if (typeof remote.rate === 'number') rate = remote.rate;
  if (remote.itinerary) itinerary = remote.itinerary;
  store.save('jt26_shopping', shopping);
  store.save('jt26_planned', planned);
  store.save('jt26_expenses', expenses);
  store.save('jt26_rate', rate);
  store.save('jt26_itinerary', itinerary);
  $('#rate-input').value = rate;
  $('#exp-cat').innerHTML = planned.map((b) => `<option>${esc(b.cat)}</option>`).join('');
  renderShopping();
  renderBudget();
  renderExpenses();
  renderItinerary();
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

/* ============ itinerary (fully editable) ============ */
function renderItinerary() {
  $('#itinerary-grid').innerHTML = itinerary.map((d, di) => `
    <article class="day-card" data-area="${d.area}">
      <div class="day-card-head">
        <span class="day-no">DAY ${d.day}</span>
        <div class="day-card-actions">
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
      <ul class="day-items">
        ${d.items.map((item, ii) => `
        <li>
          <input class="day-item-input" data-idx="${di}" data-item="${ii}" value="${esc(item)}" aria-label="รายการ">
          <button class="icon-btn item-del-btn" data-idx="${di}" data-item="${ii}" aria-label="ลบรายการนี้">✕</button>
        </li>`).join('')}
      </ul>
      <button class="btn-mini add-item-btn" data-idx="${di}">＋ เพิ่มรายการ</button>
    </article>`).join('');
}
renderItinerary();

/* ============ map ============ */
const map = L.map('leaflet-map', { scrollWheelZoom: false });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 18,
}).addTo(map);

function pinIcon(color) {
  return L.divIcon({
    className: 'pin-marker',
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z" fill="${color}"/>
      <circle cx="15" cy="14.5" r="5.5" fill="#fffdf7"/></svg>`,
    iconSize: [30, 40], iconAnchor: [15, 40], popupAnchor: [0, -38],
  });
}

const markers = PLACES.map((p) => {
  const m = L.marker([p.lat, p.lng], { icon: pinIcon(AREA_COLORS[p.area]) });
  m.bindPopup(`
    <div class="popup-title">${esc(p.name)}</div>
    <div class="popup-ja">${esc(p.ja)}</div>
    <div class="popup-desc">${esc(p.desc)}</div>
    <span class="popup-day">DAY ${p.day} · ${AREA_LABELS[p.area]}</span>${p.type === 'museum' ? ' <span class="popup-tag">🏛 Museum</span>' : ''}${p.taniguchi ? ' <span class="popup-tag popup-tag-taniguchi">✏️ Taniguchi</span>' : ''}`);
  m._place = p;
  return m;
});

const routeLine = L.polyline(ROUTE, {
  color: '#2b2118', weight: 2.5, dashArray: '7 7', opacity: .55,
});

let activeArea = 'all';
let activeType = 'all'; // 'all' | 'museum' | 'taniguchi'

function placeMatches(p) {
  const areaOk = activeArea === 'all' || p.area === activeArea;
  const typeOk = activeType === 'all'
    || (activeType === 'museum' && p.type === 'museum')
    || (activeType === 'taniguchi' && p.taniguchi === true);
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
      <div class="p-name">${esc(p.name)} <span class="popup-ja">${esc(p.ja)}</span>${p.type === 'museum' ? ' <span class="popup-tag">🏛</span>' : ''}${p.taniguchi ? ' <span class="popup-tag popup-tag-taniguchi">✏️</span>' : ''}</div>
      <div class="p-meta">DAY ${p.day} · ${AREA_LABELS[p.area]} — ${esc(p.desc)}</div>
    </div>`).join('') || '<p class="empty-note">ไม่มีสถานที่ตามตัวกรองนี้</p>';
}

$('#map-filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button.chip');
  if (!btn) return;
  activeArea = btn.dataset.filter;
  document.querySelectorAll('#map-filters button.chip').forEach((b) => b.classList.toggle('active', b === btn));
  refreshMap();
});
$('#route-toggle').addEventListener('change', refreshMap);

$('#type-filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button.chip');
  if (!btn) return;
  activeType = btn.dataset.type;
  document.querySelectorAll('#type-filters button.chip').forEach((b) => b.classList.toggle('active', b === btn));
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
  document.querySelectorAll('#map-filters button.chip').forEach((b) =>
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
    itinerary[+addItemBtn.dataset.idx].items.push('รายการใหม่');
    persistAll();
    renderItinerary();
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
  if (e.target.matches('.day-date-input')) itinerary[idx].date = e.target.value;
  else if (e.target.matches('.day-area-select')) itinerary[idx].area = e.target.value;
  else if (e.target.matches('.day-title-input')) itinerary[idx].title = e.target.value;
  else if (e.target.matches('.day-item-input')) itinerary[idx].items[+e.target.dataset.item] = e.target.value;
  else return;
  persistAll();
  if (e.target.matches('.day-area-select')) renderItinerary();
});

$('#add-day-btn').addEventListener('click', () => {
  const nextDay = itinerary.length ? Math.max(...itinerary.map((d) => d.day)) + 1 : 1;
  itinerary.push({ day: nextDay, date: 'วันที่ใหม่', area: 'tokyo', title: 'แผนวันใหม่', items: ['รายการใหม่'] });
  persistAll();
  renderItinerary();
});

$('#reset-itinerary-btn').addEventListener('click', () => {
  if (!confirm('รีเซ็ตแผนรายวันทั้งหมดกลับเป็นค่าเริ่มต้น? การแก้ไขทั้งหมดจะหายไป')) return;
  itinerary = structuredClone(DEFAULT_ITINERARY);
  persistAll();
  renderItinerary();
});

refreshMap();

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

renderShopping();
renderExpenses();
renderBudget();
