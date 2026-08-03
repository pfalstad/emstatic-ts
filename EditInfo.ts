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

import { Choice } from "./Choice";
import { Checkbox } from "./Checkbox";

export interface Editable {
    getEditInfo(n: number): EditInfo | null;
    setEditValue(n: number, ei: EditInfo): void;
}

export class EditInfo {
    name: string;
    text: string | null = null;
    value: number;
    textf: HTMLInputElement | null = null;
    choice: Choice | null = null;
    checkbox: Checkbox | null = null;
    button: HTMLButtonElement | null = null;
    textArea: HTMLTextAreaElement | null = null;

    newDialog = false;
    forceLargeM = false;
    dimensionless = false;

    constructor(n: string, val: number) {
        this.name = n;
        this.value = val;
    }

    setDimensionless(): EditInfo {
        this.dimensionless = true;
        return this;
    }
}
