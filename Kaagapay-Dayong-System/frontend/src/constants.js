export const DAVAO_REGION_LOCATIONS = {
  'Davao City (HUC)': ['Davao City'],
  'Davao del Norte': ['Tagum City', 'Panabo City', 'Island Garden City of Samal', 'Asuncion', 'Braulio E. Dujali', 'Carmen', 'Kapalong', 'New Corella', 'San Isidro (Davao del Norte)', 'Santo Tomas', 'Talaingod'],
  'Davao del Sur': ['Digos City', 'Bansalan', 'Hagonoy', 'Kiblawan', 'Magsaysay', 'Malalag', 'Matanao', 'Padada', 'Santa Cruz', 'Sulop'],
  'Davao de Oro': ['Compostela', 'Laak', 'Mabini', 'Maco', 'Maragusan', 'Mawab', 'Monkayo', 'Montevista', 'Nabunturan', 'New Bataan', 'Pantukan'],
  'Davao Occidental': ['Don Marcelino', 'Jose Abad Santos', 'Malita', 'Santa Maria', 'Sarangani'],
  'Davao Oriental': ['Mati City', 'Baganga', 'Banaybanay', 'Boston', 'Caraga', 'Cateel', 'Governor Generoso', 'Lupon', 'Manay', 'San Isidro (Davao Oriental)', 'Tarragona']
};

export const allLocations = () => Object.values(DAVAO_REGION_LOCATIONS).flat();

export const CHAPTER_DATA = {
  'Tagum City': {
    admin: 'Ralph Simbajon',
    adminEmail: 'tagumcity@gmail.com',
    adminAddress: 'Purok 1-B, Magugpo North, Tagum City',
    barangays: ['Purok 1-B, Magugpo North', 'San Vicente', 'Visayan', 'Central', 'Apokon'],
    gcashAcc: 'Admin Ralph Simbajon',
    gcashNum: '0917-888-9999',
    bankAcc: 'Kaagapay Dayong Tagum',
    bankNum: '1234-5678-9012'
  },
  'Carmen': {
    admin: 'Maria Clara',
    adminEmail: 'carmen@gmail.com',
    adminAddress: 'Barangay Poblacion, Carmen, Davao del Norte',
    barangays: ['Barangay Poblacion', 'Tuganay', 'Alejal', 'Magsaysay'],
    gcashAcc: 'Admin Maria Clara',
    gcashNum: '0918-777-1111',
    bankAcc: 'Kaagapay Dayong Carmen',
    bankNum: '2234-5678-9012'
  },
  'Mawab': {
    admin: 'Juan Santos',
    adminEmail: 'mawab@gmail.com',
    adminAddress: 'Poblacion, Mawab, Davao de Oro',
    barangays: ['Poblacion', 'Bawani', 'Andili', 'Tuboran'],
    gcashAcc: 'Admin Juan Santos',
    gcashNum: '0920-555-2222',
    bankAcc: 'Kaagapay Dayong Mawab',
    bankNum: '3234-5678-9012'
  },
  'Panabo City': {
    admin: 'Grace Poe',
    adminEmail: 'panabo@gmail.com',
    adminAddress: 'Gredu, Panabo City, Davao del Norte',
    barangays: ['Gredu', 'Sto. Niño', 'New Pandan', 'San Francisco'],
    gcashAcc: 'Admin Grace Poe',
    gcashNum: '0922-333-4444',
    bankAcc: 'Kaagapay Dayong Panabo',
    bankNum: '4234-5678-9012'
  },
  'Davao City': {
    admin: 'Carlos Yulo',
    adminEmail: 'davao@gmail.com',
    adminAddress: 'Buhangin, Davao City',
    barangays: ['Poblacion', 'Buhangin', 'Talomo', 'Matina', 'Toril'],
    gcashAcc: 'Admin Carlos Yulo',
    gcashNum: '0919-444-8888',
    bankAcc: 'Kaagapay Dayong Davao',
    bankNum: '5234-5678-9012'
  }
};

export const chapterOf = (mun) => {
  return (
    CHAPTER_DATA[mun] || {
      admin: 'Chapter Admin',
      adminEmail: '—',
      adminAddress: mun || '',
      barangays: [],
      gcashAcc: '—',
      gcashNum: '—',
      bankAcc: '—',
      bankNum: '—'
    }
  );
};

export const peso = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n) || 0);

export const pad = (n, w = 3) => String(n).padStart(w, '0');

export function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d)
    ? String(iso)
    : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function timeAgo(ts) {
  const time = typeof ts === 'string' ? new Date(ts).getTime() : ts;
  const s = Math.max(1, Math.floor((Date.now() - time) / 1000));
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(time).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function initialsOf(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function svgPlaceholder(text, bg = '#216b45') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" fill="#fff" font-family="sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export const safeImg = (src) => {
  if (typeof src === 'string' && (src.startsWith('data:image/') || src.startsWith('/uploads/') || src.startsWith('http'))) {
    return src;
  }
  return svgPlaceholder('No image available', '#64748b');
};
