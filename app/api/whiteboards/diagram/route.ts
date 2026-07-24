import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

type DiagramNode = {
  id: string;
  label: string;
  kind: 'start' | 'process' | 'decision' | 'end' | 'note';
};
type DiagramConnection = { from: string; to: string; label?: string };

function isNode(value: unknown): value is DiagramNode {
  if (!value || typeof value !== 'object') return false;
  const node = value as Record<string, unknown>;
  return (
    typeof node.id === 'string' &&
    typeof node.label === 'string' &&
    ['start', 'process', 'decision', 'end', 'note'].includes(String(node.kind))
  );
}

function isConnection(value: unknown): value is DiagramConnection {
  if (!value || typeof value !== 'object') return false;
  const connection = value as Record<string, unknown>;
  return (
    typeof connection.from === 'string' && typeof connection.to === 'string'
  );
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.OPENAI_API_KEY)
    return NextResponse.json(
      { error: 'AI Diagram is not configured.' },
      { status: 503 },
    );

  const body = (await request.json()) as Record<string, unknown>;
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt || prompt.length > 1800)
    return NextResponse.json(
      { error: 'Describe the diagram in up to 1,800 characters.' },
      { status: 400 },
    );

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.create({
    model: 'gpt-5.6-luna',
    reasoning: { effort: 'low' },
    text: { verbosity: 'low' },
    safety_identifier: `flowbase-${userId}`,
    input: [
      {
        role: 'developer',
        content:
          'You design compact, editable diagrams for a productivity whiteboard. Return valid JSON only, with shape {"title":"string","nodes":[{"id":"n1","label":"short label","kind":"start|process|decision|end|note"}],"connections":[{"from":"n1","to":"n2","label":"optional short label"}]}. Create 3-12 nodes and only connections that reference node ids. Support flowcharts, mind maps, system architecture, user journeys, and process diagrams. Keep labels under 48 characters. Do not add Markdown or explanations.',
      },
      { role: 'user', content: prompt },
    ],
  });

  try {
    const parsed = JSON.parse(response.output_text) as Record<string, unknown>;
    const rawNodes = Array.isArray(parsed.nodes)
      ? parsed.nodes.filter(isNode)
      : [];
    const ids = new Set(rawNodes.map((node) => node.id));
    const connections = Array.isArray(parsed.connections)
      ? parsed.connections
          .filter(isConnection)
          .filter(
            (connection) => ids.has(connection.from) && ids.has(connection.to),
          )
          .slice(0, 20)
      : [];
    if (!rawNodes.length) throw new Error('No diagram nodes returned.');
    return NextResponse.json({
      title:
        typeof parsed.title === 'string'
          ? parsed.title.slice(0, 100)
          : 'AI diagram',
      nodes: rawNodes.slice(0, 12).map((node) => ({
        ...node,
        id: node.id.slice(0, 40),
        label: node.label.slice(0, 48),
      })),
      connections,
    });
  } catch {
    return NextResponse.json(
      { error: 'AI Diagram returned an invalid layout. Please try again.' },
      { status: 502 },
    );
  }
}
