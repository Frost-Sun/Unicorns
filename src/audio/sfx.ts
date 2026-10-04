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
 * The above copyright notice and permission notice shall be
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
    mainSong,
    clickSfx,
    homeSfx,
    splashSfx,
    introSong,
    digSfx,
} from "./sfxData.ts";

import { createTune, FadeOutIn, type SongData } from "../core/audio/music.js";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { zzfx } from "../core/audio/sfxPlayer.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import CPlayer from "../core/audio/musicplayer.js";

export const SFX_INTRO = "intro";
export const SFX_RUNNING = "gamestarted";
export const SFX_HOME = "home";
export const SFX_CLICK = "click";
export const SFX_DIG = "dig";
export const SFX_SPLASH = "splash";

type Tune = {
    songData: SongData[];
    rowLen: number;
    patternLen: number;
    endPattern: number;
    numChannels: number;
};

const introTune = createTune();
const mainTune = createTune();

const initMusicPlayer = (
    audioTrack: { src: string; loop: boolean },
    tune: Tune,
    isLooped: boolean,
) => {
    return new Promise<void>((resolve) => {
        const songplayer = new CPlayer();
        // Initialize music generation (player).
        songplayer.init(tune);
        // Generate music...
        let done = false;
        const interval = setInterval(function () {
            if (done) {
                clearInterval(interval);
                return;
            }
            done = songplayer.generate() >= 1;
            if (done) {
                clearInterval(interval);
                // Put the generated song in an Audio element.
                const wave = songplayer.createWave();
                audioTrack.src = URL.createObjectURL(
                    new Blob([wave], { type: "audio/wav" }),
                );
                audioTrack.loop = isLooped;

                resolve();
            }
        }, 16);
    });
};

export const initializeAudio = () => {
    // Keep lint happy while is no more than one item.
    return Promise.all([
        initMusicPlayer(introTune, introSong, true),
        initMusicPlayer(mainTune, mainSong, true),
    ]);
};

export const playTune = async (tune: string, vol: number = 1) => {
    if (vol === 0) return;

    switch (tune) {
        case SFX_RUNNING: {
            if (mainTune.volume === 0) mainTune.currentTime = 0;
            FadeOutIn(introTune, mainTune, 0.6);
            break;
        }
        case SFX_INTRO: {
            if (introTune.volume === 0) introTune.currentTime = 0;
            FadeOutIn(mainTune, introTune, 0.5);
            break;
        }
        case SFX_HOME: {
            zzfx(0.5, ...homeSfx);
            break;
        }
        case SFX_SPLASH: {
            zzfx(vol, ...splashSfx);
            break;
        }
        case SFX_CLICK: {
            zzfx(vol, ...clickSfx);
            break;
        }
        case SFX_DIG: {
            zzfx(vol, ...digSfx);
            break;
        }
    }
};
