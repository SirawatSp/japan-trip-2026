# PDF export assets

Loaded only when the user requests a direct PDF download.

- `pdfmake-0.3.11.min.js`: https://unpkg.com/pdfmake@0.3.11/build/pdfmake.min.js (MIT; see `pdfmake-LICENSE.txt`).
- Noto Sans Thai and Noto Sans JP: https://github.com/google/fonts/tree/main/ofl/notosansthai and https://github.com/google/fonts/tree/main/ofl/notosansjp (SIL OFL 1.1; license files included).
- Static TTFs instantiated with fontTools from the upstream variable fonts: Thai width 100, weights 400/700; Japanese weight 400. No glyph subsets, so custom Japanese addresses remain supported.

All PDF processing happens in the browser. No itinerary data is sent to a PDF service.
