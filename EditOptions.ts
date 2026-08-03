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
import { EditDialog } from "./EditDialog";

export class EditOptions implements Editable {
    sim: EMStatic;
    offsetEditInfo: EditInfo | null = null;

    constructor(s: EMStatic) {
        this.sim = s;
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0)
            return new EditInfo("Grid size (including offscreen)", this.sim.gridSizeX).setDimensionless();
        if (n === 1) {
            this.offsetEditInfo = new EditInfo("Offscreen boundary width", this.sim.windowOffsetX).setDimensionless();
            return this.offsetEditInfo;
        }
        if (n === 2)
            return new EditInfo("Screen width scale (m)", this.sim.lengthScale * this.sim.windowWidth);
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && ei.value > 0) {
            this.sim.setResolution(ei.value);
            this.offsetEditInfo!.value = this.sim.windowOffsetX;
            EditDialog.theEditDialog!.updateValue(this.offsetEditInfo!);
        }
        if (n === 1 && ei.value > 0)
            this.sim.setResolution(this.sim.gridSizeX, ei.value);
        if (n === 2)
            this.sim.lengthScale = ei.value / this.sim.windowWidth;
    }
}
