import { GoogleGenAI } from '@google/genai';
import { DatasetInfo } from './dataAnalysis';

// Initialize the Gemini API client
const getGenAIClient = () => {
    const apiKeyStr = window.localStorage.getItem('gemini-api-key');
    const apiKey = apiKeyStr ? JSON.parse(apiKeyStr) : null;

    if (!apiKey) {
        throw new Error('Gemini API key not found. Please add it in the AI Settings.');
    }

    return new GoogleGenAI({ apiKey });
};

// Formats the dataset summary for the prompt to save tokens
const formatDatasetContext = (summary: DatasetInfo) => {
    const columnContext = summary.columns.map(col => {
        let stats = '';
        if (col.type === 'numerical' && col.summary) {
            stats = `(Min: ${col.summary.min}, Max: ${col.summary.min}, Mean: ${col.summary.mean})`;
        } else if (col.type === 'categorical' && col.summary && col.summary.uniqueValues) {
            stats = `(${col.summary.uniqueValues} unique values)`;
        }
        return `- ${col.name} (${col.type}) ${stats}`;
    }).join('\n');

    return `
Dataset Context:
- Total Rows: ${summary.rows.toLocaleString()}
- Total Columns: ${summary.columns.length}

Columns:
${columnContext}
`;
};

export async function generateDatasetInsights(datasetSummary: DatasetInfo): Promise<string> {
    const ai = getGenAIClient();
    const context = formatDatasetContext(datasetSummary);

    const prompt = `
You are an expert Data Analyst and Data Scientist. I have uploaded a dataset and need some automated insights to show the user.

${context}

Based ON THE COLUMN NAMES, TYPES, AND STATS PROVIDED ABOVE, generate 4-5 high-value, bulleted insights or hypotheses about this dataset.
Keep it concise, professional, and formatted in Markdown. DO NOT write code. DO NOT ask for the data. Just provide the insights based on the available metadata.
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text() || 'No insights could be generated.';
    } catch (error: any) {
        console.error('Error generating insights:', error);
        throw new Error(error?.message || 'Failed to generate AI insights.');
    }
}

export async function generateChartSuggestion(query: string, datasetSummary: DatasetInfo): Promise<{
    type: 'bar' | 'line' | 'scatter' | 'pie';
    xAxis: string;
    yAxis: string;
}> {
    const ai = getGenAIClient();
    const context = formatDatasetContext(datasetSummary);

    const prompt = `
You are an expert Data Visualization assistant. The user wants to visualize their data and has asked: "${query}"

${context}

Based on the user's request and the available columns, suggest the best chart configuration.
You must respond with ONLY a valid JSON object matching this schema, with no markdown formatting or other text:
{
  "type": "bar" | "line" | "scatter" | "pie",
  "xAxis": "exact_column_name_from_context",
  "yAxis": "exact_column_name_from_context"
}
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text() || '';
        // Strip markdown formatting if the model accidentally included it
        const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        return JSON.parse(jsonStr);
    } catch (error: any) {
        console.error('Error generating chart suggestion:', error);
        throw new Error(error?.message || 'Failed to generate chart suggestion. Please try rephrasing your request.');
    }
}
