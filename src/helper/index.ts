import * as urlParse from 'url-parse';
import * as md5 from 'crypto-js/md5';
import { Md5 as HashMd5 } from 'ts-md5';

export function convertTimeToSeconds(timeString: string) {
  const parts = timeString.split(':');
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  return minutes * 60 + seconds;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.DB_DATABASE === 'vrporn_live';
}

export function getCurrentTimestamp(): number {
  return Math.round(Date.now() / 1000);
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

  if (urlPart.pathname.substring(0, 1) === '/') {
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
  if (typeof def === 'undefined') {
    def = 0;
  }

  const _num = Number(num);

  return !isNaN(_num) ? _num : def;
}

export function promiseEmpty(value?: any): Promise<any> {
  value = typeof value === 'undefined' ? null : value;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return new Promise((resolve, reject) => {
    resolve(value);
  });
}

export function generateKeyCache(path: string, objFilter: any) {
  const objStr = JSON.stringify(objFilter);
  const hasherObj = HashMd5.hashStr(objStr);
  return `${path}:${hasherObj}`;
}

export function validatedKeyCache(key: string, objFilter: any) {
  const objStr = JSON.stringify(objFilter);
  return HashMd5.hashStr(objStr) === key.split(':')?.[1];
}

export function converProperties(row: { name: string; value: string }) {
  const label = {
    birthdate: 'Birthdate',
    birthplate: 'Birthplace',
    height: 'Height',
    weight: 'Weight',
    breast_size: 'Breast Size',
    hair_color: 'Hair color',
    eyecolor: 'Eye color',
    ethnicity: 'Ethnicity',
    country_of_origin: 'Country of origin',
  };
  let labelMap = 'Other';
  let valueMap = '';
  if (row.name === 'birthdate') {
    const dyear = row.value.slice(0, 4);
    const dmonth = row.value.slice(4, 6);
    const dday = row.value.slice(6, 8);
    labelMap = label[row.name] ? label[row.name] : 'Other';
    valueMap = row.value && `${dday}/${dmonth}/${dyear}`;
  } else if (row.name === 'height') {
    labelMap = label[row.name] ? label[row.name] : 'Other';
    valueMap = row.value ? row.value + ' cm' : '';
  } else if (row.name === 'weight') {
    labelMap = label[row.name] ? label[row.name] : 'Other';
    valueMap = row.value ? row.value + ' kg' : '';
  } else {
    labelMap = label[row.name] ? label[row.name] : 'Other';
    valueMap = row.value;
  }

  return { name: labelMap, value: valueMap };
}
