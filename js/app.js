/* ============================================================
   秋の旅 — app logic
   ============================================================ */

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const yen = (n) => '¥' + Math.round(n).toLocaleString('en-US');
const baht = (n) => '฿' + Math.round(n).toLocaleString('en-US');
const itineraryItemText = (item) => {
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  if (!item || typeof item !== 'object') return '';
  const title = item.title || item.name || item.activity || item.act || item.text || item.label || '';
  const detail = item.note || item.detail || item.description || '';
  const plain = (value) => String(value || '').replace(/<[^>]*>/g, '');
  const cost = Number(item.cost) > 0 ? yen(item.cost) : '';
  return [item.time || item.t, title, detail, cost].filter(Boolean).map(plain).join(' · ') || JSON.stringify(item);
};

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
let hikeChecklist = store.load('jt26_hike_checklist', {});

function persistAll() {
  store.save('jt26_shopping', shopping);
  store.save('jt26_planned', planned);
  store.save('jt26_expenses', expenses);
  store.save('jt26_rate', rate);
  store.save('jt26_itinerary', itinerary);
  store.save('jt26_hike_checklist', hikeChecklist);
  TripSync.push({ shopping, planned, expenses, rate, itinerary, hikeChecklist });
}

TripSync.init((remote) => {
  if (remote.shopping) shopping = remote.shopping;
  if (remote.planned) planned = remote.planned;
  if (remote.expenses) expenses = remote.expenses;
  if (typeof remote.rate === 'number') rate = remote.rate;
  if (remote.itinerary) itinerary = remote.itinerary;
  if (remote.hikeChecklist) hikeChecklist = remote.hikeChecklist;
  store.save('jt26_shopping', shopping);
  store.save('jt26_planned', planned);
  store.save('jt26_expenses', expenses);
  store.save('jt26_rate', rate);
  store.save('jt26_itinerary', itinerary);
  store.save('jt26_hike_checklist', hikeChecklist);
  $('#rate-input').value = rate;
  $('#exp-cat').innerHTML = planned.map((b) => `<option>${esc(b.cat)}</option>`).join('');
  renderShopping();
  renderBudget();
  renderExpenses();
  renderItinerary();
  renderHikeChecklist();
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

/* ============ collapsible utility panels ============ */
const PANEL_STATE_KEY = 'jt26_collapsed_panels';
let collapsedPanels = store.load(PANEL_STATE_KEY, {});

function setPanelCollapsed(button, collapsed) {
  const targetId = button.dataset.collapseTarget;
  const target = document.getElementById(targetId);
  if (!target) return;

  target.hidden = collapsed;
  target.closest('.map-layout')?.classList.toggle('is-catalog-hidden', collapsed);
  button.setAttribute('aria-expanded', String(!collapsed));
  const label = button.querySelector('[data-collapse-label]');
  if (label) label.textContent = (collapsed ? 'แสดง' : 'ซ่อน') + button.dataset.collapseName;
  collapsedPanels[targetId] = collapsed;
  store.save(PANEL_STATE_KEY, collapsedPanels);

  if (targetId === 'place-catalog') {
    window.dispatchEvent(new CustomEvent('trip:map-layout-change'));
  }
}

document.querySelectorAll('[data-collapse-target]').forEach((button) => {
  const targetId = button.dataset.collapseTarget;
  setPanelCollapsed(button, collapsedPanels[targetId] === true);
  button.addEventListener('click', () => {
    setPanelCollapsed(button, button.getAttribute('aria-expanded') === 'true');
  });
});

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
          <input class="day-item-input" data-idx="${di}" data-item="${ii}" value="${esc(itineraryItemText(item))}" aria-label="รายการ">
          <button class="icon-btn item-del-btn" data-idx="${di}" data-item="${ii}" aria-label="ลบรายการนี้">✕</button>
        </li>`).join('')}
      </ul>
      <button class="btn-mini add-item-btn" data-idx="${di}">＋ เพิ่มรายการ</button>
    </article>`).join('');
}
renderItinerary();

/* ============ map ============ */
const map = L.map('leaflet-map', { scrollWheelZoom: false });
window.addEventListener('trip:map-layout-change', () => {
  setTimeout(() => map.invalidateSize(), 180);
});
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

const dayLabel = (p) => (p.day ? `DAY ${p.day}` : 'นอกแผนทริป');
const searchUrl = (p) => `https://www.google.com/search?q=${encodeURIComponent(p.name + ' ' + p.ja)}`;

const markers = PLACES.map((p) => {
  const m = L.marker([p.lat, p.lng], { icon: pinIcon(AREA_COLORS[p.area]) });
  m.bindPopup(`
    ${p.img ? `<img class="popup-img" src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">` : ''}
    <div class="popup-title">${esc(p.name)}</div>
    <div class="popup-ja">${esc(p.ja)}</div>
    <div class="popup-desc">${esc(p.desc)}</div>
    <span class="popup-day">${dayLabel(p)} · ${AREA_LABELS[p.area]}</span>${p.type === 'museum' ? ' <span class="popup-tag">🏛 Museum</span>' : ''}${p.taniguchi ? ' <span class="popup-tag popup-tag-taniguchi">✏️ Taniguchi</span>' : ''}
    ${p.ticket ? `<div class="popup-ticket">🎫 ${esc(p.ticket)}</div>` : ''}
    <a class="popup-link" href="${esc(p.url || searchUrl(p))}" target="_blank" rel="noopener">${p.url ? 'เว็บทางการ' : 'ค้นหา'} ↗</a>`);
  m._place = p;
  return m;
});

const routeLine = L.polyline(ROUTE, {
  color: '#2b2118', weight: 2.5, dashArray: '7 7', opacity: .55,
});

const hikeRouteLine = L.polyline(HIKING_ROUTE.map((p) => [p.lat, p.lng]), {
  color: '#d97b29', weight: 5, opacity: .9, lineJoin: 'round',
});
const uniqueHikeWaypoints = HIKING_ROUTE.filter((point, index, points) =>
  index === points.findIndex((candidate) => candidate.lat === point.lat && candidate.lng === point.lng));
const hikeWaypointMarkers = uniqueHikeWaypoints.map((p, i) => {
  const marker = L.circleMarker([p.lat, p.lng], {
    radius: i === 0 ? 7 : 5,
    color: '#fffdf7', weight: 2, fillColor: '#d97b29', fillOpacity: 1,
  });
  marker.bindTooltip(p.name, { direction: 'top', className: 'hike-waypoint-label' });
  marker.bindPopup(
    '<div class="popup-title">' + esc(p.name) + '</div>' +
    '<div class="popup-ja">' + esc(p.ja) + '</div>' +
    '<div class="popup-desc"><strong>' + esc(p.time) + '</strong> · ' + esc(p.note) + '</div>' +
    '<div class="popup-ticket">แนวเส้นทางโดยประมาณ · ใช้ GPX/แผนที่ทางการนำทางจริง</div>'
  );
  return marker;
});

let activeArea = 'all';
let activeType = 'all'; // 'all' | 'museum' | 'taniguchi'

function placeMatches(p) {
  const areaOk = activeArea === 'all'
    ? (activeType === 'taniguchi' ? true : p.area !== 'other')
    : p.area === activeArea;
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

  const showHikeRoute = $('#hike-route-toggle').checked
    && activeType === 'all'
    && (activeArea === 'all' || activeArea === 'fukushima');
  if (showHikeRoute) {
    if (!map.hasLayer(hikeRouteLine)) hikeRouteLine.addTo(map);
    hikeWaypointMarkers.forEach((marker) => {
      if (!map.hasLayer(marker)) marker.addTo(map);
    });
  } else {
    if (map.hasLayer(hikeRouteLine)) map.removeLayer(hikeRouteLine);
    hikeWaypointMarkers.forEach((marker) => {
      if (map.hasLayer(marker)) map.removeLayer(marker);
    });
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
        <div class="p-name">${esc(p.name)} <span class="popup-ja">${esc(p.ja)}</span>${p.type === 'museum' ? ' <span class="popup-tag">🏛</span>' : ''}${p.taniguchi ? ' <span class="popup-tag popup-tag-taniguchi">✏️</span>' : ''}</div>
        <div class="p-meta">${dayLabel(p)} · ${AREA_LABELS[p.area]} — ${esc(p.desc)}</div>
        ${p.ticket ? `<div class="p-ticket">🎫 ${esc(p.ticket)}</div>` : ''}
        <a class="p-link" href="${esc(p.url || searchUrl(p))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${p.url ? 'เว็บทางการ' : 'ค้นหา'} ↗</a>
      </div>
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
$('#hike-route-toggle').addEventListener('change', refreshMap);

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

$('#show-hike-route-btn').addEventListener('click', () => {
  activeArea = 'fukushima';
  activeType = 'all';
  $('#hike-route-toggle').checked = true;
  document.querySelectorAll('#map-filters button.chip').forEach((button) =>
    button.classList.toggle('active', button.dataset.filter === 'fukushima'));
  document.querySelectorAll('#type-filters button.chip').forEach((button) =>
    button.classList.toggle('active', button.dataset.type === 'all'));
  refreshMap();
  document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    map.invalidateSize();
    map.fitBounds(hikeRouteLine.getBounds().pad(0.25));
    hikeWaypointMarkers[0].openPopup();
  }, 650);
});

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

/* ============ Mt. Issaikyo checklist ============ */
function renderHikeChecklist() {
  const allItems = HIKING_CHECKLIST.flatMap((group) => group.items);
  $('#hike-checklist').innerHTML = HIKING_CHECKLIST.map((group) =>
    '<section class="checklist-group">' +
      '<h4>' + esc(group.group) + '</h4>' +
      group.items.map((item) =>
        '<label class="checklist-item">' +
          '<input type="checkbox" data-check-id="' + esc(item.id) + '"' + (hikeChecklist[item.id] ? ' checked' : '') + '>' +
          '<span><strong>' + esc(item.label) + '</strong><small>' + esc(item.detail) + '</small></span>' +
        '</label>'
      ).join('') +
    '</section>'
  ).join('');

  const complete = allItems.filter((item) => hikeChecklist[item.id]).length;
  const percent = allItems.length ? (complete / allItems.length) * 100 : 0;
  $('#hike-checklist-bar').style.width = percent + '%';
  $('#hike-checklist-count').textContent = complete + ' / ' + allItems.length + ' พร้อมแล้ว';
}

$('#hike-checklist').addEventListener('change', (event) => {
  const input = event.target.closest('input[data-check-id]');
  if (!input) return;
  hikeChecklist[input.dataset.checkId] = input.checked;
  persistAll();
  renderHikeChecklist();
});

$('#reset-hike-checklist').addEventListener('click', () => {
  hikeChecklist = {};
  persistAll();
  renderHikeChecklist();
});

renderHikeChecklist();

/* ============ Mt. Issaikyo live weather ============ */
const HIKE_DATE = '2026-10-24';
const WEATHER_CACHE_KEY = 'jt26_hike_weather';
const WEATHER_CACHE_MS = 6 * 60 * 60 * 1000;
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=37.7232&longitude=140.2542&elevation=1600&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset&temperature_unit=celsius&wind_speed_unit=kmh&timezone=Asia%2FTokyo&forecast_days=16';

function describeWeather(code) {
  if (code === 0) return { symbol: '☀', label: 'ท้องฟ้าโปร่ง' };
  if (code <= 2) return { symbol: '◐', label: 'มีเมฆบางส่วน' };
  if (code === 3) return { symbol: '☁', label: 'เมฆมาก' };
  if (code === 45 || code === 48) return { symbol: '≋', label: 'หมอก' };
  if (code >= 51 && code <= 67) return { symbol: '☂', label: 'ฝน' };
  if (code >= 71 && code <= 77) return { symbol: '✳', label: 'หิมะ' };
  if (code >= 80 && code <= 82) return { symbol: '☂', label: 'ฝนเป็นช่วง' };
  if (code >= 85 && code <= 86) return { symbol: '✳', label: 'หิมะเป็นช่วง' };
  if (code >= 95) return { symbol: 'ϟ', label: 'พายุฝนฟ้าคะนอง' };
  return { symbol: '○', label: 'สภาพอากาศเปลี่ยนแปลง' };
}

function weatherAdvice(code, rainChance, gust) {
  if (code >= 71 || code >= 95 || gust >= 50 || rainChance >= 70) {
    return 'เงื่อนไขมีความเสี่ยงสูง: เตรียมใช้ Plan B หรือยกเลิก และถาม Visitor Center ก่อนออกเดิน';
  }
  if (gust >= 35 || rainChance >= 40 || code >= 51) {
    return 'ควรประเมินอีกครั้งที่ Jododaira: ทางเปียกและลมบนยอดอาจรุนแรงกว่าค่าพยากรณ์';
  }
  return 'แนวโน้มยังพอใช้ได้ แต่ต้องเช็คสภาพทาง ลม และประกาศภูเขาไฟอีกครั้งในเช้าวันเดิน';
}

function formatWeatherUpdate(timestamp) {
  return new Date(timestamp).toLocaleString('th-TH', {
    timeZone: 'Asia/Tokyo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }) + ' JST';
}

function renderHikeWeather(data, fetchedAt) {
  const content = $('#hike-weather-content');
  $('#weather-updated').textContent = 'อัปเดต ' + formatWeatherUpdate(fetchedAt);
  const current = data.current || {};
  const currentCondition = describeWeather(current.weather_code);
  const targetIndex = data.daily && data.daily.time ? data.daily.time.indexOf(HIKE_DATE) : -1;

  if (targetIndex < 0) {
    const tripTime = Date.parse(HIKE_DATE + 'T00:00:00+09:00');
    const tripPassed = Date.now() > tripTime + 86400000;
    const daysToTrip = Math.max(0, Math.ceil((tripTime - Date.now()) / 86400000));
    const daysToWindow = Math.max(0, daysToTrip - 16);
    const liveNow = Number.isFinite(current.temperature_2m)
      ? '<div class="weather-now"><span>ตอนนี้ ' + Math.round(current.temperature_2m) + '°C</span><span>' +
        currentCondition.label + '</span><span>ลม ' + Math.round(current.wind_speed_10m || 0) + ' km/h</span><span>กระโชก ' +
        Math.round(current.wind_gusts_10m || 0) + ' km/h</span></div>'
      : '';
    content.innerHTML =
      '<div class="weather-waiting">' +
        '<div class="weather-countdown"><strong>' + (tripPassed ? '—' : daysToWindow) + '</strong><span>' +
          (tripPassed ? 'ทริปนี้ผ่านไปแล้ว' : 'วันจนเริ่มเห็นพยากรณ์') + '</span></div>' +
        '<div class="weather-wait-copy"><h4>' +
          (tripPassed ? 'ข้อมูลพยากรณ์ย้อนหลังไม่แสดงในแผงนี้' : 'ยังไม่ถึงช่วงพยากรณ์ 16 วัน') +
        '</h4><p>' +
          (tripPassed ? 'แผงนี้จะแสดงเฉพาะ forecast ก่อนวันเดินเขา' : 'ข้อมูลวันที่ 24 ต.ค. ควรเริ่มแสดงอัตโนมัติประมาณ 8 ต.ค. 2026') +
        '</p>' + liveNow + '</div>' +
      '</div>';
    return;
  }

  const daily = data.daily;
  const at = (key) => daily[key] && daily[key][targetIndex];
  const code = at('weather_code');
  const condition = describeWeather(code);
  const maxTemp = Math.round(at('temperature_2m_max'));
  const minTemp = Math.round(at('temperature_2m_min'));
  const feelsMin = Math.round(at('apparent_temperature_min'));
  const rainChance = Math.round(at('precipitation_probability_max') || 0);
  const rainSum = Number(at('precipitation_sum') || 0).toFixed(1);
  const wind = Math.round(at('wind_speed_10m_max') || 0);
  const gust = Math.round(at('wind_gusts_10m_max') || 0);
  const sunrise = String(at('sunrise') || '').slice(11,16);
  const sunset = String(at('sunset') || '').slice(11,16);

  content.innerHTML =
    '<div class="weather-forecast">' +
      '<div class="weather-primary"><div class="weather-symbol" aria-hidden="true">' + condition.symbol + '</div>' +
        '<div><div class="weather-temp">' + minTemp + '–' + maxTemp + '°C</div><div class="weather-condition">' + condition.label + ' · รู้สึกต่ำสุด ' + feelsMin + '°C</div></div></div>' +
      '<div class="weather-stats">' +
        '<div class="weather-stat"><span>โอกาสฝนสูงสุด</span><strong>' + rainChance + '%</strong></div>' +
        '<div class="weather-stat"><span>ปริมาณฝน</span><strong>' + rainSum + ' mm</strong></div>' +
        '<div class="weather-stat"><span>ลมสูงสุด</span><strong>' + wind + ' km/h</strong></div>' +
        '<div class="weather-stat"><span>ลมกระโชก</span><strong>' + gust + ' km/h</strong></div>' +
        '<div class="weather-stat"><span>พระอาทิตย์ขึ้น</span><strong>' + sunrise + '</strong></div>' +
        '<div class="weather-stat"><span>พระอาทิตย์ตก</span><strong>' + sunset + '</strong></div>' +
      '</div>' +
      '<div class="weather-advice"><strong>ประเมินเบื้องต้น:</strong> ' + esc(weatherAdvice(code, rainChance, gust)) + '</div>' +
    '</div>';
}

async function loadHikeWeather(force) {
  const refreshButton = $('#refresh-weather-btn');
  const cached = store.load(WEATHER_CACHE_KEY, null);
  if (cached && cached.data) renderHikeWeather(cached.data, cached.fetchedAt);

  if (!force && cached && Date.now() - cached.fetchedAt < WEATHER_CACHE_MS) return;
  refreshButton.classList.add('loading');
  refreshButton.disabled = true;

  try {
    const response = await fetch(WEATHER_URL);
    if (!response.ok) throw new Error('Weather API returned ' + response.status);
    const data = await response.json();
    const weatherCache = { data, fetchedAt: Date.now() };
    store.save(WEATHER_CACHE_KEY, weatherCache);
    renderHikeWeather(data, weatherCache.fetchedAt);
  } catch (error) {
    if (!cached || !cached.data) {
      $('#weather-updated').textContent = 'อัปเดตไม่สำเร็จ';
      $('#hike-weather-content').innerHTML =
        '<p class="weather-error">โหลดพยากรณ์ไม่ได้ในขณะนี้ กรุณาตรวจอินเทอร์เน็ตแล้วกดปุ่มอัปเดตอีกครั้ง</p>';
    }
  } finally {
    refreshButton.classList.remove('loading');
    refreshButton.disabled = false;
  }
}

$('#refresh-weather-btn').addEventListener('click', () => loadHikeWeather(true));
loadHikeWeather(false);

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
