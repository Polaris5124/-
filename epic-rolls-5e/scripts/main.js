import { EpicRoll } from "./EpicRoll.js";
import { RequestEpicRoll } from "./RequestEpicRoll.js";

globalThis.EpicRolls5e = {
  EpicRoll,
  RequestEpicRoll,
  dispatcher: null,
  epicRolls : {},
}



Hooks.once("socketlib.ready", () => {
  EpicRolls5e.dispatcher = socketlib.registerModule("epic-rolls-5e");
  EpicRolls5e.dispatcher.register("dispatch", dispatchData);
});

function dispatchData(data) {
  EpicRolls5e.EpicRoll.handleDispatch(data);
}

Hooks.on("renderSidebarTab", (app, html, data) => {
  if(!game.user.isGM || app.tabName !== "chat") return;
  html.find("#chat-controls").prepend(`<label class="epic-roll"><i class="fa-duotone fa-dice-d12"></i></label>`);
  html.on("click", ".epic-roll", e => {
    new EpicRolls5e.RequestEpicRoll().render(true)
  });
});