import { NextRequest, NextResponse } from 'next/server';
import { isValidYouTubeUrl, getVideoInfo, downloadAudioAsBuffer } from '../../lib/youtube-extractor';
import { transcribeAudio } from '../../lib/groq';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const videoInfo = await getVideoInfo(url);
    
    if (videoInfo.duration > 1800) {
      return NextResponse.json(
        { error: 'Video is too long. Maximum duration is 30 minutes.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      videoInfo,
    });
  } catch (error) {
    console.error('YouTube extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract video information' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { url, language = 'en' } = await request.json();
    
    if (!url || !isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: 'Valid YouTube URL is required' },
        { status: 400 }
      );
    }

    const audioBuffer = await downloadAudioAsBuffer(url);
    
    const audioFile = new File([audioBuffer], 'youtube-audio.webm', {
      type: 'audio/webm',
    });

    const transcription = await transcribeAudio(audioFile, {
      language: language || 'en',
      response_format: 'verbose_json',
    });

    return NextResponse.json({
      success: true,
      transcription,
    });
  } catch (error) {
    console.error('YouTube transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to download and transcribe YouTube video' },
      { status: 500 }
    );
  }
}