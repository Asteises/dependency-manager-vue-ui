import type {Manager} from "@/stores/dependencies.store.ts";


export type MvnFullDependencyDto = {
    parent: MvnDependencyDTO | null;
    dependencies: MavenDependencyVersions[];
};

export type MavenDependencyVersions = {
    groupId: string;
    artifactId: string;
    version: string;
    scope?: string | null;
    versions: string[];
}

export type MvnDependencyDTO = {
    groupId: string;
    artifactId: string;
    version: string;
    scope?: string | null;
};

export type MvnParentDTO = {
    groupId: string;
    artifactId: string;
    version: string;
};

export type MvnDTO = {
    parent: MvnParentDTO | null;
    dependencies: MvnDependencyDTO[];
};

export interface Dependency {
    id: string;                 // уникальный ID (groupId:artifactId)
    manager: Manager;           // тип проекта
    groupId: string;            // напр. org.springframework.boot
    artifactId: string;         // напр. spring-boot-starter-web
    scope?: string;
    currentVersion: string;     // версия в файле пользователя
    latestVersion: string;      // последняя доступная (по данным сервера/репо)
    allVersions: string[];      // полный список версий
    selectedVersion?: string;   // версия, выбранная пользователем
    icon?: string;              // путь к иконке (опционально)
}

export interface MavenGroupArtifact {
    groupId: string;
    artifactId: string;
}

export interface MavenGroupArtifactVersions extends MavenGroupArtifact {
    versions: string[];
}