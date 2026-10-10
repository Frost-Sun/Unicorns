import type { Arrow, TileType } from "./tiles";

export const enum Action {
    // The directions should match with values of Arrow enum
    // so that we get away with a small mapping function.
    Up = 1,
    Down = 2,
    Left = 3,
    Right = 4,
    RainbowHorizontal,
    RainbowVertical,
    Dig,
}

export const actionIsArrow = (
    action: Action,
): action is Action.Up | Action.Down | Action.Left | Action.Right =>
    action === Action.Up ||
    action === Action.Down ||
    action === Action.Left ||
    action === Action.Right;

export const actionToArrow = (
    action: Action.Up | Action.Down | Action.Left | Action.Right,
): Arrow => action as unknown as Arrow;

export const ActionTiles: Record<Action, TileType | undefined> = {
    [Action.Up]: "land",
    [Action.Down]: "land",
    [Action.Left]: "land",
    [Action.Right]: "land",
    [Action.RainbowHorizontal]: "water",
    [Action.RainbowVertical]: "water",
    [Action.Dig]: undefined,
};
