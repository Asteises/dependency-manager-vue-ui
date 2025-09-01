import type {Dependency, MvnDependencyDTO, MvnDTO, MvnFullDependencyDto} from "@/types/maven-types.ts";


function mvnIcon()    { return '/src/assets/images/maven_icon.png'; }
function gradleIcon() { return '/src/assets/images/gradle_icon.png'; }
function pythonIcon() { return '/src/assets/images/python_icon.png'; }

function idOf(groupId: string, artifactId: string) {
    return `${groupId}:${artifactId}`;
}

const uniq = <T,>(xs: T[]) => Array.from(new Set(xs));

export function mapMavenFullToDeps(dto: MvnFullDependencyDto): Dependency[] {
    console.groupCollapsed('mapper.mapMavenFullToDeps:');

    console.log('MvnFullDependencyDto: ', dto);
    const result: Dependency[] = [];

    for (const item of dto.dependencies ?? []) {

        console.log('Try get dep: ', item);

        const all = item.versions?.length ? uniq(item.versions) : [item.version];
        console.log('versions: ', item.versions.length);

        result.push({
            id: idOf(item.groupId, item.artifactId),
            manager: 'maven',
            groupId: item.groupId,
            artifactId: item.artifactId,
            scope: item.scope ?? '',
            currentVersion: item.version,
            latestVersion: all[0] ?? item.version,
            allVersions: all,
            selectedVersion: item.version,
            icon: mvnIcon(),
        });
    }

    console.groupEnd();
    return result;
}

export function mapMavenToDeps(dto: MvnDTO): Dependency[] {
    return (dto.dependencies ?? []).map(d => ({
        id: idOf(d.groupId, d.artifactId),
        manager: 'maven',
        groupId: d.groupId,
        artifactId: d.artifactId,
        currentVersion: d.version,
        latestVersion: d.version,
        allVersions: [d.version],
        selectedVersion: d.version,
        icon: mvnIcon(),
    }));
}

export function mapGradleToDeps(payload: { dependencies: MvnDependencyDTO[] }): Dependency[] {
    return (payload.dependencies ?? []).map(d => ({
        id: idOf(d.groupId, d.artifactId),
        manager: 'gradle',
        groupId: d.groupId,
        artifactId: d.artifactId,
        currentVersion: d.version,
        latestVersion: d.version,
        allVersions: [d.version],
        selectedVersion: d.version,
        icon: gradleIcon(),
    }));
}

export function mapPythonToDeps(payload: { dependencies: Array<{ name: string; version: string }> }): Dependency[] {
    return (payload.dependencies ?? []).map(d => ({
        id: `pypi:${d.name}`,
        manager: 'python',
        groupId: 'pypi',
        artifactId: d.name,
        currentVersion: d.version,
        latestVersion: d.version,
        allVersions: [d.version],
        selectedVersion: d.version,
        icon: pythonIcon(),
    }));
}
