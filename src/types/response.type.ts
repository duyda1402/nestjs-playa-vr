export interface Status {
  code: number;
  message?: string;
}

export interface Rsp<T> {
  status: Status;
  data?: T;
}
