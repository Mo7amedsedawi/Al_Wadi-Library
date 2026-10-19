import { Book, Author, CategoryItem, DownloadItem } from '../types';

export const MOCK_AUTHORS: Record<string, Author> = {};
export const INITIAL_BOOKS: Book[] = [];
export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'فانتازيا', name: 'فانتازيا', icon: 'Sparkles', description: 'عوالم خيالية، سحر، ومغامرات ملحمية' },
  { id: 'غموض', name: 'غموض', icon: 'Compass', description: 'أسرار، تحقيقات، وقضايا غامضة تحبس الأنفاس' },
  { id: 'جاسوسية', name: 'جاسوسية', icon: 'Shield', description: 'مهمات سرية، عملاء، ومطاردات استخباراتية' },
  { id: 'رومانسي', name: 'رومانسي', icon: 'Heart', description: 'روايات عاطفية، حب، ومشاعر إنسانية عميقة' },
  { id: 'كتب غير روائية', name: 'كتب غير روائية', icon: 'BookOpen', description: 'فكر، مذكرات، علوم، وسير واقعية ومعرفية' },
];
export const INITIAL_DOWNLOADS: DownloadItem[] = [];
export const INITIAL_FAVORITES: string[] = [];
