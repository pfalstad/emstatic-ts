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

export class ExportAsUrlDialog {
    dialogEl: HTMLDialogElement;

    constructor(dump: string) {
        const start = window.location.href.split("?");
        const query = "?rol=" + encodeURIComponent(dump.replace(/ /g, "+"));
        const url = start[0] + query;

        this.dialogEl = document.createElement("dialog");
        this.dialogEl.className = "exportDialog";
        document.body.appendChild(this.dialogEl);

        const vp = document.createElement("div");
        this.dialogEl.appendChild(vp);

        const title = document.createElement("div");
        title.className = "dialogTitle";
        title.textContent = "Export as URL";
        vp.appendChild(title);

        const p1 = document.createElement("div");
        p1.textContent = "URL for this layout is...";
        vp.appendChild(p1);

        if (url.length > 2000) {
            const warn = document.createElement("div");
            warn.style.width = "300px";
            warn.textContent = "Warning: this URL is longer than 2000 characters and may not work in some browsers.";
            vp.appendChild(warn);
        }

        const ta = document.createElement("textarea");
        ta.style.width = "300px";
        ta.style.height = "150px";
        ta.value = url;
        vp.appendChild(ta);

        const p2 = document.createElement("div");
        p2.style.width = "300px";
        p2.textContent = "To save this URL select it all (eg click in text and type control-A) and copy to your clipboard (eg control-C) before pasting to a suitable place.";
        vp.appendChild(p2);

        const hp = document.createElement("div");
        hp.className = "hpanel topSpace";
        vp.appendChild(hp);

        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.onclick = () => this.closeDialog();
        hp.appendChild(okButton);
    }

    show(): void {
        this.dialogEl.showModal();
    }

    closeDialog(): void {
        this.dialogEl.close();
        document.body.removeChild(this.dialogEl);
    }
}
