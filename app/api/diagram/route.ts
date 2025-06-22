import { NextRequest, NextResponse } from 'next/server';
import { generateMermaidDiagram } from '../../lib/groq';

export async function POST(request: NextRequest) {
  try {
    const { text, diagramType } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required for diagram generation' },
        { status: 400 }
      );
    }

    if (!diagramType) {
      return NextResponse.json(
        { error: 'Diagram type is required' },
        { status: 400 }
      );
    }

    const validTypes = ['flowchart', 'mindmap', 'concept', 'timeline', 'network'];
    if (!validTypes.includes(diagramType)) {
      return NextResponse.json(
        { error: `Invalid diagram type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const diagram = await generateMermaidDiagram(text, diagramType);

    return NextResponse.json({
      success: true,
      diagram,
    });
  } catch (error) {
    console.error('Diagram generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate diagram' },
      { status: 500 }
    );
  }
}