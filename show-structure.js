import fs from 'fs';
import path from 'path';

function showStructure(dir, prefix = '') {
  const items = fs.readdirSync(dir);
  
  items.forEach((item, index) => {
    if (item === 'node_modules') return;
    
    const itemPath = path.join(dir, item);
    const isLast = index === items.length - 1;
    const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
    
    console.log(currentPrefix + item);
    
    if (fs.statSync(itemPath).isDirectory()) {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      showStructure(itemPath, nextPrefix);
    }
  });
}

console.log('Project Structure:');
showStructure('.');