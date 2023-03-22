export * from './auth.type';
export * from './data.type';
export * from './response.type';

export type QueryBody = {
  page?: number;
  perPage?: number;
  order?: string;
  direction?: string;
  title?: string;
};

export type LoggingData = {
  event_type: "videoDownloaded" | "videoStreamEnd";
  video_id: number;
  video_quality: string;
  duration: number;
};