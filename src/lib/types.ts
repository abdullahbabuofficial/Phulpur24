export type Lang = 'bn' | 'en';

export interface Author {
  id: string;
  nameBn: string;
  nameEn: string;
  role: string;
  avatar: string;
  bio: string;
}

export interface Category {
  id: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  color: string;
}

export interface Tag {
  id: string;
  slug: string;
  nameBn: string;
  nameEn: string;
}

export interface Article {
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  bodyBn: string;
  bodyEn: string;
  category: Category;
  tags: Tag[];
  author: Author;
  publishedAt: string;
  updatedAt: string;
  readingTimeBn: number;
  readingTimeEn: number;
  image: string;
  imageCaption: string;
  featured: boolean;
  breaking: boolean;
  views: number;
  status: 'published' | 'draft' | 'pending';
  seoScore: number;
  translationStatus: 'complete' | 'partial' | 'missing';
}

export interface AdSlot {
  id: string;
  label: string;
  size: string;
  position: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'video';
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
  icon: string;
}

export interface DashboardStats {
  publishedPosts: number;
  drafts: number;
  pendingReview: number;
  todayViews: number;
  seoIssues: number;
  translationPending: number;
}
