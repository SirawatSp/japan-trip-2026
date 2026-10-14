/* Direct, text-based PDF export for mobile and desktop. Assets load only on export. */
const TripPDF = (() => {
  let loading;
  function loadEngine() {
    if (!loading) loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/pdf/pdfmake-0.3.11.min.js';
      script.onload = () => {
        const fontURL = (name) => new URL(`assets/pdf/${name}.ttf`, document.baseURI).href;
        pdfMake.addFonts({
          NotoThai: { normal: fontURL('NotoSansThai-Regular'), bold: fontURL('NotoSansThai-Bold') },
          NotoJP: { normal: fontURL('NotoSansJP-Regular'), bold: fontURL('NotoSansJP-Regular') },
        });
        resolve(pdfMake);
      };
      script.onerror = () => {
        script.remove();
        loading = null;
        reject(new Error('PDF engine could not load'));
      };
      document.head.append(script);
    });
    return loading;
  }
  // Keep Japanese addresses legible alongside Thai/Latin text in the same cell.
  function textRuns(text) {
    // Decompose sara am so PDF text extraction does not duplicate its vowel glyph.
    return String(text).replace(/\u0e33/g, '\u0e4d\u0e32')
      .split(/([\u2190-\u22ff\u2460-\u24ff\u2e80-\u9fff\uf900-\ufaff\uff01-\uffef]+)/u)
      .filter(Boolean).map((part) => ({ text: part, font: /[\u2190-\u22ff\u2460-\u24ff\u2e80-\u9fff\uf900-\ufaff\uff01-\uffef]/u.test(part) ? 'NotoJP' : 'NotoThai' }));
  }
  const text = (element, properties = {}) => ({ text: textRuns(element.textContent.trim()), ...properties });
  function definition(report) {
    const content = [];
    for (const element of report.querySelector('.trip-print-header').children) {
      if (element.classList.contains('print-flight-summary')) {
        content.push({ stack: [...element.children].map((p) => text(p, { margin: [0, 2, 0, 2] })), margin: [0, 8, 0, 8] });
      } else {
        content.push(text(element, {
          fontSize: element.tagName === 'H1' ? 17 : element.classList.contains('print-meta') ? 8 : 10,
          bold: element.tagName === 'H1', margin: [0, 0, 0, 5],
        }));
      }
    }
    for (const table of report.querySelectorAll('.trip-print-table')) {
      const columns = table.querySelectorAll('col').length;
      const body = [...table.rows].map((row) => [...row.cells].flatMap((cell) => {
        let node;
        if (cell.classList.contains('print-day-heading')) {
          node = { stack: [...cell.children].map((p) => text(p, { fontSize: p.tagName === 'H2' ? 12 : 9, bold: p.tagName === 'H2', margin: [0, 2, 0, 2] })), colSpan: columns };
        } else if (cell.querySelector('strong')) {
          node = { stack: [text(cell.querySelector('strong'), { bold: true }), ...[...cell.querySelectorAll('.print-item-note')].map((p) => text(p, { fontSize: 8.5, margin: [0, 3, 0, 0] }))] };
        } else {
          node = text(cell, { bold: cell.tagName === 'TH', alignment: cell.classList.contains('print-cost') ? 'right' : 'left' });
        }
        return [node, ...Array.from({ length: cell.colSpan - 1 }, () => ({}))];
      }));
      content.push({
        table: { headerRows: 2, widths: columns === 4 ? [62, 52, '*', 48] : [62, 52, '*'], body },
        layout: {
          hLineWidth: () => .5, vLineWidth: () => .5,
          hLineColor: () => '#999999', vLineColor: () => '#999999',
          paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 5, paddingBottom: () => 5,
          fillColor: (row) => row === 1 ? '#f1f1f1' : null,
        },
        margin: [0, 10, 0, 8],
      });
    }
    return {
      pageSize: 'A4', pageMargins: [34, 34, 34, 34],
      info: { title: report.querySelector('h1').textContent.trim() },
      defaultStyle: { font: 'NotoThai', fontSize: 10, lineHeight: 1.25 },
      content,
      footer: (page, total) => ({ text: `${page} / ${total}`, alignment: 'center', fontSize: 8, margin: [0, 10, 0, 0] }),
    };
  }
  async function create(report) {
    const documentDefinition = definition(report);
    const engine = await loadEngine();
    return engine.createPdf(documentDefinition).getBlob();
  }
  return { create };
})();
