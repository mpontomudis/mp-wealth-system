// src/features/ai-assistant/components/AIAssistantPanel.tsx
import { useAuth } from '@/shared/hooks/useAuth';
import { useAILogs } from '@/features/ai-assistant/hooks/useAILogs';
import { Card } from '@/shared/components/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/Tabs';
import { Badge } from '@/shared/components/Badge';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageLoader } from '@/shared/components/LoadingSpinner';
import { WhatsAppFeed } from './WhatsAppFeed';
import { formatDate } from '@/shared/utils/formatters';
import type { ValidationResult } from '@/types/supabase';

const VALIDATION_BADGE: Record<ValidationResult, 'success' | 'danger' | 'warning'> = {
  approved: 'success',
  rejected: 'danger',
  modified: 'warning',
};

export function AIAssistantPanel() {
  const { user } = useAuth();
  const { logs, isLoading } = useAILogs(user?.id ?? '');

  return (
    <Card title="AI Assistant">
      <Tabs defaultValue="whatsapp">
        <TabsList className="mb-4">
          <TabsTrigger value="whatsapp">WhatsApp Feed</TabsTrigger>
          <TabsTrigger value="logs">AI Logs</TabsTrigger>
          <TabsTrigger value="ocr">OCR Results</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          <WhatsAppFeed />
        </TabsContent>

        <TabsContent value="logs">
          {isLoading ? (
            <PageLoader />
          ) : !logs || logs.length === 0 ? (
            <EmptyState
              title="No AI logs"
              description="AI processing logs will appear here"
            />
          ) : (
            <div className="max-h-96 overflow-y-auto flex flex-col gap-3 pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-mp-border bg-mp-background p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-2 flex-wrap">
                      {log.validation_result && (
                        <Badge
                          variant={
                            VALIDATION_BADGE[log.validation_result as ValidationResult] ??
                            'neutral'
                          }
                        >
                          {log.validation_result}
                        </Badge>
                      )}
                      <Badge variant="neutral">{log.input_type}</Badge>
                      {log.confidence_score != null && (
                        <Badge variant="info">
                          {(log.confidence_score * 100).toFixed(0)}% confidence
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-mp-text-muted">
                      {formatDate(log.created_at, 'datetime')}
                    </span>
                  </div>
                  {log.input_content && (
                    <p className="text-sm text-mp-text-secondary line-clamp-2">
                      {log.input_content}
                    </p>
                  )}
                  {log.parsed_data && Object.keys(log.parsed_data).length > 0 && (
                    <pre className="mt-2 text-xs text-mp-text-muted bg-mp-surface rounded p-2 overflow-x-auto max-h-24">
                      {JSON.stringify(log.parsed_data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ocr">
          <EmptyState
            title="Coming Soon"
            description="OCR result processing is under development"
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
