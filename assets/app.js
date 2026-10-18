/*
  PORTAL SMA DUA MEI — SUMBER JADWAL DARI ADMIN PUSAT
  Data dibaca dari JSON publik yang diterbitkan oleh Admin Pusat.
  URL ujian aktif diambil dari field link_ujian pada JSON. Jangan menaruh token GitHub di portal.
*/
const SCHEDULE_JSON_URL = 'https://my-ypdm.github.io/e-ujian-admindm/data/sma.json';

// Fallback opsional jika kelak ada URL Web App khusus yang tidak berasal dari sheet LINK_UJIAN.
// Jangan isi dengan URL tebakan. Format: 'KELAS|MAPEL|TARGET': 'https://script.google.com/macros/s/.../exec'
const WEB_APP_URLS = {
  // 'X|Informatika|X.1': 'https://script.google.com/macros/s/ID_DEPLOYMENT/exec',
};

const params = new URLSearchParams(location.search);
const grade = (params.get('kelas') || 'X').toUpperCase();
const subject = params.get('mapel') || '';
const group = params.get('kelompok') || '';
const validGrade = ['X', 'XI', 'XII'].includes(grade) ? grade : 'X';
const gradeName = `Kelas ${validGrade}`;
const encode = value => encodeURIComponent(value);
let scheduleRows = [];
let scheduleLoadError = '';

function cleanClassName(value) {
  return String(value || '').trim().replace(/^kelas\s+/i, '').trim();
}

function gradeForClassName(value) {
  const name = cleanClassName(value).toUpperCase();
  if (name === 'X' || /^X\.(\d+)/.test(name)) return 'X';
  if (name === 'XI' || /^XI\b/.test(name)) return 'XI';
  if (name === 'XII' || /^XII\b/.test(name)) return 'XII';
  return '';
}

function targetForClassName(value, requestedGrade) {
  const name = cleanClassName(value);
  if (requestedGrade === 'X') return /^X\.\d+/i.test(name) ? name : name.toUpperCase() === 'X' ? 'X' : '';
  const upper = name.toUpperCase();
  if (upper.includes('SAINS')) return 'Sains';
  if (upper.includes('SOSIAL')) return 'Sosial';
  if (upper.startsWith(requestedGrade + ' ')) return name.slice(requestedGrade.length).trim();
  return '';
}

function rowsForGrade(g) {
  return scheduleRows.filter(row => gradeForClassName(row.kelas) === g);
}

function rowsForSubject(g, subjectName) {
  return rowsForGrade(g).filter(row => String(row.mapel || '').trim() === String(subjectName || '').trim());
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function compareSchedule(a, b) {
  return `${a.tanggal || ''} ${a.jam_mulai || ''}`.localeCompare(`${b.tanggal || ''} ${b.jam_mulai || ''}`);
}

function formatDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value || 'Tanggal belum ditentukan');
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function formatTime(row) {
  const start = String(row.jam_mulai || '').trim();
  const end = String(row.jam_selesai || '').trim();
  if (start && end) return `${start}–${end}`;
  return start || end || 'Jam belum ditentukan';
}

function rowSummary(row) {
  const chunks = [];
  if (row.tanggal) chunks.push(formatDate(row.tanggal));
  if (row.jam_mulai || row.jam_selesai) chunks.push(formatTime(row));
  if (row.status) chunks.push(String(row.status));
  return chunks.join(' · ') || 'Jadwal tersedia';
}

function subjectSummary(rows) {
  const sorted = [...rows].sort(compareSchedule);
  if (!sorted.length) return '';
  const first = sorted[0];
  const count = sorted.length;
  const summary = rowSummary(first);
  return count > 1 ? `${summary} · ${count} jadwal` : summary;
}

async function loadScheduleJson() {
  try {
    const response = await fetch(SCHEDULE_JSON_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.jadwal)) throw new Error('Format JSON tidak sesuai (jadwal tidak ditemukan).');
    scheduleRows = payload.jadwal
      .filter(row => row && row.kelas && row.mapel)
      .map(row => ({ ...row, kelas: String(row.kelas).trim(), mapel: String(row.mapel).trim() }))
      .sort(compareSchedule);
    return true;
  } catch (error) {
    console.error('Gagal memuat jadwal Admin Pusat:', error);
    scheduleLoadError = 'Jadwal belum dapat dimuat dari Admin Pusat. Periksa koneksi internet atau pastikan JSON sudah diterbitkan.';
    return false;
  }
}

function setNotice(message, strongText) {
  const notice = document.querySelector('.notice');
  if (!notice) return;
  notice.replaceChildren();
  if (strongText) {
    const strong = document.createElement('strong');
    strong.textContent = strongText;
    notice.appendChild(strong);
  }
  notice.appendChild(document.createTextNode(message));
  notice.classList.remove('hidden');
}

function makeEmptyState(message) {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.textContent = message;
  return empty;
}

function subjectsBySection(g) {
  const rows = rowsForGrade(g);
  const subjectNames = unique(rows.map(row => row.mapel)).sort((a, b) => a.localeCompare(b, 'id'));
  if (g === 'X') {
    return [{ name: 'Mata Pelajaran dari Jadwal', group: '', subjects: subjectNames.map(name => ({ name, rows: rows.filter(row => row.mapel === name) })) }];
  }

  const targetSubjects = { Sains: new Set(), Sosial: new Set() };
  rows.forEach(row => {
    const target = targetForClassName(row.kelas, g);
    if (target === 'Sains' || target === 'Sosial') targetSubjects[target].add(row.mapel);
  });
  const common = subjectNames.filter(name => targetSubjects.Sains.has(name) && targetSubjects.Sosial.has(name));
  const scienceOnly = subjectNames.filter(name => targetSubjects.Sains.has(name) && !targetSubjects.Sosial.has(name));
  const socialOnly = subjectNames.filter(name => targetSubjects.Sosial.has(name) && !targetSubjects.Sains.has(name));
  const sections = [];
  if (common.length) sections.push({ name: 'Mata Pelajaran Umum', group: '', subjects: common.map(name => ({ name, rows: rows.filter(row => row.mapel === name) })) });
  if (scienceOnly.length) sections.push({ name: 'Pilihan Sains', group: 'Pilihan Sains', subjects: scienceOnly.map(name => ({ name, rows: rows.filter(row => row.mapel === name && targetForClassName(row.kelas, g) === 'Sains') })) });
  if (socialOnly.length) sections.push({ name: 'Pilihan Sosial', group: 'Pilihan Sosial', subjects: socialOnly.map(name => ({ name, rows: rows.filter(row => row.mapel === name && targetForClassName(row.kelas, g) === 'Sosial') })) });
  return sections;
}

async function renderSubjects() {
  const list = document.getElementById('subject-list');
  if (!list) return;
  document.getElementById('heading').textContent = `${gradeName}: pilih mata pelajaran`;
  document.getElementById('crumb-class').textContent = gradeName;
  list.replaceChildren();
  const loaded = await loadScheduleJson();
  if (!loaded) {
    list.appendChild(makeEmptyState(scheduleLoadError));
    return;
  }

  const rows = rowsForGrade(validGrade);
  if (!rows.length) {
    list.appendChild(makeEmptyState(`Belum ada jadwal untuk ${gradeName}. Admin sekolah perlu menambahkan jadwal dan menerbitkan JSON kembali.`));
    return;
  }

  const sections = subjectsBySection(validGrade);
  sections.forEach(section => {
    if (!section.subjects.length) return;
    const heading = document.createElement('h2');
    heading.className = 'subject-section-title';
    heading.textContent = section.name;
    list.appendChild(heading);
    section.subjects.forEach(item => {
      const a = document.createElement('a');
      a.className = 'subject-link';
      a.href = `kelas-spesifik.html?kelas=${encode(validGrade)}&mapel=${encode(item.name)}&kelompok=${encode(section.group)}`;
      const icon = document.createElement('span');
      icon.className = 'subject-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '▤';
      const content = document.createElement('span');
      content.style.flex = '1';
      const name = document.createElement('b');
      name.textContent = item.name;
      const small = document.createElement('small');
      small.textContent = subjectSummary(item.rows);
      small.style.display = 'block';
      small.style.marginTop = '4px';
      small.style.fontSize = '11px';
      small.style.color = 'var(--muted)';
      content.append(name, small);
      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '›';
      a.append(icon, content, arrow);
      list.appendChild(a);
    });
  });

  const note = document.getElementById('group-note');
  if (note && validGrade !== 'X') {
    note.classList.remove('hidden');
    note.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = 'Jadwal dari Admin Pusat';
    note.appendChild(strong);
    note.appendChild(document.createTextNode(' Daftar di atas dibentuk dari jadwal yang sudah diterbitkan. Mapel yang tersedia di Sains dan Sosial bersama ditampilkan sekali; pilihan kelasnya tetap bisa dipilih berikutnya.'));
  }
}

function renderSpecificClasses() {
  const list = document.getElementById('class-list');
  if (!list) return;

  const safeSubject = subject || 'Mata Pelajaran';
  document.getElementById('heading').textContent = `Pilih kelas untuk ${safeSubject}`;
  document.getElementById('subheading').textContent = `${gradeName}${group ? ' · ' + group : ''}. Pilih tujuan yang sesuai dengan kelasmu.`;
  document.getElementById('crumb-class-link').textContent = gradeName;
  document.getElementById('crumb-class-link').href = `mapel.html?kelas=${encode(validGrade)}`;
  document.getElementById('crumb-subject-link').textContent = safeSubject;
  document.getElementById('crumb-subject-link').href = `mapel.html?kelas=${encode(validGrade)}`;
  document.getElementById('back-subject').href = `mapel.html?kelas=${encode(validGrade)}`;
  list.replaceChildren();

  const relevant = rowsForSubject(validGrade, safeSubject);
  const availableTargets = unique(relevant.map(row => targetForClassName(row.kelas, validGrade))).filter(Boolean);
  let targets = availableTargets;
  if (group.toLowerCase().includes('sains')) targets = targets.filter(target => target === 'Sains');
  if (group.toLowerCase().includes('sosial')) targets = targets.filter(target => target === 'Sosial');
  targets = targets.sort((a, b) => {
    if (validGrade === 'X') return a.localeCompare(b, 'id', { numeric: true });
    return ['Sains', 'Sosial'].indexOf(a) - ['Sains', 'Sosial'].indexOf(b);
  });

  if (!relevant.length || !targets.length) {
    list.appendChild(makeEmptyState(`Belum ada jadwal untuk ${safeSubject} pada ${gradeName}.`));
    setNotice('Mata pelajaran ini belum memiliki jadwal yang diterbitkan. Kembali ke daftar mapel atau hubungi admin sekolah.', 'Jadwal belum tersedia.');
    return;
  }

  targets.forEach((target, index) => {
    const match = relevant.filter(row => targetForClassName(row.kelas, validGrade) === target).sort(compareSchedule);
    const row = match[0];
    const jsonUrl = row && String(row.link_ujian || '').trim();
    const fallbackUrl = WEB_APP_URLS[`${validGrade}|${safeSubject}|${target}`];
    const url = jsonUrl || fallbackUrl || '';
    const a = document.createElement('a');
    a.className = 'choice-card';
    if (url) {
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    } else {
      a.href = `#link-belum-aktif-${index}`;
      a.addEventListener('click', event => {
        event.preventDefault();
        setNotice(`Jadwal ${safeSubject} untuk ${gradeName} ${target} sudah terdaftar, tetapi link ujian belum diaktifkan. Tambahkan URL di sheet LINK_UJIAN, set status_akses menjadi Aktif, lalu terbitkan JSON lagi.`, 'Link ujian belum aktif.');
      });
    }

    const symbol = document.createElement('span');
    symbol.className = 'choice-symbol';
    symbol.textContent = target;
    const content = document.createElement('span');
    content.className = 'choice-content';
    const title = document.createElement('b');
    title.textContent = target === 'Sains' || target === 'Sosial' ? `Pilihan ${target}` : `Kelas ${target}`;
    const small = document.createElement('small');
    small.textContent = `${row ? rowSummary(row) : 'Jadwal tersedia'}${url ? ' · Buka Web App ujian' : ' · Link ujian belum aktif'}`;
    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = url ? '↗' : '→';
    content.append(title, small);
    a.append(symbol, content, arrow);
    list.appendChild(a);
  });
}

// Load JSON only on pages that need schedule data; homepage remains lightweight.
if (document.getElementById('subject-list')) renderSubjects();
if (document.getElementById('class-list')) {
  loadScheduleJson().then(loaded => {
    if (loaded) renderSpecificClasses();
    else {
      const list = document.getElementById('class-list');
      if (list) list.replaceChildren(makeEmptyState(scheduleLoadError));
    }
  });
}

// Sidebar navigation: hamburger menu on mobile and active page indicator.
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (sidebar && toggle && backdrop) {
    const setOpen = (open) => {
      sidebar.classList.toggle('is-open', open);
      backdrop.classList.toggle('is-visible', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
      document.body.classList.toggle('sidebar-menu-open', open);
    };

    toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('is-open')));
    backdrop.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
    sidebar.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
    window.addEventListener('resize', () => { if (window.innerWidth > 760) setOpen(false); });
  }

  const currentFile = location.pathname.split('/').pop() || 'index.html';
  let currentPage = 'home';
  if (currentFile === 'kelas.html') currentPage = 'kelas';
  else if (currentFile === 'mapel.html') currentPage = 'mapel';
  else if (currentFile === 'kelas-spesifik.html') currentPage = 'spesifik';

  document.querySelectorAll('.sidebar-nav a').forEach((link) => {
    const page = link.dataset.page;
    if (page === currentPage || (currentPage === 'mapel' && page === 'kelas') ||
        (currentPage === 'spesifik' && page === 'kelas')) {
      link.classList.add('active');
      if (page === currentPage) link.setAttribute('aria-current', 'page');
    }
  });
});
