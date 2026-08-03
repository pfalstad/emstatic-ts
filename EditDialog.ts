/*
    Copyright (C) 2017 by Paul Falstad

    This file is part of EMStatic.

    EMStatic is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    EMStatic is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with EMStatic.  If not, see <http://www.gnu.org/licenses/>.
*/

import type { EMStatic } from "./EMStatic";
import type { Editable } from "./EditInfo";
import { EditInfo } from "./EditInfo";

// formats like GWT NumberFormat("####.###"): up to 3 decimals, no trailing zeros, no grouping
function formatNoComma(v: number): string {
    return String(Math.round(v * 1000) / 1000);
}

export class EditDialog {
    static theEditDialog: EditDialog | null = null;

    elm: Editable;
    cframe: EMStatic;
    dialogEl: HTMLDialogElement;
    vp: HTMLDivElement;
    hp: HTMLDivElement;
    einfos: (EditInfo | null)[] = [];
    einfocount = 0;

    constructor(ce: Editable, f: EMStatic) {
        this.elm = ce;
        this.cframe = f;
        EditDialog.theEditDialog = this;

        this.dialogEl = document.createElement("dialog");
        this.dialogEl.className = "editDialog";
        document.body.appendChild(this.dialogEl);

        const title = document.createElement("div");
        title.className = "dialogTitle";
        title.textContent = "Edit Component";
        this.dialogEl.appendChild(title);

        this.vp = document.createElement("div");
        this.vp.className = "vpanel";
        this.dialogEl.appendChild(this.vp);

        this.hp = document.createElement("div");
        this.hp.className = "hpanel topSpace";
        this.vp.appendChild(this.hp);

        const applyButton = document.createElement("button");
        applyButton.textContent = "Apply";
        applyButton.onclick = () => this.apply();
        this.hp.appendChild(applyButton);

        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.onclick = () => { this.apply(); this.closeDialog(); };
        this.hp.appendChild(okButton);

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.onclick = () => this.closeDialog();
        this.hp.appendChild(cancelButton);

        this.buildDialog();
    }

    show(): void {
        this.dialogEl.showModal();
    }

    setVisible(visible: boolean): void {
        if (visible)
            this.show();
        else
            this.closeDialog();
    }

    buildDialog(): void {
        let i: number;
        for (i = 0; ; i++) {
            const ei = this.elm.getEditInfo(i);
            this.einfos[i] = ei;
            if (ei == null)
                break;
            let l: HTMLElement | null = null;
            if (ei.name.startsWith("<")) {
                l = document.createElement("div");
                l.innerHTML = ei.name;
            } else {
                l = document.createElement("label");
                l.textContent = ei.name;
            }
            if (i !== 0)
                l.classList.add("topSpace");
            this.vp.insertBefore(l, this.hp);

            if (ei.choice != null) {
                this.vp.insertBefore(ei.choice.element, this.hp);
                ei.choice.addChangeHandler(() => this.itemStateChanged(ei, ei.choice!.element));
            } else if (ei.checkbox != null) {
                this.vp.insertBefore(ei.checkbox.element, this.hp);
                ei.checkbox.addValueChangeHandler(() => this.itemStateChanged(ei, ei.checkbox!.input));
            } else if (ei.button != null) {
                this.vp.insertBefore(ei.button, this.hp);
                ei.button.onclick = () => this.itemStateChanged(ei, ei.button!);
            } else if (ei.textArea != null) {
                this.vp.insertBefore(ei.textArea, this.hp);
            } else {
                ei.textf = document.createElement("input");
                ei.textf.type = "text";
                this.vp.insertBefore(ei.textf, this.hp);
                if (ei.text != null)
                    ei.textf.value = ei.text;
                else
                    ei.textf.value = this.unitString(ei);
                ei.textf.addEventListener("change", () => this.itemStateChanged(ei, ei.textf!));
            }
        }
        this.einfocount = i;
    }

    unitString(ei: EditInfo): string {
        const v = ei.value;
        const va = Math.abs(v);
        if (ei.dimensionless)
            return formatNoComma(v);
        if (v === 0) return "0";
        if (va < 1e-9) return formatNoComma(v * 1e12) + "p";
        if (va < 1e-6) return formatNoComma(v * 1e9) + "n";
        if (va < 1e-3) return formatNoComma(v * 1e6) + "u";
        if (va < 1e-2) return formatNoComma(v * 1e3) + "m";
        if (va < 1) return formatNoComma(v * 1e2) + "c";
        if (va < 1e3) return formatNoComma(v);
        if (va < 1e6) return formatNoComma(v * 1e-3) + "k";
        if (va < 1e9) return formatNoComma(v * 1e-6) + "M";
        if (va < 1e12) return formatNoComma(v * 1e-9) + "G";
        return formatNoComma(v * 1e-12) + "T";
    }

    parseUnits(ei: EditInfo): number {
        let s = ei.textf!.value.trim();
        s = s.replace(/([0-9]+)([pPnNuUmMkKgG])([0-9]+)/, "$1.$3$2");
        const len = s.length;
        const uc = s.charAt(len - 1);
        let mult = 1;
        switch (uc) {
            case 'p': case 'P': mult = 1e-12; break;
            case 'n': case 'N': mult = 1e-9; break;
            case 'u': case 'U': mult = 1e-6; break;
            case 'c': mult = 1e-2; break;
            case 'm': mult = ei.forceLargeM ? 1e6 : 1e-3; break;
            case 'k': case 'K': mult = 1e3; break;
            case 'M': mult = 1e6; break;
            case 'G': case 'g': mult = 1e9; break;
            case 't': case 'T': mult = 1e12; break;
        }
        if (mult !== 1)
            s = s.substring(0, len - 1).trim();
        const val = parseFloat(s);
        if (isNaN(val))
            throw new Error("bad number");
        return val * mult;
    }

    apply(): void {
        for (let i = 0; i !== this.einfocount; i++) {
            const ei = this.einfos[i]!;
            if (ei.textf != null && ei.text == null) {
                try {
                    ei.value = this.parseUnits(ei);
                } catch (ex) { /* ignored */ }
            }
            if (ei.button != null)
                continue;
            this.elm.setEditValue(i, ei);
        }
        this.cframe.recalcAndRepaint();
        this.cframe.repaint();
    }

    itemStateChanged(ei: EditInfo, src: EventTarget): void {
        let changed = false;
        for (let i = 0; i !== this.einfocount; i++) {
            const cur = this.einfos[i]!;
            if (cur !== ei)
                continue;
            if (cur.button === src)
                this.apply();
            if (cur.textf === src) {
                try {
                    cur.value = this.parseUnits(cur);
                } catch (ex) { /* ignored */ }
            }
            this.elm.setEditValue(i, cur);
            if (cur.newDialog)
                changed = true;
            this.cframe.recalcAndRepaint();
        }
        if (changed) {
            this.clearDialog();
            this.buildDialog();
        }
    }

    clearDialog(): void {
        while (this.vp.firstChild !== this.hp)
            this.vp.removeChild(this.vp.firstChild!);
    }

    closeDialog(): void {
        if (this.dialogEl.open)
            this.dialogEl.close();
        document.body.removeChild(this.dialogEl);
        this.cframe.editDialog = null;
        this.cframe.enableDisableUI();
    }

    updateValue(ei: EditInfo): void {
        if (ei.text != null)
            ei.textf!.value = ei.text;
        else
            ei.textf!.value = this.unitString(ei);
    }
}
