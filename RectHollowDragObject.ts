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
import { RectDragObject } from "./RectDragObject";
import { StringTokenizer } from "./StringTokenizer";
import { Point } from "./Point";

export abstract class RectHollowDragObject extends DragObject {
    topLeft: DragHandle;
    topRight: DragHandle;
    bottomLeft: DragHandle;
    bottomRight: DragHandle;

    static minXHandles = [true, false, false, true];
    static minYHandles = [true, true, false, false];

    constructor(st?: StringTokenizer) {
        super(st);
        if (st == null) {
            for (let i = 0; i !== 8; i++)
                this.handles.push(new DragHandle(this));
            this.topLeft = this.handles[0];
            this.topRight = this.handles[1];
            this.bottomRight = this.handles[2];
            this.bottomLeft = this.handles[3];
            this.setTransform();
        } else {
            const dh0 = new DragHandle(this, st);
            const dh1 = new DragHandle(this, st);
            const dh2 = new DragHandle(this, st);
            const dh3 = new DragHandle(this, st);
            this.handles.push(dh0, dh1, dh2, dh3);
            this.topLeft = dh0;
            this.bottomRight = dh1;
            const h2 = dh2;
            const h3 = dh3;

            this.topRight = new DragHandle(this, this.bottomRight.x, this.topLeft.y);
            this.bottomLeft = new DragHandle(this, this.topLeft.x, this.bottomRight.y);
            this.handles.splice(1, 0, this.topRight);
            this.handles.splice(3, 0, this.bottomLeft);
            this.handles.splice(5, 0, new DragHandle(this, h3.x, h2.y));
            this.handles.splice(7, 0, new DragHandle(this, h2.x, h3.y));
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
        for (let i = 0; i !== 8; i++) {
            if (this.handles[i] === handle) {
                handleIndex = i;
                break;
            }
        }
        if (handleIndex < 0)
            return false;

        const pt = new Point(x, y);
        const base = handleIndex >= 4 ? 4 : 0;
        const baseIndex = handleIndex - base;
        let dx = x - this.handles[handleIndex].x;
        let dy = y - this.handles[handleIndex].y;
        if (this.mustBeSquare()) {
            dy = (handleIndex % 2 === 1) ? -dx : dx;
            pt.y = this.handles[handleIndex].y + dy;
        }

        const minXHandles = RectHollowDragObject.minXHandles;
        const minYHandles = RectHollowDragObject.minYHandles;

        for (let i = 0; i !== 4; i++) {
            const dh = this.handles[i + base];
            const hp = new Point(dh.x, dh.y);
            if (minXHandles[i] && !minXHandles[baseIndex] && pt.x <= hp.x) return false;
            if (!minXHandles[i] && minXHandles[baseIndex] && pt.x >= hp.x) return false;
            if (minYHandles[i] && !minYHandles[baseIndex] && pt.y <= hp.y) return false;
            if (!minYHandles[i] && minYHandles[baseIndex] && pt.y >= hp.y) return false;
        }

        if (handleIndex >= 4) {
            if (pt.x < this.topLeft.x || pt.y < this.topLeft.y || pt.x > this.bottomRight.x || pt.y > this.bottomRight.y)
                return false;
        }

        for (let i = base; i !== 8; i++) {
            const dh = this.handles[i];
            const hp = new Point(dh.x, dh.y);
            if (minXHandles[i % 4] === minXHandles[baseIndex]) hp.x += dx;
            if (minYHandles[i % 4] === minYHandles[baseIndex]) hp.y += dy;
            dh.x = hp.x;
            dh.y = hp.y;
        }

        return false;
    }

    mustBeSquare(): boolean { return (this.flags & RectDragObject.FLAG_SQUARE) !== 0; }

    hitTest(x: number, y: number): number {
        let result = 1e8;
        for (let i = 0; i !== 8; i++) {
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
        const start = this.sim.findSpace(this, 50, 50);
        this.topLeft.x = this.bottomLeft.x = start.x;
        this.topLeft.y = this.topRight.y = start.y;
        this.bottomRight.x = this.topRight.x = start.x + start.width;
        this.bottomRight.y = this.bottomLeft.y = start.y + start.height;
        const mg = 6;
        let dh = this.handles[4];
        dh.x = start.x + mg;
        dh.y = start.y + mg;
        dh = this.handles[5];
        dh.x = start.x + start.width - mg;
        dh.y = start.y + mg;
        dh = this.handles[6];
        dh.x = start.x + start.width - mg;
        dh.y = start.y + start.height - mg;
        dh = this.handles[7];
        dh.x = start.x + mg;
        dh.y = start.y + start.height - mg;
    }

    drawSelection(): void {
        EMStatic.drawWall(this.topLeft.x, this.topLeft.y, this.topRight.x, this.topRight.y, 0);
        EMStatic.drawWall(this.topLeft.x, this.topLeft.y, this.bottomLeft.x, this.bottomLeft.y, 0);
        EMStatic.drawWall(this.bottomRight.x, this.bottomRight.y, this.topRight.x, this.topRight.y, 0);
        EMStatic.drawWall(this.bottomLeft.x, this.bottomLeft.y, this.bottomRight.x, this.bottomRight.y, 0);
    }

    dumpHandles(): string {
        let out = "";
        for (let i = 0; i < this.handles.length; i += 2) {
            const dh = this.handles[i];
            out += " " + dh.x + " " + dh.y;
        }
        return out;
    }

    selectText(): string {
        return this.sim.getLengthText(this.width()) + " x " + this.sim.getLengthText(this.height());
    }
}
