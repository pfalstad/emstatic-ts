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

export class ImportFromTextDialog {
    dialogEl: HTMLDialogElement;
    sim: EMStatic;
    textArea: HTMLTextAreaElement;

    constructor(sim: EMStatic) {
        this.sim = sim;
        this.dialogEl = document.createElement("dialog");
        this.dialogEl.className = "importDialog";
        document.body.appendChild(this.dialogEl);

        const vp = document.createElement("div");
        this.dialogEl.appendChild(vp);

        const title = document.createElement("div");
        title.className = "dialogTitle";
        title.textContent = "Import from Text";
        vp.appendChild(title);

        const p1 = document.createElement("div");
        p1.textContent = "Paste the text file for your layout here...";
        vp.appendChild(p1);

        this.textArea = document.createElement("textarea");
        this.textArea.style.width = "300px";
        this.textArea.style.height = "200px";
        vp.appendChild(this.textArea);

        const hp = document.createElement("div");
        hp.className = "hpanel";
        vp.appendChild(hp);

        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.onclick = () => {
            this.sim.pushUndo();
            this.closeDialog();
            const s = this.textArea.value;
            if (s != null)
                this.sim.readImport(s);
        };
        hp.appendChild(okButton);

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.onclick = () => this.closeDialog();
        hp.appendChild(cancelButton);

        this.dialogEl.showModal();
    }

    closeDialog(): void {
        this.dialogEl.close();
        document.body.removeChild(this.dialogEl);
    }
}
