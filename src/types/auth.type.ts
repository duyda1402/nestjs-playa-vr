export interface Token {
  access_token: string;
  refresh_token: string;
}

export interface UserProfile {
  display_name: string;
  role: string;
}

export interface Configuration {
  site_name: string;
  site_logo: string;
  actors: boolean;
  categories: boolean;
  studios: boolean;
}
