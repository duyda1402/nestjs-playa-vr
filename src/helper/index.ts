export function convertTimeToSeconds(timeString: string) {
  const parts = timeString.split(':');
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  return minutes * 60 + seconds;
}

export function isProduction(): boolean {
  return false;//For test

  return process.env.NODE_ENV === 'production';
}

export function arrayPluck(arr: any[], field: string): any[] {
  return arr.map((v) => v[field]);
}

export function appendCdnDomain(path: string): string {
    return `https://mcdn.vrporn.com/${path}`;
}

export function getTableWithPrefix(table: string): string {
    return `wp_rkr3j35p5r_${table}`;
}