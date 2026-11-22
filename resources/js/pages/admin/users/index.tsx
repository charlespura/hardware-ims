import { Head, useForm, usePage } from '@inertiajs/react';
import { Pencil, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import InputError from '@/components/input-error';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { SearchInput } from '@/components/search-input';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useFilters } from '@/hooks/use-filters';
import { formatDate, formatMoney } from '@/lib/format';
import { roleLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { index, store, update } from '@/routes/admin/users';
import type { ManagedUser, Paginated, Role } from '@/types';

type Props = {
    users: Paginated<ManagedUser>;
    counts: Partial<Record<Role, number>>;
    filters: { search: string; role: string };
};

const roleTone = {
    admin: 'brand',
    staff: 'info',
    customer: 'neutral',
} as const;

export default function UsersIndex({ users, counts, filters }: Props) {
    const apply = useFilters(index.url(), filters);
    const { auth } = usePage().props;
    const tabs: { value: string; label: string; count?: number }[] = [
        {
            value: '',
            label: 'Everyone',
            count: Object.values(counts).reduce((a, b) => a + (b ?? 0), 0),
        },
        { value: 'customer', label: 'Customers', count: counts.customer },
        { value: 'staff', label: 'Staff', count: counts.staff },
        { value: 'admin', label: 'Admins', count: counts.admin },
    ];

    return (
        <>
            <Head title="Users & roles" />
            <div className="space-y-5 p-4 md:p-6">
                <PageHeader
                    title="Users & roles"
                    description="Admins manage everything. Staff handle orders, POS, stock and purchasing. Customers shop online."
                    actions={<CreateUserDialog />}
                />

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="inline-flex rounded-lg bg-muted p-1">
                        {tabs.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => apply({ role: t.value })}
                                className={cn(
                                    'rounded-md px-3 py-1.5 text-sm font-medium',
                                    filters.role === t.value
                                        ? 'bg-background shadow-sm'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {t.label}{' '}
                                <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                                    {t.count ?? 0}
                                </span>
                            </button>
                        ))}
                    </div>
                    <SearchInput
                        value={filters.search}
                        onSearch={(search) => apply({ search })}
                        placeholder="Search name, e-mail or phone"
                        className="md:ml-auto md:w-80"
                    />
                </div>

                <Card className="py-0">
                    {users.data.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="No users found"
                            className="m-4 border-0"
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="pl-4">User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">
                                        Orders
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Spent
                                    </TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-16 pr-4" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((u) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="pl-4">
                                            <div className="font-medium">
                                                {u.name}
                                                {u.id === auth.user?.id && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        (you)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {u.email} ·{' '}
                                                {u.phone ?? 'no phone'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                tone={roleTone[u.role]}
                                            >
                                                {roleLabel[u.role]}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {u.role === 'customer'
                                                ? u.orders_count
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {u.role === 'customer'
                                                ? formatMoney(u.total_spent)
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(u.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            {u.is_active ? (
                                                <StatusBadge tone="success">
                                                    Active
                                                </StatusBadge>
                                            ) : (
                                                <StatusBadge tone="danger">
                                                    Deactivated
                                                </StatusBadge>
                                            )}
                                        </TableCell>
                                        <TableCell className="pr-4">
                                            <EditUserDialog
                                                user={u}
                                                isSelf={u.id === auth.user?.id}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Card>
                <Pagination meta={users} />
            </div>
        </>
    );
}

function RoleSelect({
    value,
    onChange,
    disabled,
}: {
    value: Role;
    onChange: (r: Role) => void;
    disabled?: boolean;
}) {
    return (
        <Select
            value={value}
            onValueChange={(v) => onChange(v as Role)}
            disabled={disabled}
        >
            <SelectTrigger className="w-full">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
        </Select>
    );
}

function CreateUserDialog() {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        email: '',
        phone: '',
        role: 'staff' as Role,
        password: '',
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus /> Add user
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(store.url(), {
                            preserveScroll: true,
                            onSuccess: () => {
                                setOpen(false);
                                form.reset();
                            },
                        });
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Add a user</DialogTitle>
                        <DialogDescription>
                            Use this to create staff accounts. Share the
                            temporary password securely — they can change it in
                            Settings.
                        </DialogDescription>
                    </DialogHeader>
                    {(['name', 'email', 'phone', 'password'] as const).map(
                        (f) => (
                            <div key={f} className="grid gap-1.5">
                                <Label
                                    htmlFor={`u-${f}`}
                                    className="capitalize"
                                >
                                    {f === 'phone'
                                        ? 'Mobile number'
                                        : f === 'password'
                                          ? 'Temporary password'
                                          : f}
                                </Label>
                                <Input
                                    id={`u-${f}`}
                                    type={
                                        f === 'email'
                                            ? 'email'
                                            : f === 'password'
                                              ? 'password'
                                              : 'text'
                                    }
                                    value={form.data[f]}
                                    onChange={(e) =>
                                        form.setData(f, e.target.value)
                                    }
                                />
                                <InputError message={form.errors[f]} />
                            </div>
                        ),
                    )}
                    <div className="grid gap-1.5">
                        <Label>Role</Label>
                        <RoleSelect
                            value={form.data.role}
                            onChange={(r) => form.setData('role', r)}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Create user
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditUserDialog({
    user,
    isSelf,
}: {
    user: ManagedUser;
    isSelf: boolean;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: user.name,
        phone: user.phone ?? '',
        role: user.role,
        is_active: user.is_active,
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${user.name}`}
                >
                    <Pencil />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form
                    className="space-y-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.put(update.url(user.id), {
                            preserveScroll: true,
                            onSuccess: () => setOpen(false),
                        });
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Edit {user.name}</DialogTitle>
                        <DialogDescription>{user.email}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-1.5">
                        <Label htmlFor="eu-name">Name</Label>
                        <Input
                            id="eu-name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="eu-phone">Mobile number</Label>
                        <Input
                            id="eu-phone"
                            value={form.data.phone}
                            onChange={(e) =>
                                form.setData('phone', e.target.value)
                            }
                        />
                        <InputError message={form.errors.phone} />
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Role</Label>
                        <RoleSelect
                            value={form.data.role}
                            onChange={(r) => form.setData('role', r)}
                            disabled={isSelf}
                        />
                    </div>
                    <label className="flex items-center justify-between text-sm">
                        <span>
                            Account active
                            <span className="block text-xs text-muted-foreground">
                                Deactivated users can’t sign in.
                            </span>
                        </span>
                        <Switch
                            checked={form.data.is_active}
                            onCheckedChange={(v) =>
                                form.setData('is_active', v)
                            }
                            disabled={isSelf}
                        />
                    </label>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Users & roles', href: index() }],
};
