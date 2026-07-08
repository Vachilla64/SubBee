import fs from 'fs';
import path from 'path';
import { Jimp } from 'jimp';

const assetDirs = [
  './public/illustrations',
  './public/icons'
];

async function optimizeImage(filePath) {
  const statsBefore = fs.statSync(filePath);
  const sizeBefore = statsBefore.size;
  
  const image = await Jimp.read(filePath);
  const { width, height } = image.bitmap;
  
  let resized = false;
  const MAX_DIM = 512;
  
  if (width > MAX_DIM || height > MAX_DIM) {
    if (width > height) {
      image.resize({ w: MAX_DIM });
    } else {
      image.resize({ h: MAX_DIM });
    }
    resized = true;
  }
  
  const buffer = await image.getBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  
  const statsAfter = fs.statSync(filePath);
  const sizeAfter = statsAfter.size;
  const pctSaved = ((sizeBefore - sizeAfter) / sizeBefore * 100).toFixed(1);
  
  console.log(`Optimized ${path.basename(filePath)}:`);
  console.log(`  - Dimensions: ${width}x${height} ${resized ? `-> ${image.bitmap.width}x${image.bitmap.height}` : '(no resize)'}`);
  console.log(`  - Size: ${(sizeBefore / 1024).toFixed(1)} KB -> ${(sizeAfter / 1024).toFixed(1)} KB (${pctSaved}% saved)`);
  
  return { sizeBefore, sizeAfter };
}

async function main() {
  let totalBefore = 0;
  let totalAfter = 0;

  for (const assetsDir of assetDirs) {
    if (!fs.existsSync(assetsDir)) continue;
    const files = fs.readdirSync(assetsDir);
    const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png'));
    
    for (const file of pngFiles) {
      const filePath = path.join(assetsDir, file);
      try {
        const { sizeBefore, sizeAfter } = await optimizeImage(filePath);
        totalBefore += sizeBefore;
        totalAfter += sizeAfter;
      } catch (err) {
        console.error(`Error optimizing ${file}:`, err.message);
      }
    }
  }
  
  const saved = totalBefore - totalAfter;
  console.log('\n=====================================');
  console.log(`Total size before: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total size after:  ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total saved:       ${(saved / 1024 / 1024).toFixed(2)} MB (${(totalBefore > 0 ? (saved / totalBefore * 100).toFixed(1) : 0)}% reduction)`);
  console.log('=====================================');
}

main().catch(console.error);
