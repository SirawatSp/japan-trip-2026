/* ============================================================
   秋の旅 — Trip data (Oct 20–28, 2026)
   ราคา = ประมาณการต่อคน อัปเดต ก.ค. 2026 — เช็คราคาจริงก่อนเดินทาง
   ============================================================ */

const TRIP = {
  start: '2026-10-20',
  end: '2026-10-28',
  defaultRate: 0.23, // THB per JPY
};

const AREA_COLORS = {
  tokyo: '#2f4870',
  tochigi: '#b8860b',
  nikko: '#c73e2e',
  fukushima: '#3e5c46',
};

const AREA_LABELS = {
  tokyo: 'Tokyo',
  tochigi: 'Tochigi',
  nikko: 'Nikko',
  fukushima: 'Fukushima',
};

/* ---------- itinerary (default — user can edit/reset in the app) ---------- */
const DEFAULT_ITINERARY = [
  { day: 1, date: 'อ. 20 ต.ค.', area: 'tokyo', title: 'ถึงโตเกียวตอนเช้า', items: [
    'ถึงสนามบิน → เข้าเมือง (N\'EX / Skyliner)', 'ฝากกระเป๋า/เช็คอินโรงแรม', 'Asakusa — วัด Sensoji + ถนน Nakamise', 'Ueno Park / Ameyoko', 'เย็น: Akihabara' ] },
  { day: 2, date: 'พ. 21 ต.ค.', area: 'tokyo', title: 'โตเกียวฝั่งตะวันตก', items: [
    'ศาลเจ้า Meiji Jingu', 'Harajuku — Takeshita St.', 'Shibuya — แยกไฟแดง + Shibuya Sky', 'เย็น: Shinjuku (Omoide Yokocho)' ] },
  { day: 3, date: 'พฤ. 22 ต.ค.', area: 'tochigi', title: 'Tokyo → Utsunomiya (โทจิกิ)', items: [
    'ชินคันเซ็นเช้า ~50 นาที', 'Oya History Museum (เหมืองหินใต้ดิน)', 'ศาลเจ้า Utsunomiya Futaarayama', 'เย็น: ตะลุยเกี๊ยวซ่า — เมืองหลวงเกี๊ยวซ่าของญี่ปุ่น' ] },
  { day: 4, date: 'ศ. 23 ต.ค.', area: 'nikko', title: 'Utsunomiya → Nikko (มรดกโลก)', items: [
    'JR Nikko Line ~45 นาที', 'ศาลเจ้า Toshogu + Rinnoji', 'สะพานแดง Shinkyo', 'Kanmangafuchi Abyss (แถวจิโซ)' ] },
  { day: 5, date: 'ส. 24 ต.ค.', area: 'nikko', title: 'Nikko — ใบไม้แดงพีค 🍁', items: [
    'ขึ้นบัสผ่านโค้ง Irohazaka (48 โค้ง)', 'Akechidaira Ropeway — จุดชมวิว', 'น้ำตก Kegon + ทะเลสาบ Chuzenji', 'น้ำตก Ryuzu ตอนเย็นแสงสวย' ] },
  { day: 6, date: 'อา. 25 ต.ค.', area: 'fukushima', title: 'Nikko → Fukushima', items: [
    'กลับ Utsunomiya → ชินคันเซ็นไป Fukushima', 'เช็คอิน + ซื้อเสบียงวันเดินเขา (เซเว่นหน้าสถานี)', 'บ่าย: Hanamiyama / เมือง Fukushima', 'เย็น: แช่ออนเซ็น Iizaka Onsen' ] },
  { day: 7, date: 'จ. 26 ต.ค.', area: 'fukushima', title: '⛰ เดินเขา Mt. Issaikyo', items: [
    '08:30 บัส Sky Access จากสถานี', 'Jododaira → ยอด Issaikyo (1,949 ม.)', 'วิว「ดวงตาแม่มด」Goshikinuma', 'Azuma-Kofuji → กลับถึงเมือง 17:00 → ออนเซ็น' ] },
  { day: 8, date: 'อ. 27 ต.ค.', area: 'tokyo', title: 'Fukushima → Tokyo — วันช้อปปิ้ง', items: [
    'ชินคันเซ็นเช้า ~95 นาที', 'Shinjuku / Ginza — เก็บลิสต์ของซื้อ', 'Don Quijote + drugstore', 'เย็น: มื้อส่งท้าย' ] },
  { day: 9, date: 'พ. 28 ต.ค.', area: 'tokyo', title: 'เดินทางกลับ ✈ 17:00', items: [
    'เช้า: เก็บตกของซื้อ / คาเฟ่', '~13:30 ออกจากโรงแรมไปสนามบิน', 'ถึงสนามบินก่อน 15:00', 'บินกลับ 17:00' ] },
];

/* ---------- map places ---------- */
const PLACES = [
  // Tokyo
  { name: 'วัด Sensoji (Asakusa)', ja: '浅草寺', area: 'tokyo', lat: 35.7148, lng: 139.7967, day: 1, desc: 'วัดเก่าแก่ที่สุดในโตเกียว + ถนนช้อป Nakamise' },
  { name: 'Ueno Park / Ameyoko', ja: '上野公園', area: 'tokyo', lat: 35.7141, lng: 139.7745, day: 1, desc: 'สวน+พิพิธภัณฑ์ ตลาด Ameyoko ของกินเพียบ' },
  { name: 'Akihabara', ja: '秋葉原', area: 'tokyo', lat: 35.6984, lng: 139.7731, day: 1, desc: 'ย่านเครื่องใช้ไฟฟ้า อนิเมะ เกม' },
  { name: 'ศาลเจ้า Meiji Jingu', ja: '明治神宮', area: 'tokyo', lat: 35.6764, lng: 139.6993, day: 2, desc: 'ศาลเจ้าใหญ่กลางป่าในเมือง ติด Harajuku' },
  { name: 'Shibuya Crossing + Sky', ja: '渋谷', area: 'tokyo', lat: 35.6595, lng: 139.7005, day: 2, desc: 'แยกไฟแดงที่พลุกพล่านที่สุดในโลก + จุดชมวิว Shibuya Sky' },
  { name: 'Shinjuku', ja: '新宿', area: 'tokyo', lat: 35.6896, lng: 139.7006, day: 2, desc: 'Omoide Yokocho, Kabukicho, ช้อปปิ้งยักษ์' },
  { name: 'Ginza', ja: '銀座', area: 'tokyo', lat: 35.6717, lng: 139.7650, day: 8, desc: 'ย่านช้อปไฮเอนด์ + Uniqlo 12 ชั้น, Itoya' },
  { name: 'Don Quijote Shinjuku', ja: 'ドン・キホーテ', area: 'tokyo', lat: 35.6944, lng: 139.7016, day: 8, desc: 'แหล่งกวาดของฝาก เปิดดึก อย่าลืมพาสปอร์ต (tax-free)' },
  // Tochigi
  { name: 'สถานี Utsunomiya', ja: '宇都宮駅', area: 'tochigi', lat: 36.5591, lng: 139.8986, day: 3, desc: 'ฮับของโทจิกิ — จุดต่อรถไป Nikko' },
  { name: 'Oya History Museum', ja: '大谷資料館', area: 'tochigi', lat: 36.6009, lng: 139.8228, day: 3, desc: 'เหมืองหินใต้ดินสุดอลัง เย็น 8°C พกเสื้อคลุม' },
  { name: 'ถนนเกี๊ยวซ่า (Kirasse)', ja: '宇都宮餃子', area: 'tochigi', lat: 36.5583, lng: 139.8830, day: 3, desc: 'เมืองหลวงเกี๊ยวซ่า — ร้าน Minmin, Masashi ห้ามพลาด' },
  { name: 'ศาลเจ้า Futaarayama', ja: '二荒山神社', area: 'tochigi', lat: 36.5658, lng: 139.8823, day: 3, desc: 'ศาลเจ้าเก่าแก่ใจกลางเมือง Utsunomiya' },
  // Nikko
  { name: 'ศาลเจ้า Toshogu', ja: '日光東照宮', area: 'nikko', lat: 36.7581, lng: 139.5986, day: 4, desc: 'มรดกโลก สุสานโชกุน Tokugawa Ieyasu — แกะสลักแมวหลับ/ลิงสามตัว' },
  { name: 'สะพาน Shinkyo', ja: '神橋', area: 'nikko', lat: 36.7550, lng: 139.5995, day: 4, desc: 'สะพานแดงศักดิ์สิทธิ์ จุดถ่ายรูปซิกเนเจอร์' },
  { name: 'Kanmangafuchi Abyss', ja: '憾満ヶ淵', area: 'nikko', lat: 36.7469, lng: 139.5911, day: 4, desc: 'หุบผาริมแม่น้ำ + รูปปั้นจิโซใส่หมวกแดง ~70 องค์' },
  { name: 'โค้ง Irohazaka', ja: 'いろは坂', area: 'nikko', lat: 36.7280, lng: 139.5250, day: 5, desc: 'ถนน 48 โค้งขึ้นเขา — ใบไม้แดงพีคช่วงปลาย ต.ค. รถติดให้เผื่อเวลา' },
  { name: 'Akechidaira Ropeway', ja: '明智平', area: 'nikko', lat: 36.7278, lng: 139.5148, day: 5, desc: 'กระเช้าขึ้นจุดชมวิว เห็นน้ำตก Kegon + ทะเลสาบพร้อมกัน' },
  { name: 'น้ำตก Kegon', ja: '華厳滝', area: 'nikko', lat: 36.7379, lng: 139.5011, day: 5, desc: 'น้ำตกสูง 97 ม. — 1 ใน 3 น้ำตกสวยสุดของญี่ปุ่น (ลิฟต์ลง ¥570)' },
  { name: 'ทะเลสาบ Chuzenji', ja: '中禅寺湖', area: 'nikko', lat: 36.7333, lng: 139.4667, day: 5, desc: 'ทะเลสาบบนเขา 1,269 ม. เดินเล่นริมน้ำ' },
  { name: 'น้ำตก Ryuzu', ja: '竜頭滝', area: 'nikko', lat: 36.7581, lng: 139.4451, day: 5, desc: '“น้ำตกหัวมังกร” — จุดใบไม้แดงเปลี่ยนสีเร็วสุดของ Nikko' },
  // Fukushima
  { name: 'สถานี Fukushima', ja: '福島駅', area: 'fukushima', lat: 37.7543, lng: 140.4590, day: 6, desc: 'ฐานทัพ 2 คืน — บัสขึ้นเขาออกฝั่ง West Exit' },
  { name: 'Jododaira Visitor Center', ja: '浄土平', area: 'fukushima', lat: 37.7218, lng: 140.2517, day: 7, desc: 'จุดสตาร์ทเดินเขา 1,600 ม. บน Bandai-Azuma Skyline' },
  { name: 'ยอด Mt. Issaikyo', ja: '一切経山', area: 'fukushima', lat: 37.7311, lng: 140.2439, day: 7, desc: 'ยอด 1,949 ม. — วิวทะเลสาบ Goshikinuma「ดวงตาแม่มด」' },
  { name: 'ทะเลสาบ Goshikinuma', ja: '五色沼(魔女の瞳)', area: 'fukushima', lat: 37.7355, lng: 140.2450, day: 7, desc: 'ทะเลสาบปล่องภูเขาไฟสีเทอร์ควอยซ์ มองจากยอด Issaikyo' },
  { name: 'Azuma-Kofuji', ja: '吾妻小富士', area: 'fukushima', lat: 37.7147, lng: 140.2588, day: 7, desc: '“ฟูจิน้อย” — เดิน 15 นาทีถึงขอบปากปล่อง อยู่ตรงข้าม Jododaira' },
  { name: 'Iizaka Onsen', ja: '飯坂温泉', area: 'fukushima', lat: 37.8259, lng: 140.4478, day: 6, desc: 'เมืองออนเซ็นเก่าแก่ ห่างสถานี Fukushima ~25 นาที (รถไฟ Iizaka Line)' },
  { name: 'Hanamiyama Park', ja: '花見山公園', area: 'fukushima', lat: 37.7269, lng: 140.5090, day: 6, desc: 'สวนบนเนินเขา วิวเมือง+ภูเขา (ดังช่วงซากุระ แต่ฤดูใบไม้ร่วงก็สวย)' },
];

/* ---------- main route line (station to station) ---------- */
const ROUTE = [
  [35.6812, 139.7671],  // Tokyo Sta.
  [36.5591, 139.8986],  // Utsunomiya
  [36.7581, 139.5986],  // Nikko
  [36.5591, 139.8986],  // back Utsunomiya
  [37.7543, 140.4590],  // Fukushima
  [35.6812, 139.7671],  // back Tokyo
];

/* ---------- transport segments ---------- */
const TRANSPORT = [
  { title: 'สนามบิน → โตเกียว', day: 'DAY 1 · 20 ต.ค.', options: [
    { method: "Narita Express (N'EX)", note: 'Narita → Tokyo Sta. สบายสุด ที่นั่งระบุ', time: '~60 นาที', price: 3070 },
    { method: 'Keisei Skyliner', note: 'Narita → Ueno เร็วสุด (เหมาะถ้าพักฝั่ง Ueno/Asakusa)', time: '~45 นาที', price: 2580 },
    { method: 'Tokyo Monorail + JR', note: 'กรณีลง Haneda → Hamamatsucho', time: '~25 นาที', price: 700 },
  ]},
  { title: 'Tokyo → Utsunomiya (Tochigi)', day: 'DAY 3 · 22 ต.ค.', options: [
    { method: 'Tohoku Shinkansen (Yamabiko/Nasuno)', note: 'เร็ว นั่งสบาย — ที่นั่งไม่ระบุถูกกว่า ~¥530', time: '~50 นาที', price: 5020 },
    { method: 'JR Utsunomiya Line (รถไฟธรรมดา)', note: 'ประหยัดสุด ถ้าไม่รีบ', time: '~1 ชม. 50 น.', price: 1980 },
  ]},
  { title: 'Utsunomiya → Nikko', day: 'DAY 4 · 23 ต.ค.', options: [
    { method: 'JR Nikko Line', note: 'ออกทุก ~30-60 นาที ลงสถานี JR Nikko', time: '~45 นาที', price: 770 },
  ]},
  { title: 'ในนิกโก้: บัสขึ้นทะเลสาบ Chuzenji', day: 'DAY 5 · 24 ต.ค.', options: [
    { method: 'Tobu Bus — Chuzenji Onsen Free Pass 2 วัน', note: 'ขึ้นลงไม่จำกัด Nikko Sta. ⇄ Chuzenji (ผ่าน Irohazaka) คุ้มกว่าซื้อเที่ยวเดียว', time: '~50 นาที/เที่ยว', price: 2500 },
    { method: 'บัสเที่ยวเดียว Nikko → Chuzenji Onsen', note: 'ช่วงใบไม้แดงรถติดมาก เผื่อเวลา 2 เท่า', time: '~50-90 นาที', price: 1250 },
  ]},
  { title: 'Nikko → Fukushima', day: 'DAY 6 · 25 ต.ค.', options: [
    { method: 'JR Nikko Line + Shinkansen (เปลี่ยนที่ Utsunomiya)', note: 'Nikko → Utsunomiya (¥770) → Yamabiko ไป Fukushima (~¥6,500)', time: '~2 ชม. 15 น.', price: 7270 },
  ]},
  { title: 'วันเดินเขา: Fukushima ⇄ Jododaira', day: 'DAY 7 · 26 ต.ค.', options: [
    { method: 'บัส Jododaira Sky Access (ไป-กลับ)', note: 'ออก 08:30 West Exit กลับถึง 17:00 — ต้องจองล่วงหน้า (Japan Bus Online)', time: '~90 นาที/เที่ยว', price: 4000 },
    { method: 'เช่ารถขับเอง (ทางเลือก)', note: 'อิสระกว่า + ค่าน้ำมัน ~¥1,500 · Skyline ขับสวยมาก แต่โค้งเยอะ', time: '~75 นาที', price: 8000 },
  ]},
  { title: 'Fukushima → Tokyo', day: 'DAY 8 · 27 ต.ค.', options: [
    { method: 'Tohoku Shinkansen (Yamabiko)', note: 'นั่งยาวถึง Tokyo Sta. เลย', time: '~95 นาที', price: 8810 },
  ]},
  { title: 'โตเกียว → สนามบิน', day: 'DAY 9 · 28 ต.ค.', options: [
    { method: "N'EX ไป Narita", note: 'ออกจากเมืองก่อน 14:00 เผื่อเช็คอินไฟลท์ 17:00', time: '~60 นาที', price: 3070 },
    { method: 'Monorail ไป Haneda', note: 'กรณีบินออก Haneda', time: '~25 นาที', price: 700 },
  ]},
  { title: 'ค่าเดินทางในเมือง (เผื่อ)', day: 'ทุกวัน', options: [
    { method: 'Suica/Pasmo — เมโทร+บัสในโตเกียว', note: 'เฉลี่ยวันละ ~¥800 × 4 วันเมือง', time: '—', price: 3200 },
  ]},
];

/* เส้นทางรถไฟหลักที่ใช้เทียบกับ JR EAST PASS (¥30,000) */
const RAIL_MAIN_TOTAL = 3070 + 5020 + 770 + 7270 + 8810 + 3070; // ~¥28,010... exclude N'EX x2 if Skyliner

/* ---------- events (curated from Japan event sites, July 2026) ---------- */
const EVENTS = [
  { title: 'Tokyo Ramen Festa @ Komazawa Olympic Park', area: 'tokyo', dateText: 'ปลาย ต.ค. – ต้น พ.ย. (ปีก่อน ~21 ต.ค.–4 พ.ย.)', status: 'hit',
    desc: 'เทศกาลราเมงใหญ่สุดของโตเกียว ร้านดังทั่วประเทศ ~40 ร้าน ชามละ ~¥1,100', url: 'https://ra-fes.com/' },
  { title: 'Tokyo International Film Festival', area: 'tokyo', dateText: 'ปลาย ต.ค. (ปีก่อนเริ่ม ~27 ต.ค.) — รอประกาศวันปี 2026', status: 'tba',
    desc: 'เทศกาลหนังใหญ่สุดของเอเชีย โซน Hibiya/Ginza/Marunouchi มีพรมแดง+ฉายกลางแจ้ง', url: 'https://2026.tiff-jp.net/en/' },
  { title: 'Kanda Used Book Festival (Jimbocho)', area: 'tokyo', dateText: 'ปลาย ต.ค. – 3 พ.ย. (ปกติ)', status: 'hit',
    desc: 'ถนนหนังสือเก่า Jimbocho กลายเป็นตลาดหนังสือกลางแจ้งยักษ์ ล้านเล่ม', url: 'https://jimbou.info/' },
  { title: 'บรรยากาศ Halloween — Shibuya / Ikebukuro', area: 'tokyo', dateText: 'ตลอดเดือน ต.ค. (พีค 31 ต.ค. — หลังกลับ)', status: 'hit',
    desc: 'ตกแต่ง+อีเวนต์คอสเพลย์ทั่วเมืองตลอดเดือน แต่คืนพีคจริงคือหลังบินกลับ', url: 'https://tokyocheapo.com/events/october/' },
  { title: 'Ginchakai — พิธีชงชากลางแจ้งย่าน Ginza', area: 'tokyo', dateText: 'ปลาย ต.ค. — รอประกาศวันปี 2026', status: 'tba',
    desc: 'จุดชงชาตามมุมถนน Ginza จิบมัทฉะ+วากาชิ สัมผัสวัฒนธรรมชาแบบไม่ต้องจอง', url: 'https://www.magical-trip.com/media/ginza-october-2025-complete-guide-to-autumn-festivals-cultural-events-traditional-matsuri/' },
  { title: 'Nikko Toshogu Autumn Grand Festival (千人武者行列)', area: 'tochigi', dateText: '16–17 ต.ค. 2026 ❌ ก่อนถึง 3 วัน', status: 'miss',
    desc: 'ขบวนซามูไรพันคน + ยิงธนูบนหลังม้า (yabusame) — ปีนี้พลาด ไว้รอบหน้า', url: 'https://japancheapo.com/events/shuki-taisai-grand-autumn-festival/' },
  { title: 'ใบไม้เปลี่ยนสี Irohazaka / Chuzenji / Ryuzu', area: 'tochigi', dateText: 'พีคกลาง–ปลาย ต.ค. ✓ ตรงทริปพอดี', status: 'hit',
    desc: 'ช่วงที่ไปคือพีคของโซนทะเลสาบ Chuzenji พอดี — ไฮไลต์ธรรมชาติของทริป', url: 'https://www.japan-guide.com/e/e3801.html' },
  { title: 'Kawaji Onsen Autumn Leaves Festival', area: 'tochigi', dateText: 'ตลอดเดือน ต.ค.', status: 'hit',
    desc: 'เทศกาลใบไม้แดงเมืองออนเซ็น Kawaji — food stall + ไฟประดับใบเมเปิล (ต้องนั่งรถไฟสายพิเศษเพิ่ม)', url: 'https://www.visitnikko.jp/en/things-to-do/festivals-and-events/' },
  { title: 'ใบไม้เปลี่ยนสี Bandai-Azuma Skyline / Jododaira', area: 'fukushima', dateText: 'พีคต้น–กลาง ต.ค. · ปลายเดือนยังเก็บตกได้ที่ระดับล่าง', status: 'hit',
    desc: 'ถนนสวยติดอันดับญี่ปุ่น — วันเดินเขาจะได้วิวใบไม้เปลี่ยนสีระหว่างทางขึ้นเต็ม ๆ', url: 'https://fukushima.travel/destination/bandai-azuma-skyline/189' },
  { title: 'Nihonmatsu Chrysanthemum Doll Festival (菊人形)', area: 'fukushima', dateText: 'กลาง ต.ค. – กลาง พ.ย. ✓', status: 'hit',
    desc: 'เทศกาลตุ๊กตาดอกเบญจมาศที่ปราสาท Kasumigajo, Nihonmatsu — นั่งชินคันเซ็นจาก Fukushima แค่ ~15 นาที + บัส', url: 'https://fukushima.travel/blogs/the-guide-to-every-fukushima-festival-in-2026/169' },
];

const EVENT_SOURCES = [
  { name: 'Tokyo Cheapo — Events ต.ค.', url: 'https://tokyocheapo.com/events/october/' },
  { name: 'Japan Cheapo Events', url: 'https://japancheapo.com/events/' },
  { name: 'Japan Travel — Event Guide', url: 'https://en.japantravel.com/events' },
  { name: 'GO TOKYO (ทางการ)', url: 'https://www.gotokyo.org/en/story/guide/the-best-festivals-in-tokyo-and-japan/index.html' },
  { name: 'Visit Tochigi', url: 'https://www.visit-tochigi.com/' },
  { name: 'Visit Nikko — Festivals', url: 'https://www.visitnikko.jp/en/things-to-do/festivals-and-events/' },
  { name: 'Fukushima Travel — Festival Guide 2026', url: 'https://fukushima.travel/blogs/the-guide-to-every-fukushima-festival-in-2026/169' },
  { name: 'Walker+ (ญี่ปุ่น)', url: 'https://www.walkerplus.com/event_list/ar0300/' },
];

/* ---------- default shopping list ---------- */
const DEFAULT_SHOPPING = [
  { name: 'KitKat รสพิเศษ (มัทฉะ/ซากุระ)', price: 900, qty: 3, cat: 'ขนม/ของกิน', bought: false },
  { name: 'Tokyo Banana', price: 1200, qty: 2, cat: 'ของฝาก', bought: false },
  { name: 'Royce Nama Chocolate', price: 800, qty: 2, cat: 'ของฝาก', bought: false },
  { name: 'ราเมงกึ่งสำเร็จรูป Ichiran', price: 1500, qty: 1, cat: 'ขนม/ของกิน', bought: false },
  { name: 'ยาแก้ปวด EVE / พลาสเตอร์ Salonpas', price: 1800, qty: 1, cat: 'ยา/สกินแคร์', bought: false },
  { name: 'กันแดด Biore UV / สกินแคร์', price: 2500, qty: 1, cat: 'ยา/สกินแคร์', bought: false },
  { name: 'Uniqlo / GU (Heattech เผื่อหนาว)', price: 5000, qty: 1, cat: 'เสื้อผ้า', bought: false },
  { name: 'เกี๊ยวซ่าแช่แข็ง Utsunomiya (ของฝากโทจิกิ)', price: 1000, qty: 1, cat: 'ของฝาก', bought: false },
  { name: 'ลูกพีช/แอปเปิลอบแห้ง Fukushima', price: 800, qty: 2, cat: 'ของฝาก', bought: false },
];

/* ---------- budget categories (planned, JPY) ---------- */
const DEFAULT_BUDGET = [
  { cat: 'เดินทาง', planned: 35000 },
  { cat: 'ที่พัก (8 คืน)', planned: 64000 },
  { cat: 'อาหาร', planned: 40000 },
  { cat: 'ตั๋วเข้าชม/กิจกรรม', planned: 10000 },
  { cat: 'ช้อปปิ้ง', planned: 30000 },
  { cat: 'อื่นๆ/เผื่อฉุกเฉิน', planned: 10000 },
];

const DAY_OPTIONS = ['ก่อนทริป', 'D1 · 20 ต.ค.', 'D2 · 21 ต.ค.', 'D3 · 22 ต.ค.', 'D4 · 23 ต.ค.', 'D5 · 24 ต.ค.', 'D6 · 25 ต.ค.', 'D7 · 26 ต.ค.', 'D8 · 27 ต.ค.', 'D9 · 28 ต.ค.'];
