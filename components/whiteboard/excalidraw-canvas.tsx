'use client';

import {
  convertToExcalidrawElements,
  Excalidraw,
  exportToBlob,
} from '@excalidraw/excalidraw';
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from '@excalidraw/excalidraw/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import '@excalidraw/excalidraw/index.css';
import { PenLine, Sparkles, StickyNote } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type WhiteboardScene = {
  elements: string;
  appState: string;
  files: string;
};
export type DiagramSpec = {
  title: string;
  nodes: Array<{
    id: string;
    label: string;
    kind: 'start' | 'process' | 'decision' | 'end' | 'note';
  }>;
  connections: Array<{ from: string; to: string; label?: string }>;
};

function parse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function sceneFromStrings(scene: WhiteboardScene) {
  return {
    elements: parse<readonly ExcalidrawElement[]>(scene.elements, []),
    appState: parse<Partial<AppState>>(scene.appState, {
      viewBackgroundColor: '#fffaf6',
    }),
    files: parse<BinaryFiles>(scene.files, {}),
  };
}

function serializableAppState(appState: AppState): Partial<AppState> {
  return {
    viewBackgroundColor: appState.viewBackgroundColor,
    scrollX: appState.scrollX,
    scrollY: appState.scrollY,
    zoom: appState.zoom,
    currentItemStrokeColor: appState.currentItemStrokeColor,
    currentItemBackgroundColor: appState.currentItemBackgroundColor,
    currentItemFillStyle: appState.currentItemFillStyle,
    currentItemStrokeWidth: appState.currentItemStrokeWidth,
    currentItemRoughness: appState.currentItemRoughness,
  };
}

export function ExcalidrawCanvas({
  boardId,
  boardName,
  scene,
  onSceneChange,
}: {
  boardId: number;
  boardName: string;
  scene: WhiteboardScene;
  onSceneChange: (scene: WhiteboardScene) => void;
}) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const current = useRef(sceneFromStrings(scene));
  const initialBoardId = useRef(boardId);
  const [hasContent, setHasContent] = useState(
    () => current.current.elements.some((element) => !element.isDeleted),
  );

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () =>
      setTheme(root.classList.contains('dark') ? 'dark' : 'light');
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const next = sceneFromStrings(scene);
    current.current = next;
    setHasContent(next.elements.some((element) => !element.isDeleted));
    if (initialBoardId.current !== boardId) {
      initialBoardId.current = boardId;
      if (api) {
        api.updateScene({
          elements: next.elements,
          appState: { ...api.getAppState(), ...next.appState },
        });
        void api.addFiles(Object.values(next.files));
      }
    }
  }, [api, boardId, scene]);

  const emitScene = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles,
    ) => {
      current.current = { elements, appState, files };
      setHasContent(elements.some((element) => !element.isDeleted));
      onSceneChange({
        elements: JSON.stringify(elements),
        appState: JSON.stringify(serializableAppState(appState)),
        files: JSON.stringify(files),
      });
    },
    [onSceneChange],
  );

  const addSticky = () => {
    if (!api) return;
    const { elements, appState } = current.current;
    const x = -(appState.scrollX ?? 0) + 120;
    const y = -(appState.scrollY ?? 0) + 120;
    const groupId = `sticky-${Date.now()}`;
    const next = convertToExcalidrawElements(
      [
        {
          id: `${groupId}-shape`,
          type: 'rectangle',
          x,
          y,
          width: 240,
          height: 170,
          backgroundColor: '#f9d7a4',
          fillStyle: 'solid',
          strokeColor: '#8f5b42',
          roundness: { type: 3 },
          groupIds: [groupId],
        },
        {
          id: `${groupId}-text`,
          type: 'text',
          x: x + 22,
          y: y + 26,
          text: 'Type a thought…',
          fontSize: 20,
          strokeColor: '#42281d',
          groupIds: [groupId],
        },
      ],
      { regenerateIds: false },
    );
    api.updateScene({ elements: [...elements, ...next] });
  };

  const addDiagram = (diagram: DiagramSpec) => {
    if (!api) return;
    const { elements, appState } = current.current;
    const x = -(appState.scrollX ?? 0) + 80;
    const y = -(appState.scrollY ?? 0) + 80;
    const cols = Math.min(
      3,
      Math.max(1, Math.ceil(Math.sqrt(diagram.nodes.length))),
    );
    const nodes = diagram.nodes.map((node, index) => {
      const column = index % cols;
      const row = Math.floor(index / cols);
      const shape = node.kind === 'decision' ? 'diamond' : 'rectangle';
      return {
        id: `ai-${Date.now()}-${node.id}`,
        type: shape,
        x: x + column * 290,
        y: y + row * 185,
        width: 190,
        height: 95,
        backgroundColor:
          node.kind === 'start' || node.kind === 'end'
            ? '#dcefc7'
            : node.kind === 'decision'
              ? '#ffe7ac'
              : node.kind === 'note'
                ? '#f6dcbe'
                : '#dfeafb',
        fillStyle: 'solid',
        strokeColor: '#4f5d6d',
        roundness: { type: 3 },
        label: { text: node.label, fontSize: 18, textAlign: 'center' },
      } as const;
    });
    const idByOriginal = new Map(
      diagram.nodes.map((node, index) => [node.id, nodes[index].id]),
    );
    const arrows = diagram.connections.flatMap((connection) => {
      const from = idByOriginal.get(connection.from);
      const to = idByOriginal.get(connection.to);
      return from && to
        ? [
            {
              type: 'arrow' as const,
              x,
              y,
              start: { id: from },
              end: { id: to },
              label: connection.label
                ? { text: connection.label, fontSize: 15 }
                : undefined,
              strokeColor: '#657385',
            },
          ]
        : [];
    });
    const generated = convertToExcalidrawElements([...nodes, ...arrows], {
      regenerateIds: false,
    });
    api.updateScene({ elements: [...elements, ...generated] });
  };

  const downloadPng = async () => {
    const { elements, appState, files } = current.current;
    const blob = await exportToBlob({
      elements: elements.filter((element) => !element.isDeleted),
      appState,
      files,
      mimeType: 'image/png',
      quality: 1,
      exportPadding: 32,
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${
      boardName
        .trim()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '') || 'whiteboard'
    }.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handler = () => void downloadPng();
    window.addEventListener('flowbase:export-png', handler);
    return () => window.removeEventListener('flowbase:export-png', handler);
  });

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-[#fffaf6] dark:bg-[#1b2430]">
      <Excalidraw
        initialData={{
          ...sceneFromStrings(scene),
          appState: {
            ...sceneFromStrings(scene).appState,
            showWelcomeScreen: false,
          },
        }}
        excalidrawAPI={setApi}
        onChange={emitScene}
        theme={theme}
        UIOptions={{
          canvasActions: { loadScene: false, saveToActiveFile: false },
        }}
      />
      <div className="pointer-events-none absolute right-4 top-4 z-10 flex gap-2">
        <button
          type="button"
          onClick={addSticky}
          className="pointer-events-auto inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold shadow-sm transition hover:bg-secondary"
        >
          <StickyNote size={15} className="text-primary" />
          Sticky note
        </button>
      </div>
      {!hasContent ? (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-6">
          <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border/80 bg-card/95 p-6 text-center shadow-[0_18px_55px_rgba(117,72,53,0.14)] backdrop-blur">
            <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <PenLine size={20} />
            </span>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">
              Start shaping your idea
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Draw freely, drop in a note, or let Flowbase turn a prompt into an editable diagram.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={addSticky}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
              >
                <StickyNote size={15} />
                Add a sticky note
              </button>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('flowbase:open-diagram'))}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold hover:bg-secondary"
              >
                <Sparkles size={15} className="text-primary" />
                Create with AI
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <DiagramBridge onDiagram={addDiagram} />
    </div>
  );
}

function DiagramBridge({
  onDiagram,
}: {
  onDiagram: (diagram: DiagramSpec) => void;
}) {
  useEffect(() => {
    const handler = (event: Event) =>
      onDiagram((event as CustomEvent<DiagramSpec>).detail);
    window.addEventListener('flowbase:add-diagram', handler);
    return () => window.removeEventListener('flowbase:add-diagram', handler);
  }, [onDiagram]);
  return null;
}
