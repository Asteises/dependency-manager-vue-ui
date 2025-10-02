// src/composables/useVersions.ts
type Parsed = {
    major: number;
    minor: number;
    patch: number;         // если не указан — 0
    qualRank: number;      // порядок стабильности
    qualNum: number;       // номер пререлиза (M2, RC1, beta7 и т.п.)
};

/**
 * Нормализация префиксов пререлизов к единой шкале.
 * Чем больше rank — тем «новее» (стабильнее).
 *
 * Порядок (от более ранних к более поздним):
 * snapshot < alpha < beta < milestone(M) < rc(cr) < (ga/final/release/без суффикса) < sp
 */
const QUAL_ORDER = new Map<string, number>([
    ['snapshot', 0],
    ['alpha',    1],
    ['a',        1],
    ['beta',     2],
    ['b',        2],
    ['milestone',3],
    ['m',        3],
    ['rc',       4],
    ['cr',       4],
    // отсутствие суффикса / финальный релиз
    ['ga',       5],
    ['final',    5],
    ['release',  5],
    ['r',        5],
    ['stable',   5],
    ['none',     5], // наш маркер «нет суффикса»
    // сервис-паки после GA чаще считаются новее
    ['sp',       6],
]);

const QUAL_RE = /(?:[-\.]?((?:snapshot|alpha|a|beta|b|milestone|m|rc|cr|ga|final|release|r|stable|sp))[-\.]?(\d+)?)/i;

/**
 * Парсим версии вида:
 *  - 5.4
 *  - 5.4.4
 *  - 5.4-alpha1 / 5.4.0-M2 / 4.0.0-rc.1 / 1.0-beta-1
 *  - допускаем точки/дефисы между частями
 */
function parse(v: string): Parsed {
    // выцепляем major / minor / (опц.) patch
    // затем отдельно выцепляем qualifier через QUAL_RE
    const main = v.match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
    const q = v.match(QUAL_RE);

    const major = Number(main?.[1] ?? 0);
    const minor = Number(main?.[2] ?? 0);
    const patch = Number(main?.[3] ?? 0);

    let qualKey = 'none';
    let qualNum = 0;

    if (q) {
        qualKey = String(q[1]).toLowerCase();
        qualNum = Number(q[2] ?? 0);
    }

    // нормализуем сокращения
    if (qualKey === 'cr') qualKey = 'rc';
    if (qualKey === 'm')  qualKey = 'milestone';
    if (qualKey === 'a')  qualKey = 'alpha';
    if (qualKey === 'b')  qualKey = 'beta';

    const qualRank = QUAL_ORDER.get(qualKey) ?? -1; // неизвестные — «самые ранние»

    return { major, minor, patch, qualRank, qualNum };
}

/** Компаратор: DESC (новее выше). Учитывает пререлизы. */
function cmpDesc(a: string, b: string): number {
    const pa = parse(a);
    const pb = parse(b);

    if (pa.major !== pb.major)  return pb.major - pa.major;
    if (pa.minor !== pb.minor)  return pb.minor - pa.minor;
    if (pa.patch !== pb.patch)  return pb.patch - pa.patch;

    // сначала по «стабильности»
    if (pa.qualRank !== pb.qualRank) return pb.qualRank - pa.qualRank;
    // затем по номеру пререлиза (M2 > M1 и т.п.)
    if (pa.qualNum !== pb.qualNum)   return pb.qualNum - pa.qualNum;

    return 0;
}

/** Компаратор: ASC (нужно для некоторых списков) */
function cmpAsc(a: string, b: string): number {
    return -cmpDesc(a, b);
}

/** Отношение текущей к последней */
function versionRelation(d: { currentVersion: string; latestVersion: string }) {
    const r = cmpDesc(d.latestVersion, d.currentVersion);
    if (r > 0)  return 'outdated'; // latest новее current
    if (r === 0) return 'ok';
    return 'ahead';
}

/**
 * Группировка по "major.minor.x".
 * Теперь 5.4, 5.4.4 и 5.4-alpha1 попадают в одну группу "5.4.x".
 * "прочее" всегда внизу.
 */
function groupVersions(versions: string[]) {
    const buckets = new Map<string, string[]>();

    for (const v of versions) {
        const m = v.match(/^(\d+)\.(\d+)/); // достаточно major.minor (без точки/дефиса дальше)
        const key = m ? `${m[1]}.${m[2]}.x` : 'прочее';
        const arr = buckets.get(key) ?? [];
        arr.push(v);
        buckets.set(key, arr);
    }

    // сортировка ключей: по major/minor DESC, "прочее" — в самом низу
    const keys = Array.from(buckets.keys());
    keys.sort((a, b) => {
        if (a === 'прочее' && b === 'прочее') return 0;
        if (a === 'прочее') return 1;
        if (b === 'прочее') return -1;
        const [amj, ami] = a.split('.').map(n => Number(n));
        const [bmj, bmi] = b.split('.').map(n => Number(n));
        return (bmj - amj) || (bmi - ami);
    });

    return keys.map(k => ({
        key: k,
        label: k,
        items: (buckets.get(k) ?? []).sort(cmpDesc), // внутри группы — от нового к старому (учитывая пререлизы)
    }));
}

export function useVersions() {
    return {
        // если нужно наружу:
        cmp: (a: string, b: string) => -cmpDesc(a, b), // совместимость со старым API
        cmpDesc,
        cmpAsc,
        versionRelation,
        groupVersions,
    };
}
