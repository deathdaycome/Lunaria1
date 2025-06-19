import fs from 'fs';
import path from 'path';

function showStructure(dir, prefix = '', outputLines = []) {
  // Папки и файлы, которые нужно исключить
  const excludeDirs = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '.cache',
    'coverage',
    '.nyc_output',
    'tmp',
    'temp'
  ];
  
  // Папки, которые обязательно нужно показать (если существуют)
  const importantDirs = [
    'src',
    'public',
    'components',
    'hooks',
    'utils',
    'scripts',
    'migrations',
    'client',
    'server',
    'shared',
    'pages',
    'app',
    'lib',
    'styles',
    'assets'
  ];
  
  try {
    const items = fs.readdirSync(dir);
    
    // Фильтруем элементы
    const filteredItems = items.filter(item => {
      const itemPath = path.join(dir, item);
      const isDirectory = fs.statSync(itemPath).isDirectory();
      
      // Исключаем ненужные папки
      if (isDirectory && excludeDirs.includes(item)) {
        return false;
      }
      
      // Для корневой директории показываем важные папки и конфигурационные файлы
      if (prefix === '') {
        if (isDirectory) {
          return importantDirs.includes(item);
        } else {
          // Показываем важные конфигурационные файлы в корне
          const importantFiles = [
            'package.json',
            'package-lock.json',
            'yarn.lock',
            'next.config.js',
            'next.config.ts',
            'tsconfig.json',
            'tailwind.config.js',
            'tailwind.config.ts',
            '.env',
            '.env.local',
            '.env.example',
            'README.md',
            'Dockerfile',
            '.gitignore'
          ];
          return importantFiles.some(pattern => item.includes(pattern.replace('*', '')));
        }
      }
      
      return true;
    });
    
    filteredItems.forEach((item, index) => {
      const itemPath = path.join(dir, item);
      const isLast = index === filteredItems.length - 1;
      const currentPrefix = prefix + (isLast ? '└── ' : '├── ');
      
      const line = currentPrefix + item;
      outputLines.push(line);
      console.log(line);
      
      if (fs.statSync(itemPath).isDirectory()) {
        const nextPrefix = prefix + (isLast ? '    ' : '│   ');
        showStructure(itemPath, nextPrefix, outputLines);
      }
    });
  } catch (error) {
    console.error(`Ошибка при чтении директории ${dir}:`, error.message);
  }
  
  return outputLines;
}

function saveProjectStructure() {
  console.log('Project Structure:');
  const structureLines = ['Project Structure:', ''];
  
  // Получаем структуру и сохраняем в массив
  const lines = showStructure('.', '', []);
  structureLines.push(...lines);
  
  // Добавляем информацию о времени создания
  const timestamp = new Date().toLocaleString('ru-RU');
  structureLines.push('', `Создано: ${timestamp}`);
  
  // Сохраняем в файл
  const outputContent = structureLines.join('\n');
  const fileName = 'project-structure.txt';
  
  try {
    fs.writeFileSync(fileName, outputContent, 'utf8');
    console.log(`\nСтруктура проекта сохранена в файл: ${fileName}`);
  } catch (error) {
    console.error('Ошибка при сохранении файла:', error.message);
  }
}

// Запуск функции
saveProjectStructure();