export interface Status {
  code: number;
  message?: string;
}

export interface IFRsp<Type> {
  status: Status;
  data?: Type;
}

export type IFSemVersion = string;
export type Url = string;

export interface IFConfig {
  site_name: string;
  site_logo: Url;
  actors: boolean;
  categories: boolean;
  studios: boolean;
}

export interface IFPage<Type> {
  page_index: number;
  page_size: number;
  page_total: number;
  item_total: number;
  content: Type;
}
