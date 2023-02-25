import * as urlParse from 'url-parse';
import * as md5 from 'crypto-js/md5';
export function convertTimeToSeconds(timeString: string) {
  const parts = timeString.split(':');
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  return minutes * 60 + seconds;
}

export function isProduction(): boolean {
  return false; //For test

  return process.env.NODE_ENV === 'production';
}

export function arrayPluck(arr: any[], field: string): any[] {
  return arr.map((v) => v[field]);
}

export function appendCdnDomain(path: string): string {
  return `https://mcdn.vrporn.com/${path}`;
}

export function getDownloadId(downloadUrl: string): number {
  if (!isNaN(Number(downloadUrl))) {
    return Number(downloadUrl);
  }

  const parts = downloadUrl.split('/');
  let len = parts.length - 1;

  if (parts[len] === '') {
    len--;
  }

  return Number(parts[len]);
}

export function cdnReplaceDomain(url: string, domain?: string): string {
  if (!domain) {
    domain = 'https://mcdn.vrporn.com';
  }

  const urlPart: any = urlParse(url);

  if(urlPart.pathname.substring(0, 1) === '/') {
    urlPart.pathname = urlPart.pathname.substring(1);
  }

  return `${domain}/${urlPart.pathname}${urlPart.query}`;
}

export function signCdnUrl(url: string): string {
  if (!url) {
    return url;
  }

  const urlParts: any = urlParse(url);
  let link = '',
    signStr = '';

  const TTL = 172800;
  const secretKey = 'h6stZuj5TJeEA2EZZnLJ+ERNHnxkIKJVu532irLr';
  const now = Math.round(Date.now() / 1000);

  if (urlParts.pathname) {
    link = urlParts.pathname;
  }

  signStr = link;
  if (urlParts.query) {
    urlParts.query += '&';
  } else {
    urlParts.query = '?';
  }

  urlParts.query += `expires=${now + TTL}`;

  link += `${urlParts.query}`;
  signStr += `${urlParts.query}`;

  signStr += `&secret=${secretKey}`;

  const signature = md5(signStr);

  link += `&token=${signature}`;

  let signedUrl = `${urlParts.protocol}//${urlParts.hostname}`;

  if (urlParts.port) {
    signedUrl += `:${urlParts.port}`;
  }

  signedUrl += link;

  return signedUrl;
}

export function getTableWithPrefix(table: string): string {
  return `wp_rkr3j35p5r_${table}`;
}

export function parseNumber(num: any, def?: number) {
  if(typeof def === 'undefined') {
    def = 0;
  }

  const _num = Number(num);

  return !isNaN(_num) ? _num : def;
}

export function promiseEmpty(): Promise<any> {
  return new Promise((resolve, reject) => {resolve([]);})
}