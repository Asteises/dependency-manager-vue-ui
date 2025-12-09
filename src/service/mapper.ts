import type {
    Dependency,
    MavenGroupArtifactVersions,
    MvnDependencyDTO,
    MvnFullDependencyDto
} from "@/types/maven-types.ts";


function mvnIcon() {
    return '/src/assets/images/maven_icon.png';
}

function gradleIcon() {
    return '/src/assets/images/gradle_icon.png';
}

function pythonIcon() {
    return '/src/assets/images/python_icon.png';
}

function idOf(groupId: string, artifactId: string) {
    return `${groupId}:${artifactId}`;
}

export function mapMavenFullToDeps(dto: MvnFullDependencyDto, versionsBatch: MavenGroupArtifactVersions[]): Dependency[] {
    console.groupCollapsed('mapper.mapMavenFullToDeps:');
    console.log('Start mapping dependencies');

    // 4. Строим мапу: "groupId:artifactId" → versions[]
    const versionsMap = new Map<string, string[]>();
    for (const item of versionsBatch) {
        const key = `${item.groupId}:${item.artifactId}`;
        versionsMap.set(key, item.versions || []);
    }

    // 5. Обогащаем зависимости из dto новыми versions
    const enrichedDependencies = dto.dependencies.map(dep => {
        const key = `${dep.groupId}:${dep.artifactId}`;
        const newVersions = versionsMap.get(key) || [dep.version];
        return {
            ...dep,
            versions: newVersions
        };
    });

    const result: Dependency[] = enrichedDependencies.map(dep => {
        const allVersions = Array.isArray(dep.versions) ? dep.versions : [dep.version];
        const uniqueVersions = [...new Set(allVersions)]; // убираем дубли

        // latestVersion — первая в списке
        const latestVersion = uniqueVersions[0] || dep.version;

        return {
            id: `${dep.groupId}:${dep.artifactId}`,
            manager: 'maven',
            groupId: dep.groupId,
            artifactId: dep.artifactId,
            scope: dep.scope ?? '',
            currentVersion: dep.version,        // из pom.xml
            latestVersion,                      // из репозитория
            allVersions: uniqueVersions,        // полный список (default 20)
            selectedVersion: dep.version,       // по умолчанию — текущая
            icon: mvnIcon(),
        };
    });

    console.log('Результат:', result);
    console.groupEnd();
    return result;
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
