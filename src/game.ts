import { renderUnicorn } from "./animations/unicorn";
import { GAME_TITLE } from "./constants";
import { initializeAudio, playTune, SFX_CLICK } from "./audio/sfx";
import { renderGradient } from "./core/graphics/gradient";
import type { TimeStep } from "./core/time/TimeStep";
import { getGameState, WAIT_FOR_NEXT_STATE } from "./GameState";
import { isLastLevel, setStateLoaded } from "./gamestates";
import { canvas, cx, drawRainbowBackground } from "./graphics";
import {
    drawLevel,
    levelHandleClick,
    levelHandleMouseMove,
    updateLevel,
} from "./Level";
import {
    drawLevelSelection,
    levelSelectionHandeMouseMove,
    levelSelectionHandleClick,
} from "./LevelSelection";
import { renderText, renderWaitForProgressInput, TextSize } from "./text";
import { CHARACTER_SPEED } from "./GameObject";

export const IntroductionTextTime = 6000;

const TIME_STEP = 1000 / 60;
const MAX_FRAME = TIME_STEP * 5;

let lastTime = 0;
const time: TimeStep = {
    t: 0,
    dt: 0,
};

const gameLoop = (t: number): void => {
    requestAnimationFrame(gameLoop);

    time.t = t;
    time.dt = Math.min(t - lastTime, MAX_FRAME);
    lastTime = t;

    update(time);
    draw(time);
};

const update = (time: TimeStep): void => {
    const state = getGameState();

    switch (state.type) {
        case "run":
        case "lose":
        case "finished": {
            updateLevel(time, state);
            break;
        }
        default:
            break;
    }
};

const draw = (time: TimeStep): void => {
    const state = getGameState();

    switch (state.type) {
        case "load": {
            cx.save();
            cx.fillStyle = "black";
            cx.fillRect(0, 0, canvas.width, canvas.height);

            renderText("LOADING...", TextSize.Huge);
            cx.restore();
            break;
        }
        case "loaded": {
            cx.save();
            cx.fillStyle = "black";
            cx.fillRect(0, 0, canvas.width, canvas.height);

            renderText(
                "Director's cut. Originally made for the js13kGames 2026 game competition.",
                TextSize.Tiny,
                0.5,
                -8,
            );

            renderText("© FROST SUN", TextSize.Huge);
            renderText("2026", TextSize.Large, 1, 4);

            renderWaitForProgressInput();

            cx.restore();
            break;
        }
        case "intro": {
            cx.save();

            const direction = drawRainbowBackground(time, state.start);

            const currentVelocity =
                direction > 0
                    ? { x: -CHARACTER_SPEED, y: 0 }
                    : { x: CHARACTER_SPEED, y: 0 };

            renderUnicorn(
                {
                    x: canvas.width / 12,
                    y: canvas.height / 1.4,
                    width: canvas.width / 4,
                    height: canvas.height / 4,
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
                    width: canvas.width / 3.5,
                    height: canvas.height / 3.5,
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
                    width: canvas.width / 4,
                    height: canvas.height / 4,
                    type: "character",
                    velocity: currentVelocity,
                    animScale: 1,
                },
                time,
            );

            renderText(
                "DIRECTOR'S CUT",
                TextSize.Small,
                1,
                -5,
                true,
                0,
                undefined,
                "rgb(256, 220, 220)",
            );
            renderText(GAME_TITLE, TextSize.Huge);

            if (WAIT_FOR_NEXT_STATE < time.t - state.start) {
                renderWaitForProgressInput("start the game");
            }

            cx.restore();
            break;
        }
        case "levels": {
            drawLevelSelection(time, state);

            break;
        }
        case "run":
        case "finished":
        case "lose": {
            const { level } = state;

            cx.save();
            cx.fillStyle = "rgb(40, 30, 150)";
            cx.fillRect(0, 0, canvas.width, canvas.height);

            drawLevel(time, state);

            renderText(
                `♥️ IN ${level.charactersFinished.toString().padStart(2, "0")}/${level.charactersToFinish.toString().padStart(2, "0")} 🦄 OUT ${(
                    level.characterCount -
                    level.charactersLost -
                    level.charactersFinished
                )
                    .toFixed(0)
                    .padStart(2, "0")}`,
                TextSize.Small,
                1,
                2,
                false,
            );

            if (state.type === "run") {
                if (time.t - state.start < IntroductionTextTime) {
                    renderText(level.introduction, TextSize.Large, 1, 10);
                }
            } else if (state.type === "finished") {
                renderText("MAP FINISHED!", TextSize.Large);

                if (WAIT_FOR_NEXT_STATE < time.t - state.start) {
                    if (isLastLevel(state)) {
                        renderWaitForProgressInput("to continue", 15.5);
                        renderText("ESC to quit", TextSize.Tiny, 0.8, 17);
                    } else {
                        renderWaitForProgressInput(
                            "continue to the next map",
                            15.5,
                        );
                        renderText("ESC to quit", TextSize.Tiny, 0.8, 17);
                    }
                }
            } else if (state.type === "lose") {
                renderText("MAP FAILED!", TextSize.Large);

                if (WAIT_FOR_NEXT_STATE < time.t - state.start) {
                    renderWaitForProgressInput("try again", 15.5);
                    renderText("ESC to quit", TextSize.Tiny, 0.8, 17);
                }
            }

            cx.restore();
            break;
        }
        case "win": {
            cx.save();

            drawRainbowBackground(time, state.start, true);

            const currentVelocity = { x: 0, y: 0.1 };

            renderUnicorn(
                {
                    x: canvas.width / 12,
                    y: canvas.height / 1.4,
                    width: canvas.width / 4,
                    height: canvas.height / 4,
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
                    width: canvas.width / 3.5,
                    height: canvas.height / 3.5,
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
                    width: canvas.width / 4,
                    height: canvas.height / 4,
                    type: "character",
                    velocity: currentVelocity,
                    animScale: 1,
                },
                time,
            );

            renderText("YOU MASTERED", TextSize.Huge, 1, -5);
            renderText("ALL THE MAPS!", TextSize.Huge);

            if (WAIT_FOR_NEXT_STATE < time.t - state.start) {
                renderWaitForProgressInput("continue", 15.5);
            }

            cx.restore();
            break;
        }
    }
    renderGradient(canvas, cx, 0.5);
};

const handleMouseMove = (event: MouseEvent): void => {
    const state = getGameState();
    switch (state.type) {
        case "levels": {
            levelSelectionHandeMouseMove(event);
            break;
        }
        case "run": {
            levelHandleMouseMove(state.level, event);
            break;
        }
    }
};

const handleClick = (event: MouseEvent): void => {
    const state = getGameState();
    switch (state.type) {
        case "levels": {
            event.stopImmediatePropagation();
            levelSelectionHandleClick(time, event);
            playTune(SFX_CLICK);
            break;
        }
        case "run": {
            event.stopImmediatePropagation();
            levelHandleClick(state.level, event, time);
            playTune(SFX_CLICK);
            break;
        }
    }
};

export const start = async (): Promise<void> => {
    // Not really needed in this game:
    // initializeKeyboard();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);

    window.requestAnimationFrame(gameLoop);

    await initializeAudio();

    setStateLoaded(time);
};
