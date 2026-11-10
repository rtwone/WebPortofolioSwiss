/**
 * ============================================================================
 * AUTOMATIC BIDIRECTIONAL TRANSLATOR ENGINE (ID <-> EN)
 * ============================================================================
 * Digunakan oleh Admin Panel (/admin) dan PortfolioDataContext:
 * - Ketika Admin mengedit & menyimpan teks Bahasa Indonesia ('id'),
 *   seluruh teks secara otomatis diterjemahkan ke Bahasa Inggris ('en').
 * - Ketika Admin mengedit & menyimpan teks Bahasa Inggris ('en'),
 *   seluruh teks secara otomatis diterjemahkan ke Bahasa Indonesia ('id').
 *
 * Arsitektur Multi-Tier (Tanpa Perlu API Key Berbayar):
 * 1. In-Memory Translation Cache (mencegah request berulang untuk kalimat yang sama)
 * 2. Primary Engine: Google Translate GTX Neural Machine Translation API
 *    (`https://translate.googleapis.com/translate_a/single?client=gtx&sl=...&tl=...&dt=t&q=...`)
 * 3. Secondary Fallback Engine: MyMemory Translation API
 *    (`https://api.mymemory.translated.net/get?q=...&langpair=...`)
 * ============================================================================
 */

const translationCache = new Map();

// Key/field yang TIDAK BOLEH diterjemahkan (URL, Email, Kode Indeks, Nama Brand, dsb.)
const NON_TRANSLATABLE_KEYS = new Set([
  'id',
  'code',
  'index',
  'dossierCode',
  'email',
  'githubLabel',
  'githubUrl',
  'live_url',
  'repo_url',
  'image_url',
  'mockup_type',
  'category',
  'year',
  'period',
  'type',
  'order_index',
  'available',
  'brandName',
  'name',
  'affiliation',
  'tech_stack',
  'socials',
]);

/**
 * Mengecek apakah sebuah string tidak perlu diterjemahkan
 * (misal: URL, email, angka murni, kode pendek, atau kosong)
 */
function shouldSkipString(text) {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (!trimmed) return true;
  // Skip URLs or paths
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/') ||
    trimmed.includes('@')
  ) {
    return true;
  }
  // Skip pure numbers or symbols (e.g. "15+", "2025", "[ID-SMNP]")
  if (/^[0-9+\-./\s[\]()#&×]+$/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Menerjemahkan 1 string dari `sourceLang` ('id' | 'en') ke `targetLang` ('en' | 'id')
 */
export async function translateText(text, sourceLang = 'id', targetLang = 'en') {
  if (sourceLang === targetLang) return text;
  if (shouldSkipString(text)) return text;

  const cacheKey = `${sourceLang}:${targetLang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // 1. Primary: Google Translate GTX Neural Endpoint (Fast, CORS-enabled, High Accuracy)
  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sourceLang
    )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(gtxUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((segment) => (Array.isArray(segment) ? segment[0] : ''))
          .join('')
          .trim();

        if (translated) {
          translationCache.set(cacheKey, translated);
          return translated;
        }
      }
    }
  } catch {
    // Lanjut ke fallback MyMemory jika GTX terblokir jaringan
  }

  // 2. Secondary Fallback: MyMemory Translated API
  try {
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${encodeURIComponent(`${sourceLang}|${targetLang}`)}`;

    const res = await fetch(myMemoryUrl);
    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated && typeof translated === 'string') {
        translationCache.set(cacheKey, translated);
        return translated;
      }
    }
  } catch {
    // Jika offline total, kembalikan teks asli agar tidak merusak penyimpanan
  }

  return text;
}

/**
 * Menerjemahkan struktur objek/array `siteContent` secara rekursif & paralel
 * dari `sourceLang` ke `targetLang`, melewati field teknis di `NON_TRANSLATABLE_KEYS`.
 */
export async function autoTranslateSiteObject(
  obj,
  sourceLang = 'id',
  targetLang = 'en'
) {
  if (sourceLang === targetLang || !obj) return obj;

  async function walk(node, parentKey = '') {
    if (NON_TRANSLATABLE_KEYS.has(parentKey)) {
      return node;
    }

    if (typeof node === 'string') {
      return translateText(node, sourceLang, targetLang);
    }

    if (Array.isArray(node)) {
      return Promise.all(node.map((item) => walk(item, parentKey)));
    }

    if (node && typeof node === 'object') {
      const entries = Object.entries(node);
      const translatedEntries = await Promise.all(
        entries.map(async ([key, val]) => {
          // Jangan terjemahkan nested locale containers
          if (key === 'id_locale' || key === 'en_locale') {
            return [key, val];
          }
          // Pada array metrics, `value` seperti "3+ Tahun" atau "Fokus Ganda" boleh diterjemahkan
          const translatedVal = await walk(val, key);
          return [key, translatedVal];
        })
      );
      return Object.fromEntries(translatedEntries);
    }

    return node;
  }

  return walk(obj);
}

/**
 * Menerjemahkan field Proyek (`title`, `description`, serta `gallery_items`) secara otomatis
 * ke bahasa pasangan (`id` <-> `en`).
 */
export async function autoTranslateProjectPayload(payload, sourceLang = 'id') {
  const targetLang = sourceLang === 'id' ? 'en' : 'id';
  const rawTitle = (payload.title || '').trim();
  const rawDesc = (payload.description || '').trim();
  const rawGallery = Array.isArray(payload.gallery_items)
    ? payload.gallery_items
    : [];

  const [translatedTitle, translatedDesc, translatedGallery] =
    await Promise.all([
      translateText(rawTitle, sourceLang, targetLang),
      translateText(rawDesc, sourceLang, targetLang),
      Promise.all(
        rawGallery.map(async (item, idx) => {
          const itemTitle = (item.title || '').trim();
          const transItemTitle = await translateText(
            itemTitle,
            sourceLang,
            targetLang
          );
          return {
            ...item,
            id: item.id || `gal-${Date.now()}-${idx}`,
            title: itemTitle,
            title_id: sourceLang === 'id' ? itemTitle : transItemTitle,
            title_en: sourceLang === 'en' ? itemTitle : transItemTitle,
            image_url: (item.image_url || '').trim(),
            post_url: (item.post_url || '').trim(),
          };
        })
      ),
    ]);

  if (sourceLang === 'id') {
    return {
      title_id: rawTitle,
      description_id: rawDesc,
      title_en: translatedTitle,
      description_en: translatedDesc,
      gallery_items: translatedGallery,
    };
  }

  return {
    title_id: translatedTitle,
    description_id: translatedDesc,
    title_en: rawTitle,
    description_en: rawDesc,
    gallery_items: translatedGallery,
  };
}

/**
 * Menerjemahkan field Experience (`role`, `company`, `description_bullets`) secara otomatis
 * ke bahasa pasangan (`id` <-> `en`).
 */
export async function autoTranslateExperiencePayload(
  payload,
  bulletsArray,
  sourceLang = 'id'
) {
  const targetLang = sourceLang === 'id' ? 'en' : 'id';
  const rawRole = (payload.role || '').trim();
  const rawCompany = (payload.company || '').trim();

  const [translatedRole, translatedCompany, translatedBullets] =
    await Promise.all([
      translateText(rawRole, sourceLang, targetLang),
      translateText(rawCompany, sourceLang, targetLang),
      Promise.all(
        (bulletsArray || []).map((b) =>
          translateText(b, sourceLang, targetLang)
        )
      ),
    ]);

  if (sourceLang === 'id') {
    return {
      role_id: rawRole,
      company_id: rawCompany,
      description_bullets_id: bulletsArray,
      role_en: translatedRole,
      company_en: translatedCompany,
      description_bullets_en: translatedBullets,
    };
  }

  return {
    role_id: translatedRole,
    company_id: translatedCompany,
    description_bullets_id: translatedBullets,
    role_en: rawRole,
    company_en: rawCompany,
    description_bullets_en: bulletsArray,
  };
}
