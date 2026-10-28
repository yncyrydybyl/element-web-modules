/**
 * Element internals the module API (2.2.0) does not cover. Every access is feature-checked and wrapped, so a
 * future Element without them degrades instead of breaking:
 *
 *  - `window.mxMatrixClientPeg` (MatrixClientPeg.ts sets it unconditionally): the matrix-js-sdk client, for the
 *    power-level check (`RoomState.maySendStateEvent`, exactly what WidgetUtils.canUserModifyWidgets does) and
 *    `sendStateEvent`. API gap: no way to send state or read power levels.
 *  - `window.mxSdkContext.rightPanelStore` (MatrixChat.tsx sets it): opens a widget card in the right panel,
 *    the same call Element's Extensions list makes (ExtensionsCard → rightPanelStore.pushCard/setCard with phase
 *    "Widget"). API gap: `moveAppToContainer(w, "right")` only "unpins" (WidgetLayoutStore: "right" = default,
 *    not shown) and never opens the panel.
 */

export interface RoomStateLike {
  maySendStateEvent(type: string, userId: string): boolean;
}
export interface RoomLike {
  getMyMembership?(): string;
  currentState: RoomStateLike;
}
export interface ClientLike {
  getUserId(): string | null;
  getRoom(roomId: string): RoomLike | null;
  sendStateEvent(roomId: string, type: string, content: object, stateKey: string): Promise<unknown>;
  getAccountData?(type: string): { getContent(): unknown } | undefined;
  on?(event: string, fn: (...a: unknown[]) => void): unknown;
  off?(event: string, fn: (...a: unknown[]) => void): unknown;
}
interface Peg {
  get?(): ClientLike | null;
}
interface RightPanelStoreLike {
  setCard(card: { phase: string; state?: Record<string, unknown> }, allowClose?: boolean, roomId?: string): void;
  isOpenForRoom?(roomId: string): boolean;
  currentCardForRoom?(roomId: string): { phase?: string | null; state?: { widgetId?: string } } | undefined;
  hide?(roomId: string | null): void;
  show?(roomId: string | null): void;
}

type G = { mxMatrixClientPeg?: Peg; mxSdkContext?: { rightPanelStore?: RightPanelStoreLike } };
const g = () => globalThis as unknown as G;

/** The logged-in client, or undefined when Element does not expose it (or nobody is logged in). */
export function getClient(win: G = g()): ClientLike | undefined {
  try {
    const c = win.mxMatrixClientPeg?.get?.();
    return c && typeof c.getRoom === "function" && typeof c.sendStateEvent === "function" ? c : undefined;
  } catch {
    return undefined;
  }
}

/**
 * May the user add widgets to this room? Same rule as Element's WidgetUtils.canUserModifyWidgets: joined, and the
 * power level for `im.vector.modular.widgets` state. Undefined when the client is not reachable.
 */
export function canSendState(client: ClientLike | undefined, roomId: string, type: string): boolean | undefined {
  if (!client) return undefined;
  try {
    const me = client.getUserId();
    const room = client.getRoom(roomId);
    if (!me || !room?.currentState?.maySendStateEvent) return undefined;
    if (room.getMyMembership && room.getMyMembership() !== "join") return false;
    return room.currentState.maySendStateEvent(type, me);
  } catch {
    return undefined;
  }
}

/** Is the room a DM (listed in the user's `m.direct` account data)? */
export function isDmRoom(roomId: string, mDirect: unknown): boolean {
  if (!mDirect || typeof mDirect !== "object") return false;
  return Object.values(mDirect as Record<string, unknown>).some((ids) => Array.isArray(ids) && ids.includes(roomId));
}

export function rightPanelStore(win: G = g()): RightPanelStoreLike | undefined {
  try {
    const s = win.mxSdkContext?.rightPanelStore;
    return s && typeof s.setCard === "function" ? s : undefined;
  } catch {
    return undefined;
  }
}

/** Is the right panel of `roomId` currently showing widget `widgetId`? */
export function rightPanelShowsWidget(store: RightPanelStoreLike, roomId: string, widgetId: string): boolean {
  try {
    if (!store.isOpenForRoom?.(roomId)) return false;
    const card = store.currentCardForRoom?.(roomId);
    return card?.phase === "Widget" && card.state?.widgetId === widgetId;
  } catch {
    return false;
  }
}
