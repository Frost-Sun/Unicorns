import { renderUnicorn } from "./animations/unicorn";
import { includesPoint, type Area } from "./core/math/Area";
import type { Vector } from "./core/math/Vector";
import type { TimeStep } from "./core/time/TimeStep";
import { CHARACTER_SPEED } from "./GameObject";
import { type GameStateLevelSelection } from "./GameState";
import { setStateRun } from "./gamestates";
import { canvas, cx, drawRainbowBackground } from "./graphics";
import { maps } from "./maps";
import { renderText, TextSize } from "./text";
import { DEFAULT_HIGHLIGHT_COLOR, LandColorByTheme } from "./theme";

interface Button extends Area {
    text: string;
    background: string;
    enabled: boolean;
}

const buttons: Button[] = maps.map((createMap, i) => ({
    text: (i + 1).toString(),
    background: LandColorByTheme[createMap(i).theme],
    enabled: false,

    // Button positions are set in the draw function
    // so that changes in window size are taken care of.
})) as Button[];

let highlightedButton: Button | undefined;

export const drawLevelSelection = (
    time: TimeStep,
    state: GameStateLevelSelection,
): void => {
    cx.save();

    drawRainbowBackground(time, state.start);

    const direction = drawRainbowBackground(time, state.start);

    const currentVelocity =
        direction > 0
            ? { x: -CHARACTER_SPEED, y: 0 }
            : { x: CHARACTER_SPEED, y: 0 };

    renderUnicorn(
        {
            x: canvas.width / 12,
            y: canvas.height / 1.4,
            width: canvas.width / 5,
            height: canvas.height / 5,
            type: "character",
            velocity: currentVelocity,
            animScale: 1,
        },
        time,
    );

    renderUnicorn(
        {
            x: canvas.width / 3,
            y: canvas.height / 1.4,
            width: canvas.width / 4.5,
            height: canvas.height / 4.5,
            type: "character",
            velocity: currentVelocity,
            animScale: 1,
        },
        time,
    );

    renderUnicorn(
        {
            x: canvas.width / 1.5,
            y: canvas.height / 1.4,
            width: canvas.width / 5,
            height: canvas.height / 5,
            type: "character",
            velocity: currentVelocity,
            animScale: 1,
        },
        time,
    );

    const iconWidth = Math.max(142, canvas.width / 10);
    const iconHeight = iconWidth;
    const marginX = 16;
    const marginY = 16;
    const iconsPerRow = Math.floor(
        (canvas.width - marginX) / (iconWidth + marginX),
    );

    cx.lineWidth = 5;
    cx.font = "38px Courier New semi-bold";

    renderText("Select a map", TextSize.Normal, 1, 32, false);
    renderText("ESC to quit", TextSize.Tiny, 0.8, 16);

    for (let i = 0; i < maps.length; i++) {
        const x = marginX + (i % iconsPerRow) * (iconWidth + marginX);
        const y =
            marginY + Math.floor(i / iconsPerRow) * (iconHeight + marginY);

        const button = buttons[i];
        button.text = (i + 1).toString();
        button.enabled = i <= state.highestLevel;
        button.x = x;
        button.y = y;
        button.width = iconWidth;
        button.height = iconHeight;

        cx.fillStyle = button.background;
        cx.globalAlpha = button.enabled ? 1 : 0.3;
        cx.strokeStyle =
            button === highlightedButton
                ? DEFAULT_HIGHLIGHT_COLOR
                : "rgb(10, 100, 10)";
        cx.fillRect(button.x, button.y, button.width, button.height);
        cx.strokeRect(button.x, button.y, button.width, button.height);
        cx.fillStyle = "white";
        cx.fillText(
            button.text.padStart(2, "0"),
            button.x + iconWidth * 0.375,
            button.y + iconHeight * 0.6,
        );
    }

    cx.restore();
};

export const levelSelectionHandeMouseMove = (position: Vector): void => {
    for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        if (button.enabled && includesPoint(button, position)) {
            highlightedButton = button;
            return;
        }
    }

    highlightedButton = undefined;
};

export const levelSelectionHandleClick = (
    time: TimeStep,
    position: Vector,
): void => {
    for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        if (button.enabled && includesPoint(button, position)) {
            setStateRun(time, i);
            return;
        }
    }
};
