'use client';
import { Bot, Check, Mic, Plus, Send, Sparkles, Square, X } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  useAssistantAction,
  useAssistantConversation,
  useAssistantConversations,
  useSendAssistant,
  type AssistantAction,
} from '@/hooks/api/use-ai-assistant';
import { useAssemblyAIVoiceAgent } from '@/hooks/use-assemblyai-voice-agent';
const prompts = [
  'Create a task for tomorrow',
  'Add meeting reminder on calendar',
  'Summarize my notes',
  'Create a Kanban board',
  'Plan my week',
  'Generate a habit tracker template',
];
const parseAction = (raw: string | null) => {
  try {
    return raw ? (JSON.parse(raw) as AssistantAction) : null;
  } catch {
    return null;
  }
};
export function AiAssistant() {
  const [active, setActive] = useState(0),
    [input, setInput] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const list = useAssistantConversations(),
    detail = useAssistantConversation(active),
    send = useSendAssistant(),
    action = useAssistantAction();
  const voice = useAssemblyAIVoiceAgent({
    onTranscript: (text) => {
      setInput(text);
      setTimeout(() => ref.current?.form?.requestSubmit(), 0);
    },
  });
  const messages = detail.data?.messages ?? [];
  useEffect(() => {
    if (!active && list.data?.items[0]) setActive(list.data.items[0].id);
  }, [active, list.data]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || send.isPending) return;
    setInput('');
    const result = await send.mutateAsync({
      conversationId: active || undefined,
      content,
    });
    setActive(result.conversationId);
  };
  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <aside className="hidden w-56 shrink-0 border-r border-border p-3 md:block">
        <button
          onClick={() => setActive(0)}
          className="flex h-10 w-full items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
        >
          <Plus size={16} />
          New chat
        </button>
        <div className="mt-4 space-y-1">
          {list.data?.items.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm ${active === item.id ? 'bg-secondary font-medium' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              {item.title}
            </button>
          ))}
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles size={17} />
            </span>
            <div>
              <h1 className="font-semibold">Flowbase AI</h1>
              <p className="text-xs text-muted-foreground">
                Your workspace command center
              </p>
            </div>
          </div>
          <button
            onClick={() => setActive(0)}
            className="rounded-lg border border-border p-2 md:hidden"
          >
            <Plus size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {!messages.length ? (
            <div className="mx-auto grid max-w-3xl place-items-center py-12 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Bot size={26} />
              </span>
              <h2 className="mt-5 text-2xl font-semibold">
                What can I help you move forward?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Ask a question, plan your next steps, or prepare an action to
                confirm.
              </p>
              <div className="mt-7 grid w-full gap-2 text-left sm:grid-cols-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      ref.current?.focus();
                    }}
                    className="rounded-xl border border-border bg-background p-3 text-sm hover:border-primary/40 hover:bg-primary/5"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((message) => {
                const proposal = parseAction(message.actionJson);
                return (
                  <article
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.role === 'assistant' && (
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Bot size={16} />
                      </span>
                    )}
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'border border-border bg-background'}`}
                    >
                      {message.content}
                      {proposal && (
                        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-foreground">
                          <p className="font-semibold">
                            Ready to: {proposal.summary}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Nothing is saved until you confirm.
                          </p>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() =>
                                void action
                                  .mutateAsync({
                                    id: proposal.id,
                                    confirm: true,
                                  })
                                  .then(() => detail.refetch())
                              }
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                            >
                              <Check size={14} />
                              Confirm
                            </button>
                            <button
                              onClick={() =>
                                void action
                                  .mutateAsync({
                                    id: proposal.id,
                                    confirm: false,
                                  })
                                  .then(() => detail.refetch())
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                            >
                              <X size={14} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
              {send.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot size={16} className="animate-pulse text-primary" />
                  Thinking…
                </div>
              )}
            </div>
          )}
        </div>
        <form onSubmit={submit} className="shrink-0 border-t border-border p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-border bg-background p-2">
            <textarea
              ref={ref}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="Ask Flowbase AI to plan or prepare an action…"
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() =>
                voice.isActive ? voice.stop() : void voice.start()
              }
              className={`grid size-10 place-items-center rounded-lg ${voice.isActive ? 'bg-red-100 text-red-600 animate-pulse' : 'text-muted-foreground hover:bg-secondary'}`}
              title={voice.isActive ? 'Stop voice' : 'Talk to Flowbase AI'}
            >
              {voice.isActive ? <Square size={15} /> : <Mic size={17} />}
            </button>
            <button
              disabled={!input.trim() || send.isPending}
              className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send size={17} />
            </button>
          </div>
          {voice.preview && (
            <p className="mx-auto mt-2 max-w-3xl text-xs text-muted-foreground">
              Listening: {voice.preview}
            </p>
          )}
          {voice.error && (
            <p className="mx-auto mt-2 max-w-3xl text-xs text-destructive">
              {voice.error}
            </p>
          )}
          {send.error instanceof Error && (
            <p className="mx-auto mt-2 max-w-3xl text-xs text-destructive">
              {send.error.message}
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
