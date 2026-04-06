import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function summarizeTask(description: string): Promise<{ output: string }> {
  try {
    const sourceText = description
      .replace(/summarize|tldr|summary/gi, '')
      .trim();

    const response = await openai.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: 'Summarize the following text in 2 sentences or less.' },
        { role: 'user', content: sourceText },
      ],
      max_tokens: 200,
    });

    const output = response.choices[0]?.message?.content ?? '[summary failed]';
    return { output };
  } catch (error) {
    console.error('[summarize] error:', error);
    return { output: '[summary failed]' };
  }
}
