/**
 * The floating call stays above every page and overlay. What the call opens for
 * itself goes above that, and is marked so an overlay underneath doesn't treat
 * using the call as a click outside (see keepOpenForVoiceCall).
 */
export const VOICE_CALL_LAYER = "z-[100000]";
export const VOICE_OVERLAY_LAYER = "z-[100001]";
export const VOICE_SURFACE_LAYER = "z-[100002]";
export const VOICE_MENU_LAYER = "z-[100003]";
