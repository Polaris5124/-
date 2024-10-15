export class RequestEpicRoll extends FormApplication{
    constructor(rollData, users = []) {
        super();
        this.rollData = rollData ?? {};
        this.users = users;
    }

    static get defaultOptions() {
        return {
          ...super.defaultOptions,
          title: game.i18n.localize("epic-rolls-5e.request-roll.title"),
          id: "epic-rolls-5e-request-roll",
          template: `modules/epic-rolls-5e/templates/requestRoll.hbs`,
          resizable: false,
          width: 600,
          dragDrop: [{ dragSelector: null, dropSelector: null }],
        };
    }

    activateListeners(html) {
        //super.activateListeners(html);
        html.find('.user-panel').on('click', e => e.currentTarget.classList.toggle('selected'));
        html.find('.toggle').on('click', e => {e.preventDefault(); e.currentTarget.classList.toggle('active')});
        html.find(".check").on("change", e => {
            html.find(".check").not(e.currentTarget).removeClass("active").val("none");
            e.currentTarget.classList.toggle("active", e.currentTarget.value !== "none");
        });
        const dc = html.find("#dc");
        const contest = html.find("#contest");
        html.find("#dc").on("change", e => {
            contest.removeClass("active").val("none");
            e.currentTarget.classList.toggle("active", !!e.currentTarget.value);
        });
        html.find("#contest").on("change", e => {
            dc.removeClass("active").val("");
            e.currentTarget.classList.toggle("active", e.currentTarget.value !== "none");
        });
        html.find("#cancel").on("click", e => {
            e.preventDefault();
            this.close();
        })
        html.find("#confirm").on("click", e => {
            e.preventDefault();
            this.epicRoll();
        })
        html.find("#macro").on("click", e => {
            e.preventDefault();
            this.saveToMacro();
        });
        this.setValues(html);
    }

    setValues(html) {
        for(let [k,v] of Object.entries(this.rollData)){
            const el = html.find(`[name=${k}]`);
            if(!el.length) continue;
            el.val(v);
            if(el.hasClass("toggle")) el.toggleClass("active", v);
            if(el.hasClass("check")) el.toggleClass("active", v !== "none");
        }
    }

    async getData() {
        const users = Array.from(game.users).filter(u => u.character && !u.isGM); //const users = Array.from(game.users).filter(u => u.active && u.character && !u.isGM);
        const userCharacters = users.map(u => u.character);
        if (this.users.length) {
            for (const user of users) {
                user._epicRollsSelected = this.users.includes(user.id);
            }
        } else {            
            const isUserCharSelected = canvas?.tokens?.controlled?.some(t => userCharacters.includes(t.actor));
            if (isUserCharSelected) {
                const controlledActors = canvas.tokens.controlled.map(t => t.actor);
                for (const user of users) {
                    user._epicRollsSelected = controlledActors.includes(user.character);
    
                }
            } else { 
                for (const user of users) {
                    user._epicRollsSelected = true;
                }
            }
        }
        return {rollData: this.rollData, users, abilities: game.dnd5e.config.abilities, skills: game.dnd5e.config.skills, actors: Array.from(game.actors)};
    }

    async epicRoll(){
        const rollData = this.getRollData();
        if(!rollData) return;
        if(!rollData.users.length) return ui.notifications.error(game.i18n.localize("epic-rolls-5e.request-roll.error-users"));
        new EpicRolls5e.EpicRoll(rollData).render(true);
        this.close();
        console.log(rollData);
    }

    getRollData() {
        const data = this._getSubmitData();
        if(data.contest === "token") data.contest = canvas.tokens.controlled[0].actor.uuid;
        const users = [];
        this.element[0].querySelectorAll('.user-panel.selected')?.forEach((e) => users.push(e.dataset.userId));
        data.users = users;
        this.element.find("button.toggle").each((i, e) => {data[e.name] = e.classList.contains("active")});
        if(data.chk === "none" && data.contest === "none" && data.sav === "none" && data.skl === "none") return ui.notifications.error(game.i18n.localize("epic-rolls-5e.request-roll.error"));
        if(data.contest === "token" && !canvas.tokens.controlled[0]) return ui.notifications.error(game.i18n.localize("epic-rolls-5e.request-roll.error-token"));
        return data;
    }

    async saveToMacro() {
        const rollData = this.getRollData();
        if(!rollData) return;
        delete rollData.users;
        const rollText = EpicRolls5e.EpicRoll.rollText(rollData, true).slugify();
        Dialog.prompt({
            title: game.i18n.localize("epic-rolls-5e.request-roll.save-macro.title"),
            content: `<p>${game.i18n.localize("epic-rolls-5e.request-roll.save-macro.content")}</p>` + `<input name="name" type="text" value="EpicRolls_${rollText}"><hr>`,
            rejectClose: false,
            callback: async (html) => {
                const name = html.find('input[name="name"]').val();
                if(!name) return;
                const macro = await Macro.create({
                    name: name,
                    type: "script",
                    img: "icons/dice/d20black.svg",
                    command: `new EpicRolls5e.RequestEpicRoll(${JSON.stringify(rollData)}).render(true);`
                }, {displaySheet: false});
                macro.sheet.render(true);
            }

        })
    }
}

/*
new EpicRolls5e.EpicRoll({
    "skl": "none",
    "chk": "none",
    "sav": "dex",
    "dc": 15,
    "contest": "none",
    "users": [
        "248lrL0Q9ZMoYHXj",
        "cdKGeeNG0Pk7B72t"
    ],
    "showDc": true,
    "useAverage": true,
    "allowReroll": true,
    "showRollResult": true,
    "blindRoll": true,
    "hideNpcName": true
}).render(true);
*/