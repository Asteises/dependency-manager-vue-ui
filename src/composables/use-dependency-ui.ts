import type { Dependency } from '@/types/maven-types';

export function initials(d: Dependency) {
    const a = (d.artifactId?.[0] ?? 'D').toUpperCase();
    const g = (d.groupId?.[0] ?? 'P').toUpperCase();
    return `${a}${g}`;
}
