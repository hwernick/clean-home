const fs = require('fs');
const path = require('path');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '../assets');
const philosophersDir = path.join(assetsDir, 'philosophers');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}
if (!fs.existsSync(philosophersDir)) {
  fs.mkdirSync(philosophersDir);
}

// Create a simple SVG placeholder for each philosopher
const philosophers = [
  'socrates',
  'plato',
  'aristotle',
  'mill',
  'locke',
  'descartes',
  'nietzsche'
];

philosophers.forEach(name => {
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#333"/>
      <text x="100" y="100" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${name.charAt(0).toUpperCase() + name.slice(1)}
      </text>
    </svg>
  `;
  
  fs.writeFileSync(path.join(philosophersDir, `${name}.svg`), svg);
  console.log(`Created placeholder for ${name}`);
}); 