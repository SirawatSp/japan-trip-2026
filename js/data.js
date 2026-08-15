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
  other: '#7a5c8e',
};

const AREA_LABELS = {
  tokyo: 'Tokyo',
  tochigi: 'Tochigi',
  nikko: 'Nikko',
  fukushima: 'Fukushima',
  other: 'อื่นๆ ทั่วญี่ปุ่น',
};

/* English labels used when the map language is switched to EN */
const AREA_LABELS_EN = {
  tokyo: 'Tokyo',
  tochigi: 'Tochigi',
  nikko: 'Nikko',
  fukushima: 'Fukushima',
  other: 'Elsewhere in Japan',
};

/* UI strings for the map panel, per language */
const MAP_UI = {
  th: {
    sectionDesc: 'หมุดทุกจุดที่จะไป แยกสีตามพื้นที่ · คลิกชื่อสถานที่ในลิสต์เพื่อซูมไป',
    all: 'ทั้งหมด', other: 'อื่นๆ ทั่วญี่ปุ่น', route: 'เส้นทางหลัก',
    allTypes: 'ทุกประเภท', museum: '🏛 เฉพาะพิพิธภัณฑ์', taniguchi: '✏️ งาน Yoshio Taniguchi', stay: '🛏 ที่พัก',
    empty: 'ไม่มีสถานที่ตามตัวกรองนี้',
    outsideTrip: 'นอกแผนทริป',
    official: 'เว็บทางการ', search: 'ค้นหา', directions: 'เปิดใน Google Maps',
    stayNights: 'คืน', stayNoPrice: 'ยังไม่ได้กรอกราคา', stayBook: 'เปิดใน Airbnb', stayPerPerson: '/คน/คืน',
  },
  en: {
    sectionDesc: 'Every pin on the trip, coloured by area · click a place in the list to zoom to it',
    all: 'All areas', other: 'Elsewhere in Japan', route: 'Main route',
    allTypes: 'All types', museum: '🏛 Museums only', taniguchi: '✏️ Yoshio Taniguchi works', stay: '🛏 Stays',
    empty: 'No places match this filter',
    outsideTrip: 'Not on the trip route',
    official: 'Official site', search: 'Search', directions: 'Open in Google Maps',
    stayNights: 'nights', stayNoPrice: 'no price entered yet', stayBook: 'Open in Airbnb', stayPerPerson: '/person/night',
  },
};

/* Wikimedia Commons file name → hotlinkable thumbnail URL */
function commonsImg(file, width) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width || 480}`;
}

/* ---------- itinerary (default — user can edit/reset in the app) ---------- */
const DEFAULT_ITINERARY = [
  { day: 1, date: 'อ. 20 ต.ค.', area: 'tochigi', title: 'Narita → Utsunomiya รวดเดียว', items: [
    'Narita → Tokyo Sta. (N\'EX ~60 นาที) หรือ Skyliner ลง Ueno', 'ต่อชินคันเซ็นไป Utsunomiya ทันที (~50 นาทีจาก Tokyo Sta.)', 'เช็คอิน Airbnb Utsunomiya (พัก 2 คืน ไม่ต้องย้ายอีก)', 'เย็น: ตะลุยเกี๊ยวซ่า — เมืองหลวงเกี๊ยวซ่าของญี่ปุ่น' ] },
  { day: 2, date: 'พ. 21 ต.ค.', area: 'nikko', title: 'เดย์ทริป Nikko (ไป-กลับ ไม่ย้ายที่พัก)', items: [
    '07:00 ออกจาก Utsunomiya — JR Nikko Line ~45 นาที (ซื้อตั๋วบัส Chuzenji ที่ Nikko เลย)',
    '08:15 ขึ้นบัสไป Chuzenji ก่อน — ขึ้นเช้าเพื่อหนีรถติด Irohazaka ช่วงใบไม้แดง',
    'Akechidaira Ropeway → น้ำตก Kegon → ทะเลสาบ Chuzenji (ถ้าเวลาเหลือค่อยต่อน้ำตก Ryuzu)',
    '13:30 ลงมาศาลเจ้า Toshogu + Treasure Hall — ปิด 17:00 ขายตั๋วถึงราว 16:30',
    'ปิดท้าย: สะพาน Shinkyo / Kanmangafuchi ถ้าแดดยังอยู่',
    '17:30 กลับ Utsunomiya — เกี๊ยวซ่ารอบสอง 🥟' ] },
  { day: 3, date: 'พฤ. 22 ต.ค.', area: 'fukushima', title: 'Utsunomiya ครึ่งวัน → ย้ายเข้า Fukushima', items: [
    'เช็คเอาท์ ฝากกระเป๋าไว้ล็อกเกอร์สถานี Utsunomiya',
    'เช้า: Oya History Museum (เหมืองหินใต้ดิน · บัส ~30 นาที) — หรือสลับเป็นพิพิธภัณฑ์ในเมือง + ศาลเจ้า Futaarayama',
    '~13:30 ชินคันเซ็น Utsunomiya → Fukushima (~55 นาที)',
    'บ่าย: เช็คอิน Airbnb Fukushima · เดินสำรวจทางไป West Exit ให้ชัวร์ก่อนวันเดินเขา' ] },
  { day: 4, date: 'ศ. 23 ต.ค.', area: 'fukushima', title: 'Fukushima แบบสบาย ๆ (เป็นวันสำรองของวันเดินเขาด้วย)', items: [
    '⚠️ เช็คพยากรณ์อากาศวันพรุ่งนี้ก่อน — ถ้าเสาร์ 24 อากาศแย่ ให้สลับมาเดินเขาวันนี้แทน',
    'Fukushima Prefectural Museum of Art (ลง Iizaka Line ป้าย 美術館図書館前)',
    'Hanamiyama Park — วิวเมืองกับภูเขา',
    'ทางเลือกเที่ยวไกล: Tsuruga Castle (Aizu-Wakamatsu) หรือบึง Goshiki-numa ที่ Urabandai — ไป-กลับกินเวลา 4-5 ชม. บนรถ',
    'เย็น: Iizaka Onsen แช่น้ำร้อนเตรียมขา' ] },
  { day: 5, date: 'ส. 24 ต.ค.', area: 'fukushima', title: '⛰ เดินเขา Mt. Issaikyo', items: [
    'เช้ามืด: ซื้อเสบียงที่เซเว่นหน้าสถานี', '08:30 บัส Sky Access → Jododaira → ยอด Issaikyo (1,949 ม.)', 'วิว「ดวงตาแม่มด」Goshikinuma + Azuma-Kofuji', 'กลับถึงเมือง 17:00 → แช่ออนเซ็น Iizaka Onsen' ] },
  { day: 6, date: 'อา. 25 ต.ค.', area: 'tokyo', title: 'Fukushima → Tokyo — นัดเพื่อนตอนเย็น 🍽', items: [
    'เช้า: เก็บที่ยังไม่ได้ไปจากวันศุกร์ (ถ้าเวลาเหลือ)', 'สาย: เช็คเอาท์ → ชินคันเซ็นไป Tokyo (~95 นาที)', 'บ่าย: เช็คอินโรงแรมโตเกียว พักผ่อน', 'ค่ำ: 🍽 นัดกินข้าวกับเพื่อนในเมือง' ] },
  { day: 7, date: 'จ. 26 ต.ค.', area: 'tokyo', title: 'Asakusa + Ueno', items: [
    'Asakusa — วัด Sensoji + ถนน Nakamise', 'Ueno Park / Ameyoko + Gallery of Hōryū-ji Treasures (Taniguchi)', 'National Museum of Western Art + Sumida Hokusai Museum', 'เย็น: Akihabara' ] },
  { day: 8, date: 'อ. 27 ต.ค.', area: 'tokyo', title: 'Harajuku — Shibuya — Shinjuku', items: [
    'ศาลเจ้า Meiji Jingu + Harajuku (Takeshita St.)', 'Nezu Museum (สวนญี่ปุ่น + Kengo Kuma)', 'Shibuya — แยกไฟแดง + Shibuya Sky', 'เย็น: Shinjuku (Omoide Yokocho)' ] },
  { day: 9, date: 'พ. 28 ต.ค.', area: 'tokyo', title: 'Ginza ช้อปปิ้ง → เดินทางกลับ ✈ 17:00', items: [
    'เช้า: Ginza + GINZA SIX (Taniguchi) + Don Quijote/drugstore', '~13:30 ออกจากโรงแรมไปสนามบิน', 'ถึงสนามบินก่อน 15:00', 'บินกลับ 17:00' ] },
];

/* ---------- map places ---------- */
const PLACES = [
  // Tokyo
  { name: 'วัด Sensoji (Asakusa)', ja: '浅草寺', area: 'tokyo', lat: 35.7148, lng: 139.7967, day: 7, desc: 'วัดเก่าแก่ที่สุดในโตเกียว + ถนนช้อป Nakamise',
    en: { name: 'Sensoji Temple (Asakusa)', desc: "Tokyo's oldest temple, fronted by the Nakamise shopping street" } },
  { name: 'Ueno Park / Ameyoko', ja: '上野公園', area: 'tokyo', lat: 35.7141, lng: 139.7745, day: 7, desc: 'สวน+พิพิธภัณฑ์ ตลาด Ameyoko ของกินเพียบ',
    en: { name: 'Ueno Park / Ameyoko', desc: 'Park and museum cluster, plus the Ameyoko street market packed with food stalls' } },
  { name: 'Gallery of Hōryū-ji Treasures', ja: '法隆寺宝物館', area: 'tokyo', lat: 35.7186, lng: 139.7758, day: 7, type: 'museum', taniguchi: true, img: commonsImg('Tokyo_National_Museum_Gallery_of_Horyuji_Treasures_P5163920.jpg'), ticket: 'รวมในตั๋ว Tokyo National Museum (ผู้ใหญ่ ~¥1,000)', url: 'https://www.tnm.jp/modules/r_free_page/index.php?id=119', desc: '🏛 งานออกแบบของ Yoshio Taniguchi (1999) ในเขต Tokyo National Museum — กล่องหินเรียบคู่ล็อบบี้กระจก ในกรอบสเตนเลส เดินจากประตู Ueno Park อีกไม่กี่นาที',
    en: { name: 'Gallery of Hōryū-ji Treasures', ticket: 'Included with Tokyo National Museum admission (adult ~¥1,000)', desc: '🏛 Yoshio Taniguchi (1999), inside the Tokyo National Museum grounds — a plain stone box paired with a glass lobby in a stainless-steel frame, a few minutes from the Ueno Park gate' } },
  { name: 'National Museum of Western Art', ja: '国立西洋美術館', area: 'tokyo', lat: 35.7156, lng: 139.7745, day: 7, type: 'museum', img: commonsImg("Le_musée_national_d'art_occidental_conçu_par_Le_Corbusier_(Tokyo)_(41659392274).jpg"), ticket: 'คอลเลกชันถาวรฟรี · นิทรรศการพิเศษมีค่าใช้จ่ายแยก', url: 'https://www.nmwa.go.jp/', desc: '🏛 ตึกเดียวของ Le Corbusier ในญี่ปุ่น — ขึ้นทะเบียนมรดกโลก UNESCO 2016 ทางเข้าแบบ pilotis + ทางลาดวนชมงานสไตล์เฉพาะตัว อยู่ในคลัสเตอร์ Ueno เดียวกัน',
    en: { name: 'National Museum of Western Art', ticket: 'Permanent collection free · special exhibitions ticketed separately', desc: "🏛 Le Corbusier's only building in Japan — UNESCO World Heritage since 2016. Pilotis entrance and a spiral ramp gallery, in the same Ueno cluster" } },
  { name: 'Sumida Hokusai Museum', ja: 'すみだ北斎美術館', area: 'tokyo', lat: 35.6960, lng: 139.7960, day: 7, type: 'museum', img: commonsImg('2020_Sumida_Hokusai_Museum_02.jpg'), ticket: 'เช็คราคาที่เว็บ (มีทั้งคอลเลกชันถาวร+นิทรรศการพิเศษ)', url: 'https://hokusai-museum.jp/', desc: '🏛 ออกแบบโดย Sejima Kazuyo (SANAA) ผนังอะลูมิเนียมกระจกสะท้อนบริบทรอบข้าง — เดินจาก Ryogoku Sta. 5 นาที ห่างจาก Asakusa ข้ามแม่น้ำนิดเดียว รวมงานอุกิโยเอะของโฮคุไซ',
    en: { name: 'Sumida Hokusai Museum', ticket: 'Check current prices online (permanent collection + special exhibitions)', desc: '🏛 Designed by Kazuyo Sejima (SANAA); mirrored aluminium walls reflect the neighbourhood — 5 min from Ryogoku Sta., just across the river from Asakusa. Hokusai ukiyo-e collection' } },
  { name: 'Akihabara', ja: '秋葉原', area: 'tokyo', lat: 35.6984, lng: 139.7731, day: 7, desc: 'ย่านเครื่องใช้ไฟฟ้า อนิเมะ เกม',
    en: { name: 'Akihabara', desc: 'Electronics, anime and gaming district' } },
  { name: 'ศาลเจ้า Meiji Jingu', ja: '明治神宮', area: 'tokyo', lat: 35.6764, lng: 139.6993, day: 8, desc: 'ศาลเจ้าใหญ่กลางป่าในเมือง ติด Harajuku',
    en: { name: 'Meiji Jingu Shrine', desc: 'Major shrine set in a forest in the middle of the city, next to Harajuku' } },
  { name: 'Nezu Museum', ja: '根津美術館', area: 'tokyo', lat: 35.6654, lng: 139.7188, day: 8, type: 'museum', ticket: 'เช็คราคาที่เว็บ (แพงกว่าพิพิธภัณฑ์รัฐ เพราะเป็นเอกชน)', url: 'https://www.nezu-muse.or.jp/', desc: '🏛 ออกแบบโดย Kengo Kuma (2009) — สวนญี่ปุ่นสวยเงียบสงบกลาง Omotesando คอลเลกชันโบราณวัตถุเอเชีย มีสมบัติชาติ 7 ชิ้น เดิน 8 นาทีจากสถานี Omotesando',
    en: { name: 'Nezu Museum', ticket: 'Check prices online (private museum, pricier than the national ones)', desc: '🏛 Kengo Kuma (2009) — a quiet Japanese garden in the middle of Omotesando, with an Asian antiquities collection including 7 National Treasures. 8 min walk from Omotesando Sta.' } },
  { name: 'Shibuya Crossing + Sky', ja: '渋谷', area: 'tokyo', lat: 35.6595, lng: 139.7005, day: 8, desc: 'แยกไฟแดงที่พลุกพล่านที่สุดในโลก + จุดชมวิว Shibuya Sky',
    en: { name: 'Shibuya Crossing + Shibuya Sky', desc: "The world's busiest pedestrian crossing, plus the Shibuya Sky observation deck" } },
  { name: 'Shinjuku', ja: '新宿', area: 'tokyo', lat: 35.6896, lng: 139.7006, day: 8, desc: 'Omoide Yokocho, Kabukicho, ช้อปปิ้งยักษ์',
    en: { name: 'Shinjuku', desc: 'Omoide Yokocho, Kabukicho and huge department-store shopping' } },
  { name: 'Ginza', ja: '銀座', area: 'tokyo', lat: 35.6717, lng: 139.7650, day: 9, desc: 'ย่านช้อปไฮเอนด์ + Uniqlo 12 ชั้น, Itoya',
    en: { name: 'Ginza', desc: 'High-end shopping district — 12-floor Uniqlo, Itoya stationery' } },
  { name: 'GINZA SIX', ja: 'ギンザシックス', area: 'tokyo', lat: 35.6699, lng: 139.7638, day: 9, taniguchi: true, img: commonsImg('GINZA_SIX_Office_Building.jpg'), ticket: 'ฟรี (เดินชมอาคาร+สวนดาดฟ้าได้ไม่มีค่าใช้จ่าย)', url: 'https://ginza6.tokyo/', desc: '🏛 ภายนอกอาคารออกแบบโดย Taniguchi (ร่วมกับ Kajima Design, 2017) — ชายคาสเตนเลสรอบชั้นออฟฟิศ + สวนดาดฟ้า อยู่ในย่าน Ginza ที่จะไปช้อปอยู่แล้ว',
    en: { name: 'GINZA SIX', ticket: 'Free (building and rooftop garden open to walk-ins)', desc: '🏛 Exterior by Taniguchi with Kajima Design (2017) — stainless eaves wrapping the office floors, plus a rooftop garden. Right in the Ginza shopping area already on the plan' } },
  { name: '21_21 DESIGN SIGHT', ja: '21_21 デザインサイト', area: 'tokyo', lat: 35.6640, lng: 139.7301, day: 8, type: 'museum', img: commonsImg('21_21_DESIGN_SIGHT.jpg'), ticket: 'เช็คราคาที่เว็บ (เปลี่ยนตามนิทรรศการ)', url: 'https://2121designsight.jp/', desc: '🏛 ออกแบบโดย Tadao Ando (2007) — หลังคาเหล็กแผ่นเดียวพับตามแนวคิด "ผ้าหนึ่งผืน" ของ Issey Miyake ส่วนใหญ่ฝังอยู่ใต้ดิน ใน Tokyo Midtown, Roppongi (นอกเส้นทางหลัก แต่คุ้มถ้าชอบงานสถาปัตย์ — เดินทางต่อจาก Shibuya/Harajuku ได้)',
    en: { name: '21_21 DESIGN SIGHT', ticket: 'Check prices online (varies by exhibition)', desc: '🏛 Tadao Ando (2007) — a single folded steel-plate roof echoing Issey Miyake\'s "a piece of cloth" idea, with most of the building underground. In Tokyo Midtown, Roppongi (off the main route, but easy to reach from Shibuya/Harajuku)' } },
  { name: 'Tokyo Metropolitan Teien Art Museum', ja: '東京都庭園美術館', area: 'tokyo', lat: 35.6350, lng: 139.7168, day: 8, type: 'museum', img: commonsImg('Tokyo_Metropolitan_Teien_Art_Museum.jpg'), ticket: 'เช็คราคาที่เว็บ (เปลี่ยนตามนิทรรศการ + ค่าเข้าสวนแยก)', url: 'https://www.teien-art-museum.ne.jp/en/', desc: '🏛 อดีตวังเจ้าชาย Asaka สไตล์ Art Deco แท้ๆ จากฝรั่งเศส (1933) ทั้งหลังคือมรดกวัฒนธรรมสำคัญ — เดิน 6-7 นาทีจากสถานี Meguro/Shirokanedai ใกล้ Shibuya',
    en: { name: 'Tokyo Metropolitan Teien Art Museum', ticket: 'Check prices online (varies by exhibition; garden ticket separate)', desc: '🏛 The former Prince Asaka residence, genuine French Art Deco (1933) and an Important Cultural Property in its own right — 6–7 min from Meguro/Shirokanedai Sta., near Shibuya' } },
  { name: 'Don Quijote Shinjuku', ja: 'ドン・キホーテ', area: 'tokyo', lat: 35.6944, lng: 139.7016, day: 8, desc: 'แหล่งกวาดของฝาก เปิดดึก อย่าลืมพาสปอร์ต (tax-free)',
    en: { name: 'Don Quijote Shinjuku', desc: 'Souvenir sweep spot, open late — bring your passport for tax-free' } },
  { name: 'Tokyo Sea Life Park (Kasai)', ja: '葛西臨海水族園', area: 'tokyo', lat: 35.6423, lng: 139.8607, day: 9, type: 'museum', taniguchi: true, img: commonsImg('Tokyo_Sea_Life_Park_Edogawa-ward_Tokyo_Japan.JPG'), ticket: 'เช็คราคาปัจจุบันที่เว็บ (ผู้ใหญ่ประมาณ ¥700)', url: 'https://www.tokyo-zoo.net/', desc: '🏛 อควาเรียมออกแบบโดย Taniguchi (1989, รางวัล Mainichi Art Award) — จากสถานีโตเกียวนั่ง JR Keiyo Line ~15 นาที ในสวนเดียวกันมีงาน Taniguchi อีก 2 หลัง เหมาะเป็นช่วงเช้าก่อนไปสนามบินวันสุดท้าย (เปิด 9:30)',
    en: { name: 'Tokyo Sea Life Park (Kasai)', ticket: 'Check current prices online (adult approx. ¥700)', desc: '🏛 Aquarium by Taniguchi (1989, Mainichi Art Award) — ~15 min from Tokyo Sta. on the JR Keiyo Line. Two more Taniguchi buildings sit in the same park; a good last-morning stop before the airport (opens 9:30)' } },
  { name: 'Kasai Rinkai Park Visitor Center', ja: '葛西臨海公園ビジターセンター', area: 'tokyo', lat: 35.6438, lng: 139.8580, day: 9, type: 'museum', taniguchi: true, ticket: 'ฟรี', url: 'https://www.tokyo-park.or.jp/park/kasairinkai/', desc: '🏛 อีกหนึ่งงานของ Taniguchi ในสวนเดียวกัน (1996) — จุดชมนกและธรรมชาติ เข้าฟรี เดินต่อจากอควาเรียมได้เลย (รวมเป็น 3 อาคารของ Taniguchi ในสวนนี้)',
    en: { name: 'Kasai Rinkai Park Visitor Center', ticket: 'Free', desc: '🏛 Another Taniguchi building in the same park (1996) — birdwatching and nature centre, free entry, a short walk on from the aquarium (three Taniguchi buildings in this park in total)' } },
  // Tochigi
  { name: 'สถานี Utsunomiya', ja: '宇都宮駅', area: 'tochigi', lat: 36.5591, lng: 139.8986, day: 1, desc: 'ฮับของโทจิกิ — จุดต่อรถไป Nikko',
    en: { name: 'Utsunomiya Station', desc: 'Tochigi hub — transfer point for trains to Nikko' } },
  { name: 'Oya History Museum', ja: '大谷資料館', area: 'tochigi', lat: 36.6009, lng: 139.8228, day: 3, desc: 'เหมืองหินใต้ดินสุดอลัง เย็น 8°C พกเสื้อคลุม',
    en: { name: 'Oya History Museum', desc: 'Vast underground stone quarry — a steady 8°C, so bring a jacket' } },
  { name: 'ถนนเกี๊ยวซ่า (Kirasse)', ja: '宇都宮餃子', area: 'tochigi', lat: 36.5583, lng: 139.8830, day: 1, desc: 'เมืองหลวงเกี๊ยวซ่า — ร้าน Minmin, Masashi ห้ามพลาด',
    en: { name: 'Gyoza Street (Kirasse)', desc: "Japan's gyoza capital — Minmin and Masashi are the must-try shops" } },
  { name: 'ศาลเจ้า Futaarayama', ja: '二荒山神社', area: 'tochigi', lat: 36.5658, lng: 139.8823, day: 3, desc: 'ศาลเจ้าเก่าแก่ใจกลางเมือง Utsunomiya',
    en: { name: 'Utsunomiya Futaarayama Shrine', desc: 'Ancient shrine in the centre of Utsunomiya' } },
  { name: 'Tochigi Prefectural Museum of Fine Arts', ja: '栃木県立美術館', area: 'tochigi', lat: 36.5486, lng: 139.8890, day: 3, type: 'museum', img: commonsImg('Tochigi_Prefectural_Museum_of_Fine_Arts.jpg'), ticket: 'คอลเลกชัน ¥260 · นิทรรศการพิเศษแยก (⚠️ นิทรรศการพิเศษ ต.ค. เปิด 24 ต.ค. — ไม่ทันวันที่แวะ)', url: 'https://www.art.pref.tochigi.lg.jp/', desc: 'คอลเลกชันเครื่องเคลือบ Meissen ระดับแนวหน้าของญี่ปุ่น + งานศิลปะยุโรป/ญี่ปุ่นสมัยใหม่ — บัส 15 นาทีจากฝั่งตะวันตกสถานี Utsunomiya',
    en: { name: 'Tochigi Prefectural Museum of Fine Arts', ticket: 'Collection ¥260 · special exhibitions separate (⚠️ the October special exhibition opens 24 Oct — after our visit)', desc: 'One of the strongest Meissen porcelain collections in Japan, plus modern European and Japanese art — 15 min by bus from the west side of Utsunomiya Sta.' } },
  { name: 'Utsunomiya Museum of Art', ja: '宇都宮美術館', area: 'tochigi', lat: 36.5730, lng: 139.8420, day: 3, type: 'museum', img: commonsImg('Utsunomiya_museum.jpg'), ticket: 'เช็คราคาที่เว็บ (⚠️ นิทรรศการ Magritte เปิด 24 ต.ค. — ไม่ทันวันที่แวะ เห็นแค่คอลเลกชันถาวร)', url: 'https://u-moa.jp/', desc: 'อาคารชั้นเดียวกลมกลืนกับป่า ใน Bunka no Mori Park — งาน Magritte, Chagall และคอลเลกชันดีไซน์ บัส ~25 นาทีจากฝั่งตะวันตกสถานี Utsunomiya',
    en: { name: 'Utsunomiya Museum of Art', ticket: 'Check prices online (⚠️ the Magritte show opens 24 Oct — after our visit, so permanent collection only)', desc: 'Single-storey building blending into the woods of Bunka no Mori Park — Magritte, Chagall and a design collection. ~25 min by bus from the west side of Utsunomiya Sta.' } },
  { name: 'Mashiko Museum of Ceramic Art', ja: '益子陶芸美術館', area: 'tochigi', lat: 36.4550, lng: 140.1080, day: 3, type: 'museum', img: commonsImg('Mashiko_Museum_of_Ceramic_Art.JPG'), ticket: 'เช็คราคาที่เว็บ', url: 'https://www.mashiko-museum.jp/', desc: 'เมืองเครื่องปั้นดินเผามาชิโกะ งานของช่างระดับ Living National Treasure Hamada Shoji + เตาเผาโบราณ — บัส ~60 นาทีจากสถานี Utsunomiya (ไกลหน่อย เผื่อเวลาครึ่งวัน — ถ้าเลือกอันนี้อาจต้องตัดอย่างอื่นออก)',
    en: { name: 'Mashiko Museum of Ceramic Art', ticket: 'Check prices online', desc: 'In the pottery town of Mashiko — work by Living National Treasure Shoji Hamada plus historic kilns. ~60 min by bus from Utsunomiya Sta. (a half-day commitment; picking this may mean dropping something else)' } },
  // Nikko
  { name: 'ศาลเจ้า Toshogu', ja: '日光東照宮', area: 'nikko', lat: 36.7581, lng: 139.5986, day: 2, desc: 'มรดกโลก สุสานโชกุน Tokugawa Ieyasu — แกะสลักแมวหลับ/ลิงสามตัว',
    en: { name: 'Nikko Toshogu Shrine', desc: 'World Heritage mausoleum of shogun Tokugawa Ieyasu — the sleeping cat and three wise monkeys carvings' } },
  { name: 'Nikko Toshogu Museum (Treasure Hall)', ja: '日光東照宮宝物館', area: 'nikko', lat: 36.7583, lng: 139.5990, day: 2, type: 'museum', img: commonsImg('Nikko_toshogu_yomeimon_gate_ver1.jpg'), ticket: '¥1,000 (แยกจากตั๋วศาลเจ้าหลัก)', url: 'https://www.toshogu.jp/shisetsu/houmotsu.html', desc: 'เปิดปี 2015 ฉลอง 400 ปี Toshogu — ดาบและเครื่องรบของ Ieyasu, โรงหนัง VR เล่าเรื่องประตู Yomeimon เข้าใจง่ายแม้ไม่รู้ประวัติศาสตร์มาก่อน อยู่ในคอมเพล็กซ์เดียวกับศาลเจ้า',
    en: { name: 'Nikko Toshogu Museum (Treasure Hall)', ticket: '¥1,000 (separate from the main shrine ticket)', desc: "Opened 2015 for Toshogu's 400th anniversary — Ieyasu's swords and armour, plus a VR film on the Yomeimon gate that works even with no background in the history. Inside the shrine complex" } },
  { name: 'สะพาน Shinkyo', ja: '神橋', area: 'nikko', lat: 36.7550, lng: 139.5995, day: 2, desc: 'สะพานแดงศักดิ์สิทธิ์ จุดถ่ายรูปซิกเนเจอร์',
    en: { name: 'Shinkyo Bridge', desc: "Sacred vermillion bridge — Nikko's signature photo spot" } },
  { name: 'Kanmangafuchi Abyss', ja: '憾満ヶ淵', area: 'nikko', lat: 36.7469, lng: 139.5911, day: 2, desc: 'หุบผาริมแม่น้ำ + รูปปั้นจิโซใส่หมวกแดง ~70 องค์',
    en: { name: 'Kanmangafuchi Abyss', desc: 'Riverside gorge lined with ~70 red-capped Jizo statues' } },
  { name: 'โค้ง Irohazaka', ja: 'いろは坂', area: 'nikko', lat: 36.7280, lng: 139.5250, day: 2, desc: 'ถนน 48 โค้งขึ้นเขา — ใบไม้แดงพีคช่วงปลาย ต.ค. รถติดให้เผื่อเวลา',
    en: { name: 'Irohazaka Winding Road', desc: '48 hairpin bends up the mountain — autumn colour peaks in late October, so expect traffic and allow extra time' } },
  { name: 'Akechidaira Ropeway', ja: '明智平', area: 'nikko', lat: 36.7278, lng: 139.5148, day: 2, desc: 'กระเช้าขึ้นจุดชมวิว เห็นน้ำตก Kegon + ทะเลสาบพร้อมกัน',
    en: { name: 'Akechidaira Ropeway', desc: 'Ropeway to a viewpoint that takes in Kegon Falls and Lake Chuzenji at once' } },
  { name: 'น้ำตก Kegon', ja: '華厳滝', area: 'nikko', lat: 36.7379, lng: 139.5011, day: 2, desc: 'น้ำตกสูง 97 ม. — 1 ใน 3 น้ำตกสวยสุดของญี่ปุ่น (ลิฟต์ลง ¥570)',
    en: { name: 'Kegon Falls', desc: "97 m waterfall, one of Japan's three most famous (observation lift ¥570)" } },
  { name: 'ทะเลสาบ Chuzenji', ja: '中禅寺湖', area: 'nikko', lat: 36.7333, lng: 139.4667, day: 2, desc: 'ทะเลสาบบนเขา 1,269 ม. เดินเล่นริมน้ำ',
    en: { name: 'Lake Chuzenji', desc: 'Mountain lake at 1,269 m — easy lakeside walking' } },
  { name: 'น้ำตก Ryuzu', ja: '竜頭滝', area: 'nikko', lat: 36.7581, lng: 139.4451, day: 2, desc: '“น้ำตกหัวมังกร” — จุดใบไม้แดงเปลี่ยนสีเร็วสุดของ Nikko (อยู่ไกลสุดของสาย — ไปต่อเฉพาะถ้าลงจาก Kegon ก่อน 11:30)',
    en: { name: 'Ryuzu Falls', desc: '"Dragon\'s head falls" — the earliest autumn colour in Nikko (furthest stop on the line; only worth it if you leave Kegon before 11:30)' } },
  // Fukushima
  { name: 'สถานี Fukushima', ja: '福島駅', area: 'fukushima', lat: 37.7543, lng: 140.4590, day: 3, desc: 'ฐานทัพ 3 คืน (22–25 ต.ค.) — บัสขึ้นเขาออกฝั่ง West Exit',
    en: { name: 'Fukushima Station', desc: 'Base for three nights (22–25 Oct) — the mountain bus leaves from the West Exit' } },
  { name: 'Jododaira Visitor Center', ja: '浄土平', area: 'fukushima', lat: 37.7218, lng: 140.2517, day: 5, desc: 'จุดสตาร์ทเดินเขา 1,600 ม. บน Bandai-Azuma Skyline',
    en: { name: 'Jododaira Visitor Center', desc: 'Trailhead at 1,600 m on the Bandai-Azuma Skyline' } },
  { name: 'ยอด Mt. Issaikyo', ja: '一切経山', area: 'fukushima', lat: 37.7311, lng: 140.2439, day: 5, desc: 'ยอด 1,949 ม. — วิวทะเลสาบ Goshikinuma「ดวงตาแม่มด」',
    en: { name: 'Mt. Issaikyo summit', desc: '1,949 m summit — looks down on Goshikinuma, "the Witch\'s Eye"' } },
  { name: 'ทะเลสาบ Goshikinuma', ja: '五色沼(魔女の瞳)', area: 'fukushima', lat: 37.7355, lng: 140.2450, day: 5, desc: 'ทะเลสาบปล่องภูเขาไฟสีเทอร์ควอยซ์ มองจากยอด Issaikyo',
    en: { name: 'Lake Goshikinuma', desc: 'Turquoise crater lake, seen from the Issaikyo summit' } },
  { name: 'Azuma-Kofuji', ja: '吾妻小富士', area: 'fukushima', lat: 37.7147, lng: 140.2588, day: 5, desc: '“ฟูจิน้อย” — เดิน 15 นาทีถึงขอบปากปล่อง อยู่ตรงข้าม Jododaira',
    en: { name: 'Azuma-Kofuji', desc: '"Little Fuji" — 15 min climb to the crater rim, directly opposite Jododaira' } },
  { name: 'Fukushima Prefectural Museum of Art', ja: '福島県立美術館', area: 'fukushima', lat: 37.7602, lng: 140.4649, day: 4, type: 'museum', img: commonsImg('Fukushima_Prefectural_Museum_of_Art_ac.jpg'), ticket: 'คอลเลกชันถาวรมักฟรี/ราคาย่อมเยา · เช็คนิทรรศการพิเศษที่เว็บ', url: 'https://art-museum.fcs.ed.jp/', desc: 'งาน Andrew Wyeth + ภาพพิมพ์ไซโตะ คิโยชิ ตั้งในสวนกว้างริมลำธาร — ลง Iizaka Line ที่ป้าย "美術館図書館前" เดิน 2 นาที · ใส่ไว้วันศุกร์ 23 ต.ค. ซึ่งเป็นวันว่าง/วันสำรองของวันเดินเขา',
    en: { name: 'Fukushima Prefectural Museum of Art', ticket: 'Permanent collection usually free or cheap · check special exhibitions online', desc: 'Andrew Wyeth paintings and Kiyoshi Saito prints, in wide grounds beside a stream — Iizaka Line to "Bijutsukan-Toshokan-mae", 2 min walk. Slotted into Friday 23 Oct, the free day that doubles as the weather backup for the hike' } },
  { name: 'Iizaka Onsen', ja: '飯坂温泉', area: 'fukushima', lat: 37.8259, lng: 140.4478, day: 4, desc: 'เมืองออนเซ็นเก่าแก่ ห่างสถานี Fukushima ~25 นาที (รถไฟ Iizaka Line) — แช่ได้ทั้งเย็นวันศุกร์ (23) และหลังลงจากเขาวันเสาร์ (24)',
    en: { name: 'Iizaka Onsen', desc: 'Historic hot-spring town ~25 min from Fukushima Sta. on the Iizaka Line — good on Friday evening (23) and again after the hike on Saturday (24)' } },
  { name: 'Hanamiyama Park', ja: '花見山公園', area: 'fukushima', lat: 37.7269, lng: 140.5090, day: 4, desc: 'สวนบนเนินเขา วิวเมือง+ภูเขา (ดังช่วงซากุระ แต่ฤดูใบไม้ร่วงก็สวย) — ไปวันศุกร์ 23 ต.ค. ได้สบาย ๆ',
    en: { name: 'Hanamiyama Park', desc: 'Hillside park with city and mountain views — famous for cherry blossom but good in autumn too. Easy to fit into Friday 23 Oct' } },
  { name: 'ปราสาท Tsuruga (Aizu-Wakamatsu)', ja: '鶴ヶ城', area: 'fukushima', lat: 37.4877, lng: 139.9296, day: 4, desc: 'ปราสาทหลังคากระเบื้องแดงหนึ่งเดียวในญี่ปุ่น เมืองซามูไรไอสึ — จาก Fukushima ต้องต่อ ชินคันเซ็นถึง Koriyama + Ban\'etsu West Line รวม ~2 ชม./เที่ยว (วันศุกร์ 23 ถ้าอยากไปไกล)',
    en: { name: 'Tsuruga Castle (Aizu-Wakamatsu)', desc: "Japan's only red-tiled castle keep, in the Aizu samurai town — from Fukushima it's shinkansen to Koriyama plus the Ban'etsu West Line, about 2 hr each way (a Friday 23 Oct option if you want to go far)" } },
  { name: 'บึง Goshiki-numa (Urabandai)', ja: '裏磐梯 五色沼', area: 'fukushima', lat: 37.6580, lng: 140.0710, day: 4, desc: 'เส้นทางเดินเลียบบึงหลากสี ~3.6 กม. เชิงภูเขาบันได (คนละที่กับ 五色沼 ที่มองจากยอด Issaikyo) — จาก Fukushima ~2 ชม./เที่ยว ผ่าน Koriyama + Inawashiro',
    en: { name: 'Goshiki-numa Ponds (Urabandai)', desc: 'A 3.6 km trail past multi-coloured ponds at the foot of Mt. Bandai (a different place from the 五色沼 seen from the Issaikyo summit) — ~2 hr each way from Fukushima via Koriyama and Inawashiro' } },
  // Other Taniguchi works in Japan — far from this route, reference only (from architecture-history.org)
  { name: 'Ken Domon Museum of Photography', ja: '土門拳記念館', area: 'other', lat: 38.906, lng: 139.845, day: null, type: 'museum', taniguchi: true, ticket: 'เช็คราคาที่เว็บ', url: 'http://www.domonken-kinenkan.jp/', desc: '🏛 Sakata, Yamagata (1983) — ผลงานที่ Taniguchi ได้รางวัล Japan Art Academy Prize ถือเป็นงานที่คนรัก Taniguchi ยกย่องสุด แต่ไกลมาก (~4 ชม.จากโตเกียว ผ่าน Niigata) เหมาะเป็นทริปแยกต่างหาก',
    en: { name: 'Ken Domon Museum of Photography', ticket: 'Check prices online', desc: '🏛 Sakata, Yamagata (1983) — the building that won Taniguchi the Japan Art Academy Prize, and the one his admirers rate highest. Very far though (~4 hr from Tokyo via Niigata); better as its own trip' } },
  { name: 'D.T. Suzuki Museum', ja: '鈴木大拙館', area: 'other', lat: 36.560, lng: 136.663, day: null, type: 'museum', taniguchi: true, ticket: '¥310', url: 'https://www.kanazawa-museum.jp/daisetz/', desc: '🏛 Kanazawa (2011) — 3 ห้อง 3 สวนเชื่อมด้วยทางเดิน จบด้วย "Water Mirror Garden" เงียบสงบมาก ไป Hokuriku Shinkansen จากโตเกียว ~2.5 ชม.',
    en: { name: 'D.T. Suzuki Museum', ticket: '¥310', desc: '🏛 Kanazawa (2011) — three rooms and three gardens linked by corridors, ending at the Water Mirror Garden. Extremely quiet. ~2.5 hr from Tokyo on the Hokuriku Shinkansen' } },
  { name: 'Taniguchi Yoshiro/Yoshio Museum of Architecture', ja: '谷口吉郎・吉生記念金沢建築館', area: 'other', lat: 36.5615, lng: 136.6605, day: null, type: 'museum', taniguchi: true, ticket: '¥310', url: 'https://www.kanazawa-museum.jp/architecture/', desc: '🏛 Kanazawa (2019) — พิพิธภัณฑ์เกี่ยวกับตัว Taniguchi เองกับพ่อ (Yoshiro) โดยเฉพาะ อยู่เมืองเดียวกับ D.T. Suzuki Museum ไปคู่กันได้',
    en: { name: 'Taniguchi Yoshiro/Yoshio Museum of Architecture', ticket: '¥310', desc: '🏛 Kanazawa (2019) — a museum about Taniguchi himself and his father Yoshiro. Same city as the D.T. Suzuki Museum, so pair the two' } },
  { name: 'Kyoto National Museum — Heisei Chishinkan', ja: '京都国立博物館 平成知新館', area: 'other', lat: 34.9916, lng: 135.7717, day: null, type: 'museum', taniguchi: true, ticket: '¥700', url: 'https://www.kyohaku.go.jp/', desc: '🏛 Kyoto (2014) — งานปลายทางของ Taniguchi ในสายพิพิธภัณฑ์แห่งชาติ ไป Tokaido Shinkansen จากโตเกียว ~2.5 ชม.',
    en: { name: 'Kyoto National Museum — Heisei Chishinkan', ticket: '¥700', desc: '🏛 Kyoto (2014) — the late work in Taniguchi\'s run of national-museum buildings. ~2.5 hr from Tokyo on the Tokaido Shinkansen' } },
  { name: 'Toyota Municipal Museum of Art', ja: '豊田市美術館', area: 'other', lat: 35.083, lng: 137.156, day: null, type: 'museum', taniguchi: true, img: commonsImg('Toyota_Municipal_Museum_of_Art,_Kozakahon-machi_Toyota_2012.JPG'), ticket: 'เช็คราคาที่เว็บ', url: 'https://www.museum.toyota.aichi.jp/', desc: '🏛 Toyota, Aichi (1995) — หลายคนยกให้เป็นงานที่ "สมบูรณ์แบบที่สุด" ของ Taniguchi เส้นแนวนอน/ตั้งฉาก + แสงธรรมชาติ ใกล้นาโกย่า',
    en: { name: 'Toyota Municipal Museum of Art', ticket: 'Check prices online', desc: '🏛 Toyota, Aichi (1995) — widely called Taniguchi\'s most resolved building: horizontal and orthogonal lines worked with natural light. Near Nagoya' } },
  { name: 'MIMOCA (Marugame Genichiro-Inokuma Museum)', ja: '丸亀市猪熊弦一郎現代美術館', area: 'other', lat: 34.290, lng: 133.798, day: null, type: 'museum', taniguchi: true, ticket: '¥300', url: 'https://www.mimoca.jp/en/', desc: '🏛 Marugame, Kagawa (1991) — ติดหน้าสถานีรถไฟพอดี บนเกาะชิโกกุ ไกลมาก ต้องนั่งชินคันเซ็น+รถไฟท้องถิ่นต่อหลายทอด',
    en: { name: 'MIMOCA (Marugame Genichiro-Inokuma Museum)', ticket: '¥300', desc: '🏛 Marugame, Kagawa (1991) — right in front of the station, on Shikoku. Very far: shinkansen plus several local transfers' } },
  { name: 'Higashiyama Kaii Gallery (Nagano)', ja: '長野県信濃美術館 東山魁夷館', area: 'other', lat: 36.667, lng: 138.194, day: null, type: 'museum', taniguchi: true, ticket: 'เช็คราคาที่เว็บ', url: 'https://www.npsam.com/', desc: '🏛 Nagano City (1990) — แกลเลอรีรวมงานจิตรกร Higashiyama Kaii ไป Hokuriku Shinkansen จากโตเกียว ~90 นาที',
    en: { name: 'Higashiyama Kaii Gallery (Nagano)', ticket: 'Check prices online', desc: '🏛 Nagano City (1990) — gallery devoted to the painter Kaii Higashiyama. ~90 min from Tokyo on the Hokuriku Shinkansen' } },
  { name: 'Higashiyama Kaii Setouchi Museum (Kagawa)', ja: '香川県立東山魁夷せとうち美術館', area: 'other', lat: 34.35, lng: 133.85, day: null, type: 'museum', taniguchi: true, ticket: '¥310', url: 'https://www.pref.kagawa.lg.jp/higasiyamakaii/', desc: '🏛 Sakaide, Kagawa (2005) — แกลเลอรีที่สองของ Higashiyama Kaii โดย Taniguchi วิวสะพานเซโตะโอฮาชิ อยู่บนเกาะชิโกกุ',
    en: { name: 'Higashiyama Kaii Setouchi Museum (Kagawa)', ticket: '¥310', desc: '🏛 Sakaide, Kagawa (2005) — the second Higashiyama Kaii gallery by Taniguchi, looking out at the Seto Ohashi bridge. On Shikoku' } },
  { name: 'Shiseido Art House', ja: '資生堂アートハウス', area: 'other', lat: 34.79, lng: 138.05, day: null, type: 'museum', taniguchi: true, ticket: 'ฟรี — แต่⚠️ปิดถาวร มิ.ย. 2026 (ก่อนทริปนี้)', url: 'https://corp.shiseido.com/art-house/jp/', desc: '🏛 Kakegawa, Shizuoka (1978) — ผลงานที่ทำให้ Taniguchi ได้รางวัลสถาปัตยกรรมใหญ่ครั้งแรก แต่จะปิดถาวรปลายเดือน มิ.ย. 2026 ก่อนทริปนี้จะเริ่ม — ไปไม่ทันแล้ว',
    en: { name: 'Shiseido Art House', ticket: 'Free — but ⚠️ closed permanently in June 2026, before this trip', desc: '🏛 Kakegawa, Shizuoka (1978) — the building that won Taniguchi his first major architecture prize, but it closes for good at the end of June 2026, before this trip starts. Not reachable any more' } },
  { name: 'IBM Makuhari Building', ja: 'IBM幕張ビル', area: 'other', lat: 35.648, lng: 140.034, day: null, taniguchi: true, ticket: 'อาคารสำนักงานเอกชน ไม่เปิดให้เข้าชมด้านใน', url: '', desc: '🏛 Chiba (1991) — อาคารสำนักงาน IBM ชมได้แค่ภายนอก ไม่ใช่พิพิธภัณฑ์',
    en: { name: 'IBM Makuhari Building', ticket: 'Private office building — no public access inside', desc: '🏛 Chiba (1991) — an IBM office block, exterior viewing only, not a museum' } },
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
  { title: 'สนามบิน → Utsunomiya (Tochigi) รวดเดียว', day: 'DAY 1 · 20 ต.ค.', options: [
    { method: "Narita Express (N'EX) + Shinkansen ต่อที่ Tokyo Sta.", note: 'Narita → Tokyo Sta. (¥3,070) → เปลี่ยนขบวน Tohoku Shinkansen ไป Utsunomiya (~¥5,020)', time: 'รวม ~2 ชม.', price: 8090 },
    { method: 'Keisei Skyliner + Shinkansen', note: 'Narita → Ueno (¥2,580) → ต่อรถไฟ/ชินคันเซ็นไป Utsunomiya', time: 'รวม ~2 ชม.', price: 7600 },
    { method: 'Tokyo Monorail + Shinkansen', note: 'กรณีลง Haneda → Hamamatsucho → Tokyo Sta. → Utsunomiya', time: 'รวม ~2 ชม. 15 น.', price: 5720 },
  ]},
  { title: 'เดย์ทริป Nikko ไป-กลับจาก Utsunomiya', day: 'DAY 2 · 21 ต.ค.', options: [
    { method: 'JR Nikko Line ไป-กลับ', note: 'ออกทุก ~30-60 นาที · ขบวนแรกจาก Utsunomiya ราว 06:00 — ที่พักไม่ต้องย้าย เก็บของไว้ที่เดิมได้', time: '~45 นาที/เที่ยว', price: 1540 },
  ]},
  { title: 'ในนิกโก้: บัสขึ้นทะเลสาบ Chuzenji', day: 'DAY 2 · 21 ต.ค.', options: [
    { method: 'Tobu Bus — Chuzenji Onsen Free Pass 2 วัน', note: 'ขึ้นลงไม่จำกัด Nikko Sta. ⇄ Chuzenji (ผ่าน Irohazaka) — วันเดียวก็ยังคุ้มถ้าแวะ Akechidaira + Kegon + Ryuzu', time: '~50 นาที/เที่ยว', price: 2500 },
    { method: 'บัสเที่ยวเดียว Nikko → Chuzenji Onsen', note: 'ช่วงใบไม้แดงรถติดมาก เผื่อเวลา 2 เท่า — ขึ้นบัสก่อน 09:00 จะรอดที่สุด', time: '~50-90 นาที', price: 1250 },
  ]},
  { title: 'Utsunomiya → Fukushima', day: 'DAY 3 · 22 ต.ค. (บ่าย)', options: [
    { method: 'Tohoku Shinkansen (Yamabiko)', note: 'ขึ้นตรงจาก Utsunomiya ไม่ต้องย้อนกลับโตเกียว — เช็คเอาท์เช้า ฝากกระเป๋าไว้ล็อกเกอร์ แล้วเที่ยว Oya ก่อนได้', time: '~55 นาที', price: 6500 },
  ]},
  { title: 'วันเดินเขา: Fukushima ⇄ Jododaira', day: 'DAY 5 · 24 ต.ค.', options: [
    { method: 'Jododaira Sky Access — คอร์สนักเดินเขา', note: 'ออก Fukushima West Exit 08:30 · ถึง Jododaira 09:30 · รถกลับ 15:00 · ถึงสถานี 16:00 · จองภายใน 15:00 วันก่อน', time: '5.5 ชม. ที่ Jododaira', price: 13000 },
    { method: 'เช่ารถขับเอง (ทางเลือก)', note: 'อิสระกว่า + ค่าน้ำมัน ~¥1,500 · Skyline ขับสวยมาก แต่โค้งเยอะ', time: '~75 นาที', price: 8000 },
  ]},
  { title: 'Fukushima → Tokyo (นัดเพื่อนเย็นนี้)', day: 'DAY 6 · 25 ต.ค.', options: [
    { method: 'Tohoku Shinkansen (Yamabiko) — ขบวนสาย', note: 'นั่งยาวถึง Tokyo Sta. เลย ออกช่วงสาย ๆ ให้ถึงโตเกียวบ่ายโมง เผื่อเวลาพักก่อนนัดมื้อเย็น', time: '~95 นาที', price: 8810 },
  ]},
  { title: 'โตเกียว → สนามบิน', day: 'DAY 9 · 28 ต.ค.', options: [
    { method: "N'EX ไป Narita", note: 'ออกจากเมืองก่อน 14:00 เผื่อเช็คอินไฟลท์ 17:00', time: '~60 นาที', price: 3070 },
    { method: 'Monorail ไป Haneda', note: 'กรณีบินออก Haneda', time: '~25 นาที', price: 700 },
  ]},
  { title: 'ค่าเดินทางในเมือง (เผื่อ)', day: 'ทุกวัน', options: [
    { method: 'Suica/Pasmo — เมโทร+บัสในโตเกียว', note: 'เฉลี่ยวันละ ~¥800 × 4 วันเมือง (Day 6 เย็น + Day 7-9)', time: '—', price: 3200 },
  ]},
];

/* เส้นทางรถไฟหลักที่ใช้เทียบกับ JR EAST PASS (¥30,000) */
const RAIL_MAIN_TOTAL = 3070 + 5020 + 1540 + 6500 + 8810 + 3070; // N'EX + Tokyo→Utsunomiya + เดย์ทริป Nikko + Utsunomiya→Fukushima + Fukushima→Tokyo + N'EX กลับ

/* ---------- events (ยืนยันวันที่จริงปี 2026 แล้ว — อัปเดต ก.ค. 2026) ---------- */
const EVENTS = [
  // --- เทศกาล/บรรยากาศ ---
  { title: 'Tokyo Ramen Festa @ Komazawa Olympic Park', area: 'tokyo', dateText: '23 ต.ค. – 3 พ.ย. 2026 ✓ ยืนยันแล้ว', status: 'hit',
    desc: 'เทศกาลราเมงใหญ่สุดของโตเกียว ร้านดัง ~39 ร้าน หมุนเวียน 3 ช่วง เข้าฟรี ซื้อตั๋วราเมงใบละ ¥1,100 ต่อชาม', url: 'https://tokyocheapo.com/events/tokyo-ramen-show/' },
  { title: 'Tokyo International Film Festival (TIFF)', area: 'tokyo', dateText: '26 ต.ค. – 4 พ.ย. 2026 ✓ ยืนยันแล้ว ตรงกับวันเดินทางกลับ (27-28 ต.ค.)', status: 'hit',
    desc: 'เทศกาลหนังใหญ่สุดของเอเชีย ครั้งที่ 39 โซน Hibiya/Ginza/Marunouchi พรมแดง+ฉายกลางแจ้ง เดินเล่นดูบรรยากาศได้แม้ไม่มีตั๋ว', url: 'https://2026.tiff-jp.net/en/' },
  { title: 'Kanda Used Book Festival (Jimbocho)', area: 'tokyo', dateText: '❌ แก้ไข: จริงๆจัดเดือน มี.ค.-เม.ย. (ฤดูใบไม้ผลิ) ไม่ใช่ฤดูใบไม้ร่วง', status: 'miss',
    desc: 'ตรวจสอบซ้ำแล้วพบว่าปกติจัดช่วงปลายมี.ค.-เม.ย. (ตรงซากุระ) ไม่ใช่ ต.ค. อย่างที่เข้าใจผิดก่อนหน้านี้ — ต้องขออภัยที่ให้ข้อมูลผิดไปตอนแรก', url: 'https://jimbou.info/' },
  { title: 'บรรยากาศ Halloween — Shibuya / Ikebukuro', area: 'tokyo', dateText: 'ตลอดเดือน ต.ค. (พีคจริง 31 ต.ค. — หลังบินกลับ 3 วัน)', status: 'hit',
    desc: 'ตกแต่ง+อีเวนต์คอสเพลย์ทั่วเมืองตลอดเดือน จะเห็นบรรยากาศได้ตั้งแต่วันแรก แต่คืนพีคสุด (31 ต.ค.) คือหลังบินกลับแล้ว', url: 'https://tokyocheapo.com/events/october/' },
  { title: 'Nikko Toshogu Autumn Grand Festival (千人武者行列)', area: 'tochigi', dateText: '16–17 ต.ค. 2026 ✓ ยืนยันแล้ว ❌ ก่อนถึง 3 วัน', status: 'miss',
    desc: 'ยืนยันวันแล้ว: yabusame (ยิงธนูบนหลังม้า) 16 ต.ค. + ขบวนซามูไรพันคน 17 ต.ค. — ปีนี้พลาดแน่นอน ไว้รอบหน้า', url: 'https://www.nikko-kankou.org/spot/506' },
  { title: 'ใบไม้เปลี่ยนสี Irohazaka / Chuzenji / Ryuzu', area: 'tochigi', dateText: 'พีคกลาง–ปลาย ต.ค. ✓ ตรงทริปพอดี', status: 'hit',
    desc: 'ช่วงที่ไปคือพีคของโซนทะเลสาบ Chuzenji พอดี — ไฮไลต์ธรรมชาติของทริป', url: 'https://www.japan-guide.com/e/e3801.html' },
  { title: 'ใบไม้เปลี่ยนสี Bandai-Azuma Skyline / Jododaira', area: 'fukushima', dateText: 'พีคต้น–กลาง ต.ค. · ปลายเดือนยังเก็บตกได้ที่ระดับล่าง', status: 'hit',
    desc: 'ถนนสวยติดอันดับญี่ปุ่น — วันเดินเขาจะได้วิวใบไม้เปลี่ยนสีระหว่างทางขึ้นเต็ม ๆ', url: 'https://fukushima.travel/destination/bandai-azuma-skyline/189' },
  { title: 'Nihonmatsu Chrysanthemum Doll Festival (菊人形)', area: 'fukushima', dateText: 'กลาง ต.ค. – กลาง พ.ย. ✓', status: 'hit',
    desc: 'เทศกาลตุ๊กตาดอกเบญจมาศที่ปราสาท Kasumigajo, Nihonmatsu — นั่งชินคันเซ็นจาก Fukushima แค่ ~15 นาที + บัส', url: 'https://fukushima.travel/blogs/the-guide-to-every-fukushima-festival-in-2026/169' },
  // --- นิทรรศการพิเศษตามพิพิธภัณฑ์ที่ปักหมุดไว้ (เช็ควันจริงแล้ว) ---
  { title: '特別展「源氏物語」The Tale of Genji @ Tokyo National Museum', area: 'tokyo', dateText: '14 ต.ค. – 6 ธ.ค. 2026 ✓ ทันทั้ง Day 1 และ Day 8', status: 'hit',
    desc: 'นิทรรศการภาพวาด/ต้นฉบับที่เกี่ยวกับ Tale of Genji ครบรอบพิเศษ — จัดคู่กับ Gallery of Hōryū-ji Treasures ที่ปักหมุดไว้แล้ว ไปได้ทั้ง Day 1 และตอนกลับ Day 8', url: 'https://www.tnm.jp/modules/r_free_page/index.php?id=1255' },
  { title: '特別展「大徳寺」Daitokuji 700th Anniversary @ Tokyo National Museum', area: 'tokyo', dateText: '14 ต.ค. – 6 ธ.ค. 2026 ✓ ทันทั้ง Day 1 และ Day 8', status: 'hit',
    desc: 'รวมสมบัติวัด Daitokuji และวัดในเครือ ฉลอง 700 ปี จัดพร้อมกับนิทรรศการ Genji ที่ TNM เดียวกัน', url: 'https://daitokuji2026.exhn.jp/' },
  { title: 'テート美術館 ターナー展 Tate\'s Turner Exhibition @ National Museum of Western Art', area: 'tokyo', dateText: '24 ต.ค. 2026 – 21 ก.พ. 2027 ⚠️ พลาด Day 1 (20 ต.ค.) แต่ทัน Day 8 (27 ต.ค.)', status: 'hit',
    desc: 'งานจาก Tate กว่า 80 ชิ้น (สีน้ำมัน+watercolor) — เปิดหลัง Day 1 ไป 4 วัน ถ้าอยากดูให้แวะ Ueno อีกรอบช่วง Day 8 แทน (ตอนนี้ itinerary Day 8 ไปแค่ Shinjuku/Ginza ต้องปรับเอง)', url: 'https://www.nmwa.go.jp/jp/exhibitions/upcoming.html' },
  { title: '「舞楽装束」Bugaku Costumes @ Nezu Museum', area: 'tokyo', dateText: '24 ต.ค. – 23 พ.ย. 2026 ❌ พลาด (Day 2 คือ 21 ต.ค. — เปิดหลังจากนั้น 3 วัน)', status: 'miss',
    desc: 'นิทรรศการก่อนหน้า (やきもの名品紀行) ปิดไปแล้ว 12 ต.ค. — วันที่ไป Nezu Museum (Day 2) อยู่ในช่วง "ว่าง" ระหว่าง 2 นิทรรศการพอดี จะเห็นแค่ส่วนคอลเลกชันถาวร', url: 'https://www.nezu-muse.or.jp/jp/exhibition/next.html' },
  { title: '「逸翁美術館名品展」Itten Museum Masterpieces @ Suntory Museum of Art', area: 'tokyo', dateText: '16 ก.ย. – 8 พ.ย. 2026 ✓ ทันตลอดทริป', status: 'hit',
    desc: 'งานคัดสรรจากคอลเลกชัน Itten Museum ~5,500 ชิ้น (ต้นฉบับโบราณ, ชุดน้ำชา, ภาพวาด Buson/Goshun) — อยู่ Tokyo Midtown ใกล้ 21_21 Design Sight ไปคู่กันได้ Day 8', url: 'https://www.suntory.co.jp/sma/exhibition/future.html' },
  { title: '森万里子展 Mariko Mori @ Mori Art Museum', area: 'tokyo', dateText: '31 ต.ค. 2026 – 28 มี.ค. 2027 ❌ เปิดหลังบินกลับ 3 วัน', status: 'miss',
    desc: 'นิทรรศการใหญ่เปิดหลังทริปจบ (บินกลับ 28 ต.ค. เย็น) — พลาดแน่นอนรอบนี้', url: 'https://www.mori.art.museum/jp/exhibitions/index.html' },
  { title: '特別展（日本画・書・写真部門）@ Tochigi Prefectural Museum of Fine Arts', area: 'tochigi', dateText: '24 ต.ค. – 3 พ.ย. 2026 ❌ พลาด (Day 3 คือ 22 ต.ค. — เปิดหลังจากนั้น 2 วัน)', status: 'miss',
    desc: 'นิทรรศการพิเศษเปิดหลัง Day 3 (Utsunomiya) ไป 2 วันพอดี — วันที่แวะจะเห็นแค่คอลเลกชันถาวร (Meissen) ไม่ทันนิทรรศการนี้', url: 'https://www.art.pref.tochigi.lg.jp/schedule/index.html' },
  { title: 'マグリット展 Magritte Exhibition @ Utsunomiya Museum of Art', area: 'tochigi', dateText: '24 ต.ค. – 6 ธ.ค. 2026 ❌ พลาด (Day 3 คือ 22 ต.ค. — เปิดหลังจากนั้น 2 วัน)', status: 'miss',
    desc: 'นิทรรศการ Magritte ใหญ่ก็เปิดหลัง Day 3 ไป 2 วันเป๊ะเหมือนกัน — บังเอิญพิพิธภัณฑ์ทั้งสองที่ Utsunomiya เปลี่ยนนิทรรศการวันเดียวกันคือ 24 ต.ค. ถ้าอยากทันจริงๆ ต้องขยับวัน Tochigi ไปเป็นวันหลังของทริป (แต่เส้นทางตอนนี้ไม่ผ่าน Tochigi อีกรอบ)', url: 'https://u-moa.jp/exhibition/schedule.html' },
  { title: 'คอลเลกชันถาวร (นิทรรศการปรับใหม่) @ Fukushima Prefectural Museum of Art', area: 'fukushima', dateText: '10 ต.ค. – 6 ธ.ค. 2026 ✓ ทัน Day 6 (25 ต.ค.)', status: 'hit',
    desc: 'พิพิธภัณฑ์ปิดปรับปรุงนิทรรศการ 25 ก.ย.–9 ต.ค. แล้วเปิดคอลเลกชันชุดใหม่ 10 ต.ค. — ทันพอดีตอนแวะวัน Day 6', url: 'https://art-museum.fcs.ed.jp/exhibition' },
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

/* ============================================================
   ที่พัก — Airbnb, 4 คน, 8 คืน
   เพดานงบ: ฿1,200/คน/คืน → ฿4,800/คืน ต่อทั้งหลัง (แก้ได้ในหน้าเว็บ)
   ราคาจริงต้องเปิดลิงก์ไปดูใน Airbnb แล้วกรอกกลับมาเอง
   ============================================================ */
const STAY_GUESTS = 4;
const STAY_CAP_PER_PERSON_THB = 1200;
const STAY_BUDGET_CAT = 'ที่พัก (8 คืน)';

/* สร้างลิงก์ค้นหา Airbnb ที่กรองไว้แล้ว: 4 คน · วันที่ตามช่วงพัก · ห้องน้ำ 1+ · ทั้งหลัง · เพดานราคา/คืน */
function airbnbSearch(query, checkIn, checkOut, maxPerNightThb) {
  const p = new URLSearchParams({
    adults: String(STAY_GUESTS), children: '0', infants: '0', pets: '0',
    checkin: checkIn, checkout: checkOut,
    min_bathrooms: '1',
    currency: 'THB', price_max: String(Math.round(maxPerNightThb)),
    search_type: 'filter_change',
  });
  return `https://th.airbnb.com/s/${encodeURIComponent(query)}/homes?${p}&room_types%5B%5D=Entire%20home%2Fapt`;
}

const STAYS = [
  {
    id: 'utsunomiya', city: 'Utsunomiya', ja: '宇都宮', area: 'tochigi',
    checkIn: '2026-10-20', checkOut: '2026-10-22', nights: 2, days: 'DAY 1–2',
    station: 'JR Utsunomiya Sta. (ชินคันเซ็น + JR Nikko Line)',
    searchQuery: 'Utsunomiya Station, Tochigi, Japan',
    lat: 36.5591, lng: 139.8986,
    pick: { label: 'ลิสต์ที่ wishlist ไว้', url: 'https://th.airbnb.com/rooms/1392269349368841909?adults=4&children=0&infants=0&pets=0&check_in=2026-10-20&check_out=2026-10-22' },
    note: 'พัก 2 คืนไม่ต้องย้าย — 21 ต.ค. เป็นเดย์ทริป Nikko ไป-กลับ · 22 ต.ค. เช็คเอาท์แล้วขึ้นชินคันเซ็นไป Fukushima ตอนบ่าย ขอให้อยู่ฝั่งเดียวกับสถานี',
    en: { city: 'Utsunomiya', station: 'JR Utsunomiya Sta. (shinkansen + JR Nikko Line)', note: 'Two nights, no moving — 21 Oct is a Nikko day trip and back · on 22 Oct we check out and take the afternoon shinkansen to Fukushima, so stay on the station side' },
  },
  {
    id: 'fukushima', city: 'Fukushima', ja: '福島', area: 'fukushima',
    checkIn: '2026-10-22', checkOut: '2026-10-25', nights: 3, days: 'DAY 3–5',
    station: 'JR Fukushima Sta. — บัสขึ้นเขาออกฝั่ง West Exit 08:30',
    searchQuery: 'Fukushima Station, Fukushima, Japan',
    lat: 37.7543, lng: 140.4590,
    pick: { label: 'ลิสต์ที่ wishlist ไว้', url: 'https://th.airbnb.com/rooms/1500308318751323061?adults=4&children=0&infants=0&pets=0&check_in=2026-10-22&check_out=2026-10-25' },
    note: 'เข้าพักบ่าย 22 ต.ค. · คืนที่สำคัญสุดคือคืนศุกร์ — เช้าเสาร์ต้องออกจากที่พักก่อน 08:15 ให้ทัน Sky Access ที่ West Exit',
    en: { city: 'Fukushima', station: 'JR Fukushima Sta. — mountain bus leaves the West Exit at 08:30', note: 'The most important location of the trip: on hiking day we must leave by 08:15 to catch Sky Access at the West Exit' },
  },
  {
    id: 'tokyo', city: 'Tokyo', ja: '東京', area: 'tokyo',
    checkIn: '2026-10-25', checkOut: '2026-10-28', nights: 3, days: 'DAY 6–8',
    station: 'เลือกได้หลายย่าน — ดูตัวเลือกด้านล่าง',
    searchQuery: 'Ueno, Taito City, Tokyo, Japan',
    lat: 35.7141, lng: 139.7774,
    note: 'ยังไม่มีลิสต์ที่เลือกไว้ — กดลิงก์ค้นหาที่กรองไว้แล้ว (4 คน · 25–28 ต.ค. · ห้องน้ำ 1+ · ทั้งหลัง) แล้วกรอกราคา/ลิงก์กลับมา',
    en: { city: 'Tokyo', station: 'Several districts work — see the options below', note: 'No listing picked yet — use the pre-filtered search links (4 guests · 25–28 Oct · 1+ bathroom · entire place), then paste the price and link back here' },
    /* ย่านที่แนะนำ: ต้องรับชินคันเซ็นจาก Fukushima + ไปสนามบินวันสุดท้าย + ตรงกับแผน Day 7-9 */
    candidates: [
      { name: 'Ueno / Okachimachi', ja: '上野・御徒町', lat: 35.7141, lng: 139.7774, query: 'Ueno, Taito City, Tokyo, Japan',
        why: 'ชินคันเซ็นจาก Fukushima ลงที่ Ueno ได้เลย + Skyliner ตรงไป Narita + Day 7 เดินเที่ยว Ueno/Asakusa ได้จากที่พัก',
        whyEn: 'The shinkansen from Fukushima stops here, the Skyliner runs straight to Narita, and Day 7 (Ueno/Asakusa) starts at the door' },
      { name: 'Asakusa / Kuramae', ja: '浅草・蔵前', lat: 35.7118, lng: 139.7967, query: 'Asakusa, Taito City, Tokyo, Japan',
        why: 'ห้องใหญ่ราคาถูกที่สุดในบรรดาย่านนี้ + Asakusa Line ต่อ Haneda ได้ตรง · Day 7 อยู่ในย่านพอดี',
        whyEn: 'Biggest rooms for the money of the four, direct Asakusa Line to Haneda, and Day 7 is right here' },
      { name: 'Nippori / Nishi-Nippori', ja: '日暮里・西日暮里', lat: 35.7280, lng: 139.7710, query: 'Nippori, Arakawa City, Tokyo, Japan',
        why: 'Skyliner จอด ถึง Narita 36 นาที + JR Yamanote ครบ · เงียบและถูกกว่าฝั่ง Ueno',
        whyEn: 'Skyliner stop (Narita in 36 min) plus the full Yamanote line; quieter and cheaper than Ueno proper' },
      { name: 'Shinjuku / Shin-Okubo', ja: '新宿・新大久保', lat: 35.6896, lng: 139.7006, query: 'Shinjuku City, Tokyo, Japan',
        why: 'N\'EX ไป Narita ขึ้นที่ Shinjuku ได้ + Day 8 จบที่ Shinjuku พอดี · แลกมาด้วยราคาที่สูงกว่า',
        whyEn: "N'EX to Narita departs from Shinjuku and Day 8 ends here — but expect to pay more" },
    ],
  },
];

/* หมุดที่พักบนแผนที่ — ตำแหน่งเป็นสถานี/ย่านโดยประมาณ ไม่ใช่พิกัดบ้านจริง */
STAYS.forEach((s) => {
  if (s.candidates) {
    s.candidates.forEach((c) => PLACES.push({
      name: `ที่พัก Tokyo (ตัวเลือก): ${c.name}`, ja: c.ja, area: s.area, lat: c.lat, lng: c.lng,
      day: 6, type: 'stay', stayId: s.id, query: c.query,
      desc: `🛏 ย่านที่พักที่แนะนำสำหรับ 25–28 ต.ค. (3 คืน · 4 คน) — ${c.why} · หมุดปักที่สถานี ไม่ใช่ตำแหน่งบ้านจริง`,
      en: { name: `Tokyo stay (option): ${c.name}`, desc: `🛏 Suggested district for 25–28 Oct (3 nights · 4 guests) — ${c.whyEn} · pin is on the station, not an actual listing address` },
    }));
  } else {
    PLACES.push({
      name: `ที่พัก ${s.city}`, ja: s.ja, area: s.area, lat: s.lat, lng: s.lng,
      day: s.id === 'utsunomiya' ? 1 : 3, type: 'stay', stayId: s.id, url: s.pick.url,
      desc: `🛏 ${s.nights} คืน · ${s.checkIn} → ${s.checkOut} · 4 คน — ${s.station} · หมุดปักที่สถานี ไม่ใช่ตำแหน่งบ้านจริง`,
      en: { name: `${s.en.city} stay`, desc: `🛏 ${s.nights} nights · ${s.checkIn} → ${s.checkOut} · 4 guests — ${s.en.station} · pin is on the station, not the actual listing address` },
    });
  }
});

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
