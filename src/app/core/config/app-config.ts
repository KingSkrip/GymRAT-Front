import { AppConfig } from './app-config.model';

export const APP_CONFIG: AppConfig = {
  // ========================================
  // LOCAL
  // ========================================
  apiUrl: 'http://localhost:8000/api/',
  apiBase: 'http://localhost:8000',
  apiLanUrl: 'http://192.168.100.86:8000/api/', // ← IP real de LAN
  tcpPort: '9100',
  reverb: {
    key: 'skihewaszkyxb28di1za',
    host: 'localhost',
    port: 8080,
    scheme: 'http',
  },

  //SERVIDOR
  // apiUrl: 'https://fibrasan.ddns.net/api/public/api/',
  // apiBase: 'https://fibrasan.ddns.net/api/public',

  // reverb: {
  //   key: 'skihewaszkyxb28di1za',
  //   // host: 'https://gamecube-ignored-either-led.trycloudflare.com',
  //   host: 'gamecube-ignored-either-led.trycloudflare.com',
  //   port: 443,
  //   scheme: 'https',
  // },

  //TUNNEL
  // apiUrl: 'https://tells-effectively-modeling-fossil.trycloudflare.com/api/',
  // apiBase: 'https://tells-effectively-modeling-fossil.trycloudflare.com',

  // reverb: {
  //   key: 'skihewaszkyxb28di1za',
  //   // host: 'https://gamecube-ignored-either-led.trycloudflare.com',
  //   host: 'gamecube-ignored-either-led.trycloudflare.com',
  //   port: 443,
  //   scheme: 'https',
  // },

  //OTROS
  appName: 'Gym Rat',
  environment: 'dev',
  featureFlagX: true,
  // ========================================
  // ASSETS
  // ========================================
  logo: 'images/icono.png',
  logoText: 'images/icono-text.png',
  IconMoreText: 'images/icon+text.png',
};
