import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is required');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  response_format?: 'json' | 'text' | 'verbose_json';
  temperature?: number;
}

export interface TranscriptionResponse {
  text: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
  language?: string;
  confidence?: number;
}

export async function transcribeAudio(
  audioFile: File | Buffer,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResponse> {
  try {
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: options.language || 'en',
      prompt: options.prompt,
      response_format: options.response_format || 'verbose_json',
      temperature: options.temperature || 0,
    });

    return transcription;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

export async function analyzeText(
  text: string,
  type: 'summary' | 'key_notes' | 'topics' | 'sentiment' | 'action_items'
): Promise<string> {
  const prompts = {
    summary: `Please provide a comprehensive summary of the following text in three levels:
1. Brief (1-2 sentences)
2. Detailed (1 paragraph)
3. Comprehensive (2-3 paragraphs)

Text: ${text}

Return ONLY a JSON object with keys: brief, detailed, comprehensive. Do not include any markdown formatting, code blocks, or additional text.`,
    
    key_notes: `Extract the most important key points and notes from the following text. Present them as a clean numbered list, one point per line, without any additional formatting.

Text: ${text}`,
    
    topics: `Identify the main topics, themes, and subjects discussed in the following text. Return ONLY a JSON array of strings, no markdown or code blocks.

Text: ${text}`,
    
    sentiment: `Analyze the overall sentiment and tone of the following text. Return ONLY one word: positive, negative, or neutral.

Text: ${text}`,
    
    action_items: `Extract any action items, tasks, or next steps mentioned in the following text. Present as a clean numbered list, one item per line, without any additional formatting.

Text: ${text}`
  };

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompts[type],
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error(`Error analyzing text for ${type}:`, error);
    throw new Error(`Failed to analyze text for ${type}`);
  }
}

export async function generateChatResponse(
  message: string,
  context: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  try {
    const systemPrompt = `You are an AI assistant helping users understand and interact with their transcribed audio content. 
    
Context from transcription:
${context}

Use this context to provide helpful, accurate responses to user questions. If the question cannot be answered from the context, say so clearly.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatHistory,
      { role: 'user' as const, content: message },
    ];

    const response = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate chat response');
  }
}

export async function generateMermaidDiagram(
  text: string,
  diagramType: 'flowchart' | 'mindmap' | 'concept' | 'timeline' | 'network'
): Promise<{ title: string; mermaidCode: string; description: string }> {
  const prompts = {
    flowchart: `Analyze the following text and create a comprehensive Mermaid flowchart diagram that visualizes the processes, decision points, and workflows mentioned. Include clear start/end points, decision diamonds, and process rectangles. Use descriptive node labels and logical flow directions.`,
    mindmap: `Create a detailed Mermaid mindmap diagram from the following text. Identify the central theme and branch out to main topics, subtopics, and key concepts. Use hierarchical structure with meaningful connections between related ideas.`,
    concept: `Analyze the text and create a Mermaid graph diagram that shows the relationships between key concepts, ideas, and entities. Use nodes for concepts and labeled edges to show how they relate to each other (e.g., "causes", "includes", "leads to", "part of").`,
    timeline: `Extract chronological events, sequences, or time-based progressions from the text and create a Mermaid timeline or gantt diagram. Focus on temporal relationships and order of events with clear time markers or sequence indicators.`,
    network: `Create a Mermaid graph diagram that visualizes the network of relationships, dependencies, connections, or interactions between people, systems, or entities mentioned in the text. Show how different elements connect and influence each other.`
  };

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `${prompts[diagramType]}

Text: ${text}

IMPORTANT: Return ONLY a valid JSON object (no markdown, no additional text) with:
- title: A descriptive title for the diagram (max 60 characters)
- mermaidCode: Complete, valid Mermaid syntax for the diagram
- description: Brief description of what the diagram represents (max 150 characters)

MERMAID SYNTAX REQUIREMENTS:
- Start with proper diagram type declaration (flowchart TD, mindmap, graph LR, timeline, etc.)
- Use valid node syntax with proper quotes for labels containing spaces
- Ensure all connections use correct arrow syntax
- For flowcharts: Use (Start) for ovals, [Process] for rectangles, {Decision?} for diamonds
- For mindmaps: Use root((Central Topic)) syntax
- Keep node IDs simple (A, B, C, etc.) and use descriptive labels
- Ensure the diagram is complete and renders without errors

Example format:
{"title": "Process Flow", "mermaidCode": "flowchart TD\n    A[Start] --> B{Decision?}\n    B -->|Yes| C[Process]\n    B -->|No| D[End]", "description": "Shows the decision-making process"}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1200,
    });

    const result = response.choices[0]?.message?.content || '';
    return JSON.parse(result);
  } catch (error) {
    console.error('Error generating Mermaid diagram:', error);
    throw new Error('Failed to generate diagram');
  }
}

export default groq;