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

import { EMStatic, renderer } from "./EMStatic";
import { DragObject } from "./DragObject";
import { DragHandle } from "./DragHandle";
import { StringTokenizer } from "./StringTokenizer";
import { EditInfo } from "./EditInfo";

export class Charge extends DragObject {
    charge: number;
    chargeSize = 8;

    constructor(st?: StringTokenizer, ct?: number) {
        super(st);
        if (st == null) {
            this.handles.push(new DragHandle(this));
            this.charge = 1e-9;
            this.setTransform();
        } else {
            let count = ct ?? 0;
            while (count-- > 0)
                this.handles.push(new DragHandle(this, st));
            this.charge = parseFloat(st.nextToken());
            this.setTransform();
        }
    }

    dump(): string {
        return super.dump() + " " + this.charge;
    }

    writeCharge(): void {
        const dh = this.handles[0];
        renderer.writeCharge(dh.x, dh.y, this.charge * this.sim.gridSizeX * this.sim.gridSizeX / EMStatic.e0);
    }

    display(): void {
        this.chargeSize = 8 * this.sim.windowWidth / 256;
        const dh = this.handles[0];
        renderer.drawChargeObject(dh.x, dh.y, this.chargeSize, this.charge);
    }

    hitTest(x: number, y: number): number {
        const dh = this.handles[0];
        return Math.hypot(x - dh.x, y - dh.y) - this.chargeSize;
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0)
            return new EditInfo("Charge (C)", this.charge);
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0)
            this.charge = ei.value;
    }

    selectText(): string {
        return "q = " + this.sim.getUnitText(this.charge, "C");
    }

    getDumpType(): number { return 'c'.charCodeAt(0); }

    drawFieldLines(): void {
        const dh = this.handles[0];
        for (let i = 0; i !== 16; i++) {
            const ang = Math.PI * i / 8;
            this.sim.drawFieldLine(dh.x + this.chargeSize * Math.cos(ang), dh.y + this.chargeSize * Math.sin(ang), this.charge > 0 ? -1 : 1);
        }
    }
}
