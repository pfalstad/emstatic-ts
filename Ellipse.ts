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

export class Ellipse extends RectDragObject {
    constructor(square?: boolean, st?: StringTokenizer) {
        super(st);
        if (st == null) {
            this.materialType = DragObject.MT_CONDUCTING;
            this.flags = square ? RectDragObject.FLAG_SQUARE : 0;
        }
    }

    static getSolidEllipse(cx: number, cy: number, xr: number, yr: number, _type: number): any {
        const coords: number[] = [];
        xr = Math.max(xr, renderer.getMinFeatureWidth());
        yr = Math.max(yr, renderer.getMinFeatureWidth());
        for (let i = -xr; i <= xr; i++)
            coords.push(cx + i, cy - yr * Math.sqrt(1 - i * i / (xr * xr)));
        for (let i = -xr; i <= xr; i++)
            coords.push(cx - i, cy + yr * Math.sqrt(1 - i * i / (xr * xr)));
        return [coords];
    }

    getBoundary(): any {
        this.loadTransform();
        return Ellipse.getSolidEllipse(
            (this.topLeft.x + this.topRight.x) / 2, (this.topLeft.y + this.bottomLeft.y) / 2,
            (this.topRight.x - this.topLeft.x) / 2, (this.bottomLeft.y - this.topLeft.y) / 2, DragObject.DO_DRAW);
    }

    hitTest(x: number, y: number): number {
        x -= (this.topLeft.x + this.topRight.x) / 2;
        y -= (this.topLeft.y + this.bottomLeft.y) / 2;
        const a = (this.topRight.x - this.topLeft.x) / 2;
        const b = (this.bottomLeft.y - this.topLeft.y) / 2;
        return Math.abs(Math.sqrt(x * x / (a * a) + y * y / (b * b)) - 1) * a;
    }

    drawSelection(): void {
        const a = (this.topRight.x - this.topLeft.x) / 2;
        const b = (this.bottomRight.y - this.topRight.y) / 2;
        let fc = Math.trunc(Math.sqrt(Math.abs(a * a - b * b)));
        let fd = fc;
        if (a > b) fd = 0; else fc = 0;
        renderer.drawFocus((this.topLeft.x + this.topRight.x) / 2 - fc, (this.topLeft.y + this.bottomLeft.y) / 2 - fd);
        renderer.drawFocus((this.topLeft.x + this.topRight.x) / 2 + fc, (this.topLeft.y + this.bottomLeft.y) / 2 + fd);
    }

    getDumpType(): number { return 'e'.charCodeAt(0); }
}
