import { Book } from '../types';

/**
 * Normalizes Arabic text for smooth, fuzzy substring matching:
 * - Unifies Hamzas (أ, إ, آ, ٱ -> ا)
 * - Unifies Taa Marbuta (ة -> ه)
 * - Unifies Yaa / Alif Maqsura (ى -> ي)
 * - Removes Harakat / Tashkeel and Tatweel
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Remove Tashkeel (diacritics)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove Tatweel (Kashida)
    .replace(/\u0640/g, '')
    // Normalize Alif
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbuta
    .replace(/ة/g, 'ه')
    // Normalize Yaa / Alif Maqsura
    .replace(/ى/g, 'ي')
    // Normalize Hamza forms
    .replace(/[ؤئ]/g, 'ء');
}

/**
 * Queries title, author.name, and keywords for a match.
 */
export function matchBookSearch(book: Book, rawQuery: string): boolean {
  if (!rawQuery.trim()) return true;

  const normalizedQuery = normalizeArabic(rawQuery);
  const normalizedTitle = normalizeArabic(book.title);
  const normalizedAuthor = normalizeArabic(book.author?.name || '');
  const normalizedKeywords = (book.keywords || []).map(normalizeArabic);
  const normalizedCategory = normalizeArabic(book.category || '');

  // Substring match in title
  if (normalizedTitle.includes(normalizedQuery)) return true;

  // Substring match in author name
  if (normalizedAuthor.includes(normalizedQuery)) return true;

  // Substring match in category
  if (normalizedCategory.includes(normalizedQuery)) return true;

  // Match in any keyword
  if (normalizedKeywords.some((kw) => kw.includes(normalizedQuery))) return true;

  return false;
}
