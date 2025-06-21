#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Интегрированный калькулятор натальных карт для Lunaria AI
Версия для kerykeion 4.23.0 (последняя версия)
Принимает JSON на stdin, возвращает JSON на stdout
"""

import json
import sys
import os
import io
import re
from pathlib import Path

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

def safe_json_parse(input_text):
    """Устойчивый парсер JSON"""
    if not input_text or not input_text.strip():
        raise ValueError("Empty input")
    
    # Удаляем все возможные проблемные символы
    cleaned = input_text.strip()
    cleaned = cleaned.lstrip('\ufeff\ufffe\x00')
    cleaned = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', cleaned)
    
    print(f"🔍 Trying to parse: {repr(cleaned[:150])}", file=sys.stderr)
    
    try:
        result = json.loads(cleaned)
        print("✅ Standard JSON parsing successful", file=sys.stderr)
        return result
    except json.JSONDecodeError as e:
        print(f"⚠️ Standard JSON failed: {e}", file=sys.stderr)
        raise ValueError(f"Could not parse JSON: {cleaned[:100]}")

def calculate_natal_chart(input_data):
    """
    Основная функция расчета натальной карты для kerykeion 4.23.0
    """
    print("🐍 USING KERYKEION 4.23.0 - CUSTOMER VERSION!", file=sys.stderr)
    print(f"🐍 Input name: {input_data.get('user_name')}", file=sys.stderr)

    try:
        # Импорт для kerykeion 4.23.0 (последняя версия)
        from kerykeion import AstrologicalSubject, KerykeionChartSVG
        print("✅ Using kerykeion 4.23.0 - AstrologicalSubject & KerykeionChartSVG", file=sys.stderr)
    except ImportError as e:
        print(f"❌ Kerykeion library not found: {e}", file=sys.stderr)
        return {
            "error": "Библиотека kerykeion не установлена. Установите: pip install kerykeion",
            "svg_name": None,
            "ai_prompt": None,
            "success": False
        }

    # Настройка пути к папке SVG (адаптированный под структуру проекта)
    current_file = Path(__file__)
    server_dir = current_file.parent.parent
    svg_path = server_dir / 'public' / 'natal-charts'
    svg_path.mkdir(parents=True, exist_ok=True)
    svg_path_str = str(svg_path)
    
    print(f"🔧 SVG path: {svg_path_str}", file=sys.stderr)
    
    # Создаем безопасное имя файла
    safe_name = re.sub(r'[^\w\-]', '', input_data['user_name'])
    if not safe_name:
        safe_name = "User"
    svg_name = f"{safe_name}- Natal Chart.svg"

    def translate_natal_chart(natal_data):
        """Переводит натальную карту JSON на русский язык"""
        
        # Словари для перевода (точно как в версии заказчиков)
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
            "First": "Первый", "Second": "Второй", "Third": "Третий",
            "Fourth": "Четвертый", "Fifth": "Пятый", "Sixth": "Шестой",
            "Seventh": "Седьмой", "Eighth": "Восьмой", "Ninth": "Девятый",
            "Tenth": "Десятый", "Eleventh": "Одиннадцатый", "Twelfth": "Двенадцатый"
        }
        
        POINT_TYPE_TRANSLATION = {
            "Planet": "Планета",
            "AxialCusps": "Осевая точка",
            "House": "Дом"
        }
        
        PLANET_TRANSLATION = {
            "Sun": "Солнце", "Moon": "Луна", "Mercury": "Меркурий",
            "Venus": "Венера", "Mars": "Марс", "Jupiter": "Юпитер",
            "Saturn": "Сатурн", "Uranus": "Уран", "Neptune": "Нептун",
            "Pluto": "Плутон", "Chiron": "Хирон", "Mean_Lilith": "Черная Луна (Лилит)",
            "Ascendant": "Асцендент", "Descendant": "Десцендент",
            "Medium_Coeli": "Середина неба", "Imum_Coeli": "Глубина неба",
            "Mean_Node": "Восходящий узел (Раху)", "True_Node": "Восходящий узел (истинный)",
            "Mean_South_Node": "Нисходящий узел (Кету)", "True_South_Node": "Нисходящий узел (истинный)"
        }
        
        MOON_PHASE_TRANSLATION = {
            "Waxing Crescent": "Растущий серп", "First Quarter": "Первая четверть",
            "Waxing Gibbous": "Растущая луна", "Full Moon": "Полнолуние",
            "Waning Gibbous": "Убывающая луна", "Last Quarter": "Последняя четверть",
            "Waning Crescent": "Убывающий серп", "New Moon": "Новолуние"
        }
        
        SYSTEM_TRANSLATION = {
            "Placidus": "Плацидус", "Koch": "Коха", "Regiomontanus": "Региомонтанус",
            "Whole": "Целых знаков", "Equal": "Равных домов", "Tropic": "Тропический",
            "Apparent Geocentric": "Видимый геоцентрический"
        }
        
        translated_data = natal_data.copy()
        
        # Переводим системные поля
        for field in ["zodiac_type", "houses_system_name", "perspective_type"]:
            if field in translated_data and translated_data[field] in SYSTEM_TRANSLATION:
                translated_data[field] = SYSTEM_TRANSLATION[translated_data[field]]
        
        # Переводим лунную фазу
        if "lunar_phase" in translated_data:
            moon_phase = translated_data["lunar_phase"]
            if "moon_phase_name" in moon_phase and moon_phase["moon_phase_name"] in MOON_PHASE_TRANSLATION:
                moon_phase["moon_phase_name"] = MOON_PHASE_TRANSLATION[moon_phase["moon_phase_name"]]
        
        def translate_point(point_data):
            translated = {}
            for key, value in point_data.items():
                if isinstance(value, dict):
                    translated[key] = translate_point(value)
                    continue
                    
                if key == "name" and value in HOUSE_TRANSLATION:
                    parts = value.split('_')
                    if len(parts) > 0 and parts[0] in HOUSE_NUMBER_TRANSLATION:
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
        """Форматирует переведенную натальную карту в текстовый вид для ИИ"""
        
        def deg_to_dms(decimal_deg):
            degrees = int(decimal_deg)
            fractional = decimal_deg - degrees
            minutes_full = fractional * 60
            minutes = int(minutes_full)
            seconds = round((minutes_full - minutes) * 60)
            return degrees, minutes, seconds

        if 'error' in translated_data:
            return f"Ошибка: {translated_data['error']}"
        
        output = '''Представь, что ты опытный астролог, специализирующийся на составлении и анализе натальных карт.
Ты помогаешь пользователям понять, как положение планет в момент их рождения влияет на их характер, 
внутренние возможности и жизненные события. Ты способствуешь осознанию того, какие черты и тенденции 
они могут развивать, и как их природные дары могут быть использованы для достижения целей. 
Сделай подробный анализ по всем аспектам. Данные пользователя:  \n'''
        
        # Основная информация
        output += f"Имя: {translated_data['name']}\n"
        output += f"Место рождения: {translated_data['city']}, {translated_data['nation']}\n"
        output += f"Дата и время рождения: {translated_data['iso_formatted_local_datetime']}\n\n"
        output += f"Знак зодиака: {translated_data['sun']['sign']}\n\n"
        
        # Асцендент
        asc = translated_data['ascendant']
        deg, min, sec = deg_to_dms(asc['position'])
        output += 'Проведи подробный анализ асцендента: \n'
        output += f"Асцендент: {asc['sign']} ({deg}° {min}' {sec}'')\n\n"
        
        # Середина неба (MC)
        mc = translated_data['medium_coeli']
        deg, min, sec = deg_to_dms(mc['position'])
        output += 'Проведи подробный анализ середины неба (MC):\n'
        output += f"Середина неба (MC): {mc['sign']} ({deg}° {min}' {sec}'')\n\n"        
        
        # Планеты
        output += 'Проведи подробный анализ сначала положения планеты, а затем нахождение планеты в доме. '
        output += 'Приведи минимум 5 пунктов для положения планеты и минимум 5 пунктов для дома планеты: \n'
        
        planet_keys = [
            'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 
            'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'mean_lilith',
            'mean_node', 'true_node'
        ]
        
        for key in planet_keys:
            planet = translated_data.get(key)
            if planet:
                deg, min, sec = deg_to_dms(planet['position'])
                output += f"{planet['name']}: {planet['sign']} ({deg}° {min}' {sec}'') в {planet['house']}\n"
        
        # Дома
        output += '\nПроведи подробный анализ домов. Опиши минимум в 8 предложениях каждый дом:\n'
        house_keys = [
            'first_house', 'second_house', 'third_house', 'fourth_house',
            'fifth_house', 'sixth_house', 'seventh_house', 'eighth_house',
            'ninth_house', 'tenth_house', 'eleventh_house', 'twelfth_house'
        ]
        
        for key in house_keys:
            house = translated_data.get(key)
            if house:
                deg, min, sec = deg_to_dms(house['position'])
                output += f"{house['name']}: {house['sign']} ({deg}° {min}' {sec}'')\n"
        
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
        # Проверяем есть ли координаты в входных данных
        if "birth_lat" in input_data and "birth_lng" in input_data:
            # Используем переданные координаты
            dark_theme_subject = AstrologicalSubject(
                input_data["user_name"], 
                input_data["birth_year"], 
                input_data["birth_month"], 
                input_data["birth_day"], 
                input_data["birth_hour"], 
                input_data["birth_minute"], 
                input_data["birth_city"],
                input_data["birth_country_code"],
                lat=input_data["birth_lat"],
                lng=input_data["birth_lng"],
                tz_str=input_data.get("birth_tz", "Europe/Moscow")
            )
            print(f"✅ Using provided coordinates: {input_data['birth_lat']}, {input_data['birth_lng']}", file=sys.stderr)
        else:
            # Используем Geonames
            dark_theme_subject = AstrologicalSubject(
                input_data["user_name"], 
                input_data["birth_year"], 
                input_data["birth_month"], 
                input_data["birth_day"], 
                input_data["birth_hour"], 
                input_data["birth_minute"], 
                input_data["birth_city"], 
                input_data["birth_country_code"],
                geonames_username="deathdaycome"
            )
            print("✅ Using Geonames for coordinates", file=sys.stderr)

            print("✅ AstrologicalSubject created successfully", file=sys.stderr)

        # Получаем JSON данные (как в версии заказчиков)
        json_data = dark_theme_subject.json(dump=False, indent=2)
        print("✅ JSON data extracted", file=sys.stderr)

        # Переводим на русский язык (как в версии заказчиков)
        translated_data = translate_natal_chart(json.loads(json_data))
        print("✅ Data translated to Russian", file=sys.stderr)

        # Генерируем промт для ИИ (как в версии заказчиков)
        ai_prompt = format_natal_chart_ai(translated_data)
        ai_prompt = clean_unicode_data(ai_prompt)
        print("✅ AI prompt generated", file=sys.stderr)

        # Создаем SVG карту (как в версии заказчиков)
        try:
            dark_theme_natal_chart = KerykeionChartSVG(
                dark_theme_subject, 
                theme="dark", 
                chart_language="RU", 
                new_output_directory=svg_path_str
            )
            dark_theme_natal_chart.makeSVG()
            print("✅ SVG chart created", file=sys.stderr)
            
            # Ищем созданный SVG файл
            expected_svg_path = svg_path / svg_name
            if expected_svg_path.exists():
                final_svg_name = svg_name
                print(f"✅ SVG file found: {final_svg_name}", file=sys.stderr)
            else:
                # Ищем любой SVG файл в папке
                svg_files = list(svg_path.glob("*.svg"))
                if svg_files:
                    newest_svg = max(svg_files, key=lambda x: x.stat().st_mtime)
                    final_svg_name = newest_svg.name
                    print(f"✅ Using newest SVG: {final_svg_name}", file=sys.stderr)
                else:
                    print("❌ No SVG files found", file=sys.stderr)
                    final_svg_name = None
                    
        except Exception as svg_error:
            print(f"⚠️ SVG generation error: {svg_error}", file=sys.stderr)
            final_svg_name = None

        # Возвращаем результат (точно как в версии заказчиков)
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
    """Основная функция для запуска из командной строки"""
    try:
        # Читаем входные данные
        if len(sys.argv) > 1:
            input_text = sys.argv[1]
        else:
            input_text = sys.stdin.read().strip()
        
        # Удаляем BOM если есть
        if input_text.startswith('\ufeff'):
            input_text = input_text[1:]
        
        input_text = input_text.lstrip('\x00\ufeff\ufffe')
        
        print(f"📥 Raw input received: {repr(input_text[:100])}", file=sys.stderr)
        
        if not input_text.strip():
            raise ValueError("No input data received")
        
        # Парсим JSON
        input_data = safe_json_parse(input_text)
        print(f"✅ JSON parsed successfully: {input_data.get('user_name')}", file=sys.stderr)
        
        # Проверяем обязательные поля
        required_fields = ['user_name', 'birth_year', 'birth_month', 'birth_day', 
                          'birth_hour', 'birth_minute', 'birth_city', 'birth_country_code']
        
        missing_fields = [field for field in required_fields if field not in input_data]
        if missing_fields:
            raise ValueError(f"Missing required fields: {missing_fields}")
            
        print("✅ All required fields present", file=sys.stderr)
        print("🐍 USING KERYKEION 4.23.0 - CUSTOMER VERSION!", file=sys.stderr)
        
        # Выполняем расчет
        result = calculate_natal_chart(input_data)
        
        # Возвращаем результат
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