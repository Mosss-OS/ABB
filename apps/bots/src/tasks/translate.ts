import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

function extractTargetLanguage(description: string): string | null {
  const langs = ['Spanish', 'French', 'German', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian'];
  const lower = description.toLowerCase();
  for (const lang of langs) {
    if (lower.includes(lang.toLowerCase())) return lang;
  }
  return null;
}

function extractSourceText(description: string): string {
  const text = description
    .replace(/translate\s+(this\s+)?(cast|text|message)?\s*(to|in)?\s*(Spanish|French|German|Portuguese|Chinese|Japanese|Korean|Arabic|Hindi|Russian)/gi, '')
    .replace(/translate\s+(this\s+)?(cast|text|message)?/gi, '')
    .trim();
  return text || description;
}

export async function translateTask(description: string): Promise<{ output: string }> {
  try {
    const targetLang = extractTargetLanguage(description) ?? 'Spanish';
    const sourceText = extractSourceText(description);

    const response = await openai.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: `Translate the following text to ${targetLang}. Provide only the translation.` },
        { role: 'user', content: sourceText },
      ],
      max_tokens: 500,
    });

    const output = response.choices[0]?.message?.content ?? '[translation failed]';
    return { output };
  } catch (error) {
    console.error('[translate] error:', error);
    return { output: '[translation failed]' };
  }
}
