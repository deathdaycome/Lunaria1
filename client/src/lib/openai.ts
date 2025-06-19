import { apiRequest } from "./queryClient";

// Функции для взаимодействия с OpenAI через API сервера
export async function generateHoroscope(
  zodiacSign: string,
  period: "today" | "week" | "month",
  category: string
): Promise<string> {
  try {
    const res = await apiRequest("POST", "/api/openai/horoscope", {
      zodiacSign,
      period,
      category
    });
    const data = await res.json();
    return data.content;
  } catch (error) {
    console.error("Error generating horoscope:", error);
    throw error;
  }
}

export async function generateTarotReading(
  question: string,
  cards: number,
  category: string
): Promise<string> {
  try {
    const res = await apiRequest("POST", "/api/openai/tarot", {
      question,
      cards,
      category
    });
    const data = await res.json();
    return data.reading;
  } catch (error) {
    console.error("Error generating tarot reading:", error);
    throw error;
  }
}

export async function generateNatalChart(
  name: string,
  birthDate: string,
  birthTime?: string,
  birthPlace?: string
): Promise<string> {
  try {
    const res = await apiRequest("POST", "/api/openai/natal-chart", {
      name,
      birthDate,
      birthTime,
      birthPlace
    });
    const data = await res.json();
    return data.analysis;
  } catch (error) {
    console.error("Error generating natal chart analysis:", error);
    throw error;
  }
}

export async function generateCompatibilityAnalysis(
  person1: {
    name: string;
    zodiacSign: string;
    birthDate: string;
  },
  person2: {
    name: string;
    zodiacSign: string;
    birthDate: string;
  },
  compatibilityScore: number
): Promise<string> {
  try {
    const res = await apiRequest("POST", "/api/openai/compatibility", {
      person1,
      person2,
      compatibilityScore
    });
    const data = await res.json();
    return data.analysis;
  } catch (error) {
    console.error("Error generating compatibility analysis:", error);
    throw error;
  }
}