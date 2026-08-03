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
import { StringTokenizer } from "./StringTokenizer";
import { renderer } from "./EMStatic";

export class Box extends RectDragObject {
    constructor(st?: StringTokenizer) {
        super(st);
        if (st == null)
            this.materialType = DragObject.MT_CONDUCTING;
    }

    static getBox(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): any {
        const minW = renderer.getMinFeatureWidth();
        if (x2 - x1 < minW) { x2 = x1 + minW; x4 = x2; }
        if (y3 - y1 < minW) { y3 = y1 + minW; y4 = y3; }
        const medCoords = [x1, y1, x2, y2, x4, y4, x3, y3];
        return [medCoords];
    }

    getBoundary(): any {
        this.loadTransform();
        return Box.getBox(this.topLeft.x, this.topLeft.y, this.topRight.x, this.topRight.y,
            this.bottomLeft.x, this.bottomLeft.y, this.bottomRight.x, this.bottomRight.y);
    }

    getDumpType(): number { return 'b'.charCodeAt(0); }
}
