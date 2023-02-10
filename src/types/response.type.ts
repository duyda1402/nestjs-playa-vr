export interface Status {
  code: number;
  message?: string;
}

export interface Rsp<T> {
  status: Status;
  data?: T;
  page?: number;
  perPage?: number;
}

export type SemVersion = string;
export type Url = string;

export interface Configuration {
  site_name: string;
  site_logo: Url;
  actors: boolean;
  categories: boolean;
  studios: boolean;
}
