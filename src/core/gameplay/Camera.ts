/*
 * Copyright (c) 2024 - 2026 Frost Sun
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

import type { Area, Dimensions } from "../math/Area";
import type { Vector } from "../math/Vector";

export const enum CameraMode {
    ShowWholeLevel,
    StayInLevel,
}

export interface Camera {
    mode: CameraMode;
    x: number;
    y: number;
    zoom: number;
    visibleAreaHeight?: number;
    target?: Area;
}

const zoomToLevel = (
    camera: Camera,
    view: Dimensions,
    level: Dimensions,
): void => {
    camera.target = undefined;

    camera.x = level.width / 2;
    camera.y = level.height / 2;

    let zoom: number;
    if (level.width / level.height >= view.width / view.height) {
        zoom = view.width / level.width;
    } else {
        zoom = view.height / level.height;
    }

    // No fraction number for zoom so that drawing a tile map
    // would not produce lines between the tiles due to rounding
    // errors.
    camera.zoom = Math.floor(zoom);
};

const updateWithinLevel = (
    camera: Camera,
    view: Dimensions,
    level: Dimensions,
): void => {
    let newZoom = view.height / (camera.visibleAreaHeight ?? level.height);

    // Force that the level fills the entire view area.
    const minXZoom = view.width / level.width;
    if (newZoom < minXZoom) {
        newZoom = minXZoom;
    }
    const minYZoom = view.height / level.height;
    if (newZoom < minYZoom) {
        newZoom = minYZoom;
    }

    camera.zoom = newZoom;

    if (camera.target) {
        follow(camera, view, level, camera.target);
    }
};

export const screenToLevel = (
    camera: Camera,
    view: Dimensions,
    point: Vector,
): Vector => ({
    x: (point.x - view.width / 2) / camera.zoom + camera.x,
    y: (point.y - view.height / 2) / camera.zoom + camera.y,
});

export const applyCamera = (
    camera: Camera,
    cx: CanvasRenderingContext2D,
    view: Dimensions,
    level: Dimensions,
    draw: () => void,
): void => {
    if (camera.mode === CameraMode.ShowWholeLevel) {
        zoomToLevel(camera, view, level);
    } else {
        updateWithinLevel(camera, view, level);
    }

    cx.save();
    cx.translate(view.width / 2, view.height / 2);
    cx.scale(camera.zoom, camera.zoom);
    cx.translate(-camera.x, -camera.y);

    draw();

    cx.restore();
};

const follow = (
    camera: Camera,
    view: Dimensions,
    level: Dimensions,
    target: Area,
): void => {
    const viewAreaWidth = view.width / camera.zoom;
    const viewAreaHeight = view.height / camera.zoom;

    let x = target.x + target.width / 2;
    let y = target.y + target.height / 2;

    // Keep camera within level in x-direction.
    if (x - viewAreaWidth / 2 < 0) {
        x = viewAreaWidth / 2;
    } else if (x + viewAreaWidth / 2 > level.width) {
        x = level.width - viewAreaWidth / 2;
    }

    // Keep camera within level in y-direction.
    if (y - viewAreaHeight / 2 < 0) {
        y = viewAreaHeight / 2;
    } else if (y + viewAreaHeight / 2 > level.height) {
        y = level.height - viewAreaHeight / 2;
    }

    camera.x = x;
    camera.y = y;
};
