/* ============================================================
   TripSync — optional Firestore sync layer.
   Falls back to silent no-op (localStorage-only) if
   js/firebase-config.js still has placeholder values.
   ============================================================ */

const TripSync = (() => {
  let docRef = null;
  let pushTimer = null;
  let applyRemote = null;
  let configured = false;

  function badge() { return document.getElementById('sync-status'); }

  function setStatus(text, cls) {
    const el = badge();
    if (!el) return;
    el.textContent = text;
    el.className = 'sync-status ' + cls;
  }

  function isConfigured() {
    return typeof FIREBASE_CONFIG !== 'undefined'
      && FIREBASE_CONFIG.apiKey
      && !FIREBASE_CONFIG.apiKey.startsWith('YOUR_');
  }

  function init(onRemoteUpdate) {
    applyRemote = onRemoteUpdate;

    if (!isConfigured()) {
      setStatus('🔒 ยังไม่เชื่อมซิงค์ (บันทึกในเครื่องนี้เท่านั้น)', 'offline');
      return;
    }
    if (typeof firebase === 'undefined') {
      setStatus('⚠ โหลด Firebase SDK ไม่สำเร็จ', 'error');
      return;
    }

    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      const db = firebase.firestore();
      setStatus('🔄 กำลังเชื่อมต่อ...', 'syncing');

      firebase.auth().signInAnonymously().catch(() => {
        setStatus('⚠ เข้าสู่ระบบไม่สำเร็จ', 'error');
      });

      firebase.auth().onAuthStateChanged((user) => {
        if (!user) return;
        docRef = db.collection('trips').doc(FIREBASE_CONFIG.tripId || 'japan-oct-2026');
        docRef.onSnapshot((snap) => {
          configured = true;
          if (snap.exists) applyRemote(snap.data());
          setStatus('✓ ซิงค์แล้ว · ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }), 'synced');
        }, () => setStatus('⚠ ซิงค์ผิดพลาด (เช็ค Firestore rules)', 'error'));
      });
    } catch (e) {
      setStatus('⚠ ตั้งค่า Firebase ผิดพลาด', 'error');
    }
  }

  function push(state) {
    if (!docRef) return; // not configured / not signed in yet — localStorage already has it
    clearTimeout(pushTimer);
    setStatus('🔄 กำลังบันทึก...', 'syncing');
    pushTimer = setTimeout(() => {
      docRef.set({ ...state, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true })
        .catch(() => setStatus('⚠ บันทึกไม่สำเร็จ', 'error'));
    }, 350);
  }

  return { init, push };
})();
