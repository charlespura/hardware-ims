import type { Money } from '@/types';

const peso = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
});

const pesoCompact = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    notation: 'compact',
    maximumFractionDigits: 1,
});

const number = new Intl.NumberFormat('en-PH');

export function formatMoney(value: Money | null | undefined): string {
    return peso.format(Number(value ?? 0));
}

export function formatMoneyCompact(value: Money | null | undefined): string {
    return pesoCompact.format(Number(value ?? 0));
}

export function formatNumber(value: number | string | null | undefined) {
    return number.format(Number(value ?? 0));
}

export function formatDate(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function formatRelative(value: string | null | undefined): string {
    if (!value) {
        return '—';
    }

    const diff = (new Date(value).getTime() - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ['year', 31536000],
        ['month', 2592000],
        ['week', 604800],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60],
    ];

    for (const [unit, seconds] of units) {
        if (Math.abs(diff) >= seconds) {
            return rtf.format(Math.round(diff / seconds), unit);
        }
    }

    return 'just now';
}
