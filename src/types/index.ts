export type BookCategory = 
  | 'فانتازيا'
  | 'غموض' 
  | 'جاسوسية' 
  | 'رومانسي' 
  | 'كتب غير روائية'
  | 'فانتازي'
  | 'روايات'
  | 'تاريخ'
  | 'فلسفة'
  | 'علوم'
  | 'تكنولوجيا'
  | string;

export type BookStatus = 'published' | 'draft' | 'hidden';

export interface Author {
  id: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  born?: string;
  nationality?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  booksCount?: number;
}

export interface Book {
  id: string;
  title: string;
  author: Author;
  description: string;
  fullExcerpt?: string;
  category: BookCategory;
  coverImage: string;
  formats: ('pdf' | 'epub')[];
  publishDate: string; // ISO Date String e.g. "2024-03-15T00:00:00.000Z"
  keywords: string[];
  pages: number;
  rating: number;
  ratingsCount: number;
  isTrending: boolean;
  isNew: boolean;
  isBookOfTheDay?: boolean;
  status?: BookStatus;
  fileSize: string;
  format?: 'PDF' | 'EPUB'; // Primary format helper
  fileUrl?: string;
  epubUrl?: string;
  isbn?: string;
  readTimeHours?: number;
  downloadsCount?: number;
  seriesName?: string; // Stored in books.series_name
  series?: string;     // Alias for seriesName
  seriesPart?: number;
}

export type ViewType = 
  | 'home' 
  | 'browse' 
  | 'details' 
  | 'downloads' 
  | 'favorites' 
  | 'profile' 
  | 'login' 
  | 'signup' 
  | 'admin'
  | 'author'
  | 'series'
  | 'request-book'
  | 'contact'
  | 'donate';

export interface DownloadItem {
  bookId: string;
  progress: number; // 0 - 100
  status: 'downloading' | 'completed' | 'paused';
  downloadDate: string;
  sizeMB: number;
}

export interface RecentBookItem {
  bookId: string;
  viewedAt: string;
  readingProgress: number; // percentage 10 - 90
}

export type UserRole = 'guest' | 'user' | 'admin';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  isGuest?: boolean;
  membershipTier: string;
  joinedDate: string;
  booksReadCount: number;
  hoursRead: number;
  pagesRead: number;
  avatarUrl?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface BookComment {
  id: string;
  book_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  replies?: BookComment[];
}

export interface CommentReport {
  id: string;
  comment_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'resolved';
  created_at: string;
  comment_content?: string;
  reporter_name?: string;
  book_title?: string;
}

export interface BookRating {
  id?: string;
  book_id: string;
  user_id: string;
  rating_value: number;
  created_at?: string;
}

export interface ReadingList {
  id: string;
  title: string;
  description: string;
  book_ids: string[];
  created_at: string;
}

export interface BookAnalyticsEvent {
  id?: string;
  book_id: string;
  event_type: 'view' | 'download';
  created_at?: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalDownloads: number;
  mostDownloadedBooks: { bookId: string; title: string; count: number; coverImage?: string }[];
  mostViewedBooks: { bookId: string; title: string; count: number; coverImage?: string }[];
}

export interface BookRequest {
  id: string;
  bookTitle: string;
  createdAt: string;
  userId?: string;
  userName?: string;
  status: 'pending' | 'fulfilled' | 'rejected';
  notes?: string;
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  membershipTier?: string;
  joinedDate: string;
}


