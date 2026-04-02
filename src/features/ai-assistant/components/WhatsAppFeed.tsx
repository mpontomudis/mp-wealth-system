// src/features/ai-assistant/components/WhatsAppFeed.tsx
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useWhatsAppMessages } from '@/features/ai-assistant/hooks/useWhatsAppMessages';
import { Badge } from '@/shared/components/Badge';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageLoader } from '@/shared/components/LoadingSpinner';
import { formatDate } from '@/shared/utils/formatters';
import type { MessageType } from '@/types/supabase';

const MSG_TYPE_BADGE: Record<MessageType, 'info' | 'warning' | 'neutral' | 'success' | 'danger'> = {
  text: 'info',
  image: 'success',
  audio: 'warning',
  video: 'neutral',
  document: 'danger',
};

export function WhatsAppFeed() {
  const { user } = useAuth();
  const { messages, isLoading } = useWhatsAppMessages(user?.id ?? '');

  if (isLoading) return <PageLoader />;

  if (!messages || messages.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        description="WhatsApp messages will appear here once received"
        icon={<MessageSquare size={32} />}
      />
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto flex flex-col gap-3 pr-1">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="rounded-lg border border-mp-border bg-mp-background p-3"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-mp-text-secondary">{msg.from_number}</span>
            <span className="text-xs text-mp-text-muted">
              {formatDate(msg.created_at, 'datetime')}
            </span>
          </div>
          <p className="text-sm text-mp-text-primary">
            {(msg.text_content ?? '').length > 100
              ? (msg.text_content ?? '').slice(0, 100) + '…'
              : (msg.text_content ?? '(media message)')}
          </p>
          <div className="mt-2 flex gap-2">
            <Badge variant={msg.processed_at ? 'success' : 'warning'}>
              {msg.processed_at ? 'Processed' : 'Pending'}
            </Badge>
            <Badge variant={MSG_TYPE_BADGE[msg.message_type as MessageType] ?? 'neutral'}>
              {msg.message_type}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
