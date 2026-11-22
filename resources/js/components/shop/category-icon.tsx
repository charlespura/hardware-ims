import {
    BrickWall,
    Bolt,
    Droplet,
    Drill,
    Grid3x3,
    Hammer,
    House,
    Package,
    PaintRoller,
    TreePine,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const icons: Record<string, LucideIcon> = {
    'power-tools': Drill,
    'hand-tools': Hammer,
    'building-materials': BrickWall,
    fasteners: Bolt,
    plumbing: Droplet,
    'paint-finishing': PaintRoller,
    'wood-panels': TreePine,
    roofing: House,
    'tiles-flooring': Grid3x3,
    electrical: Zap,
};

export function categoryIcon(slug: string): LucideIcon {
    return icons[slug] ?? Package;
}
