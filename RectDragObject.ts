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

import { EMStatic } from "./EMStatic";
import { DragObject } from "./DragObject";
import { DragHandle } from "./DragHandle";
import { StringTokenizer } from "./StringTokenizer";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";

export abstract class RectDragObject extends DragObject {
    topLeft: DragHandle;
    topRight: DragHandle;
    bottomLeft: DragHandle;
    bottomRight: DragHandle;
    static FLAG_SQUARE = 1;

    static minXHandles = [true, false, false, true];
    static minYHandles = [true, true, false, false];

    constructor(st?: StringTokenizer) {
        super(st);
        if (st == null) {
            for (let i = 0; i !== 4; i++)
                this.handles.push(new DragHandle(this));
            this.topLeft = this.handles[0];
            this.topRight = this.handles[1];
            this.bottomRight = this.handles[2];
            this.bottomLeft = this.handles[3];
            this.setTransform();
        } else {
            this.topLeft = new DragHandle(this, st);
            this.bottomRight = new DragHandle(this, st);
            this.topRight = new DragHandle(this, this.bottomRight.x, this.topLeft.y);
            this.bottomLeft = new DragHandle(this, this.topLeft.x, this.bottomRight.y);
            this.handles.push(this.topLeft, this.topRight, this.bottomRight, this.bottomLeft);
            this.rotation = parseFloat(st.nextToken());
            this.setTransform();
        }
    }

    dump(): string {
        return super.dump() + " " + this.rotation;
    }

    hitTestInside(x: number, y: number): boolean {
        const origin = this.rotatedOrigin();
        x -= origin.x;
        y -= origin.y;
        return x >= 0 && x <= this.width() && y >= 0 && y <= this.height();
    }

    dragHandle(handle: DragHandle, x: number, y: number): boolean {
        let handleIndex = -1;
        for (let i = 0; i !== 4; i++) {
            if (this.handles[i] === handle) {
                handleIndex = i;
                break;
            }
        }
        if (handleIndex < 0)
            return false;

        const pt = new Point(x, y);
        const minXHandles = RectDragObject.minXHandles;
        const minYHandles = RectDragObject.minYHandles;

        for (let i = 0; i !== 4; i++) {
            const dh = this.handles[i];
            const hp = new Point(dh.x, dh.y);
            if (minXHandles[i] && !minXHandles[handleIndex] && pt.x <= hp.x) return false;
            if (!minXHandles[i] && minXHandles[handleIndex] && pt.x >= hp.x) return false;
            if (minYHandles[i] && !minYHandles[handleIndex] && pt.y <= hp.y) return false;
            if (!minYHandles[i] && minYHandles[handleIndex] && pt.y >= hp.y) return false;
        }

        for (let i = 0; i !== 4; i++) {
            const dh = this.handles[i];
            const hp = new Point(dh.x, dh.y);
            if (minXHandles[i] === minXHandles[handleIndex]) hp.x = pt.x;
            if (minYHandles[i] === minYHandles[handleIndex]) hp.y = pt.y;
            dh.x = hp.x;
            dh.y = hp.y;
        }

        if (this.mustBeSquare()) {
            const w = this.width();
            this.bottomLeft.y = this.topLeft.y + w;
            this.bottomRight.y = this.topRight.y + w;
        }

        return false;
    }

    mustBeSquare(): boolean { return (this.flags & RectDragObject.FLAG_SQUARE) !== 0; }

    hitTest(x: number, y: number): number {
        let result = 1e8;
        for (let i = 0; i !== 4; i++) {
            const dh1 = this.handles[i];
            const dh2 = this.handles[(i + 1) % 4];
            const d = DragObject.distanceToLineSegment(x, y, dh1.x, dh1.y, dh2.x, dh2.y);
            if (d < result) result = d;
        }
        return result;
    }

    canRotate(): boolean { return true; }

    width(): number { return this.topRight.x - this.topLeft.x; }
    height(): number { return this.bottomLeft.y - this.topLeft.y; }
    rotatedOrigin(): Point { return new Point(this.topLeft.x, this.topLeft.y); }

    setInitialPosition(): void {
        const start = this.sim.findSpace(this, 20, 20);
        this.topLeft.x = this.bottomLeft.x = start.x;
        this.topLeft.y = this.topRight.y = start.y;
        this.bottomRight.x = this.topRight.x = start.x + start.width;
        this.bottomRight.y = this.bottomLeft.y = start.y + start.height;
    }

    drawSelection(): void {
        EMStatic.drawWall(this.topLeft.x, this.topLeft.y, this.topRight.x, this.topRight.y, 0);
        EMStatic.drawWall(this.topLeft.x, this.topLeft.y, this.bottomLeft.x, this.bottomLeft.y, 0);
        EMStatic.drawWall(this.bottomRight.x, this.bottomRight.y, this.topRight.x, this.topRight.y, 0);
        EMStatic.drawWall(this.bottomLeft.x, this.bottomLeft.y, this.bottomRight.x, this.bottomRight.y, 0);
    }

    dumpHandles(): string {
        return " " + this.topLeft.x + " " + this.topLeft.y + " " + this.bottomRight.x + " " + this.bottomRight.y;
    }

    selectText(): string {
        return this.sim.getLengthText(this.width()) + " x " + this.sim.getLengthText(this.height());
    }
}
