import { formatDateTime } from '@/lib/format';
import { roleLabel } from '@/lib/labels';
import type { OrderActivity } from '@/types';

export function OrderTimeline({
    activities,
    showActor = false,
}: {
    activities: OrderActivity[];
    showActor?: boolean;
}) {
    return (
        <ol className="relative space-y-5 border-l pl-6">
            {activities.map((activity, i) => (
                <li key={activity.id} className="relative">
                    <span
                        className={`absolute top-1 -left-[29px] size-3 rounded-full border-2 border-background ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`}
                    />
                    <p className="text-sm font-medium">{activity.title}</p>
                    {activity.note && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {activity.note}
                        </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(activity.created_at)}
                        {showActor && activity.user && (
                            <>
                                {' '}
                                · {activity.user.name} (
                                {roleLabel[activity.user.role]})
                            </>
                        )}
                    </p>
                </li>
            ))}
        </ol>
    );
}
