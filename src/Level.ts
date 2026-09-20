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

import {
    applyCamera,
    screenToLevel,
    type Camera,
} from "./core/gameplay/Camera";
import type { TimeStep } from "./core/time/TimeStep";
import {
    CHARACTER_SPEED,
    GameObjectAction,
    RAINBOW_SPEED,
    setSpeedRatio,
    speedRatio,
    UNICORN_HEIGHT,
    UNICORN_WIDTH,
    type GameObject,
} from "./GameObject";
import type {
    GameStateLevelFinished,
    GameStateLose,
    GameStateRun,
} from "./GameState";
import { canvas, cx } from "./graphics";
import { tileMapGet, type TileMap } from "./core/tiles/TileMap";
import {
    Arrow,
    drawMap,
    getTileAt,
    getTilePosAt,
    HighlightMode,
    moveObject,
    TILE_HEIGHT,
    TILE_WIDTH,
    tileToArea,
    type Tile,
    type TilePosition,
} from "./tiles";
import {
    getCenter,
    includesArea,
    includesPoint,
    type Area,
    type Dimensions,
} from "./core/math/Area";
import {
    setStateLevelFinished,
    setStateLose,
    setStateRun,
    setStateLevelSelection,
} from "./gamestates";
import { Action, actionIsArrow, ActionTiles, actionToArrow } from "./Action";
import {
    distanceSquared,
    divide,
    length,
    multiply,
    ZERO_VECTOR,
    type Vector,
} from "./core/math/Vector";
import { playTune, SFX_HOME, SFX_SPLASH } from "./audio/sfx";
import type { Theme } from "./theme";
import { mousePositionToCanvasPosition } from "./core/platform/window";
import type { TileArea } from "./core/tiles/TileArea";
import { clamp } from "./core/math/number";

const FIRST_CHARACTER_SPAWN_INTERVAL = 4000;
const CHARACTER_SPAWN_INTERVAL = 3000;

const MAX_CHARACTER_CLICK_DISTANCE = UNICORN_WIDTH * 1.25;

const ARROW_PLACEMENT_MARGIN = 0.1 * TILE_WIDTH;

// The portion of canvas on which the map is drawn.
const levelDrawArea: Dimensions = {
    width: canvas.width,
    height: canvas.height,
};

interface Button {
    text: string;
    action?: Action;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
}

export const actionButtons: Button[] = [
    {
        text: "🗺️",
        action: Action.Back,
    },
    {
        text: "▲",
        action: Action.Up,
    },
    {
        text: "▼",
        action: Action.Down,
    },
    {
        text: "◀",
        action: Action.Left,
    },
    {
        text: "▶",
        action: Action.Right,
    },
    {
        text: "🌈⟺",
        action: Action.RainbowHorizontal,
    },
    {
        text: "🌈⇳",
        action: Action.RainbowVertical,
    },
    {
        text: "🦄",
    },
    {
        text: "⛏️",
        action: Action.Dig,
    },
    {
        text: "",
    },
    {
        text: "▶▶",
        action: Action.Fastforward,
    },
    {
        text: "☢",
        action: Action.Restart,
    },
];

export interface LevelParameters {
    readonly number: number;
    readonly introduction: string;
    readonly xCount: number;
    readonly yCount: number;
    readonly characterCount: number;
    readonly charactersToFinish: number;
    readonly actionCounts: Partial<Record<Action, number>>;
    readonly theme: Theme;
}

export interface Level extends TileMap<Tile>, LevelParameters {
    width: number;
    height: number;
    camera: Camera;
    tiles: (Tile | undefined)[];
    objects: GameObject[];
    objectsToAdd: GameObject[];
    startTile: TilePosition;
    finishArea: Area;
    charactersLeft: number;
    charactersLost: number;
    charactersFinished: number;
    lastSpawnTime: number;
    selectedActionIndex?: number;
    actionsUsed: Partial<Record<Action, number>>;
    highlightedCharacter?: GameObject;
    highlightedArea?: TileArea;
    areaHighlightMode: HighlightMode;
}

export const createLevel = (params: LevelParameters): Level => ({
    ...params,
    ix: 0,
    iy: 0,
    width: params.xCount * TILE_WIDTH,
    height: params.yCount * TILE_HEIGHT,
    camera: {
        // mode: CameraMode.ShowWholeLevel,
        x: 50,
        y: 50,
        zoom: 8,
    },
    tiles: Array.from({ length: params.xCount * params.yCount }),
    objects: [],
    objectsToAdd: [],
    startTile: { ix: 0, iy: 0 },
    finishArea: { x: 0, y: 0, width: TILE_WIDTH, height: TILE_HEIGHT },
    charactersLeft: params.characterCount,
    charactersLost: 0,
    charactersFinished: 0,
    lastSpawnTime: 0,
    actionsUsed: {},
    areaHighlightMode: HighlightMode.Allow,
});

export const clearLevelControls = (level: Level): void => {
    level.highlightedCharacter = undefined;
    level.highlightedArea = undefined;
};

const toggleActionButton = (level: Level, i: number): void => {
    if (i === level.selectedActionIndex) {
        level.selectedActionIndex = undefined;
    } else {
        level.selectedActionIndex = i;
    }
};

const addCharacter = (level: Level): void => {
    const startPos = level.startTile;

    const character: GameObject = {
        type: "character",
        x: startPos.ix * TILE_WIDTH + (TILE_WIDTH - UNICORN_WIDTH) / 2,
        y: startPos.iy * TILE_HEIGHT + (TILE_HEIGHT - UNICORN_HEIGHT) / 2,
        width: UNICORN_WIDTH * (Math.random() * 0.2 + 0.8),
        height: UNICORN_HEIGHT * (Math.random() * 0.2 + 0.8),
        velocity: { x: CHARACTER_SPEED, y: 0 },
        action: GameObjectAction.Walk,
    };
    level.objects.push(character);
};

const createSplash = (time: TimeStep, position: Vector): GameObject => ({
    type: "splash",
    x: position.x,
    y: position.y,
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    velocity: ZERO_VECTOR,
    createTime: time.t,
});

export const updateLevel = (
    time: TimeStep,
    state: GameStateRun | GameStateLose | GameStateLevelFinished,
): void => {
    const { level } = state;

    if (level.lastSpawnTime === 0) {
        level.lastSpawnTime = time.t;
    }

    const isFirstCharacter = level.charactersLeft === level.characterCount;
    const currentInterval = isFirstCharacter
        ? FIRST_CHARACTER_SPAWN_INTERVAL / speedRatio
        : (CHARACTER_SPAWN_INTERVAL * (Math.random() * 0.7 + 0.7)) / speedRatio;

    if (
        level.charactersLeft > 0 &&
        time.t - level.lastSpawnTime > currentInterval
    ) {
        level.lastSpawnTime = time.t;
        level.charactersLeft--;
        addCharacter(level);
    }

    for (let i = 0; i < level.objects.length; i++) {
        const o = level.objects[i];

        if (o.type === "character") {
            if (o.action === GameObjectAction.Finish) {
                continue;
            }

            moveObject(time, level, o);

            if (includesArea(level.finishArea, o)) {
                level.charactersFinished++;
                playTune(SFX_HOME);

                if (
                    state.type === "run" &&
                    level.charactersFinished >= level.charactersToFinish
                ) {
                    setStateLevelFinished(state, time);
                }
                o.action = GameObjectAction.Finish;
                o.velocity = {
                    x: o.velocity.x > 0 ? 0.0001 : 0,
                    y: o.velocity.y > 0 ? 0.0001 : 0,
                };
            }

            const center = getCenter(o);
            const tile = getTileAt(level, center);
            const tilePos = getTilePosAt(center);
            const tileArea = tileToArea(tilePos);
            const direction = divide(o.velocity, length(o.velocity));
            const currentVelocity = (o.velocity = multiply(
                direction,
                RAINBOW_SPEED * speedRatio,
            ));
            const speed = length(currentVelocity);

            if (tile !== o.currentTile) {
                // The unicorn has finished digging a tile.
                // Change type so that other tiles can be placed
                // on it.
                if (o.currentTile?.type === "rock") {
                    o.currentTile.type = "land";
                }
                o.currentTile = tile;
            }

            // Go faster on a rainbow
            if (tile?.type === "rainbow") {
                if (0 < speed && speed < RAINBOW_SPEED * speedRatio) {
                    o.velocity = multiply(
                        direction,
                        RAINBOW_SPEED *
                            speedRatio *
                            (Math.random() * 0.7 + 0.7),
                    );
                }
            } else if (speed > CHARACTER_SPEED * speedRatio) {
                const direction = divide(o.velocity, speed);
                o.velocity = multiply(
                    direction,
                    CHARACTER_SPEED * speedRatio * (Math.random() * 0.7 + 0.7),
                );
            }

            if (
                tile?.type === "water" &&
                includesArea(tileArea, o) &&
                !o.toDelete
            ) {
                playTune(SFX_SPLASH);

                level.objectsToAdd.push(
                    createSplash(time, {
                        x: o.x + o.width / 2,
                        y: o.y + o.height / 2,
                    }),
                );

                killCharacter(time, state, o);
            } else if (
                tile?.arrow === Arrow.Up &&
                o.velocity.y >= 0 &&
                includesArea(tileArea, o)
            ) {
                // Make sure that the unicorn does
                // not hit a rock wall after turn.
                o.x = clamp(
                    o.x,
                    tileArea.x + ARROW_PLACEMENT_MARGIN,
                    tileArea.x +
                        tileArea.width -
                        (o.width + ARROW_PLACEMENT_MARGIN),
                );

                o.velocity = {
                    x: 0,
                    y:
                        -CHARACTER_SPEED *
                        speedRatio *
                        (Math.random() * 0.7 + 0.7),
                };
            } else if (
                tile?.arrow === Arrow.Down &&
                o.velocity.y <= 0 &&
                includesArea(tileArea, o)
            ) {
                // Make sure that the unicorn does
                // not hit a rock wall after turn.
                o.x = clamp(
                    o.x,
                    tileArea.x + ARROW_PLACEMENT_MARGIN,
                    tileArea.x +
                        tileArea.width -
                        (o.width + ARROW_PLACEMENT_MARGIN),
                );

                o.velocity = {
                    x: 0,
                    y:
                        CHARACTER_SPEED *
                        speedRatio *
                        (Math.random() * 0.7 + 0.7),
                };
            } else if (
                tile?.arrow === Arrow.Left &&
                o.velocity.x >= 0 &&
                includesArea(tileArea, o)
            ) {
                // Make sure that the unicorn does
                // not hit a rock wall after turn.
                o.y = clamp(
                    o.y,
                    tileArea.y + ARROW_PLACEMENT_MARGIN,
                    tileArea.y +
                        tileArea.height -
                        (o.height + ARROW_PLACEMENT_MARGIN),
                );

                o.velocity = {
                    x:
                        -CHARACTER_SPEED *
                        speedRatio *
                        (Math.random() * 0.7 + 0.7),
                    y: 0,
                };
            } else if (
                tile?.arrow === Arrow.Right &&
                o.velocity.x <= 0 &&
                includesArea(tileArea, o)
            ) {
                // Make sure that the unicorn does
                // not hit a rock wall after turn.
                o.y = clamp(
                    o.y,
                    tileArea.y + ARROW_PLACEMENT_MARGIN,
                    tileArea.y +
                        tileArea.height -
                        (o.height + ARROW_PLACEMENT_MARGIN),
                );

                o.velocity = {
                    x:
                        CHARACTER_SPEED *
                        speedRatio *
                        (Math.random() * 0.7 + 0.7),
                    y: 0,
                };
            }
        }
    }

    level.objects = level.objects.filter((o) => !o.toDelete);
    level.objects.push(...level.objectsToAdd);
    level.objectsToAdd = [];
};

const killCharacter = (
    time: TimeStep,
    state: GameStateRun | GameStateLose | GameStateLevelFinished,
    o: GameObject,
): void => {
    const { level } = state;
    o.toDelete = true;
    level.charactersLost++;

    if (
        state.type === "run" &&
        level.characterCount - level.charactersLost < level.charactersToFinish
    ) {
        setStateLose(state, time);
    }
};

const hasActionsLeft = (level: Level, action: Action): boolean =>
    !!level.actionCounts[action] &&
    (level.actionsUsed[action] == null ||
        level.actionsUsed[action] < level.actionCounts[action]);

const rainbowCanExtend = (tile: Tile | undefined): boolean =>
    tile?.type === "water" || tile?.type === "rainbow";

const getApplicableArea = (
    level: Level,
    action: Action,
    tile: Tile,
    tilePos: TilePosition,
): TileArea | undefined => {
    const tileType = ActionTiles[action];

    if (tileType != null && tileType !== tile.type) {
        return undefined;
    }

    if (action === Action.RainbowHorizontal) {
        let ixLeftmost = tilePos.ix;
        let ixRightMost = tilePos.ix;
        while (
            rainbowCanExtend(tileMapGet(level, ixLeftmost - 1, tilePos.iy))
        ) {
            ixLeftmost--;
        }
        while (
            rainbowCanExtend(tileMapGet(level, ixRightMost + 1, tilePos.iy))
        ) {
            ixRightMost++;
        }

        // The rainbow must be from land to land.
        if (
            tileMapGet(level, ixLeftmost - 1, tilePos.iy)?.type !== "land" ||
            tileMapGet(level, ixRightMost + 1, tilePos.iy)?.type !== "land"
        ) {
            return undefined;
        }

        return {
            ix: ixLeftmost,
            iy: tilePos.iy,
            xCount: ixRightMost - ixLeftmost + 1,
            yCount: 1,
        };
    }

    if (action === Action.RainbowVertical) {
        let ixTopMost = tilePos.iy;
        let ixBottomMost = tilePos.iy;
        while (rainbowCanExtend(tileMapGet(level, tilePos.ix, ixTopMost - 1))) {
            ixTopMost--;
        }
        while (
            rainbowCanExtend(tileMapGet(level, tilePos.ix, ixBottomMost + 1))
        ) {
            ixBottomMost++;
        }

        // The rainbow must be from land to land.
        if (
            tileMapGet(level, tilePos.ix, ixTopMost - 1)?.type !== "land" ||
            tileMapGet(level, tilePos.ix, ixBottomMost + 1)?.type !== "land"
        ) {
            return undefined;
        }

        return {
            ix: tilePos.ix,
            iy: ixTopMost,
            xCount: 1,
            yCount: ixBottomMost - ixTopMost + 1,
        };
    }

    if (actionIsArrow(action) && tile.arrow === actionToArrow(action)) {
        return undefined;
    }

    return { ...tilePos, xCount: 1, yCount: 1 };
};

const consumeAction = (
    level: Level,
    action: Action,
    tile: Tile,
    tilePos: TilePosition,
): TileArea | undefined => {
    const area = getApplicableArea(level, action, tile, tilePos);
    if (!area) {
        return undefined;
    }

    if (!level.actionCounts[action]) {
        return undefined;
    }

    if (level.actionsUsed[action] == null) {
        level.actionsUsed[action] = 1;
        return area;
    }

    if (level.actionsUsed[action] < level.actionCounts[action]) {
        level.actionsUsed[action]++;
        return area;
    }

    return undefined;
};

export const levelHandleMouseMove = (level: Level, event: MouseEvent): void => {
    if (level.selectedActionIndex != null) {
        const { camera } = level;
        const position = mousePositionToCanvasPosition(canvas, event);
        const pointOnLevel = screenToLevel(camera, levelDrawArea, position);
        const selectedAction = actionButtons[level.selectedActionIndex].action;
        const tile = getTileAt(level, pointOnLevel);
        const tilePos = getTilePosAt(pointOnLevel);
        let character: GameObject | undefined;

        if (
            selectedAction != null &&
            hasActionsLeft(level, selectedAction) &&
            tile != null
        ) {
            if (selectedAction === Action.Dig) {
                if (
                    (character = findClosestCharacter(
                        level,
                        pointOnLevel,
                        MAX_CHARACTER_CLICK_DISTANCE,
                    )) &&
                    character.action !== GameObjectAction.Dig
                ) {
                    level.highlightedCharacter = character;
                    level.highlightedArea = undefined;
                } else {
                    level.highlightedArea = {
                        ...tilePos,
                        xCount: 1,
                        yCount: 1,
                    };
                    level.areaHighlightMode = HighlightMode.Deny;
                    level.highlightedCharacter = undefined;
                }
            } else {
                level.highlightedArea = getApplicableArea(
                    level,
                    selectedAction,
                    tile,
                    tilePos,
                );
                if (level.highlightedArea) {
                    level.areaHighlightMode = HighlightMode.Allow;
                } else {
                    level.highlightedArea = {
                        ...tilePos,
                        xCount: 1,
                        yCount: 1,
                    };
                    level.areaHighlightMode = HighlightMode.Deny;
                }
            }
        } else {
            level.highlightedArea = undefined;
            level.highlightedCharacter = undefined;
        }
    }
};

export const levelHandleClick = (
    level: Level,
    event: MouseEvent,
    time: TimeStep,
): void => {
    const position = mousePositionToCanvasPosition(canvas, event);

    // Check buttons
    for (let i = 0; i < actionButtons.length; i++) {
        const button = actionButtons[i];
        if (includesPoint(button as Area, position)) {
            if (button.action === Action.Back) {
                setStateLevelSelection(time);
                return;
            }

            if (button.action === Action.Restart) {
                setStateRun(time, level.number);
                return;
            }

            if (button.action === Action.Fastforward) {
                if (speedRatio === 1) {
                    setSpeedRatio(10);
                } else {
                    setSpeedRatio(1);
                }
                return;
            }

            toggleActionButton(level, i);
            return;
        }
    }

    // Check action click
    if (level.selectedActionIndex != null) {
        const { camera } = level;
        const pointOnLevel = screenToLevel(camera, levelDrawArea, position);
        const selectedAction = actionButtons[level.selectedActionIndex].action;
        const tile = getTileAt(level, pointOnLevel);
        const tilePos = getTilePosAt(pointOnLevel);
        let character: GameObject | undefined;

        if (selectedAction != null && tile != null) {
            if (selectedAction === Action.RainbowHorizontal) {
                const area = consumeAction(
                    level,
                    selectedAction,
                    tile,
                    tilePos,
                );
                if (area) {
                    for (let i = 0; i < area.xCount; i++) {
                        const areaTile = tileMapGet(
                            level,
                            area.ix + i,
                            area.iy,
                        );
                        if (areaTile) {
                            areaTile.type = "rainbow";
                            if (i === 0) {
                                // The first tile of the rainbow is the one that
                                // is actually drawn:
                                areaTile.xCount = area.xCount;
                            }
                        }
                    }
                }
            } else if (selectedAction === Action.RainbowVertical) {
                const area = consumeAction(
                    level,
                    selectedAction,
                    tile,
                    tilePos,
                );
                if (area) {
                    for (let i = 0; i < area.yCount; i++) {
                        const areaTile = tileMapGet(
                            level,
                            area.ix,
                            area.iy + i,
                        );
                        if (areaTile) {
                            areaTile.type = "rainbow";
                            if (i === 0) {
                                // The first tile of the rainbow is the one that
                                // is actually drawn:
                                areaTile.yCount = area.yCount;
                            }
                        }
                    }
                }
            } else if (selectedAction === Action.Dig) {
                if (
                    (character = findClosestCharacter(
                        level,
                        pointOnLevel,
                        MAX_CHARACTER_CLICK_DISTANCE,
                    )) &&
                    character.action !== GameObjectAction.Dig &&
                    consumeAction(level, selectedAction, tile, tilePos)
                ) {
                    character.action = GameObjectAction.Dig;
                }
            } else if (actionIsArrow(selectedAction)) {
                if (consumeAction(level, selectedAction, tile, tilePos)) {
                    const arrow = actionToArrow(selectedAction);
                    if (arrow) {
                        tile.arrow = arrow;
                    }
                }
            }
        }
    }
};

const findClosestCharacter = (
    level: Level,
    point: Vector,
    maxDistance: number,
): GameObject | undefined => {
    let minDistance = Number.MAX_VALUE;
    let closestCharacter: GameObject | undefined;

    for (let i = 0; i < level.objects.length; i++) {
        const o = level.objects[i];
        if (o.type !== "character") {
            continue;
        }
        const dst = distanceSquared(point, getCenter(o));
        if (dst < maxDistance * maxDistance && dst < minDistance) {
            minDistance = dst;
            closestCharacter = o;
        }
    }

    return closestCharacter;
};

export const drawLevel = (
    time: TimeStep,
    state: GameStateRun | GameStateLose | GameStateLevelFinished,
): void => {
    const { level } = state;
    const { camera } = level;

    const ButtonRowHeightFraction = 0.15;
    const buttonRowHeight = canvas.height * ButtonRowHeightFraction;
    const buttonRowY = canvas.height - buttonRowHeight;

    // Update the draw area on each draw so that it works also even when
    // the canvas is resized.
    levelDrawArea.width = canvas.width;
    levelDrawArea.height = canvas.height - buttonRowHeight;

    // Draw the level according to camera angle
    applyCamera(camera, cx, levelDrawArea, level, () => {
        drawMap(
            time,
            level,
            level.objects,
            level.highlightedArea,
            level.areaHighlightMode,
            level.highlightedCharacter,
            level.selectedActionIndex,
            level.theme,
        );
    });

    // Draw button row
    const buttonWidth = 100;
    const buttonRowX = (canvas.width - buttonWidth * actionButtons.length) / 2;

    cx.fillStyle = "rgb(93, 0, 32)";
    cx.fillRect(0, buttonRowY, canvas.width, buttonRowHeight);
    cx.fillStyle = "rgb(73, 0, 12)";
    cx.fillRect(
        0,
        buttonRowY + buttonRowHeight / 2,
        canvas.width,
        buttonRowHeight,
    );

    if (state.type !== "run") return;

    const fontSize = Math.floor(28 * (canvas.width / 1000));

    for (let i = 0; i < actionButtons.length; i++) {
        const button = actionButtons[i];
        const isRestartButton = button.action === Action.Restart;
        const isFastforwardButton = button.action === Action.Fastforward;
        const isBackButton = button.action === Action.Back;

        const count =
            button.action != null
                ? (level.actionCounts[button.action] ?? 0) -
                  (level.actionsUsed[button.action] ?? 0)
                : undefined;

        button.x = buttonRowX + i * buttonWidth;
        button.y = buttonRowY;
        button.width = buttonWidth - 1;
        button.height = buttonRowHeight;

        cx.save();

        if (button.action) {
            // Determine color based on selection or hover
            let fillColor =
                count || isRestartButton || isFastforwardButton || isBackButton
                    ? i === level.selectedActionIndex ||
                      (isFastforwardButton && speedRatio > 1)
                        ? "rgb(191, 85, 218)"
                        : "rgb(172, 15, 94)"
                    : "rgb(114, 10, 62)";

            cx.fillStyle = fillColor;

            cx.fillRect(button.x, button.y, button.width, button.height);

            cx.fillStyle = "rgba(0, 0, 0, 0.25)";

            cx.fillRect(
                button.x,
                button.y + button.height / 2,
                button.width,
                button.height / 2,
            );
        }

        cx.textAlign = "center";
        cx.textBaseline = "middle";
        cx.fillStyle = isRestartButton
            ? "rgb(255, 176, 176)"
            : count || isBackButton || isFastforwardButton
              ? "rgb(255, 209, 234)"
              : "rgb(219, 52, 141)";
        cx.globalAlpha =
            count ||
            !button.action ||
            isRestartButton ||
            isBackButton ||
            isFastforwardButton
                ? 1
                : 0.6;
        cx.font = `${fontSize}px Courier New`;
        cx.fillText(
            button.text,
            button.x + button.width / 2,
            button.y + button.height / 3,
        );

        if (button.action) {
            cx.font = `${fontSize}px Courier New`;
            cx.fillText(
                isRestartButton || isBackButton || isFastforwardButton
                    ? ""
                    : count
                      ? (count?.toString() ?? "-")
                      : "-",
                button.x + button.width / 2,
                button.y + button.height * 0.75,
            );
        }

        cx.restore();
    }

    const fadeElapsed = time.t - state.start;
    if (fadeElapsed < 1000) {
        const alpha = 1 - fadeElapsed / 1000;
        cx.save();
        cx.fillStyle = `rgb(219, 52, 141, ${alpha})`;
        cx.fillRect(0, 0, canvas.width, canvas.height);
        cx.restore();
    }
};
