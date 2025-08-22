import type { BaseEntity } from './common';

export interface Movie extends BaseEntity {
  title: string;
  year: number;
  genre: string;
  rating: number;
  poster: string;
  duration: string;
}

export interface TVShow extends BaseEntity {
  title: string;
  year: number;
  genre: string;
  episodes: number;
  poster: string;
}