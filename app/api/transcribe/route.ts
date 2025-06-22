import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '../../lib/groq';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fileForGroq = new File([buffer], audioFile.name, {
      type: audioFile.type,
    });

    const transcription = await transcribeAudio(fileForGroq, {
      language: language || 'en',
      response_format: 'verbose_json',
    });

    return NextResponse.json({
      success: true,
      transcription,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}