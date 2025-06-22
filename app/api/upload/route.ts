import { NextRequest, NextResponse } from 'next/server';
import { isValidAudioFile, isValidFileSize } from '../../lib/audio-utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (!isValidAudioFile(audioFile)) {
      return NextResponse.json(
        { error: 'Invalid audio file format. Supported formats: MP3, WAV, M4A, OGG, WEBM' },
        { status: 400 }
      );
    }

    if (!isValidFileSize(audioFile)) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 25MB' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      fileInfo: {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type,
        lastModified: audioFile.lastModified,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process uploaded file' },
      { status: 500 }
    );
  }
}