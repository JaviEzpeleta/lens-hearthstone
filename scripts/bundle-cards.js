const fs = require('fs');
const path = require('path');

const cardsDir = path.join(__dirname, '../public/cards');
const outputFile = path.join(__dirname, '../public/all-cards.json');

const files = fs.readdirSync(cardsDir).filter(f => f.endsWith('.json'));
const cards = files.map(f => JSON.parse(fs.readFileSync(path.join(cardsDir, f), 'utf-8')));

fs.writeFileSync(outputFile, JSON.stringify(cards, null, 2));
console.log(`Bundled ${cards.length} cards to all-cards.json`);
