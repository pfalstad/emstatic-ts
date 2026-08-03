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

import { DragObject } from "./DragObject";
import { RectDragObject } from "./RectDragObject";
import { RectHollowDragObject } from "./RectHollowDragObject";
import { StringTokenizer } from "./StringTokenizer";
import { renderer } from "./EMStatic";

export class HollowEllipse extends RectHollowDragObject {
    constructor(square?: boolean, st?: StringTokenizer) {
        super(st);
        if (st == null) {
            this.materialType = DragObject.MT_CONDUCTING;
            this.flags = square ? RectDragObject.FLAG_SQUARE : 0;
        }
    }

    static getEllipse(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): any {
        const minW = renderer.getMinFeatureWidth();
        if (x2 - x1 < minW) x2 = x1 + minW;
        if (y2 - y1 < minW) y2 = y1 + minW;
        if (x3 - x1 < minW) x3 = x1 + minW;
        if (x2 - x4 < minW) x4 = x2 - minW;
        if (y3 - y1 < minW) y3 = x1 + minW;
        if (y2 - y4 < minW) y4 = y2 - minW;

        const coords: number[] = [], coords2: number[] = [];
        let xr = Math.floor(x2 - x1) / 2;
        let yr = Math.floor(y2 - y1) / 2;
        let cx = Math.floor((x1 + x2) * .5);
        let cy = Math.floor((y1 + y2) * .5);
        for (let i = -xr; i <= xr; i++)
            coords.push(cx + i, cy - yr * Math.sqrt(1 - i * i / (xr * xr)));
        for (let i = -xr; i <= xr; i++)
            coords.push(cx - i, cy + yr * Math.sqrt(1 - i * i / (xr * xr)));
        xr = Math.floor(x4 - x3) / 2;
        yr = Math.floor(y4 - y3) / 2;
        cx = Math.floor((x3 + x4) * .5);
        cy = Math.floor((y3 + y4) * .5);
        for (let i = -xr; i <= xr; i++)
            coords2.push(cx - i, cy - yr * Math.sqrt(1 - i * i / (xr * xr)));
        for (let i = -xr; i <= xr; i++)
            coords2.push(cx + i, cy + yr * Math.sqrt(1 - i * i / (xr * xr)));
        return [coords, coords2];
    }

    getBoundary(): any {
        const itl = this.handles[4];
        const ibr = this.handles[6];
        return HollowEllipse.getEllipse(this.topLeft.x, this.topLeft.y, this.bottomRight.x, this.bottomRight.y, itl.x, itl.y, ibr.x, ibr.y);
    }

    getDumpType(): number { return 'E'.charCodeAt(0); }
}
