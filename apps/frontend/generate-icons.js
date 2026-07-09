import { Jimp } from 'jimp';
import path from 'path';

async function generate() {
  const source = 'public/illustrations/subbee-logo.png';
  
  const img = await Jimp.read(source);
  
  // Favicon (64x64)
  const favicon = img.clone();
  favicon.resize({ w: 64, h: 64 });
  favicon.write('public/favicon.png');

  // PWA 192x192
  const pwa192 = img.clone();
  pwa192.resize({ w: 192, h: 192 });
  pwa192.write('public/pwa-192x192.png');
  
  // PWA 512x512
  const pwa512 = img.clone();
  pwa512.resize({ w: 512, h: 512 });
  pwa512.write('public/pwa-512x512.png');
  
  // Apple Touch Icon (180x180)
  const appleTouch = img.clone();
  appleTouch.resize({ w: 180, h: 180 });
  appleTouch.write('public/apple-touch-icon.png');
  
  console.log('PWA icons generated successfully!');
}

generate().catch(console.error);
