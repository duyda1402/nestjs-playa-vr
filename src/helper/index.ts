import * as urlParse from 'url-parse';
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
    domain = 'https://mcdn.vrporn.com/';
  }

  const urlPart = urlParse(url);

  return `${domain}${urlPart?.pathname}`;
}

export function getTableWithPrefix(table: string): string {
  return `wp_rkr3j35p5r_${table}`;
}
