export type TaskType = 'translate' | 'summarize' | 'onchain-lookup' | 'custom';

export async function executeTask(
  taskDescription: string,
  taskType: TaskType
): Promise<string> {
  switch (taskType) {
    case 'translate':
      return await executeTranslate(taskDescription);
    case 'summarize':
      return await executeSummarize(taskDescription);
    case 'onchain-lookup':
      return await executeOnchainLookup(taskDescription);
    default:
      return await executeCustomTask(taskDescription);
  }
}

async function executeTranslate(text: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    return `[Translation requires GROQ_API_KEY]`;
  }

  try {
    const { Groq } = await import('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a translation engine. Translate the given text accurately.' },
        { role: 'user', content: text },
      ],
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || '[translation failed]';
  } catch (error) {
    return `[Translation error: ${error instanceof Error ? error.message : 'unknown'}]`;
  }
}

async function executeSummarize(text: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    return `[Summarization requires GROQ_API_KEY]`;
  }

  try {
    const { Groq } = await import('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a summarization engine. Provide a concise summary.' },
        { role: 'user', content: text },
      ],
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content || '[summarization failed]';
  } catch (error) {
    return `[Summarization error: ${error instanceof Error ? error.message : 'unknown'}]`;
  }
}

async function executeOnchainLookup(query: string): Promise<string> {
  const rpcUrl = process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo';
  
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });
    
    const data = await response.json();
    const blockNumber = parseInt(data.result || '0x0', 16);
    return `Current Base block number: ${blockNumber}`;
  } catch (error) {
    return `[Onchain lookup error: ${error instanceof Error ? error.message : 'unknown'}]`;
  }
}

async function executeCustomTask(taskDescription: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    return `[Task execution requires GROQ_API_KEY]`;
  }

  try {
    const { Groq } = await import('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an AI task executor. Complete the task and provide the result.' },
        { role: 'user', content: taskDescription },
      ],
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || '[task execution failed]';
  } catch (error) {
    return `[Task error: ${error instanceof Error ? error.message : 'unknown'}]`;
  }
}