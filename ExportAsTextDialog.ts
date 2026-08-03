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

export class ExportAsTextDialog {
    dialogEl: HTMLDialogElement;
    sim: EMStatic;
    textArea: HTMLTextAreaElement;

    constructor(sim: EMStatic, s: string) {
        this.sim = sim;
        this.dialogEl = document.createElement("dialog");
        this.dialogEl.className = "exportDialog";
        document.body.appendChild(this.dialogEl);

        const vp = document.createElement("div");
        this.dialogEl.appendChild(vp);

        const title = document.createElement("div");
        title.className = "dialogTitle";
        title.textContent = "Export as Text";
        vp.appendChild(title);

        const p1 = document.createElement("div");
        p1.textContent = "Text file for this layout is...";
        vp.appendChild(p1);

        this.textArea = document.createElement("textarea");
        this.textArea.style.width = "300px";
        this.textArea.style.height = "200px";
        this.textArea.value = s;
        vp.appendChild(this.textArea);

        const p2 = document.createElement("div");
        p2.style.width = "300px";
        p2.textContent = "To save this file select it all (eg click in text and type control-A) and copy to your clipboard (eg control-C) before pasting to an empty text file (eg on Windows Notepad) and saving as a new file.";
        vp.appendChild(p2);

        const hp = document.createElement("div");
        hp.className = "hpanel topSpace";
        vp.appendChild(hp);

        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.onclick = () => this.closeDialog();
        hp.appendChild(okButton);

        const importButton = document.createElement("button");
        importButton.textContent = "Re-Import";
        importButton.onclick = () => {
            this.sim.pushUndo();
            this.closeDialog();
            const s2 = this.textArea.value;
            if (s2 != null)
                this.sim.readImport(s2);
        };
        hp.appendChild(importButton);
    }

    show(): void {
        this.dialogEl.showModal();
    }

    closeDialog(): void {
        this.dialogEl.close();
        document.body.removeChild(this.dialogEl);
    }
}
