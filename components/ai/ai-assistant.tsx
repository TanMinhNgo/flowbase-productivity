'use client';

import { Bot, RotateCcw, Send, Sparkles } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import {
  type AssistantMessage,
  useAiAssistant,
} from '@/hooks/api/use-ai-assistant';

const prompts = [
  'Plan my top three priorities for today',
  'Turn this idea into a project plan',
  'Help me break a large task into next actions',
  'Draft a concise meeting agenda',
];

export function AiAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const assistant = useAiAssistant();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || assistant.isPending) return;
    const nextMessages = [...messages, { role: 'user' as const, content }];
    setMessages(nextMessages);
    setInput('');
    try {
      const response = await assistant.mutateAsync(nextMessages);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.text },
      ]);
    } catch {
      // The mutation error is rendered next to the composer.
    }
  };

  return (
    <section className="mx-auto flex h-[calc(100dvh-8rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border p-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles size={18} />
          </span>
          <div className="min-w-0">
            <h1 className="font-semibold">Flowbase AI</h1>
            <p className="truncate text-sm text-muted-foreground">
              Your planning and productivity copilot
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMessages([])}
          disabled={!messages.length || assistant.isPending}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-secondary disabled:opacity-50"
        >
          <RotateCcw size={15} /> <span className="hidden sm:inline">New chat</span>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {messages.length ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' ? (
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Bot size={16} />
                  </span>
                ) : null}
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'border border-border bg-background'}`}
                >
                  {message.content}
                </p>
              </article>
            ))}
            {assistant.isPending ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Bot size={16} />
                </span>
                <span className="animate-pulse">Thinking through it…</span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto grid max-w-3xl place-items-center py-12 text-center sm:py-20">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles size={25} />
            </span>
            <h2 className="mt-5 text-2xl font-semibold">What are we moving forward?</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              Ask for a plan, clearer next steps, a draft, or a thoughtful way to organize your work.
            </p>
            <div className="mt-7 grid w-full gap-2 text-left sm:grid-cols-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                  className="rounded-xl border border-border bg-background p-3 text-left text-sm transition hover:border-primary/40 hover:bg-primary/5"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="shrink-0 border-t border-border bg-card p-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:ring-2 focus-within:ring-primary/20">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            placeholder="Ask Flowbase AI anything…"
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || assistant.isPending}
            className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:brightness-95 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
        {assistant.error instanceof Error ? (
          <p className="mx-auto mt-2 max-w-3xl text-xs text-destructive">
            {assistant.error.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
