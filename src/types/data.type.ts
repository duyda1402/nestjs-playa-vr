import { Url } from './response.type';

enum TypeVideo {
  trailer,
  full,
}

export interface VideoListDetails {
  type: TypeVideo;
  duration_seconds: number;
}

export interface VideoListView {
  id: string;
  title: string;
  subtitle: string;
  preview_image: string;
  release_date: string;
  details: VideoListDetails;
}

export interface VideoViewStudio {
  id: string;
  title: string;
}

export interface VideoViewCategory {
  id: string;
  title: string;
}
export interface VideoViewActor {
  id: string;
  title: string;
}
export interface TimelineAtlas {
  version: number;
  url: Url;
}
export interface TimelineMarker {
  time?: number;
  title?: string;
  tilt?: number;
  zoom?: number;
  height?: number;
}
export interface VideoLink {
  is_stream?: boolean;
  is_download?: boolean;
  url?: Url;
  unavailable_reason?: string;
  projection?: string;
  stereo?: string;
  quality_name?: string;
  quality_order?: number;
}
export interface VideoViewDetails {
  type: TypeVideo;
  duration_seconds: number;
  timeline_atlas: TimelineAtlas;
  timeline_markers: TimelineMarker[];
  links: VideoLink[];
}
export interface ActorListView {
  id: string;
  title: string;
  preview: Url;
}

export interface ActorView {
  id: string;
  title: string;
  preview: Url;
  studios: ActorViewStudio[];
  properties: ActorViewProperty[];
  aliases: string[];
}

export interface ActorViewStudio {
  id: string;
  title: string;
}

export interface ActorViewProperty {
  name: string;
  value: string;
}

export interface StudioListView {
  id: string;
  title: string;
  preview: Url;
}

export interface StudioView {
  id: string;
  title: string;
  preview: Url;
  description: string;
}

export interface CategoryListView {
  id: string;
  title: string;
  preview: Url;
}
