import { Jimp } from 'jimp';
import { join } from 'path';

const PUBLIC_DIR = join(process.cwd(), 'public');

async function resizeImage(
  inputPath: string,
  outputPath: string,
  width: number,
  height: number
) {
  const image = await Jimp.read(inputPath);
  await image
    .resize({ w: width, h: height })
    .write(outputPath as `${string}.${string}`);
  console.log(`Resized ${inputPath} -> ${outputPath} (${width}x${height})`);
}

async function main() {
  console.log('Fixing Mini App images...\n');

  // icon.png: 516x515 -> 1024x1024 (no alpha)
  await resizeImage(
    join(PUBLIC_DIR, 'icon.png'),
    join(PUBLIC_DIR, 'icon.png'),
    1024,
    1024
  );

  // splash.png: 1408x768 -> 200x200
  await resizeImage(
    join(PUBLIC_DIR, 'splash.png'),
    join(PUBLIC_DIR, 'splash.png'),
    200,
    200
  );

  // preview.png: 391x470 -> 1280x2778
  await resizeImage(
    join(PUBLIC_DIR, 'preview.png'),
    join(PUBLIC_DIR, 'preview.png'),
    1280,
    2778
  );

  console.log('\nAll images fixed!');
}

main().catch(console.error);