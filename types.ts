export interface Concept {
  id: string;
  name: string;
  prompt: string;
  thumbnail: string;
}

export interface PhotoboothSettings {
  eventName: string;
  eventDescription: string;
  folderId: string;
  overlayImage: string | null;
  autoResetTime: number; // seconds
  adminPin: string;
  orientation: 'portrait' | 'landscape';
}

export interface GalleryItem {
  id: string;
  createdAt: string;
  conceptName: string;
  imageUrl: string;
  downloadUrl: string;
  token: string;
}

export enum AppState {
  LANDING = 'LANDING',
  THEMES = 'THEMES',
  CAMERA = 'CAMERA',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT',
  GALLERY = 'GALLERY',
  ADMIN = 'ADMIN'
}