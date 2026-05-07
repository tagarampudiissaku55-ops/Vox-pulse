import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface ElectionAnalysis {
  executiveSummary: string[];
  keyMetrics: string; // Markdown table
  voterSentiment: string;
  monitoringAlerts: string[];
  suggestedVisualizations: {
    type: 'bar' | 'pie' | 'line';
    title: string;
    data: any[];
  }[];
  demographicShifts: string;
}

export async function analyzeElectionData(rawData: string): Promise<ElectionAnalysis> {
  const prompt = `
    You are an expert Election Data Analyst. Transform the following raw election data into clear insights.
    
    RULES:
    1. TREND IDENTIFICATION: Spot shifts in voter demographics or swing patterns.
    2. DATA SIMPLIFICATION: Convert large numbers into percentages and relatable ratios.
    3. BIAS NEUTRALITY: Report strictly on data facts without political leaning.
    4. VISUAL MAPPING: Provide structured data for visualizations (Bar, Pie, or Line charts).
    5. ANOMALY DETECTION: Flag any data points that look statistically unusual.

    Raw Data:
    ${rawData}

    Return the analysis in the following JSON format:
    {
      "executiveSummary": ["bullet 1", "bullet 2", "bullet 3"],
      "keyMetrics": "Markdown table string",
      "voterSentiment": "Analysis of why numbers are moving",
      "monitoringAlerts": ["alert 1", "alert 2"],
      "suggestedVisualizations": [
        {
          "type": "bar",
          "title": "Demographic Split",
          "data": [{"name": "Group A", "value": 45}, {"name": "Group B", "value": 55}]
        }
      ],
      "demographicShifts": "Detailed analysis of demographic shifts"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyMetrics: { type: Type.STRING },
            voterSentiment: { type: Type.STRING },
            monitoringAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedVisualizations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  data: { type: Type.ARRAY, items: { type: Type.OBJECT } }
                }
              }
            },
            demographicShifts: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error("Failed to analyze election data. Please check your input format.");
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chatWithAnalysis(
  userMessage: string, 
  analysis: ElectionAnalysis, 
  history: ChatMessage[]
): Promise<string> {
  const chatContext = `
    You are the VoxPulse Election Analyst Assistant. You are helping a user understand specific election data analysis.
    
    CURRENT ANALYSIS DATA:
    Summary: ${analysis.executiveSummary.join('. ')}
    Sentiment: ${analysis.voterSentiment}
    Demographics: ${analysis.demographicShifts}
    Metrics: ${analysis.keyMetrics}
    Alerts: ${analysis.monitoringAlerts.join(', ')}

    RULES:
    1. Only discuss the election data provided in the analysis.
    2. Be neutral and data-driven.
    3. If the user asks something not related to this data, politely redirect them.
    4. Keep responses concise and layman-friendly.
  `;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })),
    config: {
      systemInstruction: chatContext,
    },
  });

  try {
    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Chat failed:", error);
    return "I've encountered a connection error while analyzing your request. Please try again.";
  }
}
