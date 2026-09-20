/*
 * Copyright (c) 2026 Frost Sun
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Action } from "./Action";
import { createLevel, type Level, type LevelParameters } from "./Level";
import {
    carve,
    carveBottom,
    carveLeft,
    carveRight,
    carveTop,
    carveX,
    carveY,
    core,
    coreX,
    coreY,
    extendDown,
    extendLeft,
    extendRight,
    extendUp,
    extendX,
    extendY,
    moveDown,
    moveLeft,
    moveRight,
    segment4,
    segment9,
    sliceBottom,
    sliceLeft,
    sliceRight,
    sliceTop,
    splitX,
    splitX3,
    splitY,
    type TileArea,
} from "./core/tiles/TileArea";
import { fill, findTilePosition, tileToArea, type TileType } from "./tiles";

export type CreateMapFunction = (number: number) => Level;

const createMapRainbowTutorial = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Select the rainbow tool and click on water.",
        xCount: 15,
        yCount: 9,
        characterCount: 1,
        charactersToFinish: 1,
        actionCounts: {
            [Action.RainbowHorizontal]: 1,
        },
        theme: "summer",
    });

    const inner = carveY(carve(level), 2);
    fill(level, inner, "land");

    const [_left, right] = splitX(inner);
    fill(level, sliceLeft(right, 3), "water");

    fill(level, coreY(sliceLeft(inner)), "start");
    fill(level, coreY(sliceRight(inner)), "finish");

    return level;
};

const createMapRockTutorial = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Select the pickaxe tool and click the unicorn.",
        xCount: 15,
        yCount: 9,
        characterCount: 1,
        charactersToFinish: 1,
        actionCounts: {
            [Action.Dig]: 2,
        },
        theme: "summer",
    });

    const inner = carveY(carve(level), 2);
    fill(level, inner, "land");

    const [left, right] = splitX(inner);
    fill(level, sliceLeft(left), "rock");
    fill(level, sliceLeft(right), "rock");

    fill(level, moveRight(coreY(sliceLeft(inner))), "start");
    fill(level, coreY(sliceRight(inner)), "finish");

    return level;
};

const createMapArrowsTutorial = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Place arrows on land to bypass the rock.",
        xCount: 15,
        yCount: 9,
        characterCount: 3,
        charactersToFinish: 3,
        actionCounts: {
            [Action.Up]: 1,
            [Action.Down]: 1,
            [Action.Left]: 1,
            [Action.Right]: 2,
        },
        theme: "summer",
    });
    fill(level, level, "rock");
    const inner = carve(level);
    const center = core(inner, 3);

    fill(level, inner, "land");
    fill(level, center, "rock");

    fill(level, coreY(sliceLeft(inner)), "start");
    fill(level, coreY(sliceRight(inner)), "finish");

    return level;
};

const createMapBounceTutorial = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Please avoid the water. The unicorns hate it.",
        xCount: 15,
        yCount: 11,
        characterCount: 3,
        charactersToFinish: 2,
        actionCounts: {
            [Action.Down]: 1,
        },
        theme: "summer",
    });

    const island = carveY(carve(level), 3);
    const cape = extendDown(sliceLeft(island, 3), 2);
    fill(level, island, "land");
    fill(level, cape, "land");

    const [left, wall, _right] = splitX3(island, island.xCount * 0.75);
    fill(level, wall, "rock");

    fill(level, moveLeft(coreY(sliceRight(left))), "start");
    fill(level, core(sliceBottom(cape, 2)), "finish");

    return level;
};

const createMapCombineTutorial = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Combine your skills.",
        xCount: 16,
        yCount: 7,
        characterCount: 6,
        charactersToFinish: 4,
        actionCounts: {
            [Action.Down]: 2,
            [Action.RainbowHorizontal]: 1,
        },
        theme: "summer",
    });

    const inner = carve(level);
    const [left, right] = splitX(inner, inner.xCount * 0.6);

    const leftIsland = carveRight(carveBottom(left, 2));
    const rightIsland = carveTop(carveLeft(right, 2));

    fill(level, leftIsland, "land");
    fill(level, rightIsland, "land");

    fill(level, coreY(sliceLeft(leftIsland)), "start");
    fill(level, coreX(sliceBottom(rightIsland)), "finish");

    return level;
};

const createMapKeepDigging = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Keep digging.",
        xCount: 20,
        yCount: 10,
        characterCount: 10,
        charactersToFinish: 8,
        actionCounts: {
            [Action.Up]: 3,
            [Action.Down]: 3,
            [Action.Left]: 3,
            [Action.Right]: 3,
            [Action.Dig]: 2,
            [Action.RainbowHorizontal]: 1,
            [Action.RainbowVertical]: 1,
        },
        theme: "spring",
    });

    const island = carveY(carveX(level, 2));
    fill(level, island, "land");
    const [left, right] = splitX(island);

    const [topLeft, bottomLeft] = splitY(left);
    fill(level, topLeft, "water");

    const rockWall = carveRight(sliceRight(bottomLeft, 3));
    fill(level, rockWall, "rock");

    fill(level, core(right, 2), "water");

    const [a, b, c, d] = segment4(right);
    fill(level, core(a, 3), "water");
    fill(level, coreY(sliceLeft(a)), "water");
    fill(level, carveY(sliceRight(b, 2)), "rock");
    fill(level, sliceBottom(c), "water");
    fill(level, sliceRight(d, 2), "water");

    fill(level, coreY(sliceLeft(bottomLeft)), "start");
    fill(level, sliceTop(sliceRight(topLeft)), "finish");

    return level;
};

const createMapSpiral = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Spiral",
        xCount: 18,
        yCount: 12,
        characterCount: 3,
        charactersToFinish: 2,
        actionCounts: {
            [Action.Up]: 2,
            [Action.Down]: 2,
            [Action.Left]: 2,
            [Action.Right]: 2,
            [Action.Dig]: 1,
            [Action.RainbowHorizontal]: 1,
        },
        theme: "spring",
    });

    const inner = carveRight(carve(level), 2);

    const land1 = carveLeft(sliceTop(inner, 2), 3);
    const landStart = extendDown(sliceLeft(land1, 3));
    const land2 = sliceRight(inner, 2);
    const land2Middle = coreY(land2, land2.yCount * 0.3);
    const land3 = carveLeft(sliceBottom(inner, 2), inner.xCount * 0.1);
    const land4 = extendUp(sliceLeft(land3, 2), 3);
    const rock2 = carveTop(sliceRight(land4));
    const land5 = extendRight(sliceTop(land4));
    const landfinish = extendLeft(extendDown(moveRight(sliceRight(land5), 4)));

    fill(level, land1, "land");
    fill(level, landStart, "land");
    fill(level, land2, "land");
    fill(level, land2Middle, "water");
    fill(level, moveRight(extendDown(extendUp(land2Middle), 2)), "land");
    fill(level, sliceRight(land2Middle), "rock");
    fill(level, land3, "land");
    fill(level, land4, "land");
    fill(level, land5, "land");
    fill(level, rock2, "rock");
    fill(level, extendRight(sliceBottom(rock2, 2)), "rock");
    fill(level, landfinish, "land");

    fill(level, core(landStart), "start");
    fill(level, sliceRight(sliceTop(landfinish)), "finish");

    return level;
};

const createSpiral = (
    level: Level,
    area: TileArea,
    topRight?: TileType,
    center?: TileType,
): void => {
    const inner = carveRight(carveBottom(area));
    const land1 = sliceTop(inner);
    const land2 = sliceRight(inner);
    const land3 = sliceBottom(inner);
    const land4 = extendUp(sliceLeft(land3), 2);
    const land5 = extendRight(sliceTop(land4), 2);

    fill(level, land1, "land");
    fill(level, land2, "land");
    fill(level, land3, "land");
    fill(level, land4, "land");
    fill(level, land5, "land");

    if (topRight) {
        fill(level, sliceRight(land1), topRight);
    }
    if (center) {
        fill(level, sliceRight(land5), center);
    }
};

const createMapSpiral2 = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Spiralliumish-splash",
        xCount: 22,
        yCount: 20,
        characterCount: 5,
        charactersToFinish: 2,
        actionCounts: {
            [Action.Up]: 3,
            [Action.Down]: 3,
            [Action.Left]: 3,
            [Action.Right]: 3,
            [Action.RainbowHorizontal]: 2,
            [Action.RainbowVertical]: 2,
        },
        theme: "autumn",
    });

    const inner = carve(level);

    const [a, b, c, d, e, f, g, h, i] = segment9(inner);

    createSpiral(level, a, undefined, "rock");
    createSpiral(level, b, "rock");
    createSpiral(level, c, undefined, "rock");
    createSpiral(level, d, "rock");
    createSpiral(level, e, undefined, "rock");
    createSpiral(level, f, "rock");
    createSpiral(level, g, undefined, "rock");
    createSpiral(level, h, "rock");
    createSpiral(level, i, undefined, "finish");

    fill(level, sliceLeft(sliceTop(a)), "start");

    return level;
};

const createMapBaboonIsland = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Baboon Island",
        xCount: 30,
        yCount: 18,
        characterCount: 10,
        charactersToFinish: 5,
        actionCounts: {
            [Action.Up]: 4,
            [Action.Down]: 4,
            [Action.Left]: 4,
            [Action.Right]: 4,
            [Action.RainbowHorizontal]: 2,
            [Action.RainbowVertical]: 1,
        },
        theme: "autumn",
    });

    const coreIsland = core(level, level.yCount * 0.7);
    const wider = carveY(extendX(coreIsland));
    const higher = carveX(extendY(coreIsland));
    const start = moveDown(moveRight(sliceLeft(sliceTop(coreIsland))));

    const cape1 = extendRight(sliceRight(sliceTop(wider)), 6);
    const cape2 = extendDown(sliceRight(cape1, 3), 8);

    const rocks = carve(coreIsland, 3);
    const rocksWider = carve(wider, 3);
    const rocksHigher = carve(higher, 3);

    const smallRock1 = sliceRight(sliceTop(coreIsland, 2), 2);
    const smallRock2 = sliceLeft(sliceBottom(coreIsland, 2), 2);
    const smallRock3 = sliceRight(coreY(wider, 3), 3);

    const water = sliceLeft(coreY(wider, 4), 3);

    fill(level, coreIsland, "land");
    fill(level, wider, "land");
    fill(level, higher, "land");

    fill(level, cape1, "land");
    fill(level, cape2, "land");

    fill(level, rocks, "rock");
    fill(level, rocksWider, "rock");
    fill(level, rocksHigher, "rock");

    fill(level, smallRock1, "rock");
    fill(level, smallRock2, "rock");
    fill(level, smallRock3, "rock");

    fill(level, water, "water");

    fill(level, start, "start");
    fill(level, sliceRight(sliceBottom(coreIsland)), "finish");

    return level;
};

const createMapReturnToBaboonIsland = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Return to Baboon Island",
        xCount: 30,
        yCount: 18,
        characterCount: 10,
        charactersToFinish: 5,
        actionCounts: {
            [Action.Up]: 4,
            [Action.Down]: 4,
            [Action.Left]: 4,
            [Action.Right]: 4,
            [Action.Dig]: 4,
            [Action.RainbowHorizontal]: 2,
            [Action.RainbowVertical]: 1,
        },
        theme: "autumn",
    });

    const coreIsland = core(level, level.yCount * 0.7);
    const wider = carveY(extendX(coreIsland));
    const higher = carveX(extendY(coreIsland));
    const start = moveDown(moveRight(sliceLeft(sliceTop(coreIsland))));

    const cape1 = extendRight(sliceRight(sliceTop(wider)), 6);
    const cape2 = extendDown(sliceRight(cape1, 3), 8);

    const rocks = carve(coreIsland, 3);
    const rocksWider = carve(wider, 3);
    const rocksHigher = carve(higher, 3);

    const smallRock1 = sliceRight(sliceTop(coreIsland, 2), 2);
    const smallRock2 = sliceLeft(sliceBottom(coreIsland, 2), 2);
    const smallRock3 = sliceRight(coreY(wider, 3), 3);

    const water = sliceLeft(coreY(wider, 4), 3);

    const [tempUpper, tempLower] = splitY(carve(rocks));
    const [upperLeft, upperRight] = splitX(carveBottom(tempUpper));
    const [lowerLeft, lowerRight] = splitX(tempLower);
    const leftEye = carveRight(upperLeft);
    const rightEye = upperRight;
    const w3 = carveRight(lowerLeft);
    const w4 = lowerRight;

    fill(level, coreIsland, "land");
    fill(level, wider, "land");
    fill(level, higher, "land");

    fill(level, cape1, "land");
    fill(level, cape2, "land");

    fill(level, rocks, "rock");
    fill(level, rocksWider, "rock");
    fill(level, rocksHigher, "rock");

    fill(level, leftEye, "water");
    fill(level, rightEye, "water");
    fill(level, w3, "water");
    fill(level, w4, "water");

    fill(level, smallRock1, "rock");
    fill(level, smallRock2, "rock");
    fill(level, smallRock3, "rock");

    fill(level, water, "water");

    fill(level, start, "start");
    fill(level, moveLeft(sliceTop(coreX(tempLower))), "finish");

    return level;
};

const RocksMapAlternativeParameters: Partial<LevelParameters> = {
    introduction: "Just keep on dig... oh, wait.",
    actionCounts: {
        [Action.Up]: 3,
        [Action.Down]: 1,
        [Action.Left]: 2,
        [Action.Right]: 2,
        [Action.RainbowHorizontal]: 2,
    },
};

const createMapRocks = (
    params: Partial<LevelParameters>,
    number: number,
): Level => {
    const level = createLevel({
        number,
        introduction: "Just keep on digging.",
        xCount: 20,
        yCount: 10,
        characterCount: 10,
        charactersToFinish: 8,
        actionCounts: {
            [Action.Up]: 2,
            [Action.Down]: 2,
            [Action.Left]: 2,
            [Action.Right]: 2,
            [Action.Dig]: 3,
        },
        theme: "spring",
        ...params,
    });

    const island = carveY(carveX(level, 2));
    fill(level, island, "land");

    const [left, right] = splitX(island);
    const [topLeft, bottomLeft] = splitY(left);
    const rockWall = carveBottom(carveRight(sliceRight(bottomLeft, 2)));
    const cape = extendUp(extendLeft(sliceLeft(bottomLeft, 2)), 2);

    const [a, b, c, d] = segment4(right);
    const rock2 = extendRight(coreY(c, 2));
    const rock3 = core(b, 2);

    fill(level, topLeft, "water");
    fill(level, cape, "land");
    fill(level, sliceTop(sliceRight(cape)), "water");
    fill(level, rockWall, "rock");

    fill(level, core(right, 2), "water");
    fill(level, core(a, 3), "water");
    fill(level, extendLeft(sliceTop(core(a, 3))), "water");
    fill(level, coreY(sliceLeft(a)), "water");
    fill(level, rock3, "rock");
    fill(level, sliceBottom(c), "water");
    fill(level, sliceRight(d, 2), "water");
    fill(level, rock2, "rock");
    fill(level, sliceTop(sliceLeft(rock2)), "land");
    fill(level, sliceBottom(sliceRight(rock2)), "land");

    fill(level, coreY(sliceLeft(bottomLeft)), "start");
    fill(level, sliceTop(sliceRight(topLeft)), "finish");

    return level;
};

const createMapRainbowIslands = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Rainbow islands",
        xCount: 30,
        yCount: 14,
        characterCount: 10,
        charactersToFinish: 10,
        actionCounts: {
            [Action.Up]: 3,
            [Action.Down]: 3,
            [Action.Left]: 3,
            [Action.Right]: 3,
            [Action.RainbowHorizontal]: 4,
            [Action.RainbowVertical]: 4,
        },
        theme: "autumn",
    });

    const inner = carveY(carveX(level, 6));
    const [a, b, c, d, _e, _f, _g, h, _i] = segment9(inner);

    const startIsland = a;
    const startExtend = extendRight(extendDown(sliceRight(sliceBottom(a)), 2));
    const finishIsland = extendDown(
        carveRight(carveTop(d, d.yCount / 2), 3),
        3,
    );
    const rocks = extendDown(core(b, 2));
    const rocks2 = sliceTop(extendUp(finishIsland));
    const tempIsland = core(c, 2);
    const tempLeft = extendLeft(tempIsland, 3);
    const tempDown = extendDown(tempIsland, 3);
    const temp2Island = extendRight(carve(h), 2);

    fill(level, startIsland, "land");
    fill(level, startExtend, "land");
    fill(level, rocks, "rock");
    fill(level, tempLeft, "land");
    fill(level, tempDown, "land");
    fill(level, temp2Island, "land");
    fill(level, rocks2, "rock");
    fill(level, finishIsland, "land");

    fill(level, sliceLeft(coreY(startIsland)), "start");
    fill(level, sliceTop(coreX(finishIsland)), "finish");

    return level;
};

const createMapMoreIslands = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "You're doing well, keep going.",
        xCount: 42,
        yCount: 20,
        characterCount: 30,
        charactersToFinish: 25,
        actionCounts: {
            [Action.Up]: 5,
            [Action.Down]: 5,
            [Action.Left]: 5,
            [Action.Right]: 5,
            [Action.Dig]: 4,
            [Action.RainbowHorizontal]: 5,
            [Action.RainbowVertical]: 5,
        },
        theme: "autumn",
    });

    const inner = carveTop(carve(level));
    const [_a, b, c, d, e, f, g, h, i] = segment9(inner);

    const topArea = sliceTop(b, b.yCount / 2);
    const [startIsland, _middle, r] = splitX3(topArea, topArea.xCount / 2);
    const finishIsland = carveRight(r, 2);

    const [middleLeft, _middleRight] = splitX(carve(e));
    const middleIsland1 = carveBottom(carveRight(middleLeft, 3));
    const middleIsland2 = sliceLeft(f, 2);
    const rockIsland = extendUp(coreX(d, 3), 4);
    const rockIslandRocks = carveY(rockIsland, 2);
    const rockIslandRocks2 = extendRight(carveTop(rockIslandRocks, 2), 2);
    const bottom1 = carveRight(sliceRight(g, 6));
    const rockIsland2 = core(c, 4);

    const little1 = core(i, 2);
    const little2 = extendRight(core(f, 2));
    const little3 = extendUp(core(f), 5);
    const little4 = extendRight(core(h), 2);

    fill(level, startIsland, "land");
    fill(level, finishIsland, "land");
    fill(level, sliceLeft(finishIsland), "rock");

    fill(level, middleIsland1, "land");

    fill(level, middleIsland2, "land");
    fill(level, sliceRight(middleIsland2), "rock");

    fill(level, rockIsland, "land");
    fill(level, rockIslandRocks, "rock");
    fill(level, rockIslandRocks2, "rock");
    fill(level, bottom1, "land");
    fill(level, little1, "land");
    fill(level, little2, "land");
    fill(level, little3, "land");
    fill(level, little4, "land");
    fill(level, rockIsland2, "rock");

    fill(level, coreY(sliceLeft(startIsland)), "start");
    fill(level, core(finishIsland), "finish");

    return level;
};

const createMapCaves = (number: number): Level => {
    const level = createLevel({
        number,
        introduction: "Use wisely what you've got.",
        xCount: 42,
        yCount: 20,
        characterCount: 8,
        charactersToFinish: 5,
        actionCounts: {
            [Action.Up]: 1,
            [Action.Down]: 1,
            [Action.Left]: 1,
            [Action.Right]: 1,
            [Action.Dig]: 2,
            [Action.RainbowHorizontal]: 1,
            [Action.RainbowVertical]: 1,
        },
        theme: "winter",
    });

    const inner = carveY(carveX(level, 10));
    fill(level, inner, "land");

    const [a, b, c, _d, e, f, _g, h, _i] = segment9(
        inner,
        inner.yCount / 4,
        inner.yCount / 2,
        inner.xCount / 6,
        inner.xCount * (4 / 6),
    );

    const water1 = extendRight(extendDown(a, 2));
    const [waterBottom1, waterBottom2] = splitX(carveX(h, 2));
    const water3 = f;
    const water4 = extendLeft(carve(c), 5);
    const landPassage2 = carveBottom(sliceRight(water3), 4);
    const landPassage3 = coreY(water3);
    const bigRock1 = sliceBottom(coreX(b, 8), 2);
    const bigRock2 = extendUp(sliceLeft(bigRock1, 4));
    const bigRock3 = extendUp(sliceLeft(bigRock2), 2);
    const caveArea = e;
    const rooms = carve(caveArea, 2);
    const [leftRoom, walls, rightRoom] = splitX3(rooms, rooms.xCount / 3, 5);

    fill(level, water1, "water");
    fill(level, waterBottom1, "water");
    fill(level, waterBottom2, "water");
    fill(level, water3, "water");
    fill(level, water4, "water");
    fill(level, sliceRight(waterBottom1), "land");
    fill(level, sliceBottom(waterBottom1), "land");
    fill(level, landPassage2, "land");
    fill(level, landPassage3, "land");

    fill(level, bigRock1, "rock");
    fill(level, bigRock2, "rock");
    fill(level, bigRock3, "rock");
    fill(level, caveArea, "rock");
    fill(level, leftRoom, "land");
    fill(level, rightRoom, "land");
    fill(level, sliceLeft(carveLeft(walls)), "land");
    fill(level, sliceRight(carveRight(walls)), "land");

    fill(level, coreY(sliceLeft(leftRoom)), "start");
    fill(level, coreY(carveBottom(sliceLeft(rightRoom), 2)), "finish");

    return level;
};

export const maps: CreateMapFunction[] = [
    createMapRainbowTutorial,
    createMapRockTutorial,
    createMapArrowsTutorial,
    createMapBounceTutorial,
    createMapCombineTutorial,
    createMapKeepDigging,
    createMapSpiral,
    createMapBaboonIsland,
    createMapRocks.bind(null, {}),
    createMapRocks.bind(null, RocksMapAlternativeParameters),
    createMapRainbowIslands,
    createMapSpiral2,
    createMapReturnToBaboonIsland,
    createMapMoreIslands,
    createMapCaves,
];

export const createMap = (number: number): Level => {
    const index = number < maps.length ? number : maps.length - 1;
    const level = maps[index](number);

    level.startTile = findTilePosition(level, "start") ?? { ix: 0, iy: 0 };
    const finishPosition = findTilePosition(level, "finish") ?? {
        ix: 0,
        iy: 0,
    };
    level.finishArea = tileToArea(finishPosition);

    return level;
};
