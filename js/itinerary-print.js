/* A text-first report: native browser printing keeps Thai text searchable. */
const TripPrint = (() => {
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function plainText(value) {
    const template = document.createElement('template');
    template.innerHTML = String(value ?? '').replace(/<br\s*\/?>/gi, '\n');
    return template.content.textContent.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').trim();
  }
  function render(days, { details = false, costs = false } = {}) {
    const generated = new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tokyo',
    }).format(new Date());
    const cols = costs ? 4 : 3;
    return `<header class="trip-print-header">
      <p class="print-eyebrow">JAPAN / OCTOBER 2026</p>
      <h1>แผนเดินทางญี่ปุ่น · 20–28 ตุลาคม 2026</h1>
      <p>Tokyo → Tochigi / Nikko → Fukushima → Tokyo · ภาคพื้นดิน 4 คน</p>
      <div class="print-flight-summary">
        <p><strong>ขาไป ZIPAIR ZG052</strong> · BKK 19 ต.ค. 23:10 → NRT 20 ต.ค. 07:30</p>
        <p><strong>ขากลับ ZIPAIR ZG051</strong> · NRT 28 ต.ค. 17:00 → BKK 28 ต.ค. 22:15</p>
        <p><strong>Narita Terminal 1 North Wing · ขากลับถึงสนามบิน 13:30–14:00</strong></p>
      </div>
      <p class="print-meta">เวลาเที่ยวบินเป็นเวลาท้องถิ่นแต่ละประเทศ / ตารางเที่ยวเป็นเวลาญี่ปุ่น (JST) · เวลาเดินทางและค่าใช้จ่ายเป็นประมาณการ ไม่ใช่หลักฐานการจอง</p>
      <p class="print-meta">แผนล่าสุด ณ ${escape(generated)} JST · ${days.length} วัน${details ? ' · รวมรายละเอียด' : ' · ฉบับย่อ'}</p>
    </header>` + (days.length ? days.map((day) => {
      const stay = overnightOf(day.day);
      const stayText = stay ? `${stay.city} · ${stay.address || stay.station}` : 'ไม่มีที่พักค้างคืน';
      return `<table class="trip-print-table">
        <colgroup><col class="print-time-col"><col class="print-kind-col"><col>${costs ? '<col class="print-cost-col">' : ''}</colgroup>
        <thead>
          <tr><th colspan="${cols}" class="print-day-heading"><h2>DAY ${escape(day.day)} · ${escape(day.date)} 2026 · ${escape(AREA_LABELS[day.area] || day.area)}</h2><p>${escape(plainText(day.title))}</p><p class="print-stay">พัก: ${escape(plainText(stayText))}</p></th></tr>
          <tr><th scope="col">เวลา</th><th scope="col">ประเภท</th><th scope="col">สถานที่ / กิจกรรม / การเดินทาง</th>${costs ? '<th scope="col">เยน/คน</th>' : ''}</tr>
        </thead>
        <tbody>${day.items.length ? day.items.map((item) => `<tr>
          <td class="print-time">${escape(item.t || 'ไม่ระบุ')}</td>
          <td>${escape(ITEM_TAGS[item.tag]?.th || 'อื่นๆ')}</td>
          <td><strong>${escape(plainText(item.act))}</strong>${details && item.note ? `<p class="print-item-note">${escape(plainText(item.note))}</p>` : ''}</td>
          ${costs ? `<td class="print-cost">${Number(item.cost) > 0 ? Math.round(item.cost).toLocaleString('en-US') : '-'}</td>` : ''}
        </tr>`).join('') : `<tr><td colspan="${cols}">ยังไม่มีกิจกรรม</td></tr>`}</tbody>
      </table>`;
    }).join('') : '<p>ไม่มีวันเดินทางในช่วงที่เลือก</p>');
  }
  return { render };
})();
