import { TemplatePreview } from '@/components/templates/template-preview';
export default async function TemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  return <TemplatePreview templateId={Number((await params).templateId)} />;
}
