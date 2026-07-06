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

/* Wikimedia Commons file name → hotlinkable thumbnail URL */
function commonsImg(file, width) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width || 480}`;
}

/* ---------- itinerary (default — user can edit/reset in the app) ---------- */
const DEFAULT_ITINERARY = [
  { day: 1, date: 'อ. 20 ต.ค.', area: 'tokyo', title: 'ถึงโตเกียวตอนเช้า', items: [
    'ถึงสนามบิน → เข้าเมือง (N\'EX / Skyliner)', 'ฝากกระเป๋า/เช็คอินโรงแรม', 'Asakusa — วัด Sensoji + ถนน Nakamise', 'Ueno Park / Ameyoko + แวะ Gallery of Hōryū-ji Treasures (Taniguchi)', 'เย็น: Akihabara' ] },
  { day: 2, date: 'พ. 21 ต.ค.', area: 'tokyo', title: 'โตเกียวฝั่งตะวันตก', items: [
    'ศาลเจ้า Meiji Jingu', 'Harajuku — Takeshita St.', 'Shibuya — แยกไฟแดง + Shibuya Sky', 'เย็น: Shinjuku (Omoide Yokocho)' ] },
  { day: 3, date: 'พฤ. 22 ต.ค.', area: 'tochigi', title: 'Tokyo → Utsunomiya (โทจิกิ)', items: [
    'ชินคันเซ็นเช้า ~50 นาที', 'Oya History Museum (เหมืองหินใต้ดิน)', 'ศาลเจ้า Utsunomiya Futaarayama', 'Tochigi Prefectural Museum of Fine Arts (คอลเลกชัน Meissen)', 'เย็น: ตะลุยเกี๊ยวซ่า — เมืองหลวงเกี๊ยวซ่าของญี่ปุ่น' ] },
  { day: 4, date: 'ศ. 23 ต.ค.', area: 'nikko', title: 'Utsunomiya → Nikko (มรดกโลก)', items: [
    'JR Nikko Line ~45 นาที', 'ศาลเจ้า Toshogu + Rinnoji', 'สะพานแดง Shinkyo', 'Kanmangafuchi Abyss (แถวจิโซ)' ] },
  { day: 5, date: 'ส. 24 ต.ค.', area: 'nikko', title: 'Nikko — ใบไม้แดงพีค 🍁', items: [
    'ขึ้นบัสผ่านโค้ง Irohazaka (48 โค้ง)', 'Akechidaira Ropeway — จุดชมวิว', 'น้ำตก Kegon + ทะเลสาบ Chuzenji', 'น้ำตก Ryuzu ตอนเย็นแสงสวย' ] },
  { day: 6, date: 'อา. 25 ต.ค.', area: 'fukushima', title: 'Nikko → Fukushima', items: [
    'กลับ Utsunomiya → ชินคันเซ็นไป Fukushima', 'เช็คอิน + ซื้อเสบียงวันเดินเขา (เซเว่นหน้าสถานี)', 'บ่าย: Hanamiyama Park หรือ Fukushima Prefectural Museum of Art', 'เย็น: แช่ออนเซ็น Iizaka Onsen' ] },
  { day: 7, date: 'จ. 26 ต.ค.', area: 'fukushima', title: '⛰ เดินเขา Mt. Issaikyo', items: [
    '08:30 บัส Sky Access จากสถานี', 'Jododaira → ยอด Issaikyo (1,949 ม.)', 'วิว「ดวงตาแม่มด」Goshikinuma', 'Azuma-Kofuji → กลับถึงเมือง 17:00 → ออนเซ็น' ] },
  { day: 8, date: 'อ. 27 ต.ค.', area: 'tokyo', title: 'Fukushima → Tokyo — วันช้อปปิ้ง', items: [
    'ชินคันเซ็นเช้า ~95 นาที', 'Shinjuku / Ginza — เก็บลิสต์ของซื้อ + แวะดูอาคาร GINZA SIX', 'Don Quijote + drugstore', 'เย็น: มื้อส่งท้าย' ] },
  { day: 9, date: 'พ. 28 ต.ค.', area: 'tokyo', title: 'เดินทางกลับ ✈ 17:00', items: [
    'เช้า (ถ้ามีแรง): Tokyo Sea Life Park ที่ Kasai (Taniguchi ออกแบบ)', 'ไม่งั้นเก็บตกของซื้อ / คาเฟ่แทน', '~13:30 ออกจากโรงแรมไปสนามบิน', 'ถึงสนามบินก่อน 15:00 · บินกลับ 17:00' ] },
];

/* ---------- map places ---------- */
const PLACES = [
  // Tokyo
  { name: 'วัด Sensoji (Asakusa)', ja: '浅草寺', area: 'tokyo', lat: 35.7148, lng: 139.7967, day: 1, desc: 'วัดเก่าแก่ที่สุดในโตเกียว + ถนนช้อป Nakamise' },
  { name: 'Ueno Park / Ameyoko', ja: '上野公園', area: 'tokyo', lat: 35.7141, lng: 139.7745, day: 1, desc: 'สวน+พิพิธภัณฑ์ ตลาด Ameyoko ของกินเพียบ' },
  { name: 'Gallery of Hōryū-ji Treasures', ja: '法隆寺宝物館', area: 'tokyo', lat: 35.7186, lng: 139.7758, day: 1, type: 'museum', taniguchi: true, img: commonsImg('Tokyo_National_Museum_Gallery_of_Horyuji_Treasures_P5163920.jpg'), ticket: 'รวมในตั๋ว Tokyo National Museum (ผู้ใหญ่ ~¥1,000)', url: 'https://www.tnm.jp/modules/r_free_page/index.php?id=119', desc: '🏛 งานออกแบบของ Yoshio Taniguchi (1999) ในเขต Tokyo National Museum — กล่องหินเรียบคู่ล็อบบี้กระจก ในกรอบสเตนเลส เดินจากประตู Ueno Park อีกไม่กี่นาที' },
  { name: 'National Museum of Western Art', ja: '国立西洋美術館', area: 'tokyo', lat: 35.7156, lng: 139.7745, day: 1, type: 'museum', img: commonsImg("Le_musée_national_d'art_occidental_conçu_par_Le_Corbusier_(Tokyo)_(41659392274).jpg"), ticket: 'คอลเลกชันถาวรฟรี · นิทรรศการพิเศษมีค่าใช้จ่ายแยก', url: 'https://www.nmwa.go.jp/', desc: '🏛 ตึกเดียวของ Le Corbusier ในญี่ปุ่น — ขึ้นทะเบียนมรดกโลก UNESCO 2016 ทางเข้าแบบ pilotis + ทางลาดวนชมงานสไตล์เฉพาะตัว อยู่ในคลัสเตอร์ Ueno เดียวกัน' },
  { name: 'Sumida Hokusai Museum', ja: 'すみだ北斎美術館', area: 'tokyo', lat: 35.6960, lng: 139.7960, day: 1, type: 'museum', img: commonsImg('2020_Sumida_Hokusai_Museum_02.jpg'), ticket: 'เช็คราคาที่เว็บ (มีทั้งคอลเลกชันถาวร+นิทรรศการพิเศษ)', url: 'https://hokusai-museum.jp/', desc: '🏛 ออกแบบโดย Sejima Kazuyo (SANAA) ผนังอะลูมิเนียมกระจกสะท้อนบริบทรอบข้าง — เดินจาก Ryogoku Sta. 5 นาที ห่างจาก Asakusa ข้ามแม่น้ำนิดเดียว รวมงานอุกิโยเอะของโฮคุไซ' },
  { name: 'Akihabara', ja: '秋葉原', area: 'tokyo', lat: 35.6984, lng: 139.7731, day: 1, desc: 'ย่านเครื่องใช้ไฟฟ้า อนิเมะ เกม' },
  { name: 'ศาลเจ้า Meiji Jingu', ja: '明治神宮', area: 'tokyo', lat: 35.6764, lng: 139.6993, day: 2, desc: 'ศาลเจ้าใหญ่กลางป่าในเมือง ติด Harajuku' },
  { name: 'Nezu Museum', ja: '根津美術館', area: 'tokyo', lat: 35.6654, lng: 139.7188, day: 2, type: 'museum', ticket: 'เช็คราคาที่เว็บ (แพงกว่าพิพิธภัณฑ์รัฐ เพราะเป็นเอกชน)', url: 'https://www.nezu-muse.or.jp/', desc: '🏛 ออกแบบโดย Kengo Kuma (2009) — สวนญี่ปุ่นสวยเงียบสงบกลาง Omotesando คอลเลกชันโบราณวัตถุเอเชีย มีสมบัติชาติ 7 ชิ้น เดิน 8 นาทีจากสถานี Omotesando' },
  { name: 'Shibuya Crossing + Sky', ja: '渋谷', area: 'tokyo', lat: 35.6595, lng: 139.7005, day: 2, desc: 'แยกไฟแดงที่พลุกพล่านที่สุดในโลก + จุดชมวิว Shibuya Sky' },
  { name: 'Shinjuku', ja: '新宿', area: 'tokyo', lat: 35.6896, lng: 139.7006, day: 2, desc: 'Omoide Yokocho, Kabukicho, ช้อปปิ้งยักษ์' },
  { name: 'Ginza', ja: '銀座', area: 'tokyo', lat: 35.6717, lng: 139.7650, day: 8, desc: 'ย่านช้อปไฮเอนด์ + Uniqlo 12 ชั้น, Itoya' },
  { name: 'GINZA SIX', ja: 'ギンザシックス', area: 'tokyo', lat: 35.6699, lng: 139.7638, day: 8, taniguchi: true, img: commonsImg('GINZA_SIX_Office_Building.jpg'), ticket: 'ฟรี (เดินชมอาคาร+สวนดาดฟ้าได้ไม่มีค่าใช้จ่าย)', url: 'https://ginza6.tokyo/', desc: '🏛 ภายนอกอาคารออกแบบโดย Taniguchi (ร่วมกับ Kajima Design, 2017) — ชายคาสเตนเลสรอบชั้นออฟฟิศ + สวนดาดฟ้า อยู่ในย่าน Ginza ที่จะไปช้อปอยู่แล้ว' },
  { name: '21_21 DESIGN SIGHT', ja: '21_21 デザインサイト', area: 'tokyo', lat: 35.6640, lng: 139.7301, day: 8, type: 'museum', img: commonsImg('21_21_DESIGN_SIGHT.jpg'), ticket: 'เช็คราคาที่เว็บ (เปลี่ยนตามนิทรรศการ)', url: 'https://2121designsight.jp/', desc: '🏛 ออกแบบโดย Tadao Ando (2007) — หลังคาเหล็กแผ่นเดียวพับตามแนวคิด "ผ้าหนึ่งผืน" ของ Issey Miyake ส่วนใหญ่ฝังอยู่ใต้ดิน ใน Tokyo Midtown, Roppongi (นอกเส้นทางหลัก แต่คุ้มถ้าชอบงานสถาปัตย์)' },
  { name: 'Tokyo Metropolitan Teien Art Museum', ja: '東京都庭園美術館', area: 'tokyo', lat: 35.6350, lng: 139.7168, day: 8, type: 'museum', img: commonsImg('Tokyo_Metropolitan_Teien_Art_Museum.jpg'), ticket: 'เช็คราคาที่เว็บ (เปลี่ยนตามนิทรรศการ + ค่าเข้าสวนแยก)', url: 'https://www.teien-art-museum.ne.jp/en/', desc: '🏛 อดีตวังเจ้าชาย Asaka สไตล์ Art Deco แท้ๆ จากฝรั่งเศส (1933) ทั้งหลังคือมรดกวัฒนธรรมสำคัญ — เดิน 6-7 นาทีจากสถานี Meguro/Shirokanedai' },
  { name: 'Don Quijote Shinjuku', ja: 'ドン・キホーテ', area: 'tokyo', lat: 35.6944, lng: 139.7016, day: 8, desc: 'แหล่งกวาดของฝาก เปิดดึก อย่าลืมพาสปอร์ต (tax-free)' },
  { name: 'Tokyo Sea Life Park (Kasai)', ja: '葛西臨海水族園', area: 'tokyo', lat: 35.6423, lng: 139.8607, day: 9, type: 'museum', taniguchi: true, img: commonsImg('Tokyo_Sea_Life_Park_Edogawa-ward_Tokyo_Japan.JPG'), ticket: 'เช็คราคาปัจจุบันที่เว็บ (ผู้ใหญ่ประมาณ ¥700)', url: 'https://www.tokyo-zoo.net/', desc: '🏛 อควาเรียมออกแบบโดย Taniguchi (1989, รางวัล Mainichi Art Award) — จากสถานีโตเกียวนั่ง JR Keiyo Line ~15 นาที ในสวนเดียวกันมีงาน Taniguchi อีก 2 หลัง เหมาะเป็นช่วงเช้าก่อนไปสนามบินวันสุดท้าย (เปิด 9:30)' },
  { name: 'Kasai Rinkai Park Visitor Center', ja: '葛西臨海公園ビジターセンター', area: 'tokyo', lat: 35.6438, lng: 139.8580, day: 9, type: 'museum', taniguchi: true, ticket: 'ฟรี', url: 'https://www.tokyo-park.or.jp/park/kasairinkai/', desc: '🏛 อีกหนึ่งงานของ Taniguchi ในสวนเดียวกัน (1996) — จุดชมนกและธรรมชาติ เข้าฟรี เดินต่อจากอควาเรียมได้เลย (รวมเป็น 3 อาคารของ Taniguchi ในสวนนี้)' },
  // Tochigi
  { name: 'สถานี Utsunomiya', ja: '宇都宮駅', area: 'tochigi', lat: 36.5591, lng: 139.8986, day: 3, desc: 'ฮับของโทจิกิ — จุดต่อรถไป Nikko' },
  { name: 'Oya History Museum', ja: '大谷資料館', area: 'tochigi', lat: 36.6009, lng: 139.8228, day: 3, desc: 'เหมืองหินใต้ดินสุดอลัง เย็น 8°C พกเสื้อคลุม' },
  { name: 'ถนนเกี๊ยวซ่า (Kirasse)', ja: '宇都宮餃子', area: 'tochigi', lat: 36.5583, lng: 139.8830, day: 3, desc: 'เมืองหลวงเกี๊ยวซ่า — ร้าน Minmin, Masashi ห้ามพลาด' },
  { name: 'ศาลเจ้า Futaarayama', ja: '二荒山神社', area: 'tochigi', lat: 36.5658, lng: 139.8823, day: 3, desc: 'ศาลเจ้าเก่าแก่ใจกลางเมือง Utsunomiya' },
  { name: 'Tochigi Prefectural Museum of Fine Arts', ja: '栃木県立美術館', area: 'tochigi', lat: 36.5486, lng: 139.8890, day: 3, type: 'museum', img: commonsImg('Tochigi_Prefectural_Museum_of_Fine_Arts.jpg'), ticket: 'คอลเลกชัน ¥260 · นิทรรศการพิเศษแยก', url: 'https://www.art.pref.tochigi.lg.jp/', desc: 'คอลเลกชันเครื่องเคลือบ Meissen ระดับแนวหน้าของญี่ปุ่น + งานศิลปะยุโรป/ญี่ปุ่นสมัยใหม่ — บัส 15 นาทีจากฝั่งตะวันตกสถานี Utsunomiya' },
  { name: 'Utsunomiya Museum of Art', ja: '宇都宮美術館', area: 'tochigi', lat: 36.5730, lng: 139.8420, day: 3, type: 'museum', img: commonsImg('Utsunomiya_museum.jpg'), ticket: 'เช็คราคาที่เว็บ (คอลเลกชันถาวรราคาย่อมเยา)', url: 'https://u-moa.jp/', desc: 'อาคารชั้นเดียวกลมกลืนกับป่า ใน Bunka no Mori Park — งาน Magritte, Chagall และคอลเลกชันดีไซน์ บัส ~25 นาทีจากฝั่งตะวันตกสถานี Utsunomiya' },
  { name: 'Mashiko Museum of Ceramic Art', ja: '益子陶芸美術館', area: 'tochigi', lat: 36.4550, lng: 140.1080, day: 3, type: 'museum', img: commonsImg('Mashiko_Museum_of_Ceramic_Art.JPG'), ticket: 'เช็คราคาที่เว็บ', url: 'https://www.mashiko-museum.jp/', desc: 'เมืองเครื่องปั้นดินเผามาชิโกะ งานของช่างระดับ Living National Treasure Hamada Shoji + เตาเผาโบราณ — บัส ~60 นาทีจากสถานี Utsunomiya (ไกลหน่อย เผื่อเวลาครึ่งวัน)' },
  // Nikko
  { name: 'ศาลเจ้า Toshogu', ja: '日光東照宮', area: 'nikko', lat: 36.7581, lng: 139.5986, day: 4, desc: 'มรดกโลก สุสานโชกุน Tokugawa Ieyasu — แกะสลักแมวหลับ/ลิงสามตัว' },
  { name: 'Nikko Toshogu Museum (Treasure Hall)', ja: '日光東照宮宝物館', area: 'nikko', lat: 36.7583, lng: 139.5990, day: 4, type: 'museum', img: commonsImg('Nikko_toshogu_yomeimon_gate_ver1.jpg'), ticket: '¥1,000 (แยกจากตั๋วศาลเจ้าหลัก)', url: 'https://www.toshogu.jp/shisetsu/houmotsu.html', desc: 'เปิดปี 2015 ฉลอง 400 ปี Toshogu — ดาบและเครื่องรบของ Ieyasu, โรงหนัง VR เล่าเรื่องประตู Yomeimon เข้าใจง่ายแม้ไม่รู้ประวัติศาสตร์มาก่อน อยู่ในคอมเพล็กซ์เดียวกับศาลเจ้า' },
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
  { name: 'Fukushima Prefectural Museum of Art', ja: '福島県立美術館', area: 'fukushima', lat: 37.7602, lng: 140.4649, day: 6, type: 'museum', img: commonsImg('Fukushima_Prefectural_Museum_of_Art_ac.jpg'), ticket: 'คอลเลกชันถาวรมักฟรี/ราคาย่อมเยา · เช็คนิทรรศการพิเศษที่เว็บ', url: 'https://art-museum.fcs.ed.jp/', desc: 'งาน Andrew Wyeth + ภาพพิมพ์ไซโตะ คิโยชิ ตั้งในสวนกว้างริมลำธาร — ลง Iizaka Line ที่ป้าย "美術館図書館前" เดิน 2 นาที (ไลน์เดียวกับที่จะไป Iizaka Onsen พอดี)' },
  { name: 'Iizaka Onsen', ja: '飯坂温泉', area: 'fukushima', lat: 37.8259, lng: 140.4478, day: 6, desc: 'เมืองออนเซ็นเก่าแก่ ห่างสถานี Fukushima ~25 นาที (รถไฟ Iizaka Line)' },
  { name: 'Hanamiyama Park', ja: '花見山公園', area: 'fukushima', lat: 37.7269, lng: 140.5090, day: 6, desc: 'สวนบนเนินเขา วิวเมือง+ภูเขา (ดังช่วงซากุระ แต่ฤดูใบไม้ร่วงก็สวย)' },
  // Other Taniguchi works in Japan — far from this route, reference only (from architecture-history.org)
  { name: 'Ken Domon Museum of Photography', ja: '土門拳記念館', area: 'other', lat: 38.906, lng: 139.845, day: null, type: 'museum', taniguchi: true, ticket: 'เช็คราคาที่เว็บ', url: 'http://www.domonken-kinenkan.jp/', desc: '🏛 Sakata, Yamagata (1983) — ผลงานที่ Taniguchi ได้รางวัล Japan Art Academy Prize ถือเป็นงานที่คนรัก Taniguchi ยกย่องสุด แต่ไกลมาก (~4 ชม.จากโตเกียว ผ่าน Niigata) เหมาะเป็นทริปแยกต่างหาก' },
  { name: 'D.T. Suzuki Museum', ja: '鈴木大拙館', area: 'other', lat: 36.560, lng: 136.663, day: null, type: 'museum', taniguchi: true, ticket: '¥310', url: 'https://www.kanazawa-museum.jp/daisetz/', desc: '🏛 Kanazawa (2011) — 3 ห้อง 3 สวนเชื่อมด้วยทางเดิน จบด้วย "Water Mirror Garden" เงียบสงบมาก ไป Hokuriku Shinkansen จากโตเกียว ~2.5 ชม.' },
  { name: 'Taniguchi Yoshiro/Yoshio Museum of Architecture', ja: '谷口吉郎・吉生記念金沢建築館', area: 'other', lat: 36.5615, lng: 136.6605, day: null, type: 'museum', taniguchi: true, ticket: '¥310', url: 'https://www.kanazawa-museum.jp/architecture/', desc: '🏛 Kanazawa (2019) — พิพิธภัณฑ์เกี่ยวกับตัว Taniguchi เองกับพ่อ (Yoshiro) โดยเฉพาะ อยู่เมืองเดียวกับ D.T. Suzuki Museum ไปคู่กันได้' },
  { name: 'Kyoto National Museum — Heisei Chishinkan', ja: '京都国立博物館 平成知新館', area: 'other', lat: 34.9916, lng: 135.7717, day: null, type: 'museum', taniguchi: true, ticket: '¥700', url: 'https://www.kyohaku.go.jp/', desc: '🏛 Kyoto (2014) — งานปลายทางของ Taniguchi ในสายพิพิธภัณฑ์แห่งชาติ ไป Tokaido Shinkansen จากโตเกียว ~2.5 ชม.' },
  { name: 'Toyota Municipal Museum of Art', ja: '豊田市美術館', area: 'other', lat: 35.083, lng: 137.156, day: null, type: 'museum', taniguchi: true, img: commonsImg('Toyota_Municipal_Museum_of_Art,_Kozakahon-machi_Toyota_2012.JPG'), ticket: 'เช็คราคาที่เว็บ', url: 'https://www.museum.toyota.aichi.jp/', desc: '🏛 Toyota, Aichi (1995) — หลายคนยกให้เป็นงานที่ "สมบูรณ์แบบที่สุด" ของ Taniguchi เส้นแนวนอน/ตั้งฉาก + แสงธรรมชาติ ใกล้นาโกย่า' },
  { name: 'MIMOCA (Marugame Genichiro-Inokuma Museum)', ja: '丸亀市猪熊弦一郎現代美術館', area: 'other', lat: 34.290, lng: 133.798, day: null, type: 'museum', taniguchi: true, ticket: '¥300', url: 'https://www.mimoca.jp/en/', desc: '🏛 Marugame, Kagawa (1991) — ติดหน้าสถานีรถไฟพอดี บนเกาะชิโกกุ ไกลมาก ต้องนั่งชินคันเซ็น+รถไฟท้องถิ่นต่อหลายทอด' },
  { name: 'Higashiyama Kaii Gallery (Nagano)', ja: '長野県信濃美術館 東山魁夷館', area: 'other', lat: 36.667, lng: 138.194, day: null, type: 'museum', taniguchi: true, ticket: 'เช็คราคาที่เว็บ', url: 'https://www.npsam.com/', desc: '🏛 Nagano City (1990) — แกลเลอรีรวมงานจิตรกร Higashiyama Kaii ไป Hokuriku Shinkansen จากโตเกียว ~90 นาที' },
  { name: 'Higashiyama Kaii Setouchi Museum (Kagawa)', ja: '香川県立東山魁夷せとうち美術館', area: 'other', lat: 34.35, lng: 133.85, day: null, type: 'museum', taniguchi: true, ticket: '¥310', url: 'https://www.pref.kagawa.lg.jp/higasiyamakaii/', desc: '🏛 Sakaide, Kagawa (2005) — แกลเลอรีที่สองของ Higashiyama Kaii โดย Taniguchi วิวสะพานเซโตะโอฮาชิ อยู่บนเกาะชิโกกุ' },
  { name: 'Shiseido Art House', ja: '資生堂アートハウス', area: 'other', lat: 34.79, lng: 138.05, day: null, type: 'museum', taniguchi: true, ticket: 'ฟรี — แต่⚠️ปิดถาวร มิ.ย. 2026 (ก่อนทริปนี้)', url: 'https://corp.shiseido.com/art-house/jp/', desc: '🏛 Kakegawa, Shizuoka (1978) — ผลงานที่ทำให้ Taniguchi ได้รางวัลสถาปัตยกรรมใหญ่ครั้งแรก แต่จะปิดถาวรปลายเดือน มิ.ย. 2026 ก่อนทริปนี้จะเริ่ม — ไปไม่ทันแล้ว' },
  { name: 'IBM Makuhari Building', ja: 'IBM幕張ビル', area: 'other', lat: 35.648, lng: 140.034, day: null, taniguchi: true, ticket: 'อาคารสำนักงานเอกชน ไม่เปิดให้เข้าชมด้านใน', url: '', desc: '🏛 Chiba (1991) — อาคารสำนักงาน IBM ชมได้แค่ภายนอก ไม่ใช่พิพิธภัณฑ์' },
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
