import React from "react";

// Компонент для форматирования текста натальной карты
const NatalChartText = ({ text }: { text: string }) => {
  const formatText = (rawText: string) => {
    if (!rawText) return [];

    const sections = [];
    let currentSection = "";
    const lines = rawText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Проверяем, является ли строка заголовком раздела
      if (line.startsWith('### ') || 
          line.startsWith('#### ') ||
          line.match(/^### \d+\. [А-ЯЁ]/i) ||
          line.match(/^#### \d+\. [А-ЯЁ]/i)) {
        
        // Сохраняем предыдущий раздел
        if (currentSection.trim()) {
          sections.push(currentSection.trim());
        }
        
        // Начинаем новый раздел
        currentSection = line;
      } else {
        // Добавляем строку к текущему разделу
        currentSection += '\n' + line;
      }
    }
    
    // Добавляем последний раздел
    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }
    
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      if (!lines.length) return null;
      
      const firstLine = lines[0].trim();
      let title = "";
      let content = lines.slice(1).join('\n');
      
      // Определяем заголовок
      if (firstLine.startsWith('### ')) {
        title = firstLine.replace('### ', '');
      } else if (firstLine.startsWith('#### ')) {
        title = firstLine.replace('#### ', '');
      } else {
        // Если нет явного заголовка, весь текст считаем контентом
        content = section;
      }
      
      // Получаем иконку для раздела
      const getIconForSection = (title: string) => {
        if (title.includes('Характеристика личности') || title.includes('знаку зодиака')) return '♈';
        if (title.includes('планет') || title.includes('характер')) return '🪐';
        if (title.includes('Сильные и слабые')) return '⚖️';
        if (title.includes('Таланты') || title.includes('способности')) return '✨';
        if (title.includes('Рекомендации') || title.includes('жизненного пути')) return '🎯';
        if (title.includes('Совместимость')) return '💫';
        if (title.includes('Благоприятные') || title.includes('числа')) return '🔮';
        return '🌟';
      };
      
      return (
        <div key={index} className="mb-8">
          {index > 0 && <div className="border-t border-gradient-to-r from-purple-500/30 via-blue-500/30 to-purple-500/30 my-8"></div>}
          
          {title && (
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg">
                {getIconForSection(title)}
              </div>
              <h4 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400">
                {title}
              </h4>
            </div>
          )}
          
          <div className="text-white text-base leading-relaxed space-y-4 font-cormorant pl-4">
            {formatContent(content)}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  const formatContent = (content: string) => {
    if (!content) return null;

    const paragraphs = content.split('\n').filter(line => line.trim());
    
    return paragraphs.map((paragraph, idx) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return null;
      
      // Жирный подзаголовок с **текст**
      if (trimmed.match(/^\*\*[^*]+\*\*:?/)) {
        const boldText = trimmed.replace(/^\*\*([^*]+)\*\*:?\s*/, '$1');
        const restText = trimmed.replace(/^\*\*[^*]+\*\*:?\s*/, '');
        
        return (
          <div key={idx} className="mt-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400"></div>
              <h5 className="font-bold text-purple-300 text-lg">
                {boldText}
              </h5>
            </div>
            {restText && (
              <p className="text-white/90 leading-relaxed ml-4">
                {restText}
              </p>
            )}
          </div>
        );
      }
      
      // Список с дефисами
      if (trimmed.startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start mb-3 ml-4">
            <span className="text-purple-400 mr-3 flex-shrink-0 mt-1">✦</span>
            <span className="text-white/90">
              {trimmed.replace(/^-\s*/, '')}
            </span>
          </div>
        );
      }
      
      // Особые характеристики (совместимость)
      if (trimmed.includes('наиболее совместим') || trimmed.includes('Меньше всего совместимости')) {
        return (
          <div key={idx} className="mb-4 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
            <p className="text-white/90 leading-relaxed font-medium">
              {trimmed}
            </p>
          </div>
        );
      }
      
      // Выделение знаков зодиака
      if (trimmed.includes('Близнецами') || trimmed.includes('Водолеем') || trimmed.includes('Овном') || 
          trimmed.includes('Козерогом') || trimmed.includes('Скорпионом')) {
        return (
          <div key={idx} className="mb-3 ml-4">
            <p className="text-white/90 leading-relaxed">
              <span className="text-purple-300 font-medium">
                {trimmed.split(':')[0]}:
              </span>
              <span className="ml-2">
                {trimmed.split(':').slice(1).join(':')}
              </span>
            </p>
          </div>
        );
      }
      
      // Обычный абзац
      return (
        <p key={idx} className="text-white/90 leading-relaxed mb-4 text-justify">
          {trimmed}
        </p>
      );
    }).filter(Boolean);
  };

  const formattedSections = formatText(text);

  if (!formattedSections.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">
          🔮
        </div>
        <p className="text-white/60 text-lg">Анализ натальной карты недоступен</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-none">
      {/* Заголовок с эффектом */}
      <div className="text-center mb-12">
        <div className="relative">
          <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 mb-2">
            ✨ Интерпретация натальной карты ✨
          </h3>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-full"></div>
        </div>
      </div>
      
      {/* Форматированные секции */}
      <div className="space-y-8">
        {formattedSections}
      </div>
      
      {/* Завершающий элемент */}
      <div className="text-center mt-12 pt-8 border-t border-gradient-to-r from-purple-500/30 via-blue-500/30 to-purple-500/30">
        <div className="flex justify-center gap-2 mb-4">
          {['🌟', '✨', '🔮', '✨', '🌟'].map((star, i) => (
            <span key={i} className="text-2xl animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
              {star}
            </span>
          ))}
        </div>
        <p className="text-purple-300 font-medium italic">
          Помните: звёзды склоняют, но не принуждают
        </p>
      </div>
    </div>
  );
};

export default NatalChartText;