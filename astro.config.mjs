import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://buildlogic.eu',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'sk',
    locales: ['sk', 'en', 'ru'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap()],
});
