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
