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

export class Checkbox {
    element: HTMLLabelElement;
    input: HTMLInputElement;

    constructor(s: string, checked: boolean = false) {
        this.element = document.createElement("label");
        this.input = document.createElement("input");
        this.input.type = "checkbox";
        this.input.checked = checked;
        this.element.appendChild(this.input);
        this.element.appendChild(document.createTextNode(s));
    }

    getState(): boolean {
        return this.input.checked;
    }

    setState(s: boolean): void {
        this.input.checked = s;
    }

    addClickHandler(fn: () => void): void {
        this.input.addEventListener("click", fn);
    }

    addValueChangeHandler(fn: () => void): void {
        this.input.addEventListener("change", fn);
    }
}
