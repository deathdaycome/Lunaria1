import { spawn } from 'child_process';
import path from 'path';

export interface NatalChartInput {
  user_name: string;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number;
  birth_minute: number;
  birth_city: string;
  birth_country_code: string;
}

export interface NatalChartResult {
  svg_name?: string;
  ai_prompt?: string;
  success: boolean;
  error?: string;
}

export function callPythonNatalChart(inputData: NatalChartInput): Promise<NatalChartResult> {
  return new Promise((resolve, reject) => {
    console.log('🐍 CALLING PYTHON NATAL CHART CALCULATOR');
    console.log('📥 Input data:', inputData);

    // Путь к Python и скрипту
    const pythonPath = 'C:\\Program Files\\PostgreSQL\\15\\pgAdmin 4\\python\\python.exe';
    const scriptPath = path.join(process.cwd(), 'natal_chart_calculator.py');

    console.log('🔧 Python path:', pythonPath);
    console.log('🔧 Script path:', scriptPath);

    // Запускаем Python процесс
    const pythonProcess = spawn(pythonPath, [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false
    });

    let output = '';
    let errorOutput = '';

    // Собираем данные из stdout
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Собираем ошибки из stderr
    pythonProcess.stderr.on('data', (data) => {
      const errorText = data.toString();
      console.log('🐍 Python stderr:', errorText);
      errorOutput += errorText;
    });

    // Обрабатываем завершение процесса
    pythonProcess.on('close', (code) => {
      console.log('🐍 Python process finished with code:', code);
      console.log('📤 Python output:', output);

      if (code === 0) {
        try {
          // Парсим JSON результат от Python
          const result = JSON.parse(output);
          console.log('✅ Python result parsed successfully:', result);
          resolve(result);
        } catch (parseError) {
          console.error('❌ Failed to parse Python output:', parseError);
          console.error('Raw output:', output);
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      } else {
        console.error('❌ Python script failed with code:', code);
        console.error('Error output:', errorOutput);
        reject(new Error(`Python script failed: ${errorOutput}`));
      }
    });

    // Обрабатываем ошибки процесса
    pythonProcess.on('error', (error) => {
      console.error('❌ Failed to start Python process:', error);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });

    // Отправляем входные данные в Python
    try {
      const inputJson = JSON.stringify(inputData);
      console.log('📤 Sending to Python:', inputJson);
      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    } catch (writeError) {
      console.error('❌ Failed to write to Python stdin:', writeError);
      reject(new Error(`Failed to write to Python stdin: ${writeError}`));
    }
  });
}

// Экспорт по умолчанию для совместимости
export default callPythonNatalChart;