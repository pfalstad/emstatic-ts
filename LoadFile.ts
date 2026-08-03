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

export class LoadFile {
    element: HTMLInputElement;
    sim: EMStatic;

    static isSupported(): boolean {
        return !!(window.File && window.FileReader);
    }

    constructor(sim: EMStatic) {
        this.sim = sim;
        this.element = document.createElement("input");
        this.element.type = "file";
        this.element.id = "LoadFileElement";
        this.element.className = "offScreen";
        this.element.addEventListener("change", () => this.doLoad());
    }

    click(): void {
        this.element.click();
    }

    doLoad(): void {
        const files = this.element.files;
        if (files && files.length >= 1 && files[0].size < 32000) {
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result as string;
                this.sim.pushUndo();
                this.sim.readImport(text);
                this.sim.createNewLoadFile();
            };
            reader.readAsText(files[0]);
        }
    }
}
