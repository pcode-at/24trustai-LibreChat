import { memo } from 'react';
import { Trash2, Send } from 'lucide-react';
import { TooltipAnchor } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

const formatDuration = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

function RecordingControls({
  levels,
  recordingTime,
  onCancel,
  onStop,
  isRTL = false,
}: {
  levels: number[];
  recordingTime: number;
  onCancel: () => void;
  onStop: () => void;
  isRTL?: boolean;
}) {
  const localize = useLocalize();

  return (
    <div
      role="region"
      aria-label={localize('com_ui_recording')}
      className={cn(
        'absolute inset-0 z-20 flex items-center gap-3 rounded-3xl bg-surface-chat px-4',
        isRTL ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <TooltipAnchor
        description={localize('com_ui_delete_recording')}
        render={
          <button
            type="button"
            aria-label={localize('com_ui_delete_recording')}
            onClick={onCancel}
            className="flex size-9 shrink-0 items-center justify-center rounded-full p-1 text-text-secondary transition-colors hover:bg-surface-hover hover:text-red-500"
          >
            <Trash2 className="size-5" />
          </button>
        }
      />
      <div className="flex shrink-0 items-center gap-2 text-text-primary">
        <span className="size-2.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
        <span className="min-w-[2.5rem] font-mono text-sm tabular-nums" aria-live="polite">
          {formatDuration(recordingTime)}
        </span>
      </div>
      <div
        className={cn('flex h-9 flex-1 items-center gap-0.5 overflow-hidden', isRTL && 'flex-row-reverse')}
        aria-hidden="true"
      >
        {levels.map((level, index) => (
          <span
            key={index}
            className="min-w-0 flex-1 rounded-full bg-text-secondary/70 transition-[height] duration-75"
            style={{ height: `${Math.max(8, Math.min(100, level * 100))}%` }}
          />
        ))}
      </div>
      <TooltipAnchor
        description={localize('com_ui_send_recording')}
        render={
          <button
            type="button"
            aria-label={localize('com_ui_send_recording')}
            onClick={onStop}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-submit p-1 text-white transition-colors hover:bg-surface-submit-hover"
          >
            <Send className="size-5" />
          </button>
        }
      />
    </div>
  );
}

export default memo(RecordingControls);
