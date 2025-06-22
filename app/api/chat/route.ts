import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '../../lib/groq';

export async function POST(request: NextRequest) {
  try {
    const { message, context, chatHistory } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!context) {
      return NextResponse.json(
        { error: 'Context (transcription) is required' },
        { status: 400 }
      );
    }

    const response = await generateChatResponse(
      message,
      context,
      chatHistory || []
    );

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate chat response' },
      { status: 500 }
    );
  }
}