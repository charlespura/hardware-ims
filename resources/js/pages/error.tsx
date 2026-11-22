import { Head, Link, usePage } from '@inertiajs/react';
import { Ban, SearchX, ServerCrash } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { home } from '@/routes';
import { dashboard } from '@/routes/admin';

const content: Record<
    number,
    { title: string; description: string; icon: typeof Ban }
> = {
    403: {
        title: 'You don’t have access to this page',
        description: 'This area is restricted to a different type of account.',
        icon: Ban,
    },
    404: {
        title: 'Page not found',
        description:
            'The page or item you’re looking for doesn’t exist or has been removed.',
        icon: SearchX,
    },
    500: {
        title: 'Something went wrong',
        description:
            'An unexpected error occurred on our side. Please try again in a moment.',
        icon: ServerCrash,
    },
    503: {
        title: 'Down for maintenance',
        description: 'We’re making improvements and will be back shortly.',
        icon: ServerCrash,
    },
};

export default function ErrorPage({
    status,
    message,
}: {
    status: number;
    message?: string | null;
}) {
    const { auth } = usePage().props;
    const info = content[status] ?? content[500];
    const backOffice = auth.user && auth.user.role !== 'customer';

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted/30 p-6 text-center">
            <Head title={info.title} />
            <AppLogo />
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <info.icon className="size-8" />
            </div>
            <div className="max-w-md space-y-2">
                <p className="text-sm font-semibold text-primary">
                    Error {status}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {info.title}
                </h1>
                <p className="text-muted-foreground">
                    {message || info.description}
                </p>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => window.history.back()}>
                    Go back
                </Button>
                <Button asChild>
                    <Link href={backOffice ? dashboard() : home()}>
                        {backOffice ? 'Back office' : 'Home'}
                    </Link>
                </Button>
            </div>
        </div>
    );
}
