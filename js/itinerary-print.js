/* Text-first, export-only localisation; never modifies the saved itinerary. */
const TripPrint = (() => {
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function plainText(value) {
    const template = document.createElement('template');
    template.innerHTML = String(value ?? '').replace(/<br\s*\/?>/gi, '\n');
    return template.content.textContent.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').trim();
  }
  const hasThai = (value) => /[\u0E00-\u0E7F]/u.test(value);
  const translations = new Map([['ทางเลือก', 'Alternative']]);
  function sourceHash(day) {
    const text = JSON.stringify([day.date, day.title, ...day.items.flatMap((item) => [item.act, item.note])]);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return (hash >>> 0).toString(16);
  }
  DEFAULT_ITINERARY.forEach((day) => {
    const en = ITINERARY_EN.find((entry) => entry.day === day.day);
    if (!en || sourceHash(day) !== en.sourceHash || en.items.length !== day.items.length) return;
    translations.set(plainText(day.title), en.title);
    translations.set(plainText(day.date), en.date);
    day.items.forEach((item, i) => {
      translations.set(plainText(item.act), en.items[i][0]);
      if (item.note) translations.set(plainText(item.note), en.items[i][1]);
    });
  });
  function translate(value, overrides = {}) {
    const source = plainText(value);
    const custom = Object.hasOwn(overrides, source) ? plainText(overrides[source]) : '';
    return custom && !hasThai(custom) ? custom : (translations.get(source) || source);
  }
  function missing(days, { details = false, overrides = {} } = {}) {
    const entries = new Map();
    const add = (value, label) => {
      const source = plainText(value);
      if (hasThai(translate(source, overrides))) entries.set(source, label);
    };
    days.forEach((day) => {
      const label = `DAY ${day.day}`;
      add(day.date, `${label} · Date`);
      add(day.title, `${label} · Day title`);
      add(AREA_LABELS_EN[day.area] || day.area, `${label} · Area`);
      day.items.forEach((item, i) => {
        add(item.t, `${label} · ${i + 1} · Time`);
        add(item.act, `${label} · ${i + 1} · Activity`);
        if (details) add(item.note, `${label} · ${i + 1} · Notes`);
      });
    });
    return [...entries].map(([source, label]) => ({ source, label }));
  }
  function render(days, { details = false, costs = false, language = 'th', overrides = {} } = {}) {
    const en = language === 'en';
    const text = (value) => escape(en ? translate(value, overrides) : plainText(value));
    const generated = new Intl.DateTimeFormat(en ? 'en-GB' : 'th-TH-u-ca-gregory', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tokyo',
    }).format(new Date());
    const cols = costs ? 4 : 3;
    return `<header class="trip-print-header">
      <p class="print-eyebrow">JAPAN / OCTOBER 2026</p>
      <h1>${en ? 'Japan Travel Itinerary · 20–28 October 2026' : 'แผนเดินทางญี่ปุ่น · 20–28 ตุลาคม 2026'}</h1>
      <p>Tokyo → Tochigi / Nikko → Fukushima → Tokyo · ${en ? '4 travellers on the ground' : 'ภาคพื้นดิน 4 คน'}</p>
      <div class="print-flight-summary">
        <p><strong>${en ? 'Outbound' : 'ขาไป'} ZIPAIR ZG052</strong> · BKK 19 ${en ? 'Oct' : 'ต.ค.'} 23:10 → NRT 20 ${en ? 'Oct' : 'ต.ค.'} 07:30</p>
        <p><strong>${en ? 'Return' : 'ขากลับ'} ZIPAIR ZG051</strong> · NRT 28 ${en ? 'Oct' : 'ต.ค.'} 17:00 → BKK 28 ${en ? 'Oct' : 'ต.ค.'} 22:15</p>
        <p><strong>Narita Terminal 1 North Wing · ${en ? 'Return airport arrival target' : 'ขากลับถึงสนามบิน'} 13:30–14:00</strong></p>
      </div>
      <p class="print-meta">${en ? 'Flights use local time in each country. Daily schedule uses Japan time (JST). Travel times and costs are estimates, not booking confirmations.' : 'เวลาเที่ยวบินเป็นเวลาท้องถิ่นแต่ละประเทศ / ตารางเที่ยวเป็นเวลาญี่ปุ่น (JST) · เวลาเดินทางและค่าใช้จ่ายเป็นประมาณการ ไม่ใช่หลักฐานการจอง'}</p>
      <p class="print-meta">${en ? 'Generated' : 'แผนล่าสุด ณ'} ${escape(generated)} JST · ${days.length} ${en ? `${days.length === 1 ? 'day' : 'days'} · ${details ? 'Detailed' : 'Compact'}` : (details ? 'วัน · รวมรายละเอียด' : 'วัน · ฉบับย่อ')}</p>
      ${en && missing(days, { details, overrides }).length ? '<p class="print-translation-warning">Some entries remain in their original language. English translations are incomplete.</p>' : ''}
    </header>` + (days.length ? days.map((day) => {
      const stay = overnightOf(day.day);
      const stayText = stay ? `${en ? (stay.en?.city || stay.city) : stay.city} · ${stay.address || (en ? (stay.en?.station || stay.station) : stay.station)}` : (en ? 'No overnight stay' : 'ไม่มีที่พักค้างคืน');
      return `<table class="trip-print-table">
        <colgroup><col class="print-time-col"><col class="print-kind-col"><col>${costs ? '<col class="print-cost-col">' : ''}</colgroup>
        <thead>
          <tr><th colspan="${cols}" class="print-day-heading"><h2>DAY ${escape(day.day)} · ${text(day.date)} 2026 · ${text((en ? AREA_LABELS_EN : AREA_LABELS)[day.area] || day.area)}</h2><p>${text(day.title)}</p><p class="print-stay">${en ? 'Stay' : 'พัก'}: ${text(stayText)}</p></th></tr>
          <tr><th scope="col">${en ? 'Time' : 'เวลา'}</th><th scope="col">${en ? 'Type' : 'ประเภท'}</th><th scope="col">${en ? 'Place / Activity / Transport' : 'สถานที่ / กิจกรรม / การเดินทาง'}</th>${costs ? `<th scope="col">${en ? 'JPY / person' : 'เยน/คน'}</th>` : ''}</tr>
        </thead>
        <tbody>${day.items.length ? day.items.map((item) => `<tr>
          <td class="print-time">${text(item.t || (en ? 'Not set' : 'ไม่ระบุ'))}</td>
          <td>${escape(ITEM_TAGS[item.tag]?.[en ? 'en' : 'th'] || (en ? 'Other' : 'อื่นๆ'))}</td>
          <td><strong>${text(item.act)}</strong>${details && item.note ? `<p class="print-item-note">${text(item.note)}</p>` : ''}</td>
          ${costs ? `<td class="print-cost">${Number(item.cost) > 0 ? Math.round(item.cost).toLocaleString('en-US') : '-'}</td>` : ''}
        </tr>`).join('') : `<tr><td colspan="${cols}">${en ? 'No activities yet' : 'ยังไม่มีกิจกรรม'}</td></tr>`}</tbody>
      </table>`;
    }).join('') : `<p>${en ? 'No travel days in the selected range' : 'ไม่มีวันเดินทางในช่วงที่เลือก'}</p>`);
  }
  return { render, missing };
})();
