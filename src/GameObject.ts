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

import type { Area } from "./core/math/Area";
import type { Vector } from "./core/math/Vector";
import { TILE_HEIGHT, TILE_WIDTH, type Tile } from "./tiles";

export const RAINBOW_SPEED = 0.02;
export const CHARACTER_SPEED = 0.005;
export const DIGGING_SPEED = 0.001;

export let speedRatio = 1;

export const UNICORN_WIDTH = TILE_WIDTH * 0.5;
export const UNICORN_HEIGHT = TILE_HEIGHT * 0.4;

export type GameObjectType = "rock" | "character" | "splash" | "finish";

export const enum GameObjectAction {
    Walk,
    Dig,
    Finish,
}

export interface GameObject extends Area {
    type: GameObjectType;
    x: number;
    y: number;
    width: number;
    height: number;
    velocity: Vector;
    action?: GameObjectAction;
    createTime?: number;
    toDelete?: boolean;
    currentTile?: Tile;
    nextDigSound?: number;
    animScale?: number;
}

export const setSpeedRatio = (newSpeedRatio: number): void => {
    speedRatio = newSpeedRatio;
};
