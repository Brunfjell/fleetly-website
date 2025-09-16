import { registerSW } from "virtual:pwa-register";

export const updateSW = registerSW({
  onNeedRefresh() {},
  onOfflineReady() {}
});
