export interface AppConfig {
  apiUrl: string;
  apiBase: string;

  // ASSETS
  logo: string;
  logoText: string;
  IconMoreText: string;

  appName: string;
  environment: 'dev' | 'prod';
  featureFlagX: boolean;

  tcpPort?: string;
  apiLanUrl?: string;

  reverb: {
    key: string;
    host: string;
    port: number;
    scheme: 'http' | 'https';
  };
}