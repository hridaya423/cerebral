import { NextRequest, NextResponse } from 'next/server';
import { analyzeText } from '../../lib/groq';

export async function POST(request: NextRequest) {
  try {
    const { text, analysisType } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required for analysis' },
        { status: 400 }
      );
    }

    if (!analysisType) {
      return NextResponse.json(
        { error: 'Analysis type is required' },
        { status: 400 }
      );
    }

    const validTypes = ['summary', 'key_notes', 'topics', 'sentiment', 'action_items'];
    if (!validTypes.includes(analysisType)) {
      return NextResponse.json(
        { error: `Invalid analysis type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await analyzeText(text, analysisType);

    return NextResponse.json({
      success: true,
      result,
      analysisType,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze text' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { text, includeActionItems = false } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required for analysis' },
        { status: 400 }
      );
    }

    const analysisTasks = [
      analyzeText(text, 'summary'),
      analyzeText(text, 'key_notes'),
      analyzeText(text, 'topics'),
      analyzeText(text, 'sentiment'),
    ];

    if (includeActionItems) {
      analysisTasks.push(analyzeText(text, 'action_items'));
    }

    const results = await Promise.all(analysisTasks);
    const [summary, keyNotes, topics, sentiment, actionItems] = results;

    let parsedSummary;
    try {
      const cleanSummary = summary.replace(/```json\s*|\s*```/g, '').trim();
      parsedSummary = JSON.parse(cleanSummary);
    } catch {
      parsedSummary = {
        brief: summary.substring(0, 200),
        detailed: summary.substring(0, 500),
        comprehensive: summary,
      };
    }

    let parsedTopics;
    try {
      const cleanTopics = topics.replace(/```json\s*|\s*```/g, '').trim();
      parsedTopics = JSON.parse(cleanTopics);
    } catch {
      parsedTopics = [topics];
    }

    const analysis: {
      summary: {
        brief: string;
        detailed: string;
        comprehensive: string;
      };
      keyNotes: string[];
      topics: string[];
      sentiment: 'positive' | 'negative' | 'neutral';
      actionItems?: string[];
    } = {
      summary: parsedSummary,
      keyNotes: keyNotes.split('\n').filter(note => note.trim()),
      topics: Array.isArray(parsedTopics) ? parsedTopics : [parsedTopics],
      sentiment: sentiment.toLowerCase().includes('positive') ? 'positive' :
                 sentiment.toLowerCase().includes('negative') ? 'negative' : 'neutral',
    };

    if (includeActionItems && actionItems) {
      analysis.actionItems = actionItems.split('\n').filter(item => item.trim());
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Batch analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to perform batch analysis' },
      { status: 500 }
    );
  }
}