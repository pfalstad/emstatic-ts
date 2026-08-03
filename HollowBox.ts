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
import { RectHollowDragObject } from "./RectHollowDragObject";
import { StringTokenizer } from "./StringTokenizer";
import { renderer } from "./EMStatic";

export class HollowBox extends RectHollowDragObject {
    constructor(st?: StringTokenizer) {
        super(st);
        if (st == null)
            this.materialType = DragObject.MT_CONDUCTING;
    }

    static getBox(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): any {
        const minW = renderer.getMinFeatureWidth();
        if (x2 - x1 < minW) x2 = x1 + minW;
        if (y2 - y1 < minW) y2 = y1 + minW;
        if (x1 !== x3 && x3 - x1 < minW) x3 = x1 + minW;
        if (x2 !== x4 && x2 - x4 < minW) x4 = x2 - minW;
        if (y1 !== y3 && y3 - y1 < minW) y3 = y1 + minW;
        if (y2 !== y4 && y2 - y4 < minW) y4 = y2 - minW;
        const medCoords: number[][] = [[x1, y1, x2, y1, x2, y2, x1, y2]];
        if (!(x4 < x3 || y4 < y3))
            medCoords.push([x3, y3, x3, y4, x4, y4, x4, y3]);
        return medCoords;
    }

    getBoundary(): any {
        this.loadTransform();
        const itl = this.handles[4];
        const ibr = this.handles[6];
        return HollowBox.getBox(this.topLeft.x, this.topLeft.y, this.bottomRight.x, this.bottomRight.y, itl.x, itl.y, ibr.x, ibr.y);
    }

    getDumpType(): number { return 'B'.charCodeAt(0); }
}
