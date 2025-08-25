// scripts/build-asset-manifest.js
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const GLB_DIR = path.join(ROOT, 'public', 'assets', 'map');
const OUT_PATH = path.join(ROOT, 'public', 'assets', 'manifest.json');

function inferDefaults(fileName) {
  const base = fileName.toLowerCase();
  if (base.includes('fence')) return { role: 'fence' };
  if (base.includes('crypt'))
    return {
      role: 'landmark',
      weight: 0.5,
      minDist: 4,
      scale: [1.1, 1.3],
      rotateY: true,
    };
  if (base.includes('pine'))
    return { weight: 1.5, minDist: 3.2, scale: [0.9, 1.3], rotateY: true };
  if (base.includes('grave') || base.includes('gravestone'))
    return { weight: 1.2, minDist: 2.2, scale: [0.9, 1.1], rotateY: true };
  if (base.includes('pumpkin'))
    return {
      weight: 1.0,
      minDist: 1.6,
      scale: [0.8, 1.2],
      rotateY: true,
      rotationYRange: [-Math.PI, Math.PI],
    };
  return { weight: 1.0, minDist: 2.0, scale: [0.9, 1.2], rotateY: true };
}

const entries = fs.readdirSync(GLB_DIR).filter((f) => f.endsWith('.glb'));

const models = entries.map((file) => {
  const id = path.basename(file, '.glb');
  const url = `/assets/map/${file}`;
  return {
    id,
    url,
    ...inferDefaults(file),
  };
});

// 地圖預設參數
const manifest = {
  map: {
    width: 60,
    depth: 60,
    fenceStep: 3,
    density: 0.5, // 0～1：控制總體道具「多寡」
  },
  models,
};

fs.writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2));
console.log(`✓ Asset manifest generated: ${OUT_PATH}`);
