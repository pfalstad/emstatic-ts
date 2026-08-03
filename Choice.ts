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

export class Choice {
    element: HTMLSelectElement;

    constructor() {
        this.element = document.createElement("select");
    }

    add(s: string): void {
        const opt = document.createElement("option");
        opt.text = s;
        this.element.add(opt);
    }

    select(i: number): void {
        this.element.selectedIndex = i;
    }

    setSelectedIndex(i: number): void {
        this.element.selectedIndex = i;
    }

    getSelectedIndex(): number {
        return this.element.selectedIndex;
    }

    getItemCount(): number {
        return this.element.options.length;
    }

    addChangeHandler(fn: () => void): void {
        this.element.addEventListener("change", fn);
    }

    addStyleName(s: string): void {
        this.element.classList.add(s);
    }
}
