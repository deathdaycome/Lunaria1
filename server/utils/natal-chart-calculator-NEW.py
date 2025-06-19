#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Натальная карта - исправленная версия для kerykeion 2.0.0
Принимает JSON на stdin, возвращает JSON на stdout
"""

import json
import sys
import os
import io
import re
from pathlib import Path

# ИСПРАВЛЕНИЕ 1: Добавляем импорт typing для Python 3.8
try:
    from typing import Dict, List, Any, Optional, Union
except ImportError:
    # Fallback для старых версий Python
    pass

def clean_unicode_data(data):
    """Очищает данные от проблемных Unicode символов и несериализуемых объектов"""
    if data is None:
        return None
    elif isinstance(data, str):
        # Удаляем суррогатные пары и проблемные символы
        cleaned = re.sub(r'[\udc00-\udfff]', '', data)
        cleaned = re.sub(r'[\ud800-\udbff]', '', cleaned) 
        return cleaned
    elif isinstance(data, (Path, os.PathLike)):
        # Конвертируем Path объекты в строки
        return str(data)
    elif isinstance(data, dict):
        try:
            return {str(key): clean_unicode_data(value) for key, value in data.items()}
        except Exception as e:
            print(f"⚠️ Error cleaning dict: {e}", file=sys.stderr)
            return str(data)
    elif isinstance(data, (list, tuple)):
        try:
            return [clean_unicode_data(item) for item in data]
        except Exception as e:
            print(f"⚠️ Error cleaning list/tuple: {e}", file=sys.stderr)
            return str(data)
    elif isinstance(data, (int, float, bool)):
        return data
    elif hasattr(data, '__dict__'):
        # Для объектов с атрибутами - конвертируем в словарь
        try:
            obj_dict = {}
            for attr_name in dir(data):
                if not attr_name.startswith('_'):  # Пропускаем приватные атрибуты
                    try:
                        attr_value = getattr(data, attr_name)
                        if not callable(attr_value):  # Пропускаем методы
                            obj_dict[attr_name] = clean_unicode_data(attr_value)
                    except Exception:
                        continue
            return obj_dict
        except Exception as e:
            print(f"⚠️ Error cleaning object: {e}", file=sys.stderr)
            return str(data)
    else:
        # Для всех остальных типов - конвертируем в строку
        try:
            return str(data)
        except Exception:
            return "non-serializable-object"

def transliterate_name(name):
    """Транслитерирует русские имена в латиницу для безопасных имен файлов"""
    print(f"🔄 Original name: '{name}' (type: {type(name)})", file=sys.stderr)
    
    # Сначала убеждаемся что это строка в правильной кодировке
    if isinstance(name, bytes):
        name = name.decode('utf-8')
    
    translit_dict = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    }
    
    result = ''
    for char in name:
        if char in translit_dict:
            result += translit_dict[char]
        elif char.isalnum() or char in '-_':
            result += char
        else:
            result += '_'
    
    print(f"🔄 Transliterated: '{result}'", file=sys.stderr)
    return result

def safe_json_parse(input_text):
    """
    Устойчивый парсер JSON, который обходит проблемы с кодировкой
    """
    import re
    
    if not input_text or not input_text.strip():
        raise ValueError("Empty input")
    
    # Удаляем все возможные проблемные символы
    cleaned = input_text.strip()
    
    # Удаляем BOM и невидимые символы
    cleaned = cleaned.lstrip('\ufeff\ufffe\x00')
    
    # Удаляем управляющие символы
    cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', cleaned)
    
    print(f"🔍 Trying to parse: {repr(cleaned[:150])}", file=sys.stderr)
    
    # Сначала пробуем стандартный парсинг
    try:
        result = json.loads(cleaned)
        print("✅ Standard JSON parsing successful", file=sys.stderr)
        return result
    except json.JSONDecodeError as e:
        print(f"⚠️ Standard JSON failed: {e}", file=sys.stderr)
    
    # Если стандартный парсинг не работает, пробуем восстановить JSON
    try:
        # Если входные данные выглядят как ключ:значение без кавычек
        if ':' in cleaned and '{' not in cleaned and '"' not in cleaned:
            print("🔧 Detected key:value format without quotes, reconstructing JSON", file=sys.stderr)
            
            # Разбиваем на пары ключ:значение
            pairs = cleaned.split(',')
            json_obj = {}
            
            for pair in pairs:
                if ':' in pair:
                    key, value = pair.split(':', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # Попробуем преобразовать значение в правильный тип
                    if value.isdigit():
                        json_obj[key] = int(value)
                    elif value.replace('.', '').isdigit():
                        json_obj[key] = float(value)
                    elif value.lower() in ('true', 'false'):
                        json_obj[key] = value.lower() == 'true'
                    else:
                        json_obj[key] = value
            
            print(f"🔧 Reconstructed JSON: {json_obj}", file=sys.stderr)
            return json_obj
        
        # Попробуем заменить одинарные кавычки на двойные
        fixed = cleaned.replace("'", '"')
        result = json.loads(fixed)
        print("✅ Fixed with quote replacement", file=sys.stderr)
        return result
        
    except Exception as e:
        print(f"⚠️ Quote replacement failed: {e}", file=sys.stderr)
    
    # Последняя попытка - извлекаем данные регулярными выражениями
    try:
        print("🔧 Using regex extraction as last resort", file=sys.stderr)
        
        # Поддерживаем оба формата: с кавычками и без
        user_match = re.search(r'(?:"user_name"|user_name)\s*:\s*["\']?([^",\'}]+)["\']?', cleaned)
        year_match = re.search(r'(?:"birth_year"|birth_year)\s*:\s*(\d+)', cleaned)
        month_match = re.search(r'(?:"birth_month"|birth_month)\s*:\s*(\d+)', cleaned)
        day_match = re.search(r'(?:"birth_day"|birth_day)\s*:\s*(\d+)', cleaned)
        hour_match = re.search(r'(?:"birth_hour"|birth_hour)\s*:\s*(\d+)', cleaned)
        minute_match = re.search(r'(?:"birth_minute"|birth_minute)\s*:\s*(\d+)', cleaned)
        city_match = re.search(r'(?:"birth_city"|birth_city)\s*:\s*["\']?([^",\'}]+)["\']?', cleaned)
        country_match = re.search(r'(?:"birth_country_code"|birth_country_code)\s*:\s*["\']?([^",\'}]+)["\']?', cleaned)
        
        if all([user_match, year_match, month_match, day_match, hour_match, minute_match, city_match, country_match]):
            result = {
                "user_name": user_match.group(1),
                "birth_year": int(year_match.group(1)),
                "birth_month": int(month_match.group(1)),
                "birth_day": int(day_match.group(1)),
                "birth_hour": int(hour_match.group(1)),
                "birth_minute": int(minute_match.group(1)),
                "birth_city": city_match.group(1),
                "birth_country_code": country_match.group(1)
            }
            print(f"✅ Regex extraction successful: {result}", file=sys.stderr)
            return result
        else:
            missing = []
            if not user_match: missing.append("user_name")
            if not year_match: missing.append("birth_year")
            if not month_match: missing.append("birth_month")
            if not day_match: missing.append("birth_day")
            if not hour_match: missing.append("birth_hour")
            if not minute_match: missing.append("birth_minute")
            if not city_match: missing.append("birth_city")
            if not country_match: missing.append("birth_country_code")
            
            raise ValueError(f"Could not extract required fields: {missing}")
            
    except Exception as e:
        print(f"❌ Regex extraction failed: {e}", file=sys.stderr)
        raise ValueError(f"Could not parse JSON after all attempts: {cleaned[:100]}")

def calculate_natal_chart(input_data):
    print("🐍 FIXED VERSION FOR KERYKEION 2.0.0!", file=sys.stderr)
    print(f"🐍 Input name: {input_data.get('user_name')}", file=sys.stderr)

    """
    Основная функция расчета натальной карты
    ИСПРАВЛЕНО ДЛЯ KERYKEION 2.0.0
    """
    
    try:
        # ИСПРАВЛЕННЫЙ импорт для kerykeion 2.0.0 - возвращаем старую рабочую логику
        from kerykeion import KrInstance, MakeSvgInstance
        KERYKEION_VERSION = "2.0"
        print("✅ Using kerykeion 2.0.0", file=sys.stderr)
    except ImportError:
        try:
            # Fallback на старую версию 1.x
            from kerykeion.kr_types import KrInstance
            from kerykeion.charts.charts_utils import MakeSvgInstance
            KERYKEION_VERSION = "1.x"
            print("✅ Using kerykeion 1.x", file=sys.stderr)
        except ImportError:
            print("❌ Kerykeion library not found", file=sys.stderr)
            return {
                "error": "Библиотека kerykeion не установлена. Установите: pip install kerykeion",
                "svg_name": None,
                "ai_prompt": None,
                "success": False
            }

    # ✅ ИСПРАВЛЕННАЯ НАСТРОЙКА АБСОЛЮТНОГО ПУТИ К ПАПКЕ SVG
    # Получаем путь к папке server
    current_file = Path(__file__)  # natal-chart-calculator-FIXED.py
    server_dir = current_file.parent.parent  # поднимаемся на уровень server/
    svg_path = server_dir / 'public' / 'natal-charts'

    # Создаем папку если не существует
    svg_path.mkdir(parents=True, exist_ok=True)

    # Отладочные логи
    print(f"🔧 Current file: {current_file}", file=sys.stderr)
    print(f"🔧 Server directory: {server_dir}", file=sys.stderr)
    print(f"🔧 SVG absolute path: {svg_path}", file=sys.stderr)
    print(f"🔧 SVG path exists: {svg_path.exists()}", file=sys.stderr)

    # Конвертируем в строку для дальнейшего использования
    svg_path_str = str(svg_path)
    
    # ✅ СОЗДАЕМ БЕЗОПАСНОЕ ИМЯ ФАЙЛА С ТРАНСЛИТЕРАЦИЕЙ
    safe_name = transliterate_name(input_data['user_name'])
    safe_name = re.sub(r'[^\w\-]', '', safe_name)
    if not safe_name:
        safe_name = "User"
    expected_svg_name = f"{safe_name}-Natal-Chart.svg"

    print(f"🔄 Expected SVG name: '{expected_svg_name}'", file=sys.stderr)

    def translate_natal_chart(natal_data):
        """
        Переводит натальную карту JSON на русский язык.
        """
        # Словари для перевода
        SIGN_TRANSLATION = {
            "Ari": "Овен", "Tau": "Телец", "Gem": "Близнецы", "Can": "Рак",
            "Leo": "Лев", "Vir": "Дева", "Lib": "Весы", "Sco": "Скорпион",
            "Sag": "Стрелец", "Cap": "Козерог", "Aqu": "Водолей", "Pis": "Рыбы"
        }
        
        QUALITY_TRANSLATION = {
            "Cardinal": "Кардинальный",
            "Fixed": "Фиксированный",
            "Mutable": "Мутабельный"
        }
        
        ELEMENT_TRANSLATION = {
            "Fire": "Огонь", "Earth": "Земля", 
            "Air": "Воздух", "Water": "Вода"
        }
        
        HOUSE_TRANSLATION = {
            "First_House": "Первый дом",
            "Second_House": "Второй дом",
            "Third_House": "Третий дом",
            "Fourth_House": "Четвертый дом",
            "Fifth_House": "Пятый дом",
            "Sixth_House": "Шестой дом",
            "Seventh_House": "Седьмой дом",
            "Eighth_House": "Восьмой дом",
            "Ninth_House": "Девятый дом",
            "Tenth_House": "Десятый дом",
            "Eleventh_House": "Одиннадцатый дом",
            "Twelfth_House": "Двенадцатый дом"
        }

        HOUSE_NUMBER_TRANSLATION = {
        "First": "Первый",
        "Second": "Второй",
        "Third": "Третий",
        "Fourth": "Четвертый",
        "Fifth": "Пятый",
        "Sixth": "Шестой",
        "Seventh": "Седьмой",
        "Eighth": "Восьмой",
        "Ninth": "Девятый",
        "Tenth": "Десятый",
        "Eleventh": "Одиннадцатый",
        "Twelfth": "Двенадцатый"
        }
        
        POINT_TYPE_TRANSLATION = {
            "Planet": "Планета",
            "AxialCusps": "Осевая точка",
            "House": "Дом"
        }
        
        PLANET_TRANSLATION = {
            "Sun": "Солнце",
            "Moon": "Луна",
            "Mercury": "Меркурий",
            "Venus": "Венера",
            "Mars": "Марс",
            "Jupiter": "Юпитер",
            "Saturn": "Сатурн",
            "Uranus": "Уран",
            "Neptune": "Нептун",
            "Pluto": "Плутон",
            "Chiron": "Хирон",
            "Mean_Lilith": "Черная Луна (Лилит)",
            "Ascendant": "Асцендент",
            "Descendant": "Десцендент",
            "Medium_Coeli": "Середина неба",
            "Imum_Coeli": "Глубина неба",
            "Mean_Node": "Восходящий узел (Раху)",
            "True_Node": "Восходящий узел (истинный)",
            "Mean_South_Node": "Нисходящий узел (Кету)",
            "True_South_Node": "Нисходящий узел (истинный)"
        }
        
        MOON_PHASE_TRANSLATION = {
            "Waxing Crescent": "Растущий серп",
            "First Quarter": "Первая четверть",
            "Waxing Gibbous": "Растущая луна",
            "Full Moon": "Полнолуние",
            "Waning Gibbous": "Убывающая луна",
            "Last Quarter": "Последняя четверть",
            "Waning Crescent": "Убывающий серп",
            "New Moon": "Новолуние"
        }
        
        SYSTEM_TRANSLATION = {
            "Placidus": "Плацидус",
            "Koch": "Коха",
            "Regiomontanus": "Региомонтанус",
            "Whole": "Целых знаков",
            "Equal": "Равных домов",
            "Tropic": "Тропический",
            "Apparent Geocentric": "Видимый геоцентрический"
        }
        
        # Создаем копию данных для перевода
        translated_data = natal_data.copy()
        
        # Переводим системные поля напрямую
        for field in ["zodiac_type", "houses_system_name", "perspective_type"]:
            if field in translated_data and translated_data[field] in SYSTEM_TRANSLATION:
                translated_data[field] = SYSTEM_TRANSLATION[translated_data[field]]
        
        # Переводим лунную фазу
        if "lunar_phase" in translated_data:
            moon_phase = translated_data["lunar_phase"]
            if "moon_phase_name" in moon_phase and moon_phase["moon_phase_name"] in MOON_PHASE_TRANSLATION:
                moon_phase["moon_phase_name"] = MOON_PHASE_TRANSLATION[moon_phase["moon_phase_name"]]
        
        # Вспомогательная функция для перевода объектов карты
        def translate_point(point_data):
            translated = {}
            for key, value in point_data.items():
                if isinstance(value, dict):
                    translated[key] = translate_point(value)
                    continue
                # ДОБАВЛЯЕМ ПЕРЕВОД НОМЕРА ДОМА
                if key == "name" and value in HOUSE_TRANSLATION:
                    # Разбиваем название дома на части (например: "First_House")
                    parts = value.split('_')
                    if len(parts) > 0 and parts[0] in HOUSE_NUMBER_TRANSLATION:
                        # Создаем переведенное название в формате "Первый дом"
                        translated["name"] = f"{HOUSE_NUMBER_TRANSLATION[parts[0]]} дом"
                    else:
                        translated["name"] = HOUSE_TRANSLATION.get(value, value)
                else:    
                    if key == "quality" and value in QUALITY_TRANSLATION:
                        translated[key] = QUALITY_TRANSLATION[value]
                    elif key == "element" and value in ELEMENT_TRANSLATION:
                        translated[key] = ELEMENT_TRANSLATION[value]
                    elif key == "sign" and value in SIGN_TRANSLATION:
                        translated[key] = SIGN_TRANSLATION[value]
                    elif key == "house" and value in HOUSE_TRANSLATION:
                        translated[key] = HOUSE_TRANSLATION[value]
                    elif key == "point_type" and value in POINT_TYPE_TRANSLATION:
                        translated[key] = POINT_TYPE_TRANSLATION[value]
                    elif key == "name" and value in PLANET_TRANSLATION:
                        translated[key] = PLANET_TRANSLATION[value]
                    else:
                        translated[key] = value
            return translated
        
        # Переводим все астрологические точки
        for point_name in ["sun", "moon", "mercury", "venus", "mars", "jupiter", 
                        "saturn", "uranus", "neptune", "pluto", "ascendant", 
                        "descendant", "medium_coeli", "imum_coeli", "chiron", 
                        "mean_lilith", "first_house", "second_house", 
                        "third_house", "fourth_house", "fifth_house", 
                        "sixth_house", "seventh_house", "eighth_house", 
                        "ninth_house", "tenth_house", "eleventh_house", 
                        "twelfth_house", "mean_node", "true_node", 
                        "mean_south_node", "true_south_node"]:
            if point_name in translated_data:
                translated_data[point_name] = translate_point(translated_data[point_name])
        
        # Переводим списки названий
        for list_name in ["planets_names_list", "axial_cusps_names_list", "houses_names_list"]:
            if list_name in translated_data:
                translated_data[list_name] = [
                    PLANET_TRANSLATION.get(name, name) 
                    for name in translated_data[list_name]
                ]
        
        return translated_data

    def format_natal_chart_ai(translated_data):
        """
        Форматирует переведенную натальную карту в текстовый вид для ИИ
        """
        # Вспомогательная функция для преобразования градусов в ГМС формат
        def deg_to_dms(decimal_deg):
            degrees = int(decimal_deg)
            fractional = decimal_deg - degrees
            minutes_full = fractional * 60
            minutes = int(minutes_full)
            seconds = round((minutes_full - minutes) * 60)
            return degrees, minutes, seconds

        # Проверка на ошибку
        if 'error' in translated_data:
            return f"Ошибка: {translated_data['error']}"
        
        output = '''Представь, что ты опытный астролог, специализирующийся на составлении и анализе натальных карт.
    Ты помогаешь пользователям понять, как положение планет в момент их рождения влияет на их характер, 
    внутренние возможности и жизненные события. Ты способствуешь осознанию того, какие черты и тенденции 
    они могут развивать, и как их природные дары могут быть использованы для достижения целей. 
    Сделай подробный анализ по всем аспектам. Данные пользователя:  \n'''
        
        # Основная информация
        output += f"Имя: {translated_data.get('name', 'Неизвестно')}\n"
        output += f"Место рождения: {translated_data.get('city', 'Неизвестно')}, {translated_data.get('nation', 'Неизвестно')}\n"
        output += f"Дата и время рождения: {translated_data.get('iso_formatted_local_datetime', 'Неизвестно')}\n\n"
        
        if 'sun' in translated_data and 'sign' in translated_data['sun']:
            output += f"Знак зодиака: {translated_data['sun']['sign']}\n\n"
        
        # Асцендент
        if 'ascendant' in translated_data:
            asc = translated_data['ascendant']
            if 'position' in asc:
                deg, min, sec = deg_to_dms(asc['position'])
                output += 'Проведи подробный анализ асцендента: \n'
                output += f"Асцендент: {asc.get('sign', 'Неизвестно')} ({deg}° {min}' {sec}'')\n\n"
        
        # Середина неба (MC)
        if 'medium_coeli' in translated_data:
            mc = translated_data['medium_coeli']
            if 'position' in mc:
                deg, min, sec = deg_to_dms(mc['position'])
                output += 'Проведи подробный анализ середины неба (MC):\n'
                output += f"Середина неба (MC): {mc.get('sign', 'Неизвестно')} ({deg}° {min}' {sec}'')\n\n"
        
        # Планеты
        output += 'Проведи подробный анализ сначала положения планеты, а затем нахождение планеты в доме. '
        output += 'Приведи минимум 5 пунктов для положения планеты и минимум 5 пунктов для дома планеты: \n'
        
        # Порядок вывода планет
        planet_keys = [
            'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 
            'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'mean_lilith',
            'mean_node', 'true_node'
        ]
        
        for key in planet_keys:
            planet = translated_data.get(key)
            if planet and 'position' in planet:
                deg, min, sec = deg_to_dms(planet['position'])
                output += f"{planet.get('name', key)}: {planet.get('sign', 'Неизвестно')} ({deg}° {min}' {sec}'') в {planet.get('house', 'Неизвестно')}\n"
        
        # Дома
        output += '\nПроведи подробный анализ домов. Опиши минимум в 8 предложениях каждый дом:\n'
        house_keys = [
            'first_house', 'second_house', 'third_house', 'fourth_house',
            'fifth_house', 'sixth_house', 'seventh_house', 'eighth_house',
            'ninth_house', 'tenth_house', 'eleventh_house', 'twelfth_house'
        ]
        
        for key in house_keys:
            house = translated_data.get(key)
            if house and 'position' in house:
                deg, min, sec = deg_to_dms(house['position'])
                output += f"{house.get('name', key)}: {house.get('sign', 'Неизвестно')} ({deg}° {min}' {sec}'')\n"
        
        # Лунная фаза
        lunar_phase = translated_data.get('lunar_phase', {})
        if lunar_phase:
            output += f"\nЛунная фаза: {lunar_phase.get('moon_phase_name', '')} {lunar_phase.get('moon_emoji', '')}\n"
        
        # Заключение
        output += '\nСделай вывод и дай рекомендации по результатам составленной натальной карты и проведенного анализа. '
        output += 'Не задавай вопросов. Учти следующие особенности:\n'
        output += '- Анализируй ретроградность планет там, где она присутствует\n'
        output += '- Учитывай стихии (огонь, земля, воздух, вода) и качества (кардинальный, фиксированный, мутабельный)\n'
        output += '- Проанализируй взаимодействие домов и планет\n'
        output += '- Укажи на сильные и слабые позиции в карте\n'
        output += '- Дай практические рекомендации по использованию выявленных потенциалов'
        
        return output

    try:
        # Словарь координат основных городов
        CITY_COORDINATES = {
            "Москва": {"lat": 55.7558, "lng": 37.6176, "tz": "Europe/Moscow"},
            "Moscow": {"lat": 55.7558, "lng": 37.6176, "tz": "Europe/Moscow"},
            "Мытищи": {"lat": 55.9116, "lng": 37.7307, "tz": "Europe/Moscow"},
            "Санкт-Петербург": {"lat": 59.9311, "lng": 30.3609, "tz": "Europe/Moscow"},
            "Екатеринбург": {"lat": 56.8431, "lng": 60.6454, "tz": "Asia/Yekaterinburg"},
            "Новосибирск": {"lat": 55.0084, "lng": 82.9357, "tz": "Asia/Novosibirsk"},
            "Краснодар": {"lat": 45.0355, "lng": 38.9753, "tz": "Europe/Moscow"},
        }
        
        city = input_data["birth_city"]
        
        # ИСПРАВЛЕННОЕ создание объекта натальной карты для kerykeion 2.0.0 - возвращаем старую рабочую логику
        if city in CITY_COORDINATES:
            coords = CITY_COORDINATES[city]
            dark_theme_subject = KrInstance(
                name=input_data["user_name"],
                year=input_data["birth_year"],
                month=input_data["birth_month"],
                day=input_data["birth_day"],
                hours=input_data["birth_hour"],
                minuts=input_data["birth_minute"],
                lat=coords["lat"],
                lon=coords["lng"],  # ← ИСПРАВЛЕНО: lon вместо lng
                tz_str=coords["tz"]
            )
            
        else:
            # Если город не найден, используем стандартный способ
            try:
                dark_theme_subject = KrInstance(
                    name=input_data["user_name"],
                    year=input_data["birth_year"],
                    month=input_data["birth_month"],
                    day=input_data["birth_day"],
                    hours=input_data["birth_hour"],  # ИСПРАВЛЕНО: hours
                    minuts=input_data["birth_minute"],  # ИСПРАВЛЕНО: minuts
                    city=city,
                    nat=input_data["birth_country_code"]  # ИСПРАВЛЕНО: nat вместо nation
                )
            except:
                # Fallback на Москву если ничего не работает
                coords = CITY_COORDINATES["Москва"]
                dark_theme_subject = KrInstance(
                    name=input_data["user_name"],
                    year=input_data["birth_year"],
                    month=input_data["birth_month"],
                    day=input_data["birth_day"],
                    hours=input_data["birth_hour"],
                    minuts=input_data["birth_minute"],
                    lat=coords["lat"],
                    lon=coords["lng"],  # ← ИСПРАВЛЕНО: lon вместо lng
                    tz_str=coords["tz"]
                )

        print("✅ Natal chart object created", file=sys.stderr)

        # Получаем данные напрямую из объекта для kerykeion 2.0.0 - возвращаем старую рабочую логику
        try:
            if hasattr(dark_theme_subject, '__dict__'):
                raw_data = {}
                for key, value in dark_theme_subject.__dict__.items():
                    try:
                        # Проверяем, что значение можно сериализовать
                        json.dumps(value, default=str)
                        raw_data[key] = value
                    except:
                        # Если не можем сериализовать - конвертируем в строку
                        raw_data[key] = str(value)
            else:
                # Минимальные данные для AI промпта
                raw_data = {
                    "name": input_data["user_name"],
                    "city": input_data["birth_city"],
                    "nation": input_data["birth_country_code"],
                    "year": input_data["birth_year"],
                    "month": input_data["birth_month"],
                    "day": input_data["birth_day"]
                }
        except Exception as json_error:
            print(f"⚠️ JSON extraction error: {json_error}", file=sys.stderr)
            # Минимальные данные для AI промпта
            raw_data = {
                "name": input_data["user_name"],
                "city": input_data["birth_city"],
                "nation": input_data["birth_country_code"],
                "year": input_data["birth_year"],
                "month": input_data["birth_month"],
                "day": input_data["birth_day"]
            }

        # Очищаем данные от проблемных символов и объектов
        cleaned_data = clean_unicode_data(raw_data)

        # Переводим json на русский язык
        translated_data = translate_natal_chart(cleaned_data)

        # Генерируем промт на основе переведенного json
        ai_prompt = format_natal_chart_ai(translated_data)
        # Очищаем промт от некорректных символов
        ai_prompt = clean_unicode_data(ai_prompt)

        # ✅ ИСПРАВЛЕННАЯ ГЕНЕРАЦИЯ И СОХРАНЕНИЕ SVG ДЛЯ KERYKEION 2.0.0
        print(f"📁 Creating SVG chart in: {svg_path_str}", file=sys.stderr)
        
        try:
            # ИСПРАВЛЕНИЕ: Меняем рабочую директорию перед созданием SVG
            import os
            old_cwd = os.getcwd()
            os.chdir(svg_path_str)  # Переходим в папку server/public/natal-charts
            
            # ДОБАВЛЕНО: Подавляем stdout от kerykeion
            from contextlib import redirect_stdout
            import io
            
            # Перехватываем stdout чтобы kerykeion не мешал JSON выводу
            captured_output = io.StringIO()
            
            with redirect_stdout(captured_output):
                svg_maker = MakeSvgInstance(dark_theme_subject)
                svg_maker.makeSVG()
            
            # Возвращаем рабочую директорию
            os.chdir(old_cwd)
            
            # ДОБАВЛЕНО: Перемещаем SVG файлы из /root если они там создались
            import glob
            import shutil
            root_svg_files = glob.glob("/root/*.svg")
            for svg_file in root_svg_files:
                try:
                    filename = os.path.basename(svg_file)
                    target_path = os.path.join(svg_path_str, filename)
                    shutil.move(svg_file, target_path)
                    print(f"✅ Moved {filename} to target directory", file=sys.stderr)
                except Exception as e:
                    print(f"⚠️ Failed to move {svg_file}: {e}", file=sys.stderr)
            
            print("✅ SVG generated with MakeSvgInstance", file=sys.stderr)
        except Exception as svg_error:
            print(f"⚠️ SVG generation error: {svg_error}", file=sys.stderr)
            return {
                "error": f"Ошибка создания SVG: {str(svg_error)}",
                "svgFileName": None,
                "ai_prompt": ai_prompt,
                "success": False
            }

        # ✅ ИЩЕМ СОЗДАННЫЙ SVG ФАЙЛ
        expected_svg_path = svg_path / expected_svg_name
        
        print(f"🔍 Looking for: {expected_svg_path}", file=sys.stderr)
        
        if expected_svg_path.exists():
            print(f"✅ Found expected SVG: {expected_svg_name}", file=sys.stderr)
            final_svg_name = expected_svg_name
        else:
            # ИСПРАВЛЕНИЕ: Ищем только в целевой папке, так как мы уже создали SVG там
            svg_files_in_target = list(svg_path.glob("*.svg"))
            all_svg_files = svg_files_in_target
            
            print(f"🔍 Found SVG files in target dir: {[f.name for f in svg_files_in_target]}", file=sys.stderr)
            
            if all_svg_files:
                # Берем самый новый файл
                newest_svg = max(all_svg_files, key=lambda x: x.stat().st_mtime)
                print(f"✅ Using newest SVG: {newest_svg.name}", file=sys.stderr)
                
                # ИСПРАВЛЕНИЕ: Файл уже в целевой директории, просто переименовываем
                try:
                    newest_svg.rename(svg_path / expected_svg_name)
                    final_svg_name = expected_svg_name
                    print(f"✅ Renamed to: {expected_svg_name}", file=sys.stderr)
                except Exception as rename_error:
                    print(f"⚠️ Rename failed: {rename_error}", file=sys.stderr)
                    final_svg_name = newest_svg.name
            else:
                print("❌ No SVG files found!", file=sys.stderr)
                return {
                    "error": "SVG файл не был создан",
                    "svg_name": None,
                    "ai_prompt": ai_prompt,
                    "success": False
                }

        # ✅ ФИНАЛЬНАЯ ПРОВЕРКА ФАЙЛА
        final_svg_path = svg_path / final_svg_name
        if final_svg_path.exists():
            print(f"✅ Final SVG file exists: {final_svg_name}", file=sys.stderr)
            print(f"📁 SVG file size: {final_svg_path.stat().st_size} bytes", file=sys.stderr)
        else:
            print(f"❌ Final SVG file missing: {final_svg_name}", file=sys.stderr)

        # ✅ ВОЗВРАЩАЕМ РЕЗУЛЬТАТ С ПРАВИЛЬНЫМ ИМЕНЕМ ФАЙЛА
        return {
            "svg_name": final_svg_name,
            "ai_prompt": ai_prompt,
            "success": True
        }

    except Exception as e:
        print(f"❌ Error in calculate_natal_chart: {str(e)}", file=sys.stderr)
        return {
            "error": f"Ошибка при расчете натальной карты: {str(e)}",
            "svg_name": None,
            "ai_prompt": None,
            "success": False
        }


def main():
    """
    Основная функция для запуска из командной строки
    Читает JSON из stdin, возвращает результат в stdout
    """
    try:
        # Улучшенное чтение stdin с удалением BOM
        if len(sys.argv) > 1:
            input_text = sys.argv[1]
        else:
            input_text = sys.stdin.read().strip()
        
        # Удаляем BOM если есть
        if input_text.startswith('\ufeff'):
            input_text = input_text[1:]
        
        # Удаляем все невидимые символы в начале
        input_text = input_text.lstrip('\x00\ufeff\ufffe')
        
        # Логируем что получили
        print(f"📥 Raw input received: {repr(input_text[:100])}", file=sys.stderr)
        print(f"📥 Input length: {len(input_text)}", file=sys.stderr)
        
        if not input_text.strip():
            raise ValueError("No input data received")
        
        # Используем устойчивый парсер JSON
        input_data = safe_json_parse(input_text)
        
        print(f"✅ JSON parsed successfully: {input_data.get('user_name')}", file=sys.stderr)
        
        # Проверяем обязательные поля
        required_fields = ['user_name', 'birth_year', 'birth_month', 'birth_day', 
                          'birth_hour', 'birth_minute', 'birth_city', 'birth_country_code']
        
        missing_fields = [field for field in required_fields if field not in input_data]
        if missing_fields:
            raise ValueError(f"Missing required fields: {missing_fields}")
            
        print("✅ All required fields present", file=sys.stderr)
        print("🐍 FIXED VERSION FOR KERYKEION 2.0.0!", file=sys.stderr)
        print(f"🐍 Input name: {input_data['user_name']}", file=sys.stderr)
        
        # Вызываем основную функцию расчета
        result = calculate_natal_chart(input_data)
        
        # Возвращаем результат в JSON формате
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        print(f"❌ Error in main(): {e}", file=sys.stderr)
        error_result = {
            "success": False,
            "error": str(e),
            "svg_name": None,
            "ai_prompt": None
        }
        print(json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()