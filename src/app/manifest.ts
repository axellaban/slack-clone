import type { MetadataRoute } from 'next';

// makes the app installable, which iOS requires for web push notifications
const manifest = (): MetadataRoute.Manifest => ({
  name: 'Slack Clone',
  short_name: 'Slack Clone',
  start_url: '/',
  display: 'standalone',
  background_color: '#481349',
  theme_color: '#481349',
  icons: [{ src: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
});

export default manifest;
