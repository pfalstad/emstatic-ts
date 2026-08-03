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

export class AboutBox {
    dialogEl: HTMLDialogElement;

    constructor(version: string) {
        this.dialogEl = document.createElement("dialog");
        this.dialogEl.className = "aboutBox";
        document.body.appendChild(this.dialogEl);

        const vp = document.createElement("div");
        vp.style.width = "400px";
        vp.innerHTML =
            `<p>Electrostatics Simulator version ${version}.</p>` +
            `<p>Originally written in Java by Paul Falstad.<br><a href="http://www.falstad.com/" target="_blank">http://www.falstad.com/</a></p>` +
            `<p>Javascript/WebGL conversion by Paul Falstad, based on work by Iain Sharp and Erick Maldonado.  Thanks to Mikko Mononen and Eric Veach.</p>` +
            `<p style="font-size:9px">This program is free software: you can redistribute it and/or modify it ` +
            `under the terms of the GNU General Public License as published by ` +
            `the Free Software Foundation, either version 2 of the License, or ` +
            `(at your option) any later version.</p>` +
            `<p style="font-size:9px">This program is distributed in the hope that it will be useful,` +
            `but WITHOUT ANY WARRANTY; without even the implied warranty of ` +
            `MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the ` +
            `GNU General Public License for more details.</p>` +
            `<p style="font-size:9px">For details of licensing see <a href="http://www.gnu.org/licenses/" target="_blank">http://www.gnu.org/licenses/</a>.</p>` +
            `<p style="font-size:9px">Source code:<a href="https://github.com/pfalstad/emstatic-ts" target="_blank">https://github.com/pfalstad/emstatic-ts</a></p>`;
        this.dialogEl.appendChild(vp);

        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.onclick = () => this.close();
        vp.appendChild(okButton);

        this.dialogEl.showModal();
    }

    close(): void {
        this.dialogEl.close();
        document.body.removeChild(this.dialogEl);
    }
}
