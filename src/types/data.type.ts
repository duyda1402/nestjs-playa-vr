import { Url } from './response.type';

enum TypeVideo {
  'trailer',
  'full',
}

export interface IFVideoListDetails {
  type: TypeVideo;
  duration_seconds: number;
}

export interface IFVideoListView {
  id: string;
  title: string;
  subtitle: string;
  preview_image: string;
  release_date: string;
  details: IFVideoListDetails[];
}
export interface IFVideoView {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  preview_image: Url;
  release_date: Date;
  studio: IFVideoViewStudio;
  categories: IFVideoViewCategory[];
  actors: IFVideoViewActor[];
  details: IFVideoViewDetails[];
  views: number;
}
export interface IFVideoViewStudio {
  id: string;
  title: string;
}

export interface IFVideoViewCategory {
  id: string;
  title: string;
}
export interface IFVideoViewActor {
  id: string;
  title: string;
}
export interface IFTimelineAtlas {
  version: number;
  url: Url;
}
export interface IFTimelineMarker {
  time?: number;
  title?: string;
  tilt?: number;
  zoom?: number;
  height?: number;
}
export interface IFVideoLink {
  is_stream?: boolean;
  is_download?: boolean;
  url?: Url;
  unavailable_reason?: string;
  projection?: string;
  stereo?: string;
  quality_name?: string;
  quality_order?: number;
}
export interface IFVideoViewDetails {
  typeVideo?: string;
  duration_seconds: number;
  timeline_atlas: IFTimelineAtlas;
  timeline_markers: IFTimelineMarker[];
  links: IFVideoLink[];
}
export interface IFActorListView {
  id: string;
  title: string;
  preview: Url;
}

export interface IFActorView {
  id: string;
  title: string;
  preview: Url;
  studios: IFActorViewStudio[];
  properties: IFActorViewProperty[];
  aliases: string[];
  views: number;
  banner: string;
}

export interface IFActorViewStudio {
  id: string;
  title: string;
}

export interface IFActorViewProperty {
  name: string;
  value: string;
}

export interface IFStudioListView {
  id: string;
  title: string;
  preview: Url;
}

export interface IFStudioView {
  id: string;
  title: string;
  preview: Url;
  description: string | Buffer;
  views: number;
}

export interface IFCategoryListView {
  id: string;
  title: string;
  preview: Url;
}
