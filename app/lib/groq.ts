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
    const fileToUpload: File = audioFile instanceof Buffer 
      ? new File([audioFile], 'audio.webm', { type: 'audio/webm' })
      : audioFile as File;

    const transcription = await groq.audio.transcriptions.create({
      file: fileToUpload,
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
    summary: `You are a professional content analyst. Create a comprehensive, multi-layered summary of the following transcribed content.

CONTENT TO ANALYZE:
${text}

Your task is to create three distinct summary levels that progressively build in detail:

1. BRIEF (1-2 sentences): Capture the absolute core essence - what is this content fundamentally about and why does it matter?

2. DETAILED (1 paragraph, 3-5 sentences): Expand on the main points, including key insights, primary topics discussed, and significant conclusions or decisions reached.

3. COMPREHENSIVE (2-3 paragraphs): Provide full context including background information, detailed explanations of concepts discussed, supporting evidence or examples mentioned, implications of the content, and any notable nuances or subtleties.

FORMATTING REQUIREMENTS:
- Return ONLY a valid JSON object with exactly these keys: "brief", "detailed", "comprehensive"
- No markdown formatting, code blocks, or additional text outside the JSON
- Ensure each summary level maintains accuracy while progressively adding depth
- Use clear, professional language appropriate for business or academic contexts

Focus on extracting meaningful insights rather than just restating information.`,
    
    key_notes: `You are an expert note-taker and content analyst. Extract the most valuable and actionable key points from this transcribed content.

CONTENT TO ANALYZE:
${text}

Your task is to identify and extract:
- Core concepts and important definitions
- Key insights, discoveries, or revelations
- Critical decisions or conclusions reached
- Important facts, statistics, or data points mentioned
- Significant quotes or statements that capture essential meaning
- Notable patterns, trends, or connections discussed
- Warning signs, risks, or concerns highlighted
- Success factors or best practices mentioned

FORMATTING REQUIREMENTS:
- Present as a clean, numbered list (one insight per line)
- Start each point with a clear, descriptive phrase
- Use action-oriented language where applicable
- Prioritize practical, actionable information
- Limit to 8-12 most impactful points
- No bullet points, markdown, or additional formatting
- Focus on what someone would want to remember or act upon

Make each note self-contained and immediately understandable without referring back to the original content.`,
    
    topics: `You are a content taxonomy specialist. Analyze this transcribed content and identify all significant topics, themes, and subject areas discussed.

CONTENT TO ANALYZE:
${text}

Identify and categorize:
- Primary topics (main subjects extensively discussed)
- Secondary themes (supporting topics that add context)
- Specific subjects (particular areas of focus within broader topics)
- Conceptual themes (abstract ideas or principles discussed)
- Practical applications (real-world implementations or examples)
- Industry/domain-specific areas (specialized fields or sectors mentioned)

FORMATTING REQUIREMENTS:
- Return ONLY a JSON array of strings
- Each topic should be 1-4 words maximum
- Use title case formatting (e.g., "Machine Learning", "Project Management")
- Arrange from most to least prominent in the content
- Include both broad topics and specific subtopics
- Limit to 8-15 most relevant topics
- No descriptions, explanations, or additional formatting
- Focus on topics that would be useful for categorization or search

Extract topics that accurately represent the content's scope and would help others quickly understand what was discussed.`,
    
    sentiment: `You are a sentiment analysis expert. Analyze the overall emotional tone, attitude, and sentiment of this transcribed content.

CONTENT TO ANALYZE:
${text}

Consider these dimensions in your analysis:
- Overall emotional tone (positive, negative, neutral)
- Speaker's attitude and demeanor
- Energy level and enthusiasm
- Confidence and certainty in statements
- Optimism vs. pessimism about topics discussed
- Stress, frustration, or concern levels
- Satisfaction or dissatisfaction indicators
- Forward-looking vs. retrospective sentiment

ASSESSMENT CRITERIA:
- Positive: Optimistic, enthusiastic, confident, satisfied, encouraging, constructive
- Negative: Pessimistic, frustrated, concerned, critical, worried, discouraging
- Neutral: Balanced, factual, objective, measured, professional, informational

FORMATTING REQUIREMENTS:
- Return ONLY one word: "positive", "negative", or "neutral"
- Base assessment on the predominant sentiment throughout the content
- Consider both explicit emotional expressions and implicit tonal indicators
- Weight the overall message and conclusion more heavily than isolated moments

Choose the sentiment that best captures the general emotional character of the entire content.`,
    
    action_items: `You are a productivity and task management specialist. Extract all actionable items, tasks, commitments, and next steps from this transcribed content.

CONTENT TO ANALYZE:
${text}

Identify and extract:
- Explicit tasks or assignments mentioned
- Commitments made by speakers
- Decisions that require follow-up actions
- Problems that need solutions or investigation
- Opportunities that should be pursued
- Deadlines, milestones, or time-sensitive items
- People to contact or follow up with
- Resources to gather or research
- Processes to implement or improve
- Reviews, evaluations, or check-ins scheduled

FORMATTING REQUIREMENTS:
- Present as a clean, numbered list (one action per line)
- Start each item with an action verb when possible
- Include relevant context (who, what, when, where if mentioned)
- Use specific, concrete language
- Prioritize items that have clear ownership or urgency
- Include both immediate and longer-term actions
- No bullet points, markdown, or additional formatting
- Focus on items that can realistically be acted upon

Transform discussions into actionable tasks that could be added to a task management system or to-do list.`
  };

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional content analyst with expertise in information extraction and synthesis. Provide accurate, insightful analysis that adds value beyond simple summarization.'
        },
        {
          role: 'user',
          content: prompts[type],
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 1500,
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
    const systemPrompt = `You are an intelligent AI assistant specialized in helping users analyze, understand, and extract insights from their transcribed audio content. You have access to the full transcription and can provide detailed, contextual responses.

TRANSCRIBED CONTENT CONTEXT:
${context}

YOUR CAPABILITIES AND APPROACH:
- Deep Content Analysis: You can identify patterns, themes, and connections within the transcription
- Contextual Understanding: Reference specific parts of the content when relevant to the user's question
- Information Extraction: Help users find specific details, quotes, or segments from the transcription
- Insight Generation: Provide analysis that goes beyond what's explicitly stated
- Question Answering: Answer both factual questions and interpretive questions about the content
- Summarization: Create focused summaries on specific aspects the user is interested in
- Cross-referencing: Connect related concepts or topics mentioned at different points in the content

RESPONSE GUIDELINES:
1. Always ground your responses in the actual transcribed content
2. When referencing specific information, be precise about what was said
3. If asked about something not covered in the transcription, clearly state this limitation
4. Provide relevant quotes or paraphrases to support your answers when helpful
5. Offer additional insights or connections that might be valuable to the user
6. Ask clarifying questions if the user's query is ambiguous
7. Suggest follow-up questions or areas for deeper exploration when appropriate
8. Be conversational yet professional, adapting to the user's communication style

RESPONSE STRUCTURE:
- Start with a direct answer to the user's question
- Provide supporting evidence or details from the transcription
- Offer additional relevant insights or context
- Suggest related aspects they might want to explore

Remember: Your goal is to help users get maximum value from their transcribed content by providing intelligent, contextual assistance that enhances their understanding and ability to act on the information.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatHistory,
      { role: 'user' as const, content: message },
    ];

    const response = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1200,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate chat response');
  }
}


export async function generateMermaidDiagram(
  text: string,
  diagramType: 'flowchart' | 'mindmap' | 'concept' | 'timeline' | 'network',
  regenerationType?: 'detailed' | 'simplified'
): Promise<{ title: string; mermaidCode: string; description: string }> {
  const regenerationInstruction = regenerationType === 'detailed' 
    ? '\n\nIMPORTANT: Make this diagram MORE DETAILED by adding more steps, sub-processes, decision points, and intermediate stages. Include additional nodes and connections to show more granular details.'
    : regenerationType === 'simplified'
    ? '\n\nIMPORTANT: Make this diagram SIMPLIFIED by reducing complexity, combining related steps, removing minor details, and focusing only on the most essential elements and main flow.'
    : '';

  const prompts = {
    flowchart: `You are a visual diagram generator. Based on the following text, create a Mermaid flowchart diagram that visualizes the processes, decision points, and workflows mentioned.${regenerationInstruction}

Text: "${text}"

Create a Mermaid flowchart with clear structure:
1. Start/End points using stadium shapes (Start) and (End)
2. Process steps using rectangles [Process Name]
3. Decision points using diamonds {Decision?}
4. Clear directional flow with meaningful labels

Return ONLY the Mermaid flowchart syntax in this exact format:

\`\`\`mermaid
flowchart TD
    A(Start) --> B[First Process]
    B --> C{Decision Point?}
    C -->|Yes| D[Process A]
    C -->|No| E[Process B]
    D --> F(End)
    E --> F
\`\`\`

Rules:
- Use flowchart TD (top-down) syntax
- Use stadium shapes (text) for start/end, rectangles [text] for processes, diamonds {text?} for decisions
- Extract 4-8 main steps/decisions from the text
- Keep labels concise (2-4 words max)
- Focus on logical flow and sequence
- Use simple, clear language
- No special characters or symbols in labels

Only return the Mermaid code block, nothing else.`,

    mindmap: `You are a visual mind map generator. Based on the following content, create a Mermaid flowchart diagram that mimics a mind map layout with a central topic and radiating branches.${regenerationInstruction}

Content: "${text}"

Analyze the content and identify:
1. The central theme/topic (what is this content primarily about?)
2. 3-6 main concepts or categories that branch from the central theme
3. 2-4 supporting details, examples, or sub-concepts for each main branch
4. Logical relationships and hierarchical groupings

Create a flowchart that looks like a mind map with this structure:

\`\`\`mermaid
flowchart LR
    A((Central Topic)) --> B[Main Concept 1]
    A --> C[Main Concept 2]
    A --> D[Main Concept 3]
    A --> E[Main Concept 4]
    
    B --> F[Supporting Detail 1]
    B --> G[Supporting Detail 2]
    C --> H[Supporting Detail 3]
    C --> I[Supporting Detail 4]
    D --> J[Supporting Detail 5]
    D --> K[Supporting Detail 6]
    E --> L[Supporting Detail 7]
    E --> M[Supporting Detail 8]
\`\`\`

CRITICAL SYNTAX RULES:
- Use flowchart LR (left-right) for mind map-like spreading
- Central topic MUST use double parentheses ((Central Topic)) for circular shape
- Main concepts use square brackets [Main Concept] for rectangular shapes
- Supporting details use square brackets [Supporting Detail] for rectangular shapes
- Each node MUST have a simple identifier (A, B, C, D, etc.)
- Extract 3-6 main concepts as primary branches from the central topic
- Add 2-4 sub-concepts under each main branch
- Keep labels concise (2-4 words max) but descriptive
- Use only alphanumeric characters and spaces in labels
- NO special characters, symbols, punctuation, or quotes in labels
- Create logical hierarchical groupings that make sense
- Make it visually balanced with similar branch sizes
- Each line must be: NodeID((Central)) --> NodeID[Branch] or NodeID[Branch] --> NodeID[Detail]

Only return the Mermaid code block, nothing else.`,

    concept: `You are a concept map generator. Based on the following text, create a Mermaid graph diagram that shows the relationships between key concepts, ideas, and entities.${regenerationInstruction}

Text: "${text}"

Create a Mermaid graph diagram with:
1. Key concepts as nodes using simple identifiers (A, B, C, etc.)
2. Labeled relationships between concepts
3. Clear directional connections showing how concepts relate  

Return ONLY the Mermaid graph syntax in this exact format:

\`\`\`mermaid
graph TD
    A[Concept A] --> B[Concept B]
    B --> C[Concept C]
    A --> D[Concept D]
    C --> E[Concept E]
    D --> B
    E --> F[Concept F]
\`\`\`

CRITICAL SYNTAX RULES:
- Use graph TD (top-down) syntax - NEVER use LR
- Each node MUST have a simple identifier (A, B, C, D, E, F, etc.)
- Use rectangles [text] for all concepts
- NO relationship labels on arrows (use simple --> only)
- Extract 5-8 key concepts from the text
- Keep concept names concise (1-3 words max)
- Use only alphanumeric characters and spaces in concept names
- NO special characters, symbols, punctuation, or quotes in concept names
- Each line must be: NodeID[Concept Name] --> NodeID[Concept Name]
- Start with simple connections, avoid complex branching

Example of CORRECT syntax:
A[Main Topic] --> B[Subtopic One]
A --> C[Subtopic Two]
B --> D[Detail One]
C --> E[Detail Two]

Only return the Mermaid code block, nothing else.`,

    timeline: `You are a timeline diagram generator. Based on the following text, create a Mermaid timeline or gantt diagram that shows chronological events, sequences, or time-based progressions.${regenerationInstruction}

Text: "${text}"

Create a Mermaid timeline with:
1. Chronological sequence of events
2. Clear time markers or progression
3. Key milestones and phases

Return ONLY the Mermaid timeline syntax in this exact format:

\`\`\`mermaid
timeline
    title Timeline Title
    
    Phase 1 : Event 1
           : Event 2
    
    Phase 2 : Event 3
           : Event 4
           
    Phase 3 : Event 5
           : Event 6
\`\`\`

Rules:
- Use timeline syntax with clear phases
- Extract 3-6 phases or time periods from the text
- Add 1-3 events per phase
- Keep event names concise (2-4 words max)
- Focus on chronological order and sequence
- Use simple, clear language
- No special characters or symbols in labels

Only return the Mermaid code block, nothing else.`,

    network: `You are a network diagram generator. Based on the following text, create a Mermaid graph diagram that visualizes the network of relationships, dependencies, connections, or interactions between entities.${regenerationInstruction}

Text: "${text}"

Create a Mermaid graph diagram with:
1. Entities as nodes (people, systems, organizations)
2. Connections showing relationships and dependencies
3. Network structure showing influence and interaction

Return ONLY the Mermaid graph syntax in this exact format:

\`\`\`mermaid
graph TB
    A[Entity A] --> B[Entity B]
    B --> C[Entity C]
    A --> D[Entity D]
    C --> E[Entity E]
    D --> B
    E --> A
\`\`\`

Rules:
- Use graph TB (top-bottom) syntax
- Use rectangles [text] for entities
- Extract 5-8 key entities from the text
- Show meaningful connections and dependencies
- Keep entity names concise (2-3 words max)
- Focus on network structure and relationships
- Use simple, clear language
- No special characters or symbols in labels

Only return the Mermaid code block, nothing else.`
  };

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `${prompts[diagramType]}

IMPORTANT: After generating the Mermaid diagram, return ONLY a valid JSON object (no markdown, no additional text) with:
- title: A descriptive title for the diagram (max 60 characters)
- mermaidCode: The complete Mermaid syntax you generated (without the \`\`\`mermaid wrapper)
- description: Brief description of what the diagram represents (max 150 characters)

Example format:
{"title": "Process Flow", "mermaidCode": "flowchart TD\\n    A[Start] --> B{Decision?}\\n    B -->|Yes| C[Process]\\n    B -->|No| D[End]", "description": "Shows the decision-making process"}`,
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