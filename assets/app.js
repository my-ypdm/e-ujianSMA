/*
  KONFIGURASI PORTAL SMA
  1) Daftar mapel dapat diedit pada SUBJECTS.
  2) Isi WEB_APP_URLS dengan URL deployment Apps Script yang benar.
  3) Kunci URL menggunakan format: "KELAS|MAPEL|KELAS_SPESIFIK".
  Contoh: "X|Informatika|X.1": "https://script.google.com/macros/s/ID_DEPLOYMENT/exec"
  Link sengaja dikosongkan agar tidak ada URL ujian yang tertebak/keliru.
*/
const SUBJECTS = {
  X: {
    general: [
      'Pendidikan Agama','Pendidikan Pancasila','Bahasa Indonesia','Matematika (Umum)',
      'Fisika','Kimia','Biologi','Sejarah Indonesia','Bahasa Inggris','Ekonomi','Geografi',
      'Sosiologi','Informatika','Mulok (BTQ)','Pendidikan Jasmani, Olahraga, dan Kesehatan',
      'Prakarya dan Kewirausahaan','Seni dan Budaya','Koding (AI)'
    ],
    groups: []
  },
  XI: {
    general: ['Pendidikan Agama','Pendidikan Pancasila','Bahasa Indonesia','Matematika (Umum)','Sejarah Indonesia','Bahasa Inggris','Pendidikan Jasmani, Olahraga, dan Kesehatan','Prakarya dan Kewirausahaan','Seni dan Budaya'],
    groups: [
      {name:'Pilihan Sains', subjects:['Fisika','Kimia','Biologi','Ekonomi','Informatika','Bahasa Jepang']},
      {name:'Pilihan Sosial', subjects:['Ekonomi','Sosiologi','Geografi','Informatika','Bahasa Jepang','Biologi']}
    ]
  },
  XII: {
    general: ['Pendidikan Agama','Pendidikan Pancasila','Bahasa Indonesia','Matematika (Umum)','Sejarah Indonesia','Bahasa Inggris','Pendidikan Jasmani, Olahraga, dan Kesehatan','Prakarya dan Kewirausahaan','Seni dan Budaya'],
    groups: [
      {name:'Pilihan Sains', subjects:['Fisika','Kimia','Biologi','Ekonomi','Informatika','Bahasa Jepang']},
      {name:'Pilihan Sosial', subjects:['Ekonomi','Sosiologi','Geografi','Informatika','Bahasa Jepang','Biologi']}
    ]
  }
};
// Isi URL Web App sebenarnya setelah inventarisasi Apps Script selesai.
const WEB_APP_URLS = {
  // 'X|Informatika|X.1': 'https://script.google.com/macros/s/ID_DEPLOYMENT/exec',
  // 'XI|Informatika|Sains': 'https://script.google.com/macros/s/ID_DEPLOYMENT/exec',
};
const params = new URLSearchParams(location.search);
const grade = (params.get('kelas') || 'X').toUpperCase();
const subject = params.get('mapel') || '';
const group = params.get('kelompok') || '';
const validGrade = ['X','XI','XII'].includes(grade) ? grade : 'X';
const gradeName = `Kelas ${validGrade}`;
const gradeTargets = {X:['X.1','X.2','X.3'],XI:['Sains','Sosial'],XII:['Sains','Sosial']};
const encode = value => encodeURIComponent(value);

function getSubjectsForGrade(g) {
  const data = SUBJECTS[g];
  return [...data.general, ...data.groups.flatMap(item => item.subjects)].filter((v,i,a)=>a.indexOf(v)===i);
}
function renderSubjects() {
  const list = document.getElementById('subject-list');
  if (!list) return;
  document.getElementById('heading').textContent = `${gradeName}: pilih mata pelajaran`;
  document.getElementById('crumb-class').textContent = gradeName;
  const data = SUBJECTS[validGrade];
  const sections = [{name:'Mata Pelajaran Umum', subjects:data.general}, ...data.groups];
  list.innerHTML = '';
  sections.forEach(section => {
    if (!section.subjects.length) return;
    const heading = document.createElement('h2'); heading.className = 'subject-section-title'; heading.textContent = section.name; list.appendChild(heading);
    section.subjects.forEach(name => {
      const a = document.createElement('a'); a.className = 'subject-link';
      a.href = `kelas-spesifik.html?kelas=${encode(validGrade)}&mapel=${encode(name)}&kelompok=${encode(section.name==='Mata Pelajaran Umum'?'':section.name)}`;
      a.innerHTML = `<span class="subject-icon" aria-hidden="true">▤</span><b></b><span class="arrow" aria-hidden="true">›</span>`;
      a.querySelector('b').textContent = name; list.appendChild(a);
    });
  });
  if (data.groups.length) {
    const note = document.getElementById('group-note');
    note.classList.remove('hidden');
    note.innerHTML = '<strong>Mapel pilihan</strong>Pada Kelas XI dan XII, beberapa mata pelajaran tersedia di kelompok Sains atau Sosial. Pilih kelompok yang sesuai dengan kelasmu.';
  }
}
function renderSpecificClasses() {
  const list = document.getElementById('class-list');
  if (!list) return;
  const safeSubject = subject || 'Mata Pelajaran';
  document.getElementById('heading').textContent = `Pilih kelas untuk ${safeSubject}`;
  document.getElementById('subheading').textContent = `${gradeName}${group ? ' · '+group : ''}. Pilih tujuan yang sesuai dengan kelasmu.`;
  document.getElementById('crumb-class-link').textContent = gradeName;
  document.getElementById('crumb-class-link').href = `mapel.html?kelas=${encode(validGrade)}`;
  document.getElementById('crumb-subject-link').textContent = safeSubject;
  document.getElementById('crumb-subject-link').href = `mapel.html?kelas=${encode(validGrade)}`;
  document.getElementById('back-subject').href = `mapel.html?kelas=${encode(validGrade)}`;
  list.innerHTML = '';
  gradeTargets[validGrade].forEach((target, index) => {
    const key = `${validGrade}|${safeSubject}|${target}`;
    const url = WEB_APP_URLS[key];
    const a = document.createElement('a'); a.className = 'choice-card';
    if (url) {
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    } else {
      a.href = `#belum-dikonfigurasi-${index}`;
      a.addEventListener('click', event => {
        event.preventDefault();
        const note = document.querySelector('.notice');
        note.innerHTML = `<strong>Link ujian belum dipasang.</strong>URL Web App untuk ${safeSubject} — ${gradeName} ${target} belum dimasukkan ke konfigurasi portal. Setelah URL Apps Script tersedia, tautan ini akan diaktifkan.`;
        note.scrollIntoView({behavior:'smooth',block:'center'});
      });
    }
    a.innerHTML = `<span class="choice-symbol">${target}</span><span class="choice-content"><b></b><small></small></span><span class="arrow">${url?'↗':'→'}</span>`;
    a.querySelector('.choice-content b').textContent = target.startsWith('Sains') || target.startsWith('Sosial') ? `Pilihan ${target}` : `Kelas ${target}`;
    a.querySelector('.choice-content small').textContent = url ? 'Buka Web App ujian' : 'Pilih untuk melanjutkan';
    list.appendChild(a);
  });
}
renderSubjects();
renderSpecificClasses();


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

    toggle.addEventListener('click', () => {
      setOpen(!sidebar.classList.contains('is-open'));
    });
    backdrop.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
    sidebar.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) setOpen(false);
    });
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