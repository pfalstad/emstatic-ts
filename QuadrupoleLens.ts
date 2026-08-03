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
import { EditInfo } from "./EditInfo";

export class QuadrupoleLens extends RectDragObject {
    constructor(st?: StringTokenizer) {
        super(st);
        if (st == null)
            this.materialType = DragObject.MT_CONDUCTING;
    }

    static getLensPiece(cx: number, cy: number, xr: number, yr: number, dirx: number, diry: number): number[] {
        const coords: number[] = [];
        xr = Math.max(xr, renderer.getMinFeatureWidth());
        yr = Math.max(yr, renderer.getMinFeatureWidth());
        const h = yr * .4;
        for (let i = -xr; i <= xr; i++) {
            const yd = Math.sqrt(i * i + h * h);
            if (yd > yr)
                continue;
            coords.push(cx + i * dirx + yd * diry, cy + yd * dirx + i * diry);
        }
        return coords;
    }

    static writeLensPieces(arr1: number[], arr2: number[], flip: boolean): void {
        if (flip)
            renderer.potential = -renderer.potential;
        renderer.writeShape([arr1, arr2]);
    }

    writeMaterials(): void {
        const cx = (this.topLeft.x + this.topRight.x) / 2;
        const cy = (this.topLeft.y + this.bottomLeft.y) / 2;
        const xr = (this.topRight.x - this.topLeft.x) / 2;
        const yr = (this.bottomLeft.y - this.topLeft.y) / 2;
        const arr1 = QuadrupoleLens.getLensPiece(cx, cy, xr, yr, 1, 0);
        const arr2 = QuadrupoleLens.getLensPiece(cx, cy, xr, yr, -1, 0);
        const arr3 = QuadrupoleLens.getLensPiece(cx, cy, xr, yr, 0, 1);
        const arr4 = QuadrupoleLens.getLensPiece(cx, cy, xr, yr, 0, -1);
        QuadrupoleLens.writeLensPieces(arr1, arr2, false);
        QuadrupoleLens.writeLensPieces(arr3, arr4, true);
    }

    drawFieldLinesShape(bound: any): void {
        renderer.drawFieldLinesShape([bound[0]]);
        renderer.drawFieldLinesShape([bound[1]]);
        renderer.drawFieldLinesShape([bound[2]]);
        renderer.drawFieldLinesShape([bound[3]]);
    }

    getBoundary(): any {
        this.loadTransform();
        const cx = (this.topLeft.x + this.topRight.x) / 2;
        const cy = (this.topLeft.y + this.bottomLeft.y) / 2;
        const xr = (this.topRight.x - this.topLeft.x) / 2;
        const yr = (this.bottomLeft.y - this.topLeft.y) / 2;
        const arr1 = QuadrupoleLens.getLensPiece(cx, cy, xr, yr, 1, 0);
        const arr2 = QuadrupoleLens.getLensPiece(cx, cy, xr, yr, -1, 0);
        const arr3 = QuadrupoleLens.getLensPiece(cx, cy, xr, yr, 0, 1);
        const arr4 = QuadrupoleLens.getLensPiece(cx, cy, xr, yr, 0, -1);
        return [arr1, arr2, arr3, arr4];
    }

    hitTestInside(_x: number, _y: number): boolean { return false; }

    drawSelection(): void {
        const a = (this.topRight.x - this.topLeft.x) / 2;
        const b = (this.bottomRight.y - this.topRight.y) / 2;
        let fc = Math.trunc(Math.sqrt(Math.abs(a * a - b * b)));
        let fd = fc;
        if (a > b) fd = 0; else fc = 0;
        renderer.drawFocus((this.topLeft.x + this.topRight.x) / 2 - fc, (this.topLeft.y + this.bottomLeft.y) / 2 - fd);
        renderer.drawFocus((this.topLeft.x + this.topRight.x) / 2 + fc, (this.topLeft.y + this.bottomLeft.y) / 2 + fd);
    }

    mustBeSquare(): boolean { return true; }

    getDumpType(): number { return 'q'.charCodeAt(0); }

    getEditInfo(n: number): EditInfo | null {
        return super.getEditInfo(n + 1);
    }

    setEditValue(n: number, ei: EditInfo): void {
        super.setEditValue(n + 1, ei);
    }
}
