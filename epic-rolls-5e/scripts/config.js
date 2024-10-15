Hooks.once('init', function() {

    game.settings.register("epic-rolls-5e", "purgeMessages", {
        name: game.i18n.localize("epic-rolls-5e.settings.purgeMessages.name"),
        hint: game.i18n.localize("epic-rolls-5e.settings.purgeMessages.hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
      });

      game.settings.register("epic-rolls-5e", "introSound", {
        name: game.i18n.localize("epic-rolls-5e.settings.introSound.name"),
        hint: game.i18n.localize("epic-rolls-5e.settings.introSound.hint"),
        scope: "world",
        config: true,
        type: String,
        default: "modules/epic-rolls-5e/assets/epic_battle_music_1-6275.ogg",
        filePicker: "audio",
      });

      game.settings.register("epic-rolls-5e", "successSound", {
        name: game.i18n.localize("epic-rolls-5e.settings.successSound.name"),
        hint: game.i18n.localize("epic-rolls-5e.settings.successSound.hint"),
        scope: "world",
        config: true,
        type: String,
        default: "modules/epic-rolls-5e/assets/epic_battle_music_1-6275.ogg",
        filePicker: "audio",
      });

      game.settings.register("epic-rolls-5e", "failureSound", {
        name: game.i18n.localize("epic-rolls-5e.settings.failureSound.name"),
        hint: game.i18n.localize("epic-rolls-5e.settings.failureSound.hint"),
        scope: "world",
        config: true,
        type: String,
        default: "modules/epic-rolls-5e/assets/epic_battle_music_1-6275.ogg",
        filePicker: "audio",
      });

});

Hooks.once('ready', async function() {

});
