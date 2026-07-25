import { eq } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { monthlyUsage, userSettings } from '@/db/schema';

const monthKey = () => new Date().toISOString().slice(0, 7);
export const AI_MODELS = ['gpt-5.6-luna'] as const;

export async function hasProPlan(clerkId: string) {
  try {
    const clerk = await clerkClient();
    const subscription =
      await clerk.billing.getUserBillingSubscription(clerkId);
    return subscription.subscriptionItems.some(
      (item) =>
        item.status === 'active' && item.plan?.name.toLowerCase() === 'pro',
    );
  } catch {
    return false;
  }
}

export async function getAiSettings(clerkId: string) {
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.clerkId, clerkId));
  if (settings) return settings;
  const [created] = await db
    .insert(userSettings)
    .values({ clerkId })
    .returning();
  return created;
}

export async function allowAi(
  clerkId: string,
  feature: 'assistant' | 'refine' | 'templates',
) {
  const settings = await getAiSettings(clerkId);
  const enabled =
    feature === 'assistant'
      ? settings.aiAssistantEnabled
      : feature === 'refine'
        ? settings.aiRefineEnabled
        : settings.aiTemplatesEnabled;
  if (!enabled)
    return { error: 'This AI feature is disabled in Settings.' } as const;
  const key = monthKey();
  const [usage] = await db
    .select()
    .from(monthlyUsage)
    .where(eq(monthlyUsage.clerkId, clerkId));
  const current = usage?.monthKey === key ? usage.aiRequests : 0;
  if (!(await hasProPlan(clerkId)) && current >= 20)
    return {
      error:
        'You reached the Free plan AI limit for this month. Upgrade to Pro for unlimited AI.',
    } as const;
  if (usage)
    await db
      .update(monthlyUsage)
      .set({ monthKey: key, aiRequests: current + 1, updatedAt: new Date() })
      .where(eq(monthlyUsage.id, usage.id));
  else
    await db
      .insert(monthlyUsage)
      .values({ clerkId, monthKey: key, aiRequests: 1 });
  return {
    model: AI_MODELS.includes(settings.aiModel as (typeof AI_MODELS)[number])
      ? settings.aiModel
      : AI_MODELS[0],
    tone: settings.aiTone,
    behavior: settings.aiBehavior,
  } as const;
}
