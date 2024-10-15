export class EpicRoll extends Application {
    constructor(rollData, onRollEnd) {
        super();
        this.rollData = rollData;
        this.onRollEnd = onRollEnd ?? (() => {});
        this._id = rollData._id ?? randomID(20);
        this.users = rollData.users.map((u) => game.users.get(u));
        this.results = {};
        EpicRolls5e.epicRolls[this._id] = this;
    }

    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            id: "epic-rolls-5e-epic-roll",
            template: `modules/epic-rolls-5e/templates/epicRoll.hbs`,
            resizable: false,
            popOut: false,
            dragDrop: [{ dragSelector: null, dropSelector: null }],
        };
    }

    get rollText() {
        return this.constructor.rollText(this.rollData);
    }

    static rollText(rollData, dc = false) {
        let text = "";
        if (rollData.chk !== "none") text = dnd5e.config.abilities[rollData.chk].label + " " + game.i18n.localize("epic-rolls-5e.check");
        else if (rollData.sav !== "none") text = dnd5e.config.abilities[rollData.sav].label + " " + game.i18n.localize("epic-rolls-5e.save");
        else if (rollData.skl !== "none") text = dnd5e.config.skills[rollData.skl].label + " " + game.i18n.localize("epic-rolls-5e.check");
        if (rollData.contest !== "none") text += " " + game.i18n.localize("epic-rolls-5e.contest");
        if (dc && !isNaN(parseFloat(dc))) text += " " + game.i18n.localize("epic-rolls-5e.dc") + " " + rollData.dc;
        return text;
    }

    dispatchForm() {
        const data = this.rollData;
        data._id = this._id;
        EpicRolls5e.dispatcher.executeForOthers("dispatch", data);
    }

    dispatchRoll(data) {
        data.isRoll = true;
        data.EpicRollId = this._id;
        EpicRolls5e.dispatcher.executeForOthers("dispatch", data);
    }

    dispatchClose() {
        const data = { EpicRollId: this._id, close: true };
        EpicRolls5e.dispatcher.executeForOthers("dispatch", data);
    }

    static handleDispatch(data) {
        if (data.close) return EpicRolls5e.epicRolls[data.EpicRollId].close();
        if (!data.isRoll) new EpicRolls5e.EpicRoll(data).render(true);
        else {
            const epicRoll = EpicRolls5e.epicRolls[data.EpicRollId];
            if (!epicRoll) return;
            epicRoll.element.find(`.user-card[data-user-id="${data.userId}"] .result`).text(data.res).removeClass("hidden");
            epicRoll.results[data.userId] = data.res;
            epicRoll.processFailSuccess(data.userId);
        }
    }

    activateListeners(html) {
        this.updateDC();
        AudioHelper.play({ src: game.settings.get("epic-rolls-5e", "introSound"), volume: game.settings.get("core", "globalInterfaceVolume") });
        html.find(".splash-text").text(this.rollText);
        html.find("#splash-screen")[0].onanimationend = () => {
            html.find("#splash-screen").remove();
            html[0].querySelectorAll(".splash").forEach((el) => el.classList.remove("splash"));
        };
        html.on("click", ".roll-buttons i", (e) => {
            const userId = e.currentTarget.closest(".user-card").dataset.userId;
            this.roll(userId, e);
        });
        html.on("click", "#end-roll", (e) => {
            this.onComplete(true);
        });
        if (this.rollData.contest !== "none") {
            if (game.user.isGM && !this.rollData.dc) {
                this.roll(this.contest).then((r) => {
                    if (!r) return this.close();
                    this.dispatchForm();
                });
            } else {
                this.element.find(`.user-card[data-user-id="contest"] .result`).text(this.rollData.dc);
            }
            if (!game.user.isGM && this.rollData.hideNpcName) this.element.find(`.user-card[data-user-id="contest"] .name`).text("???");
        } else {
            if (game.user.isGM) this.dispatchForm();
        }
    }

    async getData() {
        let contest = null;
        if (this.rollData.contest !== "none") {
            contest = await fromUuid(this.rollData.contest);
            contest = contest.actor ?? contest;
        }
        if (contest) this.users.push({ character: contest, id: "contest" });
        return { users: this.users, rollData: this.rollData, isGM: game.user.isGM, rollText: this.rollText };
    }

    async _render(...args) {
        await super._render(...args);
        document.querySelector("#ui-top").after(this.element[0]);
    }

    async roll(userId, e) {
        const rollOptions = {
            event: e,
            blind: this.rollData.blindRoll,
        };
        if (this.rollData.blindRoll) rollOptions.rollMode = "blindroll"
        let actor = game.users.get(userId)?.character ?? (await fromUuid(this.rollData.contest));
        actor = actor?.actor ?? actor;
        let rollResult = null;
        if (this.rollData.chk !== "none") {
            rollResult = await actor.rollAbilityTest(this.rollData.chk, rollOptions);
        } else if (this.rollData.sav !== "none") {
            rollResult = await actor.rollAbilitySave(this.rollData.sav, rollOptions);
        } else if (this.rollData.skl !== "none") {
            rollResult = await actor.rollSkill(this.rollData.skl, rollOptions);
        }
        if (!rollResult) return;

        const continueRoll = () => {
            if (game.settings.get("epic-rolls-5e", "purgeMessages")) message?.delete();
            const res = rollResult?.total ?? 0;
            const isContest = this.rollData.contest === actor?.uuid;
            if (isContest) {
                userId = "contest";
                this.rollData.dc = res;
            }
            this.element.find(`.user-card[data-user-id="${userId}"] .result`).text(res);
            if (!this.rollData.allowReroll && !game.user.isGM) this.element.find(`.user-card[data-user-id="${userId}"] .roll-buttons`).addClass("roll-hidden");
            this.results[userId] = res;
            this.dispatchRoll({ userId, res });
            this.processFailSuccess();
            return rollResult;
        };
        if(this.rollData.blindRoll && !game.user.isGM) return continueRoll();
        let message = Array.from(game.messages)
            .reverse()
            .find((m) => m.rolls?.includes(rollResult) || this.hasRoll(m.rolls, rollResult));
        if (!message) {
            message = await this.waitForRoll(rollResult);
            return continueRoll();
        } else {
            return continueRoll();
        }
    }

    waitForRoll(roll) {
        return new Promise((resolve) => {
            let hookId = Hooks.on("diceSoNiceRollComplete", (messageId) => {
                const message = game.messages.get(messageId);
                if (this.hasRoll(message.rolls, roll)) {
                    Hooks.off("diceSoNiceRollComplete", hookId);
                    resolve(message);
                }
            });
        });
    }

    hasRoll(rolls, roll) {
        if (!rolls) return false;
        for (let r of rolls) {
            if (r.formula === roll.formula && r.total === roll.total) return true;
        }
    }

    get average() {
        const resCopy = { ...this.results };
        if (resCopy.contest) delete resCopy.contest;
        return Object.values(resCopy).reduce((a, b) => a + b, 0) / Object.values(resCopy).length;
    }

    processFailSuccess() {
        const ids = this.users.map((u) => u.id);
        for (const userId of ids) {
            const userCard = this.element.find(`.user-card[data-user-id="${userId}"]`);
            if (!userCard.length) continue;
            const resultEl = userCard.find(".result");
            const result = this.results[userId];
            const isBlind = this.rollData.blindRoll && !game.user.isGM;
            if ((!result && result != 0) || isBlind) {
                resultEl.addClass("hidden");
                continue;
            }
            const dc = this.rollData.dc;
            if (userId === "contest" && !game.user.isGM && !this.rollData.showDc) continue;
            resultEl.removeClass("success failure hidden");
            if (userId === "contest") continue;
            if (!this.rollData.showRollResult && !game.user.isGM) continue;
            if ((this.rollData.useAverage ? this.average : result) >= dc) {
                resultEl.addClass("success");
            } else {
                resultEl.addClass("failure");
            }
        }
        this.updateDC();
        this.onComplete();
    }

    updateDC() {
        //this.element.find("#dc-display").toggle(!isNaN(parseFloat(this.rollData.dc)))
        if (!isNaN(parseFloat(this.rollData.dc))) this.element.find("#dc-display").text(`${game.i18n.localize("epic-rolls-5e.dc")} ${this.rollData.dc}`);
    }

    onComplete(force = false) {
        if (!game.user.isGM || this._endDialog) return;
        const results = {};
        for (const user of this.users) {
            const result = parseFloat(this.element.find(`.user-card[data-user-id="${user.id}"] .result`).text());
            results[user.id] = result;
        }
        if (Object.values(results).some((r) => isNaN(r)) && !force) return;
        this._endDialog = true;
        Dialog.confirm({
            title: "Epic Roll",
            content: `<p>End Epic Roll?</p>`,
            yes: () => {
                this.close();
                this.dispatchClose();
                this.processResults(results);
            },
            no: () => {
                this._endDialog = false;
            },
        });
    }

    async processResults(results) {
        const resultData = [];
        for (const [userId, result] of Object.entries(results)) {
            const user = game.users.get(userId);
            if (!user || isNaN(result)) continue;
            resultData.push({
                user: user,
                result,
                success: (this.rollData.useAverage ? this.average : result) >= this.rollData.dc,
            });
        }
        if (!resultData.length) {
            this.onRollEnd(resultData)
            return;
        }
        const messageHtml = await renderTemplate(`modules/epic-rolls-5e/templates/chatMessage.hbs`, { resultData, results, users: this.users, rollData: this.rollData });
        ChatMessage.create({
            user: game.user.id,
            speaker: { alias: game.user.name },
            content: messageHtml,
            whisper: this.rollData.showRollResult ? [] : [game.user.id]
        });
        this.onRollEnd(resultData);
    }

    playSuccessSound() {
        const successSound = game.settings.get("epic-rolls-5e", "successSound");
        if (successSound) AudioHelper.play({ src: successSound, volume: game.settings.get("core", "globalInterfaceVolume") });
    }

    playFailureSound() {
        const failureSound = game.settings.get("epic-rolls-5e", "failureSound");
        if (failureSound) AudioHelper.play({ src: failureSound, volume: game.settings.get("core", "globalInterfaceVolume") });
    }

    async close() {
        const result = this.results[game.user.id];
        if (isNaN(result) && game.user.isGM && !this.rollData.useAverage) return super.close();
        if (!game.user.isGM && !this.rollData.useAverage && !this.users.some((u) => u.id === game.user.id)) return super.close();
        const isSuccess = (this.rollData.useAverage ? this.average : result) >= this.rollData.dc;
        isSuccess ? this.playSuccessSound() : this.playFailureSound();
        const endScreen = document.createElement("div");
        endScreen.id = "splash-screen";
        endScreen.classList.add("end-screen");
        endScreen.classList.add(isSuccess ? "success" : "failure");
        const splashText = document.createElement("span");
        splashText.classList.add("splash-text");

        splashText.innerText = isSuccess ? game.i18n.localize("epic-rolls-5e.success") : game.i18n.localize("epic-rolls-5e.failure");
        endScreen.appendChild(splashText);
        this.element[0].appendChild(endScreen);

        const els = {
            userCards: this.element[0].querySelector(".user-cards"),
            dc: this.element[0].querySelector(".dc"),
            endRoll: this.element[0].querySelector("#end-roll"),
        };
        if (els.userCards) {
            els.userCards.style.display = "none";
            els.userCards.classList.add("splash");
        }
        if (els.dc) {
            els.dc.style.display = "none";
            els.dc.classList.add("splash");
        }
        if (els.endRoll) els.endRoll.style.display = "none";

        setTimeout(() => {
            super.close();
        }, 3600);
    }
}
