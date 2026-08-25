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
    allTypes: 'ทุกประเภท', museum: '🏛 เฉพาะพิพิธภัณฑ์', taniguchi: '✏️ งาน Yoshio Taniguchi', stay: '🛏 ที่พัก', car: '🚗 เช่ารถ',
    empty: 'ไม่มีสถานที่ตามตัวกรองนี้',
    outsideTrip: 'นอกแผนทริป',
    official: 'เว็บทางการ', search: 'ค้นหา', directions: 'เปิดใน Google Maps',
    stayNights: 'คืน', stayNoPrice: 'ยังไม่ได้กรอกราคา', stayBook: 'เปิดใน Airbnb', stayPerPerson: '/คน/คืน',
  },
  en: {
    sectionDesc: 'Every pin on the trip, coloured by area · click a place in the list to zoom to it',
    all: 'All areas', other: 'Elsewhere in Japan', route: 'Main route',
    allTypes: 'All types', museum: '🏛 Museums only', taniguchi: '✏️ Yoshio Taniguchi works', stay: '🛏 Stays', car: '🚗 Car rental',
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

/* ---------- itinerary (default — user can edit/reset in the app) ----------
   แต่ละรายการ = { t: เวลา, act: กิจกรรม, note: รายละเอียดเพิ่ม, cost: ราคาประมาณต่อคน (เยน) }
   ขึ้นเวอร์ชันทุกครั้งที่แก้แผนเริ่มต้น เพื่อให้เครื่องที่เคยบันทึกไว้รู้ว่ามีของใหม่ */
const ITINERARY_VERSION = 10;
/* ป้ายประเภทกิจกรรมในแผนรายวัน — ใช้ดูภาพรวมว่าวันไหนออกนอกเมือง วันไหนอยู่ในเมือง */
const ITEM_TAGS = {
  nature: { icon: '🌿', th: 'ธรรมชาติ', en: 'Nature',  color: '#3e5c46' },
  city:   { icon: '🏙', th: 'ในเมือง',  en: 'City',    color: '#2f4870' },
  move:   { icon: '🚄', th: 'เดินทาง',  en: 'Transit', color: '#7a5c8e' },
  food:   { icon: '🍽', th: 'กิน',      en: 'Food',    color: '#d97b29' },
  other:  { icon: '•',  th: 'อื่นๆ',    en: 'Other',   color: '#8d8375' },
};
const ITEM_TAG_KEYS = Object.keys(ITEM_TAGS);


const DEFAULT_ITINERARY = [
  { day: 1, date: 'อ. 20 ต.ค.', area: 'tokyo', title: 'Narita → นัดข้าวกับญาติ → เย็นเข้า Utsunomiya (2 คืนรวด)', items: [
    { t: '08:00', act: 'ถึง Narita — ตม. / รับกระเป๋า / เติมเงิน Suica', note: 'เวลาเป็นสมมติฐาน ปรับตามไฟลท์จริง', tag: 'move', cost: 0 },
    { t: '09:00', act: '📦 ฝากกระเป๋าที่เคาน์เตอร์ Same-day Delivery ในสนามบิน (JAL ABC / Yamato / Sagawa)', note: 'ยื่นกระเป๋าช่วง 09:00-18:00 → ของถึงที่พัก Utsunomiya <strong>ภายในราว 21:00 คืนนี้เลย</strong> ไม่ต้องรอถึงพรุ่งนี้ · ราคาประมาณ ¥2,000-3,000/ใบ ขึ้นกับขนาด เช็คราคาจริงหน้าเคาน์เตอร์ · แจ้งที่อยู่ Airbnb + เบอร์เจ้าของที่พักไว้ล่วงหน้า', tag: 'other', cost: 2000 },
    { t: '—', act: '🔁 ถ้านัดญาติอยู่ใกล้สนามบิน: ใช้ล็อกเกอร์ Narita แทน', note: 'ล็อกเกอร์ไซส์ XL ที่ Terminal 3 เก็บได้ถึง 5 วัน — เลือกอันนี้แทนถ้าไม่อยากเสียค่าส่งและวนกลับมารับเองได้ทัน แต่ถ้านัดอยู่ไกลสนามบิน การส่งตรงเข้าที่พักสะดวกกว่ามาก', tag: 'other', cost: 0 },
    { t: '10:00', act: 'เดินทางเข้าเมืองไปพบญาติ (ตัวเบา ไม่แบกกระเป๋าใหญ่แล้ว)', note: 'ปรับสถานีปลายทางตามที่นัดจริง — ตัวอย่างคือเข้า Tokyo Sta./Ueno ด้วย N\'EX หรือ Skyliner', tag: 'move', cost: 1000 },
    { t: '12:00', act: '🍽 นัดข้าวเที่ยงกับญาติ', note: 'ช่วงเวลาหลักของวันนี้ — ไม่ต้องรีบ ปรับกิจกรรมอื่นทั้งวันรอบนัดนี้', tag: 'food', cost: 0 },
    { t: '14:00', act: 'ช่วงบ่ายว่าง — เดินเล่น/พักผ่อนแถวที่นัด', note: 'ตัวเบาไม่มีกระเป๋าแล้ว จะเดินเที่ยวเพิ่มหรือนั่งพักรอเวลาก็ได้ ไม่ต้องอัดโปรแกรม เผื่อเวลาคุยกับญาติเกินแผน', tag: 'city', cost: 0 },
    { t: '17:30', act: 'ไปสถานี Tokyo/Ueno เตรียมขึ้นชินคันเซ็นเย็น', note: 'เผื่อเวลาเดินทางจากจุดนัดกลับมาสถานีต้นทาง', tag: 'move', cost: 0 },
    { t: '18:20', act: '🚄 Tohoku Shinkansen (Yamabiko/Nasuno) → Utsunomiya', note: '~50 นาที ¥5,020 (จองที่นั่ง) · ช่วงเย็นมีวิ่งราว 3 เที่ยว/ชม. เที่ยวท้าย ๆ ลากยาวถึงราว 21:00 — <strong>เช็ครอบแน่นอนใกล้วันเดินทาง</strong> เพราะปรับตามฤดูกาล', tag: 'move', cost: 5020 },
    { t: '—', act: '🔁 ไม่รีบ: JR Utsunomiya Line รถธรรมดา/รถด่วน', note: '~1 ชม. 30-50 นาที ¥2,090 ถูกกว่าชินคันเซ็นเกินครึ่ง ไม่ต้องเปลี่ยนขบวน วิ่งถึงดึกกว่าชินคันเซ็น เหมาะถ้าคุยกับญาติเพลินจนดึก', tag: 'move', cost: 0 },
    { t: '19:15', act: 'ถึง Utsunomiya · เช็คอิน Airbnb (พัก 2 คืนรวด 20-22)', note: 'กระเป๋าที่ส่งไว้เช้านี้ควรถึงก่อนหรือใกล้เคียงเวลานี้ — เช็คับสถานะพัสดุจากเคาน์เตอร์ที่ Narita ได้', tag: 'move', cost: 0 },
    { t: '20:00', act: '🥟 เย็น: เกี๊ยวซ่าร้านดัง (Minmin / Masashi)', note: 'ต่อคิวได้ ไปก่อนเวลาจะดีกว่า · Kirasse ลานรวมร้านเกี๊ยวซ่าปิดค่อนข้างเร็ว เช็คเวลาก่อน', tag: 'food', cost: 1500 },
  ]},
  { day: 2, date: 'พ. 21 ต.ค.', area: 'nikko', title: 'เดย์ทริป Nikko (ไป-กลับ ไม่ย้ายที่พัก)', items: [
    { t: '06:50', act: 'ซื้อข้าวเช้าที่เซเว่นหน้าสถานี', note: 'กินบนรถไฟ ประหยัดเวลา', tag: 'food', cost: 500 },
    { t: '07:15', act: '🚃 JR Nikko Line: Utsunomiya → Nikko', note: '~42-45 นาที ¥760 · ที่พักไม่ต้องย้าย เก็บของไว้ที่เดิมได้', tag: 'move', cost: 760 },
    { t: '08:00', act: 'ถึง Nikko · ซื้อบัตรบัส Chuzenji Onsen Free Pass', note: '~¥2,500 · คุ้มถ้าขึ้น Irohazaka + แวะหลายจุด', tag: 'move', cost: 2500 },
    { t: '08:15', act: 'บัสขึ้นโค้ง Irohazaka → Akechidaira Ropeway', note: '⚠️ ขึ้นเช้าเพื่อหนีรถติดใบไม้แดง · กระเช้าไป-กลับ ~¥1,000', tag: 'nature', cost: 1000 },
    { t: '09:30', act: 'น้ำตก Kegon + ลิฟต์ลงจุดชมวิว', note: 'ลิฟต์ ¥570', tag: 'nature', cost: 570 },
    { t: '10:45', act: 'ทะเลสาบ Chuzenji + ข้าวเที่ยงริมทะเลสาบ', note: 'ถ้าลงจาก Kegon ก่อน 11:30 ค่อยต่อน้ำตก Ryuzu', tag: 'nature', cost: 1200 },
    { t: '13:00', act: 'ลงมาศาลเจ้า Toshogu', note: 'ปิด 17:00 ขายตั๋วถึงราว 16:30 · ค่าเข้าประมาณ ¥1,600 เช็คหน้างาน', tag: 'city', cost: 1600 },
    { t: '14:15', act: 'Toshogu Treasure Hall (โรงหนัง VR)', note: 'ตั๋วแยกจากศาลเจ้า', tag: 'city', cost: 1000 },
    { t: '15:30', act: 'สะพาน Shinkyo / Kanmangafuchi Abyss', note: 'ข้ามสะพาน ~¥300 · Kanmangafuchi เดินฟรี', tag: 'nature', cost: 300 },
    { t: '16:45', act: '🚃 JR Nikko Line กลับ Utsunomiya', note: '~42-45 นาที ¥760', tag: 'move', cost: 760 },
    { t: '18:00', act: 'เย็น: เกี๊ยวซ่ารอบสอง 🥟', note: 'ร้านอื่นจากเมื่อคืน หรือกลับไปร้านเดิมที่ถูกใจ', tag: 'food', cost: 1500 },
  ]},
  { day: 3, date: 'พฤ. 22 ต.ค.', area: 'fukushima', title: 'ครึ่งวัน ① — Utsunomiya ครึ่งเช้า → เข้า Fukushima', items: [
    { t: '08:30', act: 'เช็คเอาท์ · ฝากกระเป๋าล็อกเกอร์สถานี Utsunomiya', note: 'ล็อกเกอร์ใบใหญ่ ~¥700', tag: 'move', cost: 700 },
    { t: '09:00', act: 'บัสไป Oya (ฝั่งตะวันตกสถานี)', note: '~30 นาที', tag: 'move', cost: 460 },
    { t: '09:45', act: 'Oya History Museum — เหมืองหินใต้ดิน', note: 'ข้างในเย็น ~8°C พกเสื้อคลุม · ค่าเข้าประมาณ ¥800 · ถ้าไม่อยากรีบ ตัดอันนี้ออกแล้วเดินเมือง+ศาลเจ้า Futaarayama แทนได้', tag: 'city', cost: 800 },
    { t: '11:30', act: 'บัสกลับตัวเมือง · รับกระเป๋า', note: '', tag: 'move', cost: 460 },
    { t: '12:15', act: 'ข้าวเที่ยงแถวสถานี Utsunomiya', note: '', tag: 'food', cost: 1200 },
    { t: '13:30', act: '🚄 ชินคันเซ็น Utsunomiya → Fukushima', note: '~55 นาที · Yamabiko', tag: 'move', cost: 6250 },
    { t: '14:40', act: 'ถึง Fukushima · เช็คอิน Airbnb (3 คืน)', note: 'ครึ่งบ่ายที่เหลือเอาไว้ตั้งหลัก อย่าอัดโปรแกรม', tag: 'move', cost: 0 },
    { t: '16:00', act: 'เดินย่านสถานี · ซื้อเสบียงวันเดินเขา · เดินดูทาง West Exit', note: 'ให้รู้ทางก่อนเช้าวันเสาร์ จะได้ไม่หลง · เผื่อซื้อถุงมือ/หมวกที่ยังขาด', tag: 'city', cost: 1500 },
    { t: '18:00', act: '🥟 เย็น: เกี๊ยวซ่าจานกลม (円盤餃子)', note: 'ของขึ้นชื่อประจำเมือง — ร้านดังรอบสถานีมีหลายเจ้า บางร้านหมดเร็ว ไปก่อน 19:00', tag: 'food', cost: 1500 },
    { t: '—', act: '🔁 ถ้ายังมีแรงเย็นนี้: light-up อุโมงค์แปะก๊วย @ Azuma Sports Park', note: 'เปิดไฟ 17:00–20:00 ช่วงปลาย ต.ค.–กลาง พ.ย. · บัสจากสถานี ~30 นาที — เก็บวันนี้ได้ถ้าไม่อยากเบียดวันศุกร์', tag: 'nature', cost: 500 },
  ]},
  { day: 4, date: 'ศ. 23 ต.ค.', area: 'fukushima', title: 'เต็มวัน ① — ธรรมชาติแบบชิว: ทะเลสาบ Urabandai', items: [
    { t: '07:00', act: '⚠️ เช็คพยากรณ์อากาศของวันพรุ่งนี้ก่อนออก', note: 'ถ้าเสาร์ 24 อากาศแย่ ให้สลับ — เดินเขาวันนี้ แล้วยกวันทะเลสาบไปวันเสาร์แทน (ทะเลสาบเที่ยวได้แม้ฟ้าปิด)', tag: 'other', cost: 0 },
    { t: '07:40', act: 'ซื้อข้าวเช้า/น้ำที่สถานี Fukushima', note: '', tag: 'food', cost: 600 },
    { t: '08:10', act: '🚄 ชินคันเซ็น Fukushima → Koriyama', note: '~13 นาที ~¥1,800 · ประหยัดได้: รถไฟธรรมดาสาย Tohoku ~50 นาที ~¥990 (ออกเช้ากว่านี้ ~1 ชม.)', tag: 'move', cost: 1800 },
    { t: '08:50', act: '🚃 Ban\'etsu West Line → สถานี Inawashiro', note: '~35 นาที · ขบวนห่างกันพอสมควร เช็ครอบก่อนวันเดินทาง', tag: 'move', cost: 770 },
    { t: '09:40', act: '🚌 บัส Bandai Toto → ป้าย Goshikinuma Iriguchi', note: '~30 นาที ¥790 · บัสสายนี้วิ่งต่อไป Urabandai Kogen-eki ปลายอีกฝั่งของเส้นทางเดิน', tag: 'move', cost: 790 },
    { t: '10:15', act: '🥾 เดินเส้น Goshiki-numa — บึงห้าสี 3.6 กม.', note: 'ทางราบ ไม่ต้องปีน ใช้เวลา 80–90 นาที · เดินจาก Goshikinuma Iriguchi ไปออก Urabandai Kogen-eki ผ่าน Bishamon-numa บึงใหญ่สุดที่มองเห็นภูเขาบันได · ใบไม้พีคกลาง ต.ค.–ต้น พ.ย.', tag: 'nature', cost: 0 },
    { t: '12:00', act: 'ข้าวเที่ยงแถว Urabandai Kogen', note: 'ร้านอาหาร/คาเฟ่อยู่รวมกันแถวปลายทางเดิน', tag: 'food', cost: 1200 },
    { t: '13:00', act: '🚤 ล่องเรือทะเลสาบ Hibara ~35 นาที', note: 'เปิดปลาย เม.ย.–ต้น พ.ย. — ปลาย ต.ค. ยังทัน · ~¥1,500 · วิวใบไม้เปลี่ยนสีจากกลางทะเลสาบที่เดินไม่ถึง', tag: 'nature', cost: 1500 },
    { t: '14:00', act: 'นั่งชิลริมทะเลสาบ · คาเฟ่ · ร้านของฝาก', note: 'วันนี้ตั้งใจให้เหลือเวลาไม่ต้องรีบ — ต่างจากวันเดินเขาที่มีเดดไลน์รถ', tag: 'nature', cost: 800 },
    { t: '15:10', act: '🚌 บัสกลับสถานี Inawashiro', note: 'เช็ครอบบัสเที่ยวสุดท้ายตั้งแต่ตอนลงรถขามา', tag: 'move', cost: 790 },
    { t: '16:10', act: '🚃🚄 Inawashiro → Koriyama → Fukushima', note: 'รวม ~1 ชม. 15 นาที', tag: 'move', cost: 3370 },
    { t: '17:40', act: '♨️ ถึงเมือง — เลือกอย่างใดอย่างหนึ่งตามแรงที่เหลือ', note: 'A) Iizaka Onsen + Sabakoyu (~¥200 + ค่ารถ) · B) light-up อุโมงค์แปะก๊วย Azuma Sports Park (17:00–20:00) · C) กลับที่พักเลย เตรียมของวันเดินเขา', tag: 'other', cost: 950 },
    { t: '19:30', act: '🥟 ข้าวเย็น · เตรียมของวันเดินเขา นอนเร็ว', note: 'พรุ่งนี้ตื่น 07:00', tag: 'food', cost: 1200 },
    { t: '—', act: '🔁 ถ้าไม่อยากเดินทางไกล: ทะเลสาบ Inawashiro อย่างเดียว', note: 'ลงสถานี Inawashiro แล้วบัสสั้น ๆ ไปริมทะเลสาบ — ตัดช่วง Urabandai ออก ประหยัดทั้งเวลาและเงิน · ปลาย ต.ค. หงส์อพยพเริ่มมา', tag: 'nature', cost: 0 },
    { t: '—', act: '🔁 ถ้ามีรถ/บัสฤดูกาล: แวะหุบเขา Nakatsugawa บน Bandai Lake Line', note: 'จุดใบไม้แดงดังของ Urabandai — ต่อจาก Lake Hibara ได้ถ้าขับรถเอง', tag: 'nature', cost: 0 },
  ]},
  { day: 5, date: 'ส. 24 ต.ค.', area: 'fukushima', title: 'เต็มวัน ② — ⛰ เดินเขา Mt. Issaikyo', items: [
    { t: '07:00', act: 'ตื่น · ซื้อเสบียงเพิ่มที่เซเว่น', note: 'น้ำ 1.5 ลิตร + ข้าวกล่อง + snack ฉุกเฉิน', tag: 'food', cost: 1000 },
    { t: '08:15', act: 'ถึง Fukushima Sta. West Exit', note: 'เข้าห้องน้ำให้เรียบร้อย เตรียม QR จองรถ', tag: 'move', cost: 0 },
    { t: '08:30', act: 'Sky Access ออกเดินทาง → Jododaira', note: 'ราคาต่อคน ¥13,000 · จองภายใน 15:00 ของวันก่อน · เป็นรถเหมา/แท็กซี่ ไม่ใช่บัสประจำทาง', tag: 'move', cost: 13000 },
    { t: '—', act: '🔁 ทางเลือกถูกกว่ามากเมื่อไป 4 คน: เช่ารถขับเอง', note: 'รถ+น้ำมัน+ที่จอดรวม ~¥10,000 ต่อคัน หาร 4 = ~¥2,500/คน (ประหยัดกว่า Sky Access ~¥10,500 ต่อคน) · Skyline ฟรีไม่มีค่าผ่านทาง · ออกกี่โมงก็ได้ ไม่ต้องรีบกลับ 15:00 · ต้องมีใบขับขี่สากล (เจนีวา 1949) และเช็คเวลาปิดประตูตอนเย็น', tag: 'move', cost: 0 },
    { t: '09:30', act: 'ถึง Jododaira · เช็ค Visitor Center', note: 'ถามลม เส้นทาง น้ำแข็ง และประกาศภูเขาไฟทุกครั้ง', tag: 'nature', cost: 0 },
    { t: '09:40', act: 'เริ่มเดิน: Wetland → Sugadaira Shelter', note: 'ชันช่วงแรก เดินช้า ๆ วอร์มขา', tag: 'nature', cost: 0 },
    { t: '11:20', act: 'ถึงยอด 1,949 ม. · วิว Goshikinuma「ดวงตาแม่มด」', note: 'ถ่ายรูป 15-20 นาที ไม่ลงไปริมทะเลสาบ', tag: 'nature', cost: 0 },
    { t: '12:30', act: 'พักกลางวันใกล้ shelter', note: 'ถ้าลมแรงอย่ากินบนยอด', tag: 'food', cost: 0 },
    { t: '12:50', act: 'แยกไป Kamanuma → Ubagahara', note: 'เดินตามป้าย Jododaira ห้ามออกนอกทาง', tag: 'nature', cost: 0 },
    { t: '14:10', act: 'กลับถึง Jododaira · ซื้อของ/ห้องน้ำ', note: 'เหลือ buffer อย่างน้อย 40 นาที', tag: 'nature', cost: 500 },
    { t: '15:00', act: 'รถออกตรงเวลา → ถึง Fukushima 16:00', note: 'รถไม่รอคนกลับช้า', tag: 'move', cost: 0 },
    { t: '17:00', act: 'Iizaka Onsen + ข้าวเย็นฉลอง 🍜', note: 'ถ้าวันศุกร์ยังไม่ได้ไป Sabakoyu (~¥200) คืนนี้เก็บได้ · หรือแช่ยาว ๆ ที่เรียวกังแบบ day-use', tag: 'food', cost: 2300 },
  ]},
  { day: 6, date: 'อา. 25 ต.ค.', area: 'tokyo', title: 'ครึ่งวัน ② — เช้าฟุกุชิมะ → ถึง Tokyo บ่าย 3 · เย็นนัดเพื่อน 🍽', items: [
    { t: '08:00', act: 'เช็คเอาท์ · ฝากกระเป๋าล็อกเกอร์สถานี Fukushima', note: 'เอาของหนักลงก่อน จะได้เที่ยวเช้าตัวเบา', tag: 'move', cost: 700 },
    { t: '09:00', act: 'Hanamiyama Park — วิวเมือง + เทือกอาซุมะ', note: 'บัสจากสถานี ~20 นาที · ขาล้าจากวันเดินเขาก็ยังไหว เดินไม่ชัน', tag: 'nature', cost: 500 },
    { t: '—', act: '🔁 สลับเช้าวันนี้เป็นอย่างอื่นได้: เก็บแอปเปิล Fruit Line / Fukushima Prefectural Museum of Art / Mt. Shinobu', note: 'เก็บแอปเปิลต้องโทรจองสวนก่อน · พิพิธภัณฑ์ลง Iizaka Line ป้าย 美術館図書館前 · Mt. Shinobu เดินจากสถานีได้เลยถ้าขี้เกียจเดินทาง', tag: 'other', cost: 0 },
    { t: '11:00', act: 'กลับสถานี · ของฝากฟุกุชิมะ', note: 'พีช/แอปเปิลอบแห้ง เหล้าสาเก ขนมประจำจังหวัด — ในสถานีมีครบ', tag: 'city', cost: 1500 },
    { t: '12:00', act: 'ข้าวเที่ยงในสถานี · รับกระเป๋า', note: 'เผื่อเวลาขึ้นชานชาลา 15 นาที', tag: 'food', cost: 1200 },
    { t: '13:20', act: '🚄 Tohoku Shinkansen (Yamabiko) → Tokyo', note: '~95 นาที · จองที่นั่งล่วงหน้าเพราะวันอาทิตย์คนกลับเยอะ', tag: 'move', cost: 9110 },
    { t: '15:00', act: 'ถึง Tokyo Sta. → Chuo Line ต่อไป Shinjuku · เช็คอิน Airbnb', note: 'ชินคันเซ็นลงที่ Tokyo Sta. แล้วต่อ Chuo Line ไป Shinjuku อีก ~15 นาที ~¥210 · ถึงที่พักราวบ่าย 4 กำลังดี ไม่ค่ำ', tag: 'move', cost: 400 },
    { t: '16:30', act: 'อาบน้ำ พักขา เดินสำรวจย่านที่พัก', note: '', tag: 'other', cost: 0 },
    { t: '18:30', act: '🍽 นัดกินข้าวกับเพื่อน', note: 'นัดร้านล่วงหน้า วันอาทิตย์ร้านดังเต็มเร็ว', tag: 'food', cost: 4000 },
  ]},
  { day: 7, date: 'จ. 26 ต.ค.', area: 'tokyo', title: 'Asakusa + Ueno + Ryogoku', items: [
    { t: '08:30', act: 'Asakusa — วัด Sensoji + ถนน Nakamise', note: 'ไปเช้าคนน้อย ถ่ายรูปสวย', tag: 'city', cost: 0 },
    { t: '10:30', act: 'ข้ามแม่น้ำไป Sumida Hokusai Museum (Ryogoku)', note: 'อาคาร SANAA + งานโฮคุไซ', tag: 'city', cost: 1000 },
    { t: '12:00', act: 'ข้าวเที่ยงแถว Ryogoku', note: 'ย่านซูโม่ — มีจังโกะนาเบะ', tag: 'food', cost: 1200 },
    { t: '13:30', act: 'Ueno — Tokyo National Museum + Gallery of Hōryū-ji Treasures', note: 'ตั๋วเดียวเข้าได้ทั้งสอง (Taniguchi 1999) · นิทรรศการ Genji + Daitokuji ก็อยู่ที่นี่', tag: 'city', cost: 1000 },
    { t: '15:30', act: 'National Museum of Western Art — นิทรรศการ Turner', note: 'คอลเลกชันถาวรฟรี · นิทรรศการพิเศษจ่ายแยก ~¥2,000', tag: 'city', cost: 2000 },
    { t: '17:30', act: 'Ameyoko — ของกินริมทาง', note: '', tag: 'city', cost: 1000 },
    { t: '19:00', act: 'เย็น: Akihabara', note: '', tag: 'city', cost: 1500 },
  ]},
  { day: 8, date: 'อ. 27 ต.ค.', area: 'tokyo', title: 'Harajuku — Shibuya — Shinjuku', items: [
    { t: '09:00', act: 'ศาลเจ้า Meiji Jingu', note: 'ป่ากลางเมือง เดินสบาย เข้าฟรี', tag: 'city', cost: 0 },
    { t: '11:00', act: 'Harajuku — Takeshita St.', note: '', tag: 'city', cost: 1500 },
    { t: '12:30', act: 'ข้าวเที่ยงย่าน Omotesando', note: '', tag: 'food', cost: 1200 },
    { t: '14:00', act: 'Nezu Museum (Kengo Kuma + สวนญี่ปุ่น)', note: 'เดิน 8 นาทีจากสถานี Omotesando', tag: 'city', cost: 1500 },
    { t: '16:00', act: 'Shibuya — แยกไฟแดง + Shibuya Sky', note: 'Shibuya Sky ต้องจองรอบล่วงหน้า ~¥2,500', tag: 'city', cost: 2500 },
    { t: '18:30', act: 'เย็น: Shinjuku — Omoide Yokocho', note: '', tag: 'city', cost: 3000 },
  ]},
  { day: 9, date: 'พ. 28 ต.ค.', area: 'tokyo', title: 'Ginza ช้อปปิ้ง → เดินทางกลับ ✈ 17:00', items: [
    { t: '08:30', act: 'Ginza + GINZA SIX (Taniguchi) + สวนดาดฟ้า', note: 'ร้านส่วนใหญ่เปิด 10:00-11:00 — ช่วงแรกเดินชมอาคารก่อน', tag: 'city', cost: 0 },
    { t: '10:30', act: 'Don Quijote / drugstore — ของฝากรอบสุดท้าย', note: 'พกพาสปอร์ตไว้ทำ tax-free', tag: 'city', cost: 5000 },
    { t: '12:00', act: 'ข้าวเที่ยง + กลับไปเอากระเป๋า', note: '', tag: 'food', cost: 1200 },
    { t: '13:30', act: "ออกจากที่พัก → สนามบิน (N'EX จาก Shinjuku)", note: '~55-90 นาที · ถ้าซื้อ N\'EX Tokyo Round Trip ตั้งแต่ขามา ขานี้จ่ายแล้ว · เผื่อเวลาให้ถึงก่อน 15:00', tag: 'move', cost: 3250 },
    { t: '15:00', act: 'ถึงสนามบิน · เช็คอิน + คืนภาษี', note: '', tag: 'move', cost: 0 },
    { t: '17:00', act: 'บินกลับ ✈', note: '', tag: 'move', cost: 0 },
  ]},
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
  { name: 'สถานี Utsunomiya', ja: '宇都宮駅', area: 'tochigi', lat: 36.5591, lng: 139.8986, day: 2, desc: 'ฮับของโทจิกิ — จุดต่อรถไป Nikko',
    en: { name: 'Utsunomiya Station', desc: 'Tochigi hub — transfer point for trains to Nikko' } },
  { name: 'Oya History Museum', ja: '大谷資料館', area: 'tochigi', lat: 36.6009, lng: 139.8228, day: 3, desc: 'เหมืองหินใต้ดินสุดอลัง เย็น 8°C พกเสื้อคลุม',
    en: { name: 'Oya History Museum', desc: 'Vast underground stone quarry — a steady 8°C, so bring a jacket' } },
  { name: 'ถนนเกี๊ยวซ่า (Kirasse)', ja: '宇都宮餃子', area: 'tochigi', lat: 36.5583, lng: 139.8830, day: 2, desc: 'เมืองหลวงเกี๊ยวซ่า — ร้าน Minmin, Masashi ห้ามพลาด',
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
  // Fukushima — เพิ่มจากข้อมูลเว็บเที่ยวฟุกุชิมะ (fukushima.travel / f-kankou.jp / welovefukushima) สำหรับช่วงปลาย ต.ค.
  { name: 'Azuma Sports Park — อุโมงค์แปะก๊วย', ja: 'あづま総合運動公園 銀杏並木', area: 'fukushima', lat: 37.7317, lng: 140.3852, day: 4, desc: '🍂 แถวแปะก๊วย 116 ต้น ยาว 520 ม. เป็นอุโมงค์สีเหลือง · พีคปลาย ต.ค.–กลาง พ.ย. และมี light-up ช่วง 17:00–20:00 เริ่มราว 20 ต.ค. (บางปีปิดวันอังคาร — เช็คปีจริง) · หมุดโดยประมาณ บัสจากสถานี Fukushima ~30 นาที',
    en: { name: 'Azuma Sports Park — ginkgo avenue', desc: '🍂 116 ginkgo trees forming a 520 m yellow tunnel · peaks late Oct to mid Nov with an evening light-up around 17:00–20:00 starting about 20 Oct (some years closed Tuesdays — check the actual year) · approximate pin, ~30 min by bus from Fukushima Sta.' } },
  { name: 'Fruit Line — เก็บแอปเปิล (Azuma Orchard)', ja: 'フルーツライン りんご狩り', area: 'fukushima', lat: 37.7830, lng: 140.4060, day: 4, desc: '🍎 ถนนสวนผลไม้ของเมืองฟุกุชิมะ — เดือน ต.ค. เป็นฤดูแอปเปิล (พันธุ์ Fuji) เก็บเองกินได้ในสวน · หมุดโดยประมาณ ควรโทรจองสวนก่อน',
    en: { name: 'Fruit Line — apple picking (Azuma Orchard)', desc: "🍎 Fukushima City's orchard road — October is apple season (Fuji), pick-your-own and eat in the orchard · approximate pin, call the orchard ahead" } },
  { name: 'Mt. Shinobu (ชินโนบุยามะ)', ja: '信夫山', area: 'fukushima', lat: 37.7690, lng: 140.4680, day: 4, desc: '⛰ ภูเขาเตี้ยกลางเมือง เดินขึ้นได้จากสถานี Fukushima — วิวเมืองกับเทือกอาซุมะ เหมาะเป็นตัวเลือกเบา ๆ ถ้าขาล้าจากวันเดินเขา',
    en: { name: 'Mt. Shinobu', desc: '⛰ A low hill in the middle of the city, walkable from Fukushima Sta. — city and Azuma-range views, an easy option if your legs are tired from the hike' } },
  { name: 'Sabakoyu — โรงอาบน้ำเก่าแก่ Iizaka', ja: '鯖湖湯', area: 'fukushima', lat: 37.8262, lng: 140.4470, day: 4, ticket: 'ค่าเข้าประมาณ ¥200 · รถไฟ Iizaka Line เที่ยวละ ~¥370', desc: '♨️ โรงอาบน้ำสาธารณะไม้เก่าแก่ที่สุดแห่งหนึ่งของญี่ปุ่นใน Iizaka Onsen (บูรณะปี 1993) น้ำร้อนจัดแบบท้องถิ่น · แถวนั้นมี "ไข่เรเดียม" ต้มน้ำแร่ และร้าน Gyoza Terui เกี๊ยวซ่าจานกลม',
    en: { name: 'Sabakoyu bathhouse (Iizaka)', ticket: 'Around ¥200 entry · Iizaka Line ~¥370 each way', desc: '♨️ One of Japan\'s oldest wooden public bathhouses, in Iizaka Onsen (rebuilt 1993) — properly hot local-style water · nearby: "radium eggs" boiled in the spring water and Gyoza Terui for disc gyoza' } },
  { name: 'เกี๊ยวซ่าจานกลม (Enban Gyoza)', ja: '円盤餃子', area: 'fukushima', lat: 37.7545, lng: 140.4620, day: 3, desc: '🥟 ของขึ้นชื่อเมืองฟุกุชิมะ — เกี๊ยวซ่าเรียงเป็นวงกลมบนกระทะกลม ทอดจนก้นติดกันเป็นแผ่น กรอบกว่าเกี๊ยวซ่าทั่วไป มีร้านกว่าสิบร้านในเมือง (ร้านดังอีกสาขาอยู่ที่ Iizaka Onsen) · หมุดคือย่านรอบสถานี',
    en: { name: 'Enban Gyoza (disc gyoza)', desc: "🥟 Fukushima City's signature dish — gyoza arranged in a circle on a round hotplate and fried until the bases fuse into one crisp disc. A dozen-plus shops in the city (another famous one is out at Iizaka Onsen) · pin marks the station area" } },
  { name: 'Ouchi-juku', ja: '大内宿', area: 'fukushima', lat: 37.3306, lng: 139.8593, day: 4, desc: '🏘 หมู่บ้านบ้านหลังคาฟางสมัยเอโดะ — จาก Aizu-Wakamatsu นั่ง Aizu Railway ถึง Yunokami-Onsen ~40 นาที + บัส ~20 นาที · รวมจาก Fukushima ไปกลับเกือบทั้งวัน (ทางเลือกวันศุกร์เท่านั้น)',
    en: { name: 'Ouchi-juku', desc: '🏘 Edo-era thatched-roof post town — from Aizu-Wakamatsu take the Aizu Railway to Yunokami-Onsen (~40 min) plus a ~20 min bus · from Fukushima it eats most of a day, so Friday only' } },
  { name: 'Nihonmatsu Kasumigajo — เทศกาลตุ๊กตาเบญจมาศ', ja: '二本松 霞ヶ城 菊人形', area: 'fukushima', lat: 37.5947, lng: 140.4310, day: 4, ticket: 'ค่าเข้างานเช็คหน้างาน · ชินคันเซ็นจาก Fukushima ~15 นาที', desc: '🌼 งานตุ๊กตาดอกเบญจมาศบนซากปราสาท Kasumigajo จัดกลาง ต.ค.–กลาง พ.ย. ทุกปี (ทันช่วงทริปพอดี) — ช่างฝีมือใช้ดอกไม้ถึงหมื่นดอกต่อตัว · เดินจากสถานี Nihonmatsu ~20 นาที',
    en: { name: 'Nihonmatsu Kasumigajo — Chrysanthemum Doll Festival', ticket: 'Check entry fee on site · ~15 min by shinkansen from Fukushima', desc: '🌼 Chrysanthemum doll festival on the Kasumigajo castle ruins, held mid-Oct to mid-Nov every year (right inside our window) — artisans use up to 10,000 blooms per figure · ~20 min walk from Nihonmatsu Sta.' } },
  { name: 'ทะเลสาบ Hibara (Urabandai)', ja: '桧原湖', area: 'fukushima', lat: 37.6900, lng: 140.0400, day: 4, ticket: 'เรือชมวิวรอบละ ~35 นาที ~¥1,500 · เปิดปลาย เม.ย.–ต้น พ.ย.', desc: '🚤 ทะเลสาบใหญ่สุดของ Urabandai เกิดจากภูเขาบันไดระเบิดปี 1888 — มีเรือชมวิวแล่นอ้อมเกาะเล็กเกาะน้อย ~35 นาที (ปิดต้น พ.ย. ไปเดือนนี้ยังทัน) · ริมทะเลสาบมีคาเฟ่และร้านของฝาก นั่งชิลได้',
    en: { name: 'Lake Hibara (Urabandai)', ticket: 'Sightseeing boat ~35 min, about ¥1,500 · runs late April to early November', desc: "🚤 Urabandai's largest lake, formed by Mt. Bandai's 1888 eruption — a ~35 min boat loop around its many small islands (season ends early Nov, so late Oct still works) · cafes and shops along the shore for an easy sit-down" } },
  { name: 'ทะเลสาบ Inawashiro', ja: '猪苗代湖', area: 'fukushima', lat: 37.4667, lng: 140.0917, day: 4, desc: '🦢 ทะเลสาบใหญ่อันดับ 4 ของญี่ปุ่น น้ำใสจนเรียก "กระจกสวรรค์" — ตัวเลือกที่ชิลและใกล้กว่า Urabandai (เดินจากสถานี Inawashiro + บัสสั้น ๆ) · ปลาย ต.ค.–พ.ย. หงส์อพยพเริ่มทยอยมาที่หาด Shirakaba (เช็คช่วงเวลาก่อน)',
    en: { name: 'Lake Inawashiro', desc: '🦢 Japan\'s fourth-largest lake, clear enough to be called the "Heavenly Mirror" — the closer, calmer alternative to Urabandai (short bus from Inawashiro Sta.) · migrating swans start arriving at Shirakaba beach from late Oct into Nov (worth checking timing first)' } },
  { name: 'หุบเขา Nakatsugawa (Bandai Lake Line)', ja: '中津川渓谷', area: 'fukushima', lat: 37.6250, lng: 140.1050, day: 4, desc: '🍁 หุบเขาลำธารบนถนน Bandai-Azuma Lake Line — จุดใบไม้แดงชื่อดังของ Urabandai มีจุดชมวิวริมถนนและทางเดินลงลำธารสั้น ๆ · หมุดโดยประมาณ ต้องมีรถหรือบัสตามฤดูกาล',
    en: { name: 'Nakatsugawa Valley (Bandai Lake Line)', desc: '🍁 A stream gorge on the Bandai-Azuma Lake Line — one of Urabandai\'s best-known autumn spots, with a roadside lookout and a short path down to the water · approximate pin; needs a car or a seasonal bus' } },
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
  [35.6812, 139.7671],  // Tokyo — นัดข้าวกับญาติ (20 ต.ค.)
  [36.5591, 139.8986],  // Utsunomiya (ค้าง 20-22 ต.ค.)
  [36.7581, 139.5986],  // Nikko เดย์ทริป (21 ต.ค.)
  [36.5591, 139.8986],  // กลับ Utsunomiya
  [37.7543, 140.4590],  // Fukushima (22–25 ต.ค.)
  [35.6896, 139.7006],  // back Tokyo — Shinjuku (25–28 ต.ค.)
];

/* ---------- transport segments ---------- */
const TRANSPORT = [
  { title: 'สนามบิน → เข้าเมือง (ไปนัดข้าวกับญาติ)', day: 'DAY 1 · 20 ต.ค. (เช้า)', options: [
    { method: "Narita Express (N'EX) → Tokyo Sta./Shinjuku ฯลฯ", note: 'ไปได้ตรงหลายสถานีใหญ่ ปรับตามจุดนัดจริง · ที่นั่งจอง แต่วันนี้ไม่มีกระเป๋าใหญ่ติดตัวแล้วเพราะส่งล่วงหน้าไปที่พักแล้ว', time: '~55-90 นาที', price: 3070 },
    { method: 'Keisei Skyliner → Ueno/Nippori', note: 'เร็วและถูกกว่า N\'EX เล็กน้อย เหมาะถ้าจุดนัดอยู่ฝั่งเหนือของเมือง', time: '~41-60 นาที', price: 2580 },
    { method: 'Keisei Access Express (รถธรรมดา)', note: '💰 ถูกที่สุด — วันนี้ตัวเบาไม่มีกระเป๋าใหญ่ ไม่ต้องกังวลเรื่องเปลี่ยนขบวน', time: '~70-80 นาที', price: 1300 },
  ]},
  { title: '📦 ส่งกระเป๋าล่วงหน้าจากสนามบิน (Same-day Delivery)', day: 'DAY 1 · 20 ต.ค. (เช้า)', options: [
    { method: 'เคาน์เตอร์ JAL ABC / Yamato / Sagawa ที่ Narita', note: 'ยื่นกระเป๋าช่วง 09:00-18:00 → ถึงที่พัก Utsunomiya ภายในราว 21:00 คืนเดียวกัน · ราคาประมาณ ¥2,000-3,000/ใบ ตามขนาด/น้ำหนัก เช็คราคาจริงหน้าเคาน์เตอร์ · ต้องรู้ที่อยู่ Airbnb และเบอร์ติดต่อเจ้าของที่พักล่วงหน้า', time: 'ถึงที่พักภายใน ~21:00', price: 2000 },
    { method: 'ล็อกเกอร์ XL ที่ Narita Terminal 3', note: 'เก็บได้นานสุด 5 วัน — เหมาะถ้าจุดนัดอยู่ใกล้สนามบินและจะย้อนกลับมารับเองได้ทัน แทนที่จะเสียค่าส่ง', time: 'เก็บได้ถึง 5 วัน', price: 700 },
  ]},
  { title: 'เย็น: Tokyo → Utsunomiya (หลังนัดข้าวกับญาติ)', day: 'DAY 1 · 20 ต.ค. (เย็น)', options: [
    { method: 'Tohoku Shinkansen (Yamabiko/Nasuno) — จองที่นั่ง', note: 'ช่วงเย็นวิ่งราว 3 เที่ยว/ชม. เที่ยวท้าย ๆ ลากยาวถึงราว 21:00 — เช็ครอบแน่นอนใกล้วันเดินทาง', time: '~50 นาที', price: 5020 },
    { method: 'Tohoku Shinkansen — ไม่จองที่นั่ง', note: 'ถูกกว่าเล็กน้อย ตู้ไม่จองมีจำกัด', time: '~50 นาที', price: 4490 },
    { method: '💰 JR Utsunomiya Line / Shonan-Shinjuku Line (รถธรรมดา)', note: 'ถูกกว่าชินคันเซ็นเกินครึ่ง ไม่ต้องเปลี่ยนขบวน วิ่งถึงดึกกว่าชินคันเซ็น — เหมาะถ้าคุยกับญาติเพลินจนดึก', time: '~1 ชม. 30-50 นาที', price: 2090 },
  ]},
  { title: 'เดย์ทริป Nikko ไป-กลับจาก Utsunomiya', day: 'DAY 2 · 21 ต.ค.', options: [
    { method: 'JR Nikko Line ไป-กลับ', note: 'ออกทุก ~30-60 นาที · ขบวนแรกจาก Utsunomiya ราว 06:00 — ที่พักไม่ต้องย้าย เก็บของไว้ที่เดิมได้', time: '~42-45 นาที/เที่ยว', price: 1520 },
  ]},
  { title: 'ในนิกโก้: บัสขึ้นทะเลสาบ Chuzenji', day: 'DAY 2 · 21 ต.ค.', options: [
    { method: 'Tobu Bus — Chuzenji Onsen Free Pass 2 วัน', note: 'ขึ้นลงไม่จำกัด Nikko Sta. ⇄ Chuzenji (ผ่าน Irohazaka) — วันเดียวก็ยังคุ้มถ้าแวะ Akechidaira + Kegon + Ryuzu', time: '~50 นาที/เที่ยว', price: 2500 },
    { method: 'บัสเที่ยวเดียว Nikko → Chuzenji Onsen', note: 'ช่วงใบไม้แดงรถติดมาก เผื่อเวลา 2 เท่า — ขึ้นบัสก่อน 09:00 จะรอดที่สุด', time: '~50-90 นาที', price: 1250 },
  ]},
  { title: 'Utsunomiya → Fukushima', day: 'DAY 3 · 22 ต.ค. (บ่าย)', options: [
    { method: 'Tohoku Shinkansen (Yamabiko)', note: 'ขึ้นตรงจาก Utsunomiya ไม่ต้องย้อนกลับโตเกียว — เช็คเอาท์เช้า ฝากกระเป๋าไว้ล็อกเกอร์ แล้วเที่ยว Oya ก่อนได้', time: '~55 นาที', price: 6250 },
  ]},
  { title: 'วันเดินเขา: Fukushima ⇄ Jododaira', day: 'DAY 5 · 24 ต.ค.', options: [
    { method: '🚗 เช่ารถขับเอง — ถูกที่สุดเมื่อไป 4 คน', note: 'รถเล็ก ~¥8,000/วัน + น้ำมัน ~¥1,500 + ที่จอด Jododaira ¥500 = ~¥10,000 ต่อคัน → หาร 4 เหลือ ~¥2,500/คน · Skyline ไม่มีค่าผ่านทาง · ⚠️ ต้องมีใบขับขี่สากลแบบอนุสัญญาเจนีวา 1949 · ประตูอาจปิดกลางคืน 17:00–07:00', time: '~75 นาที/เที่ยว', price: 2500 },
    { method: '🚌 Jododaira Sky Access — คอร์สนักเดินเขา', note: 'ราคาต่อคน ไม่ใช่ต่อคัน · ออก Fukushima West Exit 08:30 · ถึง Jododaira 09:30 · รถกลับ 15:00 · จองออนไลน์ภายใน 15:00 ของวันก่อน · เป็นรถเหมา/แท็กซี่ ไม่ใช่บัสประจำทาง จึงแพง', time: '5.5 ชม. ที่ Jododaira', price: 13000 },
    { method: '🚕 บัสประจำทางไป Takayu Onsen + แท็กซี่ต่อ', note: 'บัส Fukushima → Takayu Onsen มีวิ่งประจำ (ถูก) แต่จาก Takayu ถึง Jododaira ยังเหลืออีก 15 กม. บน Skyline ต้องต่อแท็กซี่และ⚠️นัดเที่ยวกลับล่วงหน้า — เช็คกับศูนย์ข้อมูลก่อนว่ามีรถจริงในวันนั้น', time: '~90 นาที/เที่ยว', price: 6000 },
    { method: '🚖 แท็กซี่ท่องเที่ยวจากสถานี Fukushima', note: 'เริ่มราว ¥15,900 ต่อคัน/3 ชม. — เวลาไม่พอสำหรับเดินเขา 4-5 ชม. ต้องเหมายาวขึ้นซึ่งแพงกว่าเช่ารถมาก', time: 'เหมาเป็นชั่วโมง', price: 15900 },
  ]},
  { title: 'Fukushima → Tokyo (นัดเพื่อนเย็นนี้)', day: 'DAY 6 · 25 ต.ค.', options: [
    { method: 'Tohoku Shinkansen (Yamabiko) — ขบวนสาย', note: 'นั่งยาวถึง Tokyo Sta. เลย ออกช่วงสาย ๆ ให้ถึงโตเกียวบ่ายโมง เผื่อเวลาพักก่อนนัดมื้อเย็น', time: '~95 นาที', price: 9110 },
  ]},
  { title: 'โตเกียว → สนามบิน', day: 'DAY 9 · 28 ต.ค.', options: [
    { method: "N'EX จาก Shinjuku ไป Narita", note: "ขึ้นที่ Shinjuku ได้เลยไม่ต้องเข้า Tokyo Sta. · ถ้าซื้อ Round Trip ¥5,000 ตั้งแต่ขามา ขานี้ไม่ต้องจ่ายเพิ่ม · ออกจากเมืองก่อน 14:00 เผื่อเช็คอินไฟลท์ 17:00", time: '~55-90 นาที', price: 3250 },
    { method: 'Monorail ไป Haneda', note: 'กรณีบินออก Haneda', time: '~25 นาที', price: 700 },
  ]},
  { title: 'ค่าเดินทางในเมือง (เผื่อ)', day: 'ทุกวัน', options: [
    { method: 'Suica/Pasmo — เมโทร+บัสในโตเกียว', note: 'เฉลี่ยวันละ ~¥800 × 5 วันเมือง (Day 1 + Day 6 เย็น + Day 7-9)', time: '—', price: 4000 },
  ]},
];


/* ---------- เช่ารถที่ Fukushima (23–24 ต.ค.) เทียบกับไปด้วยขนส่งสาธารณะ ----------
   ราคาประมาณการช่วง high season ใบไม้เปลี่ยนสี — เช็คราคาจริงตอนจอง */
const CAR_PLAN = {
  days: 2,                 // รับรถเช้า 23 คืนรถเย็น 24
  guests: 4,               // 4 คน
  carPerDay: 11000,        // รถกลาง/แวกอน พอสำหรับ 4 คน + กระเป๋า
  fuel: 4000,              // Urabandai ไป-กลับ + ขึ้น Skyline
  parking: 1500,           // Jododaira ~¥500 + เผื่อจุดอื่น (ที่พักมีที่จอดอยู่แล้ว)
  publicHike: 13000,       // Sky Access ต่อคน
  publicLake: 8300,        // ค่ารถวันทะเลสาบ Urabandai ต่อคน
};


/* ---------- ค่ารถไฟรายเส้นทาง ----------
   ราคาเป็นเยน ต่อคน เที่ยวเดียว (ผู้ใหญ่) · อ้างอิงตารางค่าโดยสารช่วงปี 2026
   conf: 'src'  = มีแหล่งอ้างอิงตรง ๆ
         'calc' = คำนวณจากตารางค่าโดยสาร JR ตามระยะทาง (ยังไม่ยืนยันหน้างาน)
   ทุกแถวมีปุ่มเช็คราคาสดกับ Google Maps เพราะ JR ปรับราคาเป็นระยะ */
const RAIL_FARES = [
  { leg: 'Narita Airport → เข้าเมือง (ตัวเบา)', day: 'DAY 1 · 20 ต.ค. (เช้า)', from: 'Narita Airport Terminal 1 Station', to: 'Tokyo Station', options: [
    { method: "JR Narita Express (N'EX)", time: '~55-90 นาที', xfer: '0 ครั้ง', price: 3070, conf: 'src',
      note: 'ปรับสถานีปลายทางตามจุดนัดจริง — วันนี้ไม่มีกระเป๋าใหญ่ติดตัวแล้วเพราะส่งล่วงหน้าไปที่พักแล้ว' },
    { method: 'Keisei Skyliner → Ueno/Nippori', time: '~41-60 นาที', xfer: '0-1 ครั้ง', price: 2580, conf: 'src',
      note: 'เร็วและถูกกว่า N\'EX เล็กน้อย เหมาะถ้าจุดนัดอยู่ฝั่งเหนือของเมือง' },
    { method: '💰 Keisei Access Express (รถธรรมดา)', time: '~70-80 นาที', xfer: '1 ครั้ง', price: 1300, conf: 'calc',
      note: 'ถูกที่สุด — วันนี้ตัวเบาไม่มีกระเป๋าใหญ่ ไม่ต้องกังวลเรื่องเปลี่ยนขบวนพร้อมสัมภาระ' },
  ]},
  { leg: 'เย็น: Tokyo → Utsunomiya', day: 'DAY 1 · 20 ต.ค. (เย็น)', from: 'Tokyo Station', to: 'Utsunomiya Station', options: [
    { method: 'Tohoku Shinkansen (Yamabiko / Nasuno) — ไม่จองที่นั่ง', time: '~50 นาที', xfer: '0 ครั้ง', price: 4490, conf: 'src',
      note: 'ตู้ไม่จองที่นั่งมีจำกัด วันหยุดอาจต้องยืน' },
    { method: 'Tohoku Shinkansen — จองที่นั่ง', time: '~50 นาที', xfer: '0 ครั้ง', price: 5020, conf: 'src',
      note: 'บวกจากตั๋วไม่จองที่นั่ง ¥530' },
    { method: '🚃 JR Utsunomiya Line / Shonan-Shinjuku Line (รถธรรมดา)', time: '~1 ชม. 30-50 นาที', xfer: '0 ครั้ง', price: 2090, conf: 'src',
      note: '💰 ถูกกว่าชินคันเซ็นเกินครึ่ง และ**ไม่ต้องเปลี่ยนขบวน** — ตรงกับที่เห็นใน Google Maps (~฿430) · ขึ้นจาก Ueno ถูกลงอีกเหลือ ~¥1,340 / ~1 ชม. 20 นาที · มีตู้ Green Car จ่ายเพิ่มถ้าอยากนั่งชัวร์' },
  ]},
  { leg: 'Utsunomiya ⇄ Nikko (ไป-กลับ)', day: 'DAY 2 · 21 ต.ค.', from: 'Utsunomiya Station', to: 'Nikko Station', options: [
    { method: 'JR Nikko Line — เที่ยวเดียว', time: '~42-45 นาที', xfer: '0 ครั้ง', price: 760, conf: 'src',
      note: 'รถธรรมดาจอดทุกสถานี ออกราวชั่วโมงละ 1-2 ขบวน · ⚠️ เช็ครอบสุดท้ายก่อนขึ้นเขา' },
    { method: 'JR Nikko Line — ไป-กลับ', time: '~90 นาที รวมสองเที่ยว', xfer: '0 ครั้ง', price: 1520, conf: 'src',
      note: 'ไม่มีตั๋วไป-กลับลดราคา จ่ายสองเที่ยวตรง ๆ' },
    { method: 'ขบวนท่องเที่ยว「Iroha」', time: '~45 นาที', xfer: '0 ครั้ง', price: 760, conf: 'src',
      note: 'รถแต่งพิเศษ ที่นั่งกว้างกว่า วิ่งวันละราว 5 เที่ยว · ราคาเท่ารถธรรมดา ไม่ต้องจ่ายเพิ่ม' },
  ]},
  { leg: 'Utsunomiya → Fukushima', day: 'DAY 3 · 22 ต.ค.', from: 'Utsunomiya Station', to: 'Fukushima Station', options: [
    { method: 'Tohoku Shinkansen (Yamabiko) — ไม่จองที่นั่ง', time: '~55 นาที', xfer: '0 ครั้ง', price: 5720, conf: 'src',
      note: 'ขึ้นตรงจาก Utsunomiya ไม่ต้องย้อนกลับโตเกียว' },
    { method: 'Tohoku Shinkansen — จองที่นั่ง', time: '~55 นาที', xfer: '0 ครั้ง', price: 6250, conf: 'src',
      note: 'แนะนำให้จอง เพราะขึ้นกลางทางที่นั่งว่างน้อย' },
    { method: '🚃 รถธรรมดาต่อกัน (Kuroiso → Shin-Shirakawa → Koriyama)', time: '~4 ชม.', xfer: '3 ครั้ง', price: 3410, conf: 'calc',
      note: '💰 ประหยัด ~¥2,800/คน (4 คน = ~¥11,300) แต่กินเวลาครึ่งวัน — วันนี้ยังมีโปรแกรมเช้าที่ Oya จึงไม่คุ้ม เก็บไว้เป็นแผนสำรองถ้าตัดเช้าออก' },
  ]},
  { leg: 'Fukushima → Koriyama (วันไป Urabandai)', day: 'DAY 4 · 23 ต.ค.', from: 'Fukushima Station', to: 'Koriyama Station', options: [
    { method: 'Tohoku Shinkansen', time: '~12 นาที', xfer: '0 ครั้ง', price: 1800, conf: 'src',
      note: 'ช่วงราคา ~¥1,520-1,800 แล้วแต่จองที่นั่งหรือไม่ · ระยะสั้นมาก 33-45 กม.' },
    { method: '🚃 JR Tohoku Line รถธรรมดา', time: '~50 นาที', xfer: '0 ครั้ง', price: 990, conf: 'calc',
      note: '💰 ประหยัด ~¥800/คน · ต้องออกจากที่พักเช้ากว่าราว 40 นาที' },
  ]},
  { leg: 'Koriyama → Inawashiro (ประตูสู่ Urabandai)', day: 'DAY 4 · 23 ต.ค.', from: 'Koriyama Station', to: 'Inawashiro Station', options: [
    { method: "JR Ban'etsu West Line", time: '~35 นาที', xfer: '0 ครั้ง', price: 770, conf: 'calc',
      note: '⚠️ ขบวนห่างกันมาก บางช่วงเว้น 1-2 ชม. เช็ครอบทั้งขาไปขากลับตั้งแต่ก่อนออกเดินทาง' },
  ]},
  { leg: 'Fukushima → Tokyo', day: 'DAY 6 · 25 ต.ค.', from: 'Fukushima Station', to: 'Tokyo Station', options: [
    { method: 'Tohoku Shinkansen (Yamabiko) — ไม่จองที่นั่ง', time: '~95 นาที', xfer: '0 ครั้ง', price: 8580, conf: 'src',
      note: '⚠️ ขบวน Hayabusa บางขบวนไม่จอด Fukushima — ดูขบวน Yamabiko เป็นหลัก' },
    { method: 'Tohoku Shinkansen — จองที่นั่ง', time: '~95 นาที', xfer: '0 ครั้ง', price: 9110, conf: 'src',
      note: '25 ต.ค. เป็นวันอาทิตย์ขากลับ คนเยอะ — จองล่วงหน้าเถอะ เย็นนี้มีนัดกินข้าว · ⚠️ ลงที่ Tokyo Sta. แล้ว<strong>ต้องต่อ Chuo Line ไป Shinjuku อีก ~15 นาที ~¥210</strong>' },
  ]},
  { leg: 'Shinjuku → Narita Airport', day: 'DAY 9 · 28 ต.ค.', from: 'Shinjuku Station Tokyo', to: 'Narita Airport Terminal 1 Station', options: [
    { method: "JR Narita Express (N'EX) จาก Shinjuku", time: '~55-90 นาที', xfer: '0 ครั้ง', price: 3250, conf: 'src',
      note: 'ขึ้นที่ Shinjuku ได้เลยไม่ต้องเข้า Tokyo Sta. · <strong>ถ้าซื้อ Round Trip ¥5,000 ตั้งแต่ขามา ขานี้จ่ายไปแล้ว</strong> · ออกจากเมืองก่อน 14:00 ให้ทันไฟลท์ 17:00' },
    { method: 'JR Yamanote → Nippori → Keisei Skyliner', time: '~60 นาที', xfer: '1 ครั้ง', price: 2790, conf: 'src',
      note: 'ถูกกว่าเล็กน้อย แต่วันกลับมีของฝากเยอะ การเปลี่ยนขบวนที่ Nippori จะลำบากกว่า' },
    { method: 'Airport Limousine Bus จาก Shinjuku', time: '~2 ชม.', xfer: '0 ครั้ง', price: 3600, conf: 'calc',
      note: 'ยกกระเป๋าขึ้นใต้ท้องรถครั้งเดียวจบ · ต้องเผื่อรถติดมากกว่าปกติ' },
  ]},
];

/* ค่ารถท้องถิ่นย่อย ๆ ที่ไม่ใช่เส้นหลัก */
const RAIL_LOCAL_NOTES = [
  { what: 'Fukushima → Iizaka Onsen (แช่ออนเซ็น)', detail: 'Fukushima Kotsu สาย Iizaka ~¥370 เที่ยวเดียว · ~25 นาที · ไม่ใช่ JR' },
  { what: 'Fukushima → Azuma Sports Park (แปะก๊วย light-up)', detail: 'บัสจากสถานี ~30 นาที ~¥500' },
  { what: 'Inawashiro → Goshikinuma Iriguchi', detail: "บัส Bandai Toto ~30 นาที ~¥790 · วิ่งตามฤดูกาล เช็ครอบสุดท้ายทุกครั้ง" },
  { what: 'Nikko → Chuzenji Onsen', detail: 'Tobu Bus เที่ยวเดียว ~¥1,250 · Chuzenji Onsen Free Pass ~¥2,500 คุ้มกว่าถ้าแวะหลายจุด' },
  { what: 'Tobu-Nikko ↔ JR Nikko', detail: 'สองสถานีอยู่ติดกัน เดิน 3-5 นาที ไม่มีค่าใช้จ่าย' },
  { what: 'ส่งกระเป๋าล่วงหน้าแบบ Same-day Delivery จาก Narita', detail: 'ยื่นเคาน์เตอร์ JAL ABC / Yamato / Sagawa ช่วง 09:00-18:00 → ถึงปลายทางภายใน ~21:00 คืนนั้นเลย ~¥2,000-3,000/ใบ' },
];

/* เส้นทางรถไฟหลักที่ใช้เทียบกับ JR EAST PASS (¥30,000) */
const RAIL_MAIN_TOTAL = 5020 + 1520 + 6250 + 9110 + 3250; // เย็นวันแรก Tokyo→Utsunomiya (ชินคันเซ็นจองที่นั่ง) + เดย์ทริป Nikko ไป-กลับ + Utsunomiya→Fukushima + Fukushima→Tokyo + N'EX กลับ (ไม่รวม N'EX ขาเข้า เพราะวันแรกเข้าเมืองแบบเบาไม่ผ่าน route หลัก)


/* ---------- คลังสถานที่จากการค้นคว้า + เงื่อนไขการเดินทาง ----------
   ใช้ตอนเลือกว่าจะเอาเมืองไหนเป็นฐานช่วง 21-25 ต.ค.
   ⚠️ พิกัดเป็นตำแหน่งโดยประมาณ ไว้ให้เห็นภาพรวมบนแผนที่ ไม่ใช่พิกัดทางเข้าจริง
   ราคา/เวลาเป็นข้อมูลที่ค้นได้ช่วงกลางปี 2026 — ยืนยันอีกครั้งก่อนเดินทาง */
const SPOT_NEEDS = {
  train:       { icon: '🚃', th: 'รถไฟถึง',            en: 'Reachable by train' },
  bus:         { icon: '🚌', th: 'ต่อบัส',              en: 'Bus connection' },
  seasonalBus: { icon: '📅', th: 'บัสตามฤดูกาล',        en: 'Seasonal bus only' },
  noBus:       { icon: '⛔', th: 'ไม่มีบัสช่วงเรา',      en: 'No bus in our window' },
  car:         { icon: '🚗', th: 'ต้องมีรถ',            en: 'Car required' },
  noCar:       { icon: '🚫', th: 'ห้ามนำรถเข้า',        en: 'Private cars banned' },
  cash:        { icon: '💴', th: 'เงินสดเท่านั้น',      en: 'Cash only' },
  reserve:     { icon: '🎫', th: 'ต้องจองล่วงหน้า',     en: 'Reservation required' },
  walk:        { icon: '🚶', th: 'เดินต่อไกล',          en: 'Long walk from stop' },
  closing:     { icon: '❄️', th: 'ใกล้ปิดฤดูกาล',       en: 'Season ending soon' },
  ropeway:     { icon: '🚡', th: 'มีกระเช้า',           en: 'Ropeway' },
};

const SPOT_BASES = {
  fukushima: { th: 'ฟุกุชิมะ',  en: 'Fukushima', access: 'Tokyo → Fukushima ชินคันเซ็น 1 ชม. 30 นาที ~¥9,110' },
  sendai:    { th: 'เซนได',     en: 'Sendai',    access: 'Tokyo → Sendai ชินคันเซ็น (Hayabusa) 1 ชม. 30 นาที ~¥11,410 · ที่นั่งจองทั้งขบวน' },
  matsumoto: { th: 'มัตสึโมโตะ', en: 'Matsumoto', access: "Shinjuku → Matsumoto ด่วนพิเศษ Azusa 2 ชม. 35 นาที ~¥6,620 (จองที่นั่ง ~¥6,900-7,500)" },
  nagano:    { th: 'นางาโนะ',   en: 'Nagano',    access: 'Tokyo → Nagano ชินคันเซ็น 1 ชม. 20 นาที ~¥8,340' },
  gunma:     { th: 'กุนมะ',     en: 'Gunma',     access: 'Tokyo → Jomo-Kogen ชินคันเซ็น ~1 ชม. 10 นาที ~¥6,000 · Kusatsu ไปทาง Ueno ด่วน Kusatsu-Shima ~¥5,770' },
  aomori:    { th: 'อาโอโมริ',  en: 'Aomori',    access: 'Tokyo → Hachinohe / Shin-Aomori ชินคันเซ็น ~3 ชม. ~¥17,670' },
  gifu:      { th: 'กิฟุ (โอคุฮิดะ)', en: 'Gifu / Okuhida', access: 'ต่อจากฐาน Matsumoto — บัสผ่าน Hirayu Onsen · หรือจาก Takayama Nohi Bus Center ~1 ชม. 45 นาที' },
  toyama:    { th: 'โทยามะ',    en: 'Toyama',    access: 'Tokyo → Toyama ชินคันเซ็น ~2 ชม. 10 นาที ~¥13,000' },
  niigata:   { th: 'นีงาตะ (เกาะซาโดะ)', en: 'Niigata / Sado', access: 'Tokyo → Niigata ชินคันเซ็น ~2 ชม. แล้วต่อเรือข้ามไปเกาะซาโดะ (เจ็ตฟอยล์ ~1 ชม. / เรือเฟอร์รี ~2 ชม. 30 นาที)' },
  kyoto:     { th: 'เกียวโตตอนเหนือ (ทังโกะ)', en: 'North Kyoto / Tango', access: 'Kyoto → Amanohashidate บัสด่วน Tankai ~2 ชม. 5 นาที ~¥3,200-3,400 (หรือรถไฟด่วน ~3 ชม.)' },
  kumamoto:  { th: 'คุมาโมโตะ (คิวชู)', en: 'Kumamoto / Kyushu', access: '✈ Haneda → Kumamoto บิน ~1 ชม. 50 นาที (วันละ ~18 เที่ยว) แล้วต่อรถเข้าเมือง' },
};

const RESEARCH_SPOTS = [
  /* ---------- ฐาน: ฟุกุชิมะ ---------- */
  { base: 'fukushima', name: 'Ouchi-juku หมู่บ้านหลังคาฟาง', ja: '大内宿', en: 'Ouchi-juku', lat: 37.2136, lng: 139.8593,
    highlight: 'หมู่บ้านสถานีม้าสมัยเอโดะ บ้านหลังคาฟางเรียงสองฝั่งถนนดิน ยังใช้อยู่จริงเป็นร้าน/ที่พัก · ขึ้นเนินท้ายหมู่บ้านได้วิวมุมสูงที่เห็นตามโปสเตอร์ · ของขึ้นชื่อคือโซบะที่กินด้วยต้นหอมแทนตะเกียบ',
    access: ['Aizu-Wakamatsu → Yunokami-Onsen ด้วย Aizu Railway ~40 นาที ~¥1,050 (ตั๋วแยกจาก JR)', 'Yunokami-Onsen → Ouchi-juku บัส/แท็กซี่รวม「Saruyu-go」~20 นาที · เปิด มี.ค.–พ.ย. ราวชั่วโมงละเที่ยว · บัตร 2 วัน ¥1,100'],
    need: ['train', 'seasonalBus', 'cash'],
    season: '✓ ปลาย ต.ค. บัสยังวิ่ง (หยุดหลัง พ.ย.) · ใบไม้รอบหมู่บ้านกำลังสวย',
    warn: '⚠️ Aizu Railway รับ<strong>เงินสดอย่างเดียว</strong> ใช้บัตรเครดิต/IC card ไม่ได้ และขึ้นจากสถานีไร้พนักงานต้องจ่ายที่ปลายทาง',
    url: 'https://www.japan-guide.com/e/e7710.html' },
  { base: 'fukushima', name: 'To-no-Hetsuri หน้าผาเสาหิน', ja: '塔のへつり', en: 'To-no-Hetsuri', lat: 37.2431, lng: 139.8843,
    highlight: 'หน้าผาหินถูกน้ำกัดเป็นเสาสูงเรียงริมแม่น้ำ มีสะพานแขวนข้ามไปฝั่งผา + ศาลเจ้าเล็กในซอกหิน · เดินจากสถานี 10 นาทีถึงเลย',
    access: ['อยู่บนเส้น Aizu Railway เดียวกับ Ouchi-juku — ลงสถานี Tō-no-Hetsuri แล้วเดิน ~10 นาที', 'เก็บคู่กับ Ouchi-juku ในวันเดียวได้สบาย'],
    need: ['train', 'cash'],
    season: '✓ ใบไม้แดงริมผาช่วงปลาย ต.ค.–ต้น พ.ย.',
    url: 'https://en.wikipedia.org/wiki/T%C5%8D-no-Hetsuri_Station' },
  { base: 'fukushima', name: 'ปราสาท Tsurugajo (Aizu-Wakamatsu)', ja: '鶴ヶ城', en: 'Tsuruga Castle', lat: 37.4876, lng: 139.9296,
    highlight: 'ปราสาทหลังคากระเบื้องแดงหนึ่งเดียวในญี่ปุ่น · เมืองซามูไรไอสึ ศูนย์กลางสงครามโบชิน · ในเมืองมีบ้านซามูไร Aizu Bukeyashiki และเนิน Iimoriyama',
    access: ['Koriyama → Aizu-Wakamatsu ด้วย JR Ban\'etsu West Line ~1 ชม. 20 นาที', 'ในเมืองใช้บัสวน Aizu Loop Bus ¥250/เที่ยว หรือบัตรวัน ¥700'],
    need: ['train', 'bus'],
    season: '✓ เที่ยวได้ทุกสภาพอากาศ — เป็นแผนสำรองวันฟ้าปิดที่ดี',
    url: 'https://www.japan-guide.com/e/e7701.html' },
  { base: 'fukushima', name: 'บึงห้าสี Goshiki-numa (Urabandai)', ja: '五色沼', en: 'Goshiki-numa Ponds', lat: 37.6479, lng: 140.0722,
    highlight: 'กลุ่มบึงภูเขาไฟสีต่างกันตั้งแต่ฟ้าเทอร์ควอยซ์ถึงเขียวมรกต เกิดจากการระเบิดของภูเขาบันไดปี 1888 · เส้นเดิน 3.6 กม. ทางราบ 80-90 นาที ผ่าน Bishamon-numa บึงใหญ่สุดที่เห็นภูเขาบันไดสะท้อนน้ำ',
    access: ['Fukushima → Koriyama (ชินคันเซ็น ~12 นาที ~¥1,800 / รถธรรมดา ~50 นาที ~¥990)', "Koriyama → Inawashiro ด้วย JR Ban'etsu West Line ~35 นาที ~¥770", 'Inawashiro → ป้าย Goshikinuma Iriguchi บัส Bandai Toto ~30 นาที ¥790 · ปลายทางอีกฝั่ง Urabandai Kogen-eki ¥910'],
    need: ['train', 'bus', 'cash'],
    season: '✓ ใบไม้พีคกลาง ต.ค.–ต้น พ.ย. — ตรงช่วงเราพอดี',
    warn: '⚠️ บัส Bandai Toto มีแค่<strong>ชั่วโมงละ 1 เที่ยว บางช่วงเว้น 2 ชั่วโมง</strong> และจ่ายเงินสดเท่านั้น ซื้อออนไลน์ไม่ได้ — เช็ครอบเที่ยวสุดท้ายตั้งแต่ตอนลงรถขามา',
    url: 'https://www.japan-guide.com/e/e7752.html' },

  /* ---------- ฐาน: เซนได ---------- */
  { base: 'sendai', name: 'Naruko Gorge หุบเขานารุโกะ', ja: '鳴子峡', en: 'Naruko Gorge', lat: 37.7458, lng: 140.6597,
    highlight: 'หุบเขาลึก 100 ม. ยาว 2.6 กม. — วิวคลาสสิกคือมองจากจุดชมวิว Ofukazawa เห็นสะพานรถไฟพาดกลางหุบใบไม้แดง · เดินเส้นเลียบหุบเขาได้ · เมือง Naruko Onsen เป็นเมืองออนเซ็นเก่าที่มีน้ำแร่หลายประเภทในที่เดียว + ตุ๊กตาโคเคชิ',
    access: ['Sendai → Furukawa ชินคันเซ็น ~15 นาที', 'Furukawa → Naruko-Onsen ด้วย JR Rikuu East Line ~45 นาที', 'รวมทั้งหมด ~90 นาที ~¥2,500 เที่ยวเดียว (ไม่จองที่นั่ง)', 'สถานี → หุบเขา: บัสฤดูกาล ~10-15 นาที ¥400 ลงป้าย Nakayamadaira-guchi (หรือเดิน ~1 ชม.)'],
    need: ['train', 'seasonalBus'],
    season: '★ พีค<strong>ปลาย ต.ค.–ต้น พ.ย.</strong> และบัสพิเศษวิ่งเฉพาะช่วงนี้พอดี — จังหวะตรงที่สุดจุดหนึ่งของทั้งทริป',
    url: 'https://www.japan-guide.com/e/e5177.html' },
  { base: 'sendai', name: 'Yamadera (Risshakuji) วัดบนหน้าผา', ja: '山寺 立石寺', en: 'Yamadera Risshakuji', lat: 38.3134, lng: 140.4383,
    highlight: 'วัดปี ค.ศ. 860 เกาะอยู่บนหน้าผา ต้องปีนบันไดหิน 1,015 ขั้นผ่านป่าซีดาร์ขึ้นไป · ลานชมวิว Godaido ยื่นออกจากผาเห็นหุบเขาทั้งหุบ · เป็นที่ที่บาโชแต่งไฮกุ「ความเงียบ เสียงจักจั่นซึมเข้าหิน」',
    access: ['Sendai → Yamadera ด้วย JR Senzan Line ~1 ชม. ¥910 · ขบวนราวชั่วโมงละเที่ยว', 'สถานี → ทางขึ้นวัด เดิน 5 นาที', 'ค่าเข้า ¥300'],
    need: ['train'],
    season: '★ ใบไม้พีคปลาย ต.ค.–ต้น พ.ย. · อากาศเย็นกำลังดีสำหรับปีนบันได',
    warn: '⚠️ นี่คือ<strong>ปีนบันได ~40-60 นาที</strong> ไม่ใช่เดินเขาสันยาว — ถ้าอยากได้ trekking เต็มวันต้องมองที่อื่น',
    url: 'https://www.japan-guide.com/e/e7940.html' },
  { base: 'sendai', name: 'อ่าว Matsushima', ja: '松島', en: 'Matsushima Bay', lat: 38.3697, lng: 141.0600,
    highlight: '1 ใน 3 วิวงามที่สุดของญี่ปุ่น — เกาะสนกว่า 260 เกาะกระจายในอ่าว · วัด Zuiganji (สมบัติชาติ) และ Godaido ริมน้ำ · จุดชมวิว 4 มุมบนเนินรอบอ่าว',
    access: ['Sendai → Matsushima-Kaigan ด้วย JR Senseki Line ~40 นาที ¥440', 'ท่าเรืออยู่ห่างสถานีเดิน 5-10 นาที', 'ล่องเรือรอบอ่าว ~50 นาที ~¥1,500'],
    need: ['train'],
    season: '✓ เที่ยวได้แม้ฟ้าปิด — เป็น<strong>แผนสำรองที่ดีที่สุด</strong>ของฐานเซนได',
    url: 'https://www.japan-guide.com/e/e5101.html' },
  { base: 'sendai', name: 'Zao Okama ปล่องภูเขาไฟทะเลสาบ', ja: '蔵王 御釜', en: 'Zao Okama Crater', lat: 38.1425, lng: 140.4497,
    highlight: 'ทะเลสาบในปล่องภูเขาไฟสีเขียวมรกต เปลี่ยนเฉดตามแสง เลยได้ชื่อว่า「ทะเลสาบห้าสี」 · จากลานจอด Katta-toge เดินไม่กี่นาทีถึงจุดชมวิว · เดินสันต่อขึ้น Kumano-dake ได้อีก ~1 ชม.',
    access: ['ต้องขึ้นถนน Zao Echo Line — เปิดปลาย เม.ย.–ต้น พ.ย. เวลา 06:00-18:00', 'บัส Miyagi Kotsu จาก Shiroishi-Zao ขึ้น Katta-toge ~1 ชม. 45 นาที ~¥1,960'],
    need: ['noBus', 'car', 'closing'],
    season: '⚠️ ใบไม้บนยอด<strong>พีคไปแล้วต้น-กลาง ต.ค.</strong> ปลายเดือนเหลือวิวปล่องล้วน',
    warn: '⛔ <strong>ตัวตัดสิน:</strong> บัสขึ้น Okama วิ่งทุกวันแค่ <strong>ส.ค.–กลาง ต.ค.</strong> เท่านั้น — วันที่ 24 ต.ค. <strong>ไม่มีบัสประจำ</strong> ต้องเช่ารถหรือซื้อทัวร์ และถนนปิดตอนกลางคืน',
    url: 'https://www.japan-guide.com/e/e7929.html' },
  { base: 'sendai', name: 'น้ำตก Akiu Otaki + หุบเขา Rairaikyo', ja: '秋保大滝・磊々峡', en: 'Akiu Otaki & Rairaikyo Gorge', lat: 38.2400, lng: 140.6350,
    highlight: 'น้ำตกสูง 55 ม. 1 ใน 3 น้ำตกงามของญี่ปุ่น รอบด้านเป็นเมเปิล/โอ๊ก · หุบเขา Rairaikyo มีเส้นเดินริมผา 650 ม. ไป-กลับ 30-40 นาที เดินง่ายมาก · เมืองออนเซ็น Akiu อยู่ตรงกลาง',
    access: ['บัส Miyagi Kotsu จาก Sendai Station ประตูตะวันตก ป้ายที่ 8', 'ปลายทาง Akiu Otaki ~70-75 นาที · ถึงแค่ Akiu Onsen Yumoto ~30 นาที (มีรถเร็วเฉพาะเสาร์-อาทิตย์)'],
    need: ['bus'],
    season: '✓ ใบไม้พีคกลาง ต.ค.–ต้น พ.ย. — ตรงช่วงเรา · <strong>เหมาะเป็นบ่ายวันแรก</strong>เพราะไม่ต้องออกไปไกล',
    url: 'https://visitmiyagi.com/articles/akiu-otaki-falls/' },

  /* ---------- ฐาน: มัตสึโมโตะ ---------- */
  { base: 'matsumoto', fit: 'good', requested: true, name: 'Kamikochi หุบเขาเทือกเขาแอลป์', ja: '上高地', en: 'Kamikochi', lat: 36.2506, lng: 137.6383,
    highlight: 'หุบเขาที่ราบสูง 1,500 ม. ใต้เทือก Hotaka · แม่น้ำ Azusa สีเทอร์ควอยซ์ + สะพานไม้ Kappabashi ที่เป็นภาพจำ · เดินเลียบน้ำแบบราบล้วนจาก Taisho Pond → Kappabashi → Myojin Pond ~7-9 กม. ไม่ต้องปีน',
    access: ['Matsumoto → Shin-Shimashima ด้วยรถไฟ Alpico ~30 นาที แล้วต่อบัส ~60 นาที · <strong>รวม ~¥2,710</strong> เที่ยวเดียว', 'หรือบัสตรง「National Park Liner」จาก Matsumoto Bus Terminal ~1 ชม. 30 นาที ออก 05:30 กับ 10:15 (เที่ยวจำกัด)'],
    need: ['train', 'bus', 'noCar', 'closing', 'reserve'],
    season: '⚠️ ใบไม้พีคกลาง ต.ค. — ปลายเดือน<strong>ผ่านพีคแล้ว</strong> แต่ได้ยอดเขาโรยหิมะคู่ใบไม้ท้ายฤดูแทน',
    warn: '🚫 <strong>ห้ามนำรถส่วนตัวเข้าตั้งแต่ปี 1975</strong> ต้องจอดที่ Sawando (~¥700/วัน) แล้วต่อชัตเทิล 20-30 นาที · <strong>ปิดฤดูกาล 15 พ.ย. 2026</strong> · เช้ามืดปลาย ต.ค. อาจต่ำกว่า 0°C',
    url: 'https://www.kamikochi.org/access/public' },
  { base: 'matsumoto', name: 'ปราสาท Matsumoto', ja: '松本城', en: 'Matsumoto Castle', lat: 36.2384, lng: 137.9690,
    highlight: 'ปราสาทไม้ดั้งเดิมที่เก่าแก่ที่สุดแห่งหนึ่ง สร้างปลายศตวรรษ 16 ไม่เคยถูกไฟไหม้/สร้างใหม่ · หอปราสาทดำสนิทสะท้อนคูน้ำ ฉากหลังเป็นเทือกเขาแอลป์ญี่ปุ่น · ในเมืองเดินต่อไปถนนเก่า Nakamachi/Nawate ได้',
    access: ['เดินจากสถานี Matsumoto ~15 นาที หรือขึ้นบัสวนในเมือง', 'อยู่กลางเมือง ไม่ต้องเดินทางไกล'],
    need: ['walk'],
    season: '✓ เที่ยวได้ทุกสภาพอากาศ — เก็บวันแรกที่มาถึงได้เลย',
    url: 'https://www.japan-guide.com/e/e6053.html' },
  { base: 'matsumoto', fit: 'good', requested: true, name: 'ที่ราบสูง Utsukushigahara', ja: '美ヶ原高原', en: 'Utsukushigahara Highlands', lat: 36.2100, lng: 138.1000,
    highlight: 'ทุ่งหญ้าบนสันเขาสูง 2,000 ม. เดินได้แบบไม่ต้องปีน วิว 360° เห็นเทือกเขาแอลป์ทั้งแนวและฟูจิในวันฟ้าใส · มีพิพิธภัณฑ์ประติมากรรมกลางแจ้งตั้งอยู่บนทุ่งจริง ๆ',
    access: ['⚠️ ไม่มีบัสสาธารณะช่วงฤดูใบไม้ร่วง — บัสจาก Matsumoto วิ่งเฉพาะฤดูร้อน (ต้น–กลาง ส.ค.) และต้องจอง'],
    need: ['car', 'noBus'],
    season: '★ ใบไม้พีค<strong>ปลาย ต.ค.–กลาง พ.ย.</strong> ตรงวันเราพอดี · ถนนปิดฤดูหนาวปลาย พ.ย.–ปลาย เม.ย.',
    warn: '🚗 <strong>ต้องเช่ารถ</strong> — ช่วงใบไม้ร่วงไม่มีขนส่งสาธารณะขึ้นไป นี่คือเงื่อนไขตัดสินว่าจะเก็บที่นี่ได้หรือไม่',
    url: 'https://visitmatsumoto.com/en/fallleaves/utsukushigahara/' },
  { base: 'matsumoto', name: 'Narai-juku เมืองไปรษณีย์เอโดะ', ja: '奈良井宿', en: 'Narai-juku', lat: 35.9333, lng: 137.8167,
    highlight: 'เมืองสถานีบนเส้นทางนาคาเซ็นโด ถนนไม้ยาว 1 กม. — ยาวที่สุดในบรรดาเมืองไปรษณีย์ที่เหลืออยู่ · บ้านไม้สองชั้นชายคายื่น ร้านเครื่องเขิน Kiso · คนน้อยกว่า Tsumago/Magome มาก',
    access: ['Matsumoto → Narai ด้วย JR Chuo Line ~45-60 นาที ~¥590', 'สถานี → ถนนเก่า เดิน 3 นาที'],
    need: ['train'],
    season: '✓ ใบไม้รอบหุบเขา Kiso สวยปลาย ต.ค. · เป็นแผนสำรองวันฝนที่ดี',
    url: 'https://www.japan-guide.com/e/e6079.html' },
  { base: 'matsumoto', name: 'Daio Wasabi Farm (Azumino)', ja: '大王わさび農場', en: 'Daio Wasabi Farm', lat: 36.3197, lng: 137.8886,
    highlight: 'ไร่วาซาบิใหญ่สุดของญี่ปุ่น ปลูกในลำธารน้ำใสจากหิมะละลายเทือกเขาแอลป์ · มีกังหันน้ำไม้ริมลำธาร (ฉากในหนัง Kurosawa) · ที่ราบ Azumino ปั่นจักรยานเล่นได้ทั้งวันโดยมีเทือกเขาเป็นฉากหลัง',
    access: ['Matsumoto → Hotaka ด้วย JR Oito Line ~28 นาที', 'Hotaka → ไร่ เช่าจักรยานปั่น ~15 นาที (หรือแท็กซี่)'],
    need: ['train', 'walk'],
    season: '✓ เข้าฟรี · เที่ยวได้ทั้งปี',
    url: 'https://www.go-nagano.net/en/trip-idea/id16502' },

  /* ---------- ฐาน: นางาโนะ ---------- */
  { base: 'nagano', name: 'ศาลเจ้า Togakushi + ทางเดินซีดาร์', ja: '戸隠神社', en: 'Togakushi Shrine', lat: 36.7594, lng: 138.0761,
    highlight: 'ศาลเจ้า 5 แห่งกระจายบนภูเขา เชื่อมด้วยเส้นเดินป่า · ไฮไลต์คือ<strong>ทางเดินซีดาร์อายุ 400 ปี กว่า 300 ต้น</strong> ก่อนถึง Okusha · ช่วงท้ายเป็นบันไดหินชันขึ้นไปหาศาลเจ้าที่ซุกใต้หน้าผา Mt. Togakushi · แถวนี้ยังขึ้นชื่อเรื่องโซบะโทงาคุชิ',
    access: ['บัส Nagano-Togakushi จากสถานีขนส่ง Nagano ชานชาลา 7 (ปลายทาง Togakushi Campground)', '~1 ชม. เศษ ~¥1,550'],
    need: ['bus', 'walk'],
    season: '★ พีค<strong>ปลาย ต.ค.–ต้น พ.ย.</strong> ตรงช่วงเราพอดี · อุณหภูมิกำลังดีสำหรับเดิน',
    url: 'https://visit-nagano.alpico.co.jp/travelog/post/hiking-the-5-shrines-trail-in-togakushi/' },
  { base: 'nagano', name: 'Jigokudani ลิงแช่ออนเซ็น', ja: '地獄谷野猿公苑', en: 'Jigokudani Monkey Park', lat: 36.7328, lng: 138.4622,
    highlight: 'ลิงหิมะญี่ปุ่นลงมาแช่บ่อน้ำร้อนกลางหุบเขา — ที่เดียวในโลกที่เห็นพฤติกรรมนี้ · เปิดทั้งปี ปลาย ต.ค. ลิงยังลงแช่แม้ยังไม่มีหิมะ',
    access: ['Nagano → Yudanaka ด้วยรถไฟ Nagano Dentetsu ~45 นาที (ด่วน) / ~70 นาที (ธรรมดา)', 'Yudanaka → ป้าย Snow Monkey Park บัสสาย Kobayashi ~10 นาที ¥390 (ชั่วโมงละ 1-2 เที่ยว)', '⚠️ จากป้ายบัส<strong>ต้องเดินป่าต่ออีก 30-40 นาที</strong> ถึงตัวสวน'],
    need: ['train', 'bus', 'walk'],
    season: '✓ ปลาย ต.ค. เห็นลิงได้ แต่ภาพ「ลิงกับหิมะ」ต้องรอฤดูหนาว',
    url: 'https://www.japan-guide.com/e/e6028.html' },
  { base: 'nagano', name: 'วัด Zenkoji', ja: '善光寺', en: 'Zenkoji Temple', lat: 36.6614, lng: 138.1875,
    highlight: 'วัดอายุกว่า 1,400 ปี เก่ากว่าการแยกนิกายพุทธในญี่ปุ่น จึงเปิดรับทุกนิกาย · โถงหลักเป็นสมบัติชาติ · มี「กุญแจแห่งสวรรค์」ให้คลำในอุโมงค์มืดสนิทใต้แท่นบูชา · ถนนหน้าวัดยาวเป็นกิโลเต็มไปด้วยร้านเก่า',
    access: ['เดินจากสถานี Nagano ~30 นาที หรือบัส ~10 นาที', 'อยู่ในเมือง ไปเช้ามืดได้ทันพิธี O-asaji ตอนพระอาทิตย์ขึ้น'],
    need: ['bus'],
    season: '✓ ทุกสภาพอากาศ',
    url: 'https://www.go-nagano.net/en/trip-idea/id7062' },

  /* ---------- ฐาน: กุนมะ ---------- */
  { base: 'gunma', name: 'Tanigawadake Ropeway + Tenjindaira', ja: '谷川岳ロープウェイ・天神平', en: 'Tanigawadake Ropeway', lat: 36.8350, lng: 138.9300,
    highlight: 'กระเช้าขึ้น 573 ม. ใน 15 นาที ถึงสถานี Tenjindaira ที่ 1,319 ม. · เดินสันเขาชมวิวหน้าผา Ichinokura-sawa แบบไม่ต้องใช้อุปกรณ์ · ถ้าอยากลุยเดินต่อขึ้นยอด 1,977 ม. ได้ (ไป-กลับ 6-7 ชม.)',
    access: ['Tokyo → Jomo-Kogen ชินคันเซ็น ~70 นาที', 'Jomo-Kogen ป้ายที่ 1 → Tanigawadake Ropeway บัส Kan-etsu ~45 นาที ¥1,250', 'หรือลงสถานี Doai (สถานีใต้ดินลึกสุดในญี่ปุ่น 486 ขั้น) แล้วเดิน ~20 นาที', 'ค่ากระเช้า เที่ยวเดียว ¥1,800 / ไป-กลับ ¥3,000'],
    need: ['train', 'bus', 'ropeway'],
    season: '⚠️ ใบไม้ระดับกระเช้าพีคกลาง ต.ค. — ปลายเดือนพีคไหลลงมาที่ระดับหุบเขาแทน · อุณหภูมิ ต.ค. ราว 12°C ในเมือง บนเขาเย็นกว่ามาก',
    url: 'https://www.visit-gunma.jp/en/plan-your-trip/access-guide/how-to-get-to-tanigawa/' },
  { base: 'gunma', name: 'Takaragawa Onsen (Osenkaku)', ja: '宝川温泉 汪泉閣', en: 'Takaragawa Onsen', lat: 36.8608, lng: 139.0364,
    highlight: 'บ่อกลางแจ้งริมแม่น้ำที่ใหญ่ที่สุดแห่งหนึ่งของญี่ปุ่น — บ่อหินเรียงยาวตามลำน้ำในป่า มองขึ้นไปเห็นใบไม้เปลี่ยนสีทั้งหุบ · มี 3 บ่อรวม + 1 บ่อหญิง',
    access: ['Minakami Station ป้ายที่ 4 → Takaragawa Iriguchi บัส ~30 นาที ¥1,300', 'จากป้ายมีรถรับส่งฟรีเข้าออนเซ็น (ทั้งแขกค้างและแบบ day-use)'],
    need: ['bus'],
    season: '✓ ใบไม้รอบบ่อสวยปลาย ต.ค. · <strong>day-use 10:00-16:30 (เข้าได้ถึง 16:00) ~¥1,500</strong> รวมชุดคลุมอาบน้ำ',
    url: 'https://www.visit-gunma.jp/en/plan-your-trip/access-guide/how-to-get-to-takaragawa/' },
  { base: 'gunma', name: 'Kusatsu Onsen — Yubatake', ja: '草津温泉 湯畑', en: 'Kusatsu Onsen', lat: 36.6222, lng: 138.5964,
    highlight: 'ออนเซ็นอันดับต้นของญี่ปุ่น น้ำแร่ไหลออกมากที่สุดในประเทศ · ใจกลางเมืองคือ「Yubatake ทุ่งน้ำร้อน」รางไม้ระบายน้ำแร่กลางเมืองที่ส่องไฟตอนกลางคืน · มีบ่อสาธารณะฟรีกระจายทั่วเมือง + Sainokawara บ่อกลางแจ้งใหญ่ในสวน',
    access: ['Ueno → Naganohara-Kusatsuguchi ด้วยด่วนพิเศษ Kusatsu-Shima ~2 ชม. 20 นาที ~¥5,770', 'ต่อบัส ~25 นาที ¥710 (เวลารถประสานกับรถไฟ)', 'รวม ~3 ชม. ~¥6,260'],
    need: ['train', 'bus'],
    season: '✓ ทั้งปี — เมืองออนเซ็นแบบเดินเที่ยวได้ ไม่ขึ้นกับอากาศ',
    url: 'https://www.visit-gunma.jp/en/plan-your-trip/access-guide/how-to-get-to-kusatsu/' },

  /* ---------- ฐาน: อาโอโมริ ---------- */
  { base: 'aomori', name: 'Oirase Gorge ลำธารโออิราเสะ', ja: '奥入瀬渓流', en: 'Oirase Gorge', lat: 40.5333, lng: 140.9333,
    highlight: 'ลำธารยาว 14 กม. ไหลออกจากทะเลสาบ Towada มีทางเดินเลียบน้ำขนานตลอดสาย · น้ำตกเล็ก ๆ นับสิบ + หินคลุมมอสเขียวใต้อุโมงค์ใบไม้ · ช่วงสวยสุดคือ Ishigedo → Nenokuchi ~9 กม. ทางราบล้วน',
    access: ['Tokyo → Hachinohe ชินคันเซ็น ~2 ชม. 45 นาที', "Hachinohe → หุบเขา ด้วย JR Bus「Oirase-go」~2-2.5 ชม. ~¥1,990 (ต่อไปทะเลสาบ ~¥2,720)", 'บัตร Aomori–Hachinohe–Towada Free 2 วัน ¥5,800 นั่ง Mizuumi-go/Oirase-go ไม่จำกัด'],
    need: ['train', 'seasonalBus', 'reserve'],
    season: '★★ <strong>พีคปลาย ต.ค. พอดีเป๊ะ</strong> และช่วงนี้มีการเสริมรอบบัสพิเศษ · บัสฤดูใบไม้ร่วงวิ่งถึงราว 18 พ.ย.',
    warn: '🎫 ขึ้น Oirase-go จากสถานี Hachinohe <strong>ต้องจองล่วงหน้า</strong>',
    url: 'https://www.jrbustohoku.co.jp/towadako-oirase/en/' },
  { base: 'aomori', name: 'ทะเลสาบ Towada', ja: '十和田湖', en: 'Lake Towada', lat: 40.4550, lng: 140.8811,
    highlight: 'ทะเลสาบปล่องภูเขาไฟลึกที่สุดอันดับ 3 ของญี่ปุ่น น้ำใสจนเห็นพื้น · ล่องเรือข้ามทะเลสาบชมผาริมน้ำ · รูปปั้น「สตรีสองนาง」ริมฝั่งที่ Yasumiya',
    access: ['ต่อจาก Oirase ด้วยบัสสายเดียวกัน — ปลายทาง Yasumiya (Towadako)', 'จาก Hachinohe ~2.5 ชม. ~¥2,720'],
    need: ['seasonalBus'],
    season: '★ ใบไม้พีคกลาง–ปลาย ต.ค.',
    url: 'https://www.towada.travel/en/season/autumn' },
  { base: 'aomori', name: 'Hakkoda Ropeway', ja: '八甲田ロープウェー', en: 'Hakkoda Ropeway', lat: 40.6567, lng: 140.8639,
    highlight: 'กระเช้าขึ้น 650 ม. ใน 10 นาที ถึงยอด Tamoyachi-dake 1,324 ม. · วิว 360° เห็นเมืองอาโอโมริ อ่าวมุตสึ และภูเขา Iwaki · มีเส้นเดินวนบนที่ราบพรุใกล้ยอด ไป-กลับ 45-60 นาที',
    access: ['บัส JR「Mizuumi-go」จาก Aomori ~1 ชม.', 'เก็บคู่กับ Sukayu Onsen ที่อยู่ถัดไปบนเส้นเดียวกันได้'],
    need: ['seasonalBus', 'ropeway', 'closing'],
    season: '⚠️ ใบไม้บนยอด<strong>พีคปลาย ก.ย.–กลาง ต.ค.</strong> และยอดเขามัก<strong>มีหิมะแรกกลาง ต.ค.</strong> — ปลายเดือนอาจเจอหิมะแทนใบไม้แดง',
    url: 'https://www.japan-guide.com/e/e3780.html' },

  /* ---------- ลิสต์ที่ผู้ใช้ส่งมาเพิ่ม ---------- */
  { base: 'nagano', name: 'สะพาน Hakuba Ohashi', ja: '白馬大橋', en: 'Hakuba Ohashi Bridge', lat: 36.6975, lng: 137.8619,
    fit: 'good', pair: 'matsumoto',
    highlight: 'สะพานข้ามแม่น้ำ Matsukawa ที่น้ำใสจากหิมะละลาย มองตรงไปเห็น<strong>ยอดสามพี่น้อง Shirouma-Sanzan</strong> (Shakushi / Yari / Shirouma) เต็มหน้า · มีทางเดินเท้าทั้งสองฝั่งสะพาน + ที่จอดรถเชิงสะพาน · ได้รับเลือกเป็น 1 ใน 100 ถนนงามของญี่ปุ่น',
    access: ['Matsumoto → Hakuba ด้วย JR Oito Line ~1 ชม.–1 ชม. 40 นาที ~¥1,230 · หลายขบวนเปลี่ยนรถที่ Shinano-Omachi', 'ด่วนพิเศษ Azusa วิ่งตรงวันละเที่ยว ~1 ชม. (แพงกว่า)', 'จากสถานี Hakuba ต่อรถ/แท็กซี่สั้น ๆ ถึงสะพาน'],
    need: ['train', 'walk'],
    season: '★ <strong>「ใบไม้สามชั้น」ช่วงกลาง–ปลาย ต.ค. พอดี</strong> — ยอดโรยหิมะ ไหล่เขาใบไม้แดง เชิงเขายังเขียว · แถวทะเลสาบ Aoki เห็นสะท้อนน้ำครบสามชั้น',
    photoQuery: '白馬大橋 紅葉 10月', requested: true,
    url: 'https://www.mlit.go.jp/tagengo-db/en/H30-00607.html' },
  { base: 'gifu', name: 'Shinhotaka Ropeway', ja: '新穂高ロープウェイ', en: 'Shinhotaka Ropeway', lat: 36.2683, lng: 137.5806,
    fit: 'good', pair: 'matsumoto',
    highlight: '<strong>กระเช้าสองชั้นแห่งเดียวในญี่ปุ่น</strong> จุได้ 121 คน ขึ้นถึง 2,156 ม. · ดาดฟ้าชมวิวเห็นแนวเทือกเขาแอลป์เหนือทั้งแนวแบบ 360° · ล่างสุดเป็นหมู่บ้านออนเซ็น Okuhida มีบ่อกลางแจ้งเยอะมาก',
    access: ['จากฐาน Matsumoto: บัสจาก Matsumoto Bus Terminal ผ่าน Hirayu Onsen', 'หรือจาก Takayama Nohi Bus Center ~1 ชม. 45 นาที ลงป้ายสุดท้าย', 'ค่ากระเช้า (ทั้งสายที่ 1 + 2) <strong>ไป-กลับ ¥3,800</strong>'],
    need: ['bus', 'ropeway'],
    season: '★ ใบไม้ปลาย ก.ย.–<strong>ปลาย ต.ค.</strong> · โชคดีจะเจอ「ใบไม้สามชั้น」— เชิงเขาเขียว ไหล่เขาแดง-เหลือง ยอดขาวโพลน',
    photoQuery: '新穂高ロープウェイ 紅葉 10月', requested: true,
    url: 'https://visitgifu.com/see-do/shinhotaka-ropeway/' },
  { base: 'toyama', name: 'Tateyama Murodo', ja: '立山室堂', en: 'Tateyama Murodo', lat: 36.5772, lng: 137.5947,
    fit: 'stretch',
    highlight: 'จุดกึ่งกลางของเส้นทาง Tateyama Kurobe Alpine Route ยาว 37.2 กม. — ที่ราบสูง 2,450 ม. มีโรงแรมสูงสุดในญี่ปุ่น · เดินรอบบ่อ Mikurigaike ได้ · ต่อไปอีกฝั่งคือเขื่อน Kurobe',
    access: ['ฤดูกาล <strong>15 เม.ย.–30 พ.ย. 2026</strong>', 'Tokyo → Toyama ชินคันเซ็น ~2 ชม. 10 นาที', 'ตั๋วเส้นทาง Tateyama → เขื่อน Kurobe ไป-กลับ ~¥16,000/คน (ปี 2026)'],
    need: ['train', 'ropeway', 'reserve', 'closing'],
    season: '⚠️ ปลาย ต.ค. <strong>บนยอดเป็นหิมะแล้ว</strong> ไม่ใช่ใบไม้แดง — ใบไม้พีคที่ระดับล่าง (Bijodaira / น้ำตก Shomyo / Unazuki Onsen) ช่วงปลาย ต.ค.–พ.ย. แทน',
    warn: '💸 ค่าตั๋วเส้นทาง ~¥16,000/คน (×4 = ~¥64,000) <strong>ยังไม่รวมค่าชินคันเซ็น</strong> — แพงที่สุดในบรรดาจุดทั้งหมดที่วิเคราะห์มา',
    photoQuery: '立山室堂 紅葉 10月', requested: true,
    url: 'https://www.japan-guide.com/e/e7550.html' },
  { base: 'niigata', name: 'Onogame (เกาะซาโดะ)', ja: '大野亀', en: 'Onogame, Sado Island', lat: 38.3247, lng: 138.5136,
    fit: 'no',
    highlight: 'ก้อนหินโมโนลิธสูง 167 ม. โผล่ขึ้นจากทะเลที่ปลายเหนือของเกาะซาโดะ ชื่อแปลว่า「เต่าใหญ่」 · ทุ่งหญ้ารอบฐานเดินขึ้นไปหาจุดชมวิวได้',
    access: ['Tokyo → Niigata ชินคันเซ็น ~2 ชม.', 'Niigata → เกาะซาโดะ เจ็ตฟอยล์ ~1 ชม. / เรือเฟอร์รี ~2 ชม. 30 นาที', 'ท่าเรือ Ryotsu → Onogame ต่อรถอีกราว 1-2 ชม. ไปปลายเหนือของเกาะ'],
    need: ['train', 'bus', 'car'],
    season: '⚠️ ไฮไลต์จริงของที่นี่คือ<strong>ทุ่งดอกลิลลี่สีเหลืองต้นเดือน มิ.ย.</strong> — ปลาย ต.ค. เหลือแค่หน้าผากับทะเล ยังสวยแต่ไม่ใช่ช่วงพีค',
    warn: '⛔ อยู่นอกกรอบ 21–25 ต.ค. — ต้องนั่งเรือข้ามเกาะ แล้ววิ่งไปสุดปลายเหนือ กินเวลาไป-กลับเกือบ 2 วัน',
    photoQuery: '大野亀 佐渡 10月', requested: true,
    url: 'https://www.japan-guide.com/e/e7550.html' },
  { base: 'niigata', name: 'เรือกระทะ Tarai-bune @ Yajima-Kyojima', ja: 'たらい舟 矢島・経島', en: 'Tarai-bune at Yajima-Kyojima', lat: 37.8117, lng: 138.2708,
    fit: 'no',
    highlight: 'เรือไม้ทรงกระทะ (ซีดาร์+ไผ่ ยาว 180 ซม.) ที่ชาวเกาะคิดขึ้นสมัยเมจิไว้งมหอย/สาหร่ายตามชายฝั่งหินซาโดะ · จุด Yajima-Kyojima เป็นอ่าวแคบยาวขนาบด้วยเกาะสองเกาะ คนท้องถิ่นบอกว่าสวยที่สุดในสามจุด · นั่งจริงและพายเองได้',
    access: ['ท่าเรือ Ogi ทางใต้ของเกาะซาโดะ (มีเรือเฟอร์รีจาก Naoetsu เข้าตรง)', 'ช่วง <strong>26 ต.ค.–25 พ.ย. เปิด 08:30-16:30</strong>'],
    need: ['bus', 'reserve'],
    season: '○ เปิดตลอดฤดูใบไม้ร่วง — แต่เป็นกิจกรรมสั้น ๆ ไม่ใช่จุดหมายที่คุ้มกับการข้ามเกาะโดยตัวเอง',
    warn: '⛔ อยู่คนละฝั่งเกาะกับ Onogame — เก็บทั้งสองที่ในทริปเดียวต้องมีรถบนเกาะและอย่างน้อย 2 คืน',
    photoQuery: 'たらい舟 矢島経島 佐渡', requested: true,
    url: 'https://www.gltjp.com/en/directory/item/12977/' },
  { base: 'kyoto', name: 'Ine no Funaya บ้านเรือริมอ่าว', ja: '伊根の舟屋', en: 'Ine no Funaya', lat: 35.6800, lng: 135.2867,
    fit: 'no',
    highlight: 'หมู่บ้านชาวประมงที่บ้าน <strong>230 กว่าหลัง</strong>ปลูกติดผิวน้ำรอบอ่าว ชั้นล่างเป็นโรงจอด<strong>เรือ</strong> ชั้นบนเป็นที่อยู่อาศัย · ล่องเรือรอบอ่าว 25 นาที ¥1,200 เห็นแนวบ้านจากฝั่งน้ำ · มีฟุนายะที่เปิดเป็นที่พักด้วย',
    access: ['Kyoto Sta. ป้าย C2 → Amanohashidate บัสด่วน Tankai ~2 ชม. 5 นาที ~¥3,200-3,400', 'Amanohashidate → Ine บัส Tankai สาย Ine ~1 ชม. ¥400 · ราวชั่วโมงละเที่ยว', 'รวมจากเกียวโต ~3 ชม.'],
    need: ['bus'],
    season: '○ ไม่ใช่จุดใบไม้แดง — เป็นวิวหมู่บ้านริมน้ำที่สวยทั้งปี',
    warn: '⛔ อยู่คนละทิศกับทริปเรา (ฝั่งทะเลญี่ปุ่น เหนือเกียวโต) — ต้องนั่งชินคันเซ็นลงไปเกียวโตก่อนอีก ~2 ชม. 15 นาที',
    photoQuery: '伊根の舟屋 秋', requested: true,
    url: 'https://www.japan-guide.com/e/e3996.html' },
  { base: 'kyoto', name: 'สะพานรถไฟแม่น้ำ Yura', ja: '由良川橋梁', en: 'Yura River Bridge', lat: 35.5300, lng: 135.2600,
    fit: 'no',
    highlight: 'สะพานรถไฟสีน้ำตาลแดงยาว <strong>550 ม. แต่สูงจากผิวน้ำแค่ 3 ม.</strong> ตรงปากแม่น้ำ Yura — เวลารถไฟวิ่งผ่านจึงดูเหมือน<strong>แล่นอยู่บนผิวน้ำระหว่างฟ้ากับทะเล</strong> · ยาวที่สุดในจังหวัดเกียวโต และขึ้นทะเบียนมรดกวิศวกรรมโยธา',
    access: ['อยู่บนสาย Kyoto Tango Railway ระหว่างสถานี Tango-Yura กับ Tango-Kanzaki', 'จุดถ่ายรูปเดินจากสถานี Tango-Yura ~15 นาที', 'เก็บคู่กับ Ine / Amanohashidate ได้เพราะอยู่เส้นเดียวกัน'],
    need: ['train', 'walk'],
    season: '○ ถ่ายได้ทั้งปี — เสน่ห์อยู่ที่มุมภาพ ไม่ใช่ฤดู',
    warn: '⛔ อยู่นอกกรอบทริป เช่นเดียวกับ Ine',
    photoQuery: '由良川橋梁 京都丹後鉄道', requested: true,
    url: 'https://www.kyototourism.org/en/sightseeing/32358/' },
  { base: 'kumamoto', name: 'ทุ่ง Kusasenri-ga-hama (Aso)', ja: '草千里ヶ浜', en: 'Kusasenri-ga-hama', lat: 32.8853, lng: 131.0472,
    fit: 'no',
    highlight: 'ทุ่งหญ้ากว้างในปล่องภูเขาไฟเก่า มีบ่อน้ำกลางทุ่งสะท้อนภูเขา · มีม้าเล็มหญ้าอยู่จริง ขี่ม้าได้ · ฉากหลังคือยอด Nakadake ที่ยังพ่นควัน',
    access: ['✈ Haneda → Kumamoto ~1 ชม. 50 นาที (วันละ ~18 เที่ยว)', 'Kumamoto Sta. → Aso Sta. ~2 ชม. ~¥1,800 · หรือบัสด่วนตรงไป Aso Sanjo Terminal ~¥1,750', "Aso Sta. → Kusasenri บัส Kyushu Sanko สาย Aso Tozan ~35 นาที ¥650 · วันละ 7 เที่ยว"],
    need: ['bus'],
    season: '○ ทุ่งหญ้าเปลี่ยนเป็นสีทองช่วงปลายปี — ไม่ใช่ใบไม้แดงแบบโทโฮคุ',
    warn: '⛔ <strong>อยู่คิวชู ต้องบิน</strong> — ไปกลับกินเวลาอย่างน้อย 1 วันเต็มจากงบเวลา 4 คืนของเรา · และบัสรอบ Kumamoto ยัง<strong>ลดรอบจากผลแผ่นดินไหวปี 2026</strong>',
    photoQuery: '草千里ヶ浜 阿蘇 10月', requested: true,
    url: 'https://www.japan-guide.com/e/e4551.html' },
  { base: 'kumamoto', name: 'จุดชมวิว Daikanbo (ขอบปล่อง Aso)', ja: '大観峰', en: 'Daikanbo Lookout', lat: 32.9686, lng: 131.0736,
    fit: 'no',
    highlight: 'จุดสูงสุดของขอบปล่องภูเขาไฟ Aso — มองลงไปเห็น<strong>แอ่งปล่องที่ใหญ่ที่สุดแห่งหนึ่งของโลก</strong> กว้างกว่า 20 กม. มีเมืองและนาข้าวอยู่ข้างใน · เช้าตรู่ฤดูใบไม้ร่วงมีโอกาสเจอทะเลหมอกเต็มแอ่ง',
    access: ['Aso Sta. → บัส Sanko ทาง Tsuchitate ~25 นาที ลงป้าย Daikanbo Iriguchi แล้ว<strong>เดินต่อ ~2 กม. / 15 นาทีขึ้นไป</strong>', 'มี「Aso Tour Bus」เปิดตั้งแต่ ม.ค. 2025 วิ่งเก็บจุดหลักรวม Daikanbo สำหรับคนไม่มีรถ', 'เหมาแท็กซี่ทั้งวันรอบ Aso ราว ¥30,000+'],
    need: ['bus', 'walk'],
    season: '○ ทะเลหมอกเจอบ่อยช่วงฤดูใบไม้ร่วงเช้ามืด — ต้องค้างแถวนั้นถึงจะทัน',
    warn: '⛔ คิวชูเช่นกัน ต้องบิน',
    photoQuery: '大観峰 阿蘇 雲海 10月', requested: true,
    url: 'https://japantravel.navitime.com/en/area/jp/spot/02301-pn0000967/' },
  { base: 'kumamoto', name: 'ภูเขาไฟ Aso — ปล่อง Nakadake', ja: '阿蘇山 中岳火口', en: 'Mt. Aso Nakadake Crater', lat: 32.8844, lng: 131.1042,
    fit: 'no',
    highlight: 'ปล่องภูเขาไฟที่ยังคุกรุ่นและเข้าถึงได้ง่ายที่สุดแห่งหนึ่งของโลก — ปกติขึ้นไปยืนดูขอบปล่องที่มีน้ำสีเขียวมรกตและควันกำมะถันพวยพุ่งได้เลย',
    access: ['ปกติ: Aso Sta. → บัส Aso Tozan Line → Aso Sanjo Terminal'],
    need: ['bus', 'noBus'],
    season: '—',
    warn: '🚫 <strong>ปิดอยู่ตอนนี้:</strong> ระดับเตือนภัยภูเขาไฟถูกยกจาก 1 เป็น <strong>2 ตั้งแต่ 21 มิ.ย. 2026 และยังมีผลถึง ส.ค. 2026</strong> — ห้ามเข้าในรัศมี ~1 กม. รอบปล่อง Nakadake ที่ 1 <strong>ชมปล่องไม่ได้</strong> และถนน Aso-san Park Road ฝั่งปล่องปิด · ต้องเช็คประกาศของ Aso Volcano Disaster Prevention Council ก่อนเสมอ',
    photoQuery: '阿蘇山 中岳火口', requested: true,
    url: 'https://www.japan-guide.com/e/e4551.html' },
];

/* หมุดคลังสถานที่ลงแผนที่ (type: 'spot') — แสดงเมื่อกดตัวกรอง 🔭 */
RESEARCH_SPOTS.forEach((sp) => {
  PLACES.push({
    name: sp.name, ja: sp.ja, area: 'other', lat: sp.lat, lng: sp.lng,
    type: 'spot', spotBase: sp.base, url: sp.url,
    desc: `🔭 ตัวเลือกฐาน ${SPOT_BASES[sp.base].th} — ${sp.highlight.replace(/<[^>]+>/g, '')} · หมุดโดยประมาณ`,
    en: { name: sp.en, desc: `🔭 Alternative base: ${SPOT_BASES[sp.base].en} — pin position approximated` },
  });
});

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
    desc: 'เทศกาลตุ๊กตาดอกเบญจมาศบนซากปราสาท Kasumigajo — จัดกลาง ต.ค.–กลาง พ.ย. ต่อเนื่องมากว่า 60 ปี ช่างใช้ดอกไม้ถึง 10,000 ดอกต่อตุ๊กตาหนึ่งตัว · ชินคันเซ็นจาก Fukushima ~15 นาที แล้วเดินจากสถานี Nihonmatsu ~20 นาที', url: 'https://fukushima.travel/blogs/the-guide-to-every-fukushima-festival-in-2026/169' },
  { title: 'Light-up อุโมงค์แปะก๊วย @ Azuma Sports Park (Fukushima City)', area: 'fukushima', dateText: 'ประมาณ 20 ต.ค. – กลาง พ.ย. · 17:00–20:00 ✓ ตรงคืนที่พัก Fukushima (22–24 ต.ค.)', status: 'hit',
    desc: 'แถวแปะก๊วย 116 ต้น ยาว 520 ม. เปิดไฟกลางคืน — บางปีปิดวันอังคาร และวันเริ่มขยับตามสีใบไม้ ให้เช็คประกาศปี 2026 ก่อนไป', url: 'https://www.f-kankou.jp/en/experience/trip-ideas/426/' },
  { title: 'เก็บแอปเปิล Fuji ตาม Fruit Line (Fukushima City)', area: 'fukushima', dateText: 'ฤดูแอปเปิลตลอดเดือน ต.ค. ✓', status: 'hit',
    desc: 'สวนผลไม้ริม Fruit Line เปิดให้เก็บแอปเปิลเองช่วง ต.ค. (พันธุ์ Fuji ปลายฤดู) — ควรจองสวนล่วงหน้า เหมาะกับเช้าวันศุกร์ 23 ต.ค.', url: 'https://fukushima.travel/destination/pick-your-own-fruit-in-fukushima-city/91' },
  { title: 'ใบไม้เปลี่ยนสี Goshiki-numa / Urabandai', area: 'fukushima', dateText: 'พีคกลาง ต.ค. – ต้น พ.ย. ✓ ตรงทริป', status: 'hit',
    desc: 'บึงหลากสีเชิงภูเขาบันได เส้นทางเดินราบ ~3.5 กม. — จาก Fukushima ต้องต่อชินคันเซ็นถึง Koriyama แล้วนั่ง Ban\'etsu West Line ไป Inawashiro + บัส ~30 นาที (¥790)', url: 'https://www.fukushima.travel/destination/goshiki-numa-ponds/13' },
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
  { name: 'Fukushima Travel (ทางการจังหวัด)', url: 'https://fukushima.travel/' },
  { name: 'Fukushima Travel — Festival Guide 2026', url: 'https://fukushima.travel/blogs/the-guide-to-every-fukushima-festival-in-2026/169' },
  { name: 'Fukushima Travel — ใบไม้เปลี่ยนสี 10 อันดับ', url: 'https://fukushima.travel/blogs/top-10-places-to-see-autumn-leaves-in-fukushima/87' },
  { name: 'We Love Fukushima', url: 'https://welovefukushima.com/' },
  { name: 'Fukushima City Guide (f-kankou ทางการเมือง)', url: 'https://www.f-kankou.jp/en/' },
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
    note: 'พัก 2 คืนรวด 20-22 ต.ค. — 20 ต.ค. ถึงเย็นหลังนัดข้าวกับญาติที่โตเกียว (ต้องเช็คอินเองได้ตอนค่ำ) · กระเป๋าส่งล่วงหน้าแบบ same-day delivery จากสนามบินควรถึงก่อนหรือใกล้เคียงเวลาเช็คอิน · 21 ต.ค. เป็นเดย์ทริป Nikko ไป-กลับ ไม่ต้องย้ายที่พัก · 22 ต.ค. เช้าเที่ยว Oya แล้วบ่ายขึ้นชินคันเซ็นไป Fukushima ขอให้อยู่ฝั่งเดียวกับสถานีและมีที่ฝากกระเป๋า',
    en: { city: 'Utsunomiya', station: 'JR Utsunomiya Sta. (shinkansen + JR Nikko Line)', note: 'Two nights (20-22 Oct) — arriving in the evening of day 1 after a Tokyo lunch with relatives, self check-in matters; luggage sent ahead as same-day delivery from the airport should land around check-in time. 21 Oct is a Nikko day trip and back · on 22 Oct we check out and take the afternoon shinkansen to Fukushima, so stay on the station side' },
  },
  {
    id: 'fukushima', city: 'Fukushima', ja: '福島', area: 'fukushima',
    checkIn: '2026-10-22', checkOut: '2026-10-25', nights: 3, days: 'DAY 3–5',
    station: 'JR Fukushima Sta. — บัสขึ้นเขาออกฝั่ง West Exit 08:30',
    searchQuery: 'Fukushima Station, Fukushima, Japan',
    lat: 37.7543, lng: 140.4590,
    pick: { label: 'ลิสต์ที่ wishlist ไว้', url: 'https://th.airbnb.com/rooms/1500308318751323061?adults=4&children=0&infants=0&pets=0&check_in=2026-10-22&check_out=2026-10-25' },
    note: 'อยู่ 4 วัน 3 คืน แบบ ครึ่งวัน–เต็มวัน–เต็มวัน–ครึ่งวัน · เข้าพักบ่าย 22 ต.ค. · คืนที่สำคัญสุดคือคืนศุกร์ เพราะเช้าเสาร์ต้องออกก่อน 08:15 ให้ทัน Sky Access ที่ West Exit · เช้าอาทิตย์เช็คเอาท์แล้วขึ้นชินคันเซ็น 13:20 ถึงโตเกียวบ่าย 3',
    en: { city: 'Fukushima', station: 'JR Fukushima Sta. — mountain bus leaves the West Exit at 08:30', note: 'The most important location of the trip: on hiking day we must leave by 08:15 to catch Sky Access at the West Exit' },
  },
  {
    id: 'tokyo', city: 'Tokyo', ja: '東京', area: 'tokyo',
    checkIn: '2026-10-25', checkOut: '2026-10-28', nights: 3, days: 'DAY 6–8',
    station: 'ย่าน Shinjuku และโดยรอบ — ดู 4 ตัวเลือกด้านล่าง',
    searchQuery: 'Shinjuku City, Tokyo, Japan',
    lat: 35.6896, lng: 139.7006,
    note: 'ยังไม่มีลิสต์ที่เลือกไว้ — กดลิงก์ค้นหาที่กรองไว้แล้ว (4 คน · 25–28 ต.ค. · ห้องน้ำ 1+ · ทั้งหลัง) แล้วกรอกราคา/ลิงก์กลับมา · 25–28 ต.ค. เป็น อา.–พ. ซึ่งเป็นวันธรรมดาเกือบหมด ให้ดูกล่องเตือน minpaku ก่อนจอง',
    en: { city: 'Tokyo', station: 'Several districts work — see the options below', note: 'No listing picked yet — use the pre-filtered search links (4 guests · 25–28 Oct · 1+ bathroom · entire place), then paste the price and link back here' },
    /* ย่านที่แนะนำ: ต้องรับชินคันเซ็นจาก Fukushima + ไปสนามบินวันสุดท้าย + ตรงกับแผน Day 7-9 */
    candidates: [
      { name: 'Shinjuku (ฝั่งตะวันตก / Nishi-Shinjuku)', ja: '西新宿', lat: 35.6896, lng: 139.6917, query: 'Nishi-Shinjuku, Shinjuku City, Tokyo, Japan',
        why: 'N\'EX ไป Narita ขึ้นที่ Shinjuku ได้ตรง + Day 8 จบที่ Shinjuku พอดี · โซนตึกสูงเป็นพื้นที่พาณิชย์ ทำให้มีห้องแบบ apart-hotel ที่ไม่ติดข้อจำกัด minpaku มากกว่าโซนบ้านพักอาศัย',
        whyEn: "N'EX to Narita departs Shinjuku, Day 8 ends here, and the high-rise side is commercially zoned so more listings are licensed hotels rather than day-capped minpaku" },
      { name: 'Shin-Okubo / Okubo', ja: '新大久保・大久保', lat: 35.7013, lng: 139.7000, query: 'Okubo, Shinjuku City, Tokyo, Japan',
        why: 'เดินถึง Shinjuku ได้ ราคาถูกกว่าฝั่งสถานีหลักชัดเจน · ย่านเกาหลี ร้านอาหารเปิดดึก ซูเปอร์เยอะ เหมาะกับกลับดึกจากทริป',
        whyEn: 'Walkable to Shinjuku but clearly cheaper, with Korean-town restaurants open late and plenty of supermarkets' },
      { name: 'Yoyogi / Sendagaya', ja: '代々木・千駄ヶ谷', lat: 35.6836, lng: 139.7020, query: 'Yoyogi, Shibuya City, Tokyo, Japan',
        why: 'สถานีถัดจาก Shinjuku สาย Yamanote/Chuo ครบเหมือนกัน แต่เงียบกว่ามาก · เดินไป Shinjuku Gyoen และ Meiji Jingu (Day 8) ได้',
        whyEn: 'One stop from Shinjuku with the same Yamanote/Chuo access but far quieter; walking distance to Shinjuku Gyoen and Meiji Jingu' },
      { name: 'Nakano', ja: '中野', lat: 35.7057, lng: 139.6659, query: 'Nakano City, Tokyo, Japan',
        why: 'Chuo Line 5 นาทีถึง Shinjuku · ห้องใหญ่ราคาถูกที่สุดในกลุ่มนี้ + ถนนคนเดิน Nakano Broadway · คนละเขตปกครองกับ Shinjuku จึงกฎ minpaku ต่างกัน',
        whyEn: 'Five minutes to Shinjuku on the Chuo Line, biggest rooms for the money here, plus Nakano Broadway — and a different ward, so different minpaku rules' },
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
      day: { utsunomiya: 1 }[s.id] || 3, type: 'stay', stayId: s.id, url: s.pick && s.pick.url,
      desc: `🛏 ${s.nights} คืน · ${s.checkIn} → ${s.checkOut} · 4 คน — ${s.station} · หมุดปักที่สถานี ไม่ใช่ตำแหน่งบ้านจริง`,
      en: { name: `${s.en.city} stay`, desc: `🛏 ${s.nights} nights · ${s.checkIn} → ${s.checkOut} · 4 guests — ${s.en.station} · pin is on the station, not the actual listing address` },
    });
  }
});


/* ---------- บริษัทเช่ารถรอบสถานี Fukushima ----------
   พิกัดเป็นตำแหน่งโดยประมาณจากคำอธิบายทางเดินของแต่ละสาขา (เว็บบริษัทเปิดตรงจาก sandbox ไม่ได้)
   ราคาเป็นช่วงอ้างอิงจากข้อมูลรวมของเว็บจอง — ต้องกดเข้าไปเช็คราคาจริงตามวันที่ */
const CAR_RENTALS = [
  { name: 'Toyota Rent a Car — สาขาฝั่งชินคันเซ็น (西口)', ja: 'トヨタレンタカー 福島駅新幹線口店',
    lat: 37.7546, lng: 140.4570, walk: 'เดิน 1 นาทีจากทางออกฝั่งตะวันตก (ชินคันเซ็น)',
    url: 'https://rent.toyota.co.jp/eng/', book: 'จองภาษาอังกฤษได้ที่เว็บ Toyota EN',
    note: 'ใกล้ชานชาลาชินคันเซ็นที่สุด — สะดวกถ้ารับรถทันทีที่ลงจากรถไฟ · รถใหม่ ระบบภาษาอังกฤษในรถมีเกือบทุกคัน' },
  { name: 'Toyota Rent a Car — สาขาหน้าสถานี (東口)', ja: 'トヨタレンタカー 福島駅前店',
    lat: 37.7560, lng: 140.4605, walk: 'เดินขึ้นเหนือ ~3 นาทีจากทางออกฝั่งตะวันออก',
    url: 'https://rent.toyota.co.jp/eng/', book: 'จองภาษาอังกฤษได้ที่เว็บ Toyota EN',
    note: 'สาขาสำรองของ Toyota ถ้าสาขาชินคันเซ็นรถเต็ม' },
  { name: 'Nippon Rent-A-Car — ฝั่งตะวันออก', ja: 'ニッポンレンタカー 福島駅東口',
    lat: 37.7525, lng: 140.4620, walk: 'เดิน 1 นาทีจากทางออกฝั่งตะวันออก',
    url: 'https://www.nipponrentacar.co.jp/en/', book: 'เว็บภาษาอังกฤษของ Nippon',
    note: '⚠️ ย้ายที่ตั้งเมื่อ เม.ย. 2025 ไปที่ 置賜町 1-4 — เช็คแผนที่ในใบจองอีกครั้งก่อนไป' },
  { name: 'ORIX Rent-A-Car — ฝั่งตะวันตก', ja: 'オリックスレンタカー 福島駅西口店',
    lat: 37.7535, lng: 140.4570, walk: 'เดิน 3 นาทีจากทางออกฝั่งตะวันตก',
    url: 'https://car.orix.co.jp/eng/', book: 'เว็บภาษาอังกฤษของ ORIX',
    note: 'มักเป็นเจ้าที่ราคาถูกสุดในฟุกุชิมะจากข้อมูลเว็บเปรียบเทียบ' },
  { name: 'Ekiren (JR East) — ฝั่งตะวันตก', ja: '駅レンタカー 福島駅営業所',
    lat: 37.7538, lng: 140.4577, walk: 'ออกประตูฝั่งตะวันตกแล้วเลี้ยวขวา ~80 ม. · เปิด 08:00–19:00',
    url: 'https://www.ekiren.co.jp/', book: 'เว็บ Ekiren (ญี่ปุ่น) — จองคู่กับตั๋ว JR ได้',
    note: 'ของ JR East เอง อยู่ติดสถานีที่สุด · เว็บเป็นภาษาญี่ปุ่นเป็นหลัก' },
];

/* เว็บเปรียบเทียบราคา/จองรวมหลายเจ้า */
const CAR_BOOKING_SITES = [
  { name: 'Klook — รถเช่าฟุกุชิมะ (ไทย/อังกฤษ จ่ายบัตรได้)', url: 'https://www.klook.com/en-US/car-rentals/city/18085-fukushima-car-rentals/' },
  { name: 'ToCoo! — เจ้าที่นักท่องเที่ยวต่างชาติใช้เยอะ', url: 'https://www2.tocoo.jp/en/' },
  { name: 'Rakuten Travel — รถเช่ารอบสถานี Fukushima (ญี่ปุ่น)', url: 'https://cars.travel.rakuten.co.jp/cars/station/fukushima/79697.html' },
  { name: 'Web-Rentacar — รวมสาขาแถวสถานี Fukushima (อังกฤษ)', url: 'https://www.web-rentacar.com/en/area/station/ST0336' },
  { name: 'KAYAK — เทียบราคารถเช่าจังหวัดฟุกุชิมะ', url: 'https://www.kayak.com/Fukushima-Prefecture-Japan-Car-Rentals.1754.crr.html' },
];

/* หมุดร้านเช่ารถบนแผนที่ */
CAR_RENTALS.forEach((r) => PLACES.push({
  name: r.name, ja: r.ja, area: 'fukushima', lat: r.lat, lng: r.lng, day: 4, type: 'car',
  url: r.url, ticket: r.walk,
  desc: `🚗 จุดรับรถสำหรับวันทะเลสาบ/วันเดินเขา — ${r.note} · หมุดโดยประมาณจากคำอธิบายทางเดินของสาขา`,
  en: { name: r.ja, ticket: r.walk, desc: '🚗 Pick-up point for the lakes and hiking days · pin position approximated from the branch\'s walking directions' },
}));

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
