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
import { Box } from "./Box";
import { EditInfo } from "./EditInfo";

export class Wall extends DragObject {
    wallLen = 0;

    constructor(st?: StringTokenizer, x1?: number, y1?: number, x2?: number, y2?: number) {
        super(st);
        if (st == null) {
            if (x1 != null) {
                this.handles.push(new DragHandle(this, x1, y1!));
                this.handles.push(new DragHandle(this, x2!, y2!));
            } else {
                this.handles.push(new DragHandle(this));
                this.handles.push(new DragHandle(this));
            }
            this.setTransform();
            this.materialType = DragObject.MT_CONDUCTING;
        } else {
            this.handles.push(new DragHandle(this, st));
            this.handles.push(new DragHandle(this, st));
            this.setTransform();
        }
    }

    setWallTransform(): void {
        this.wallLen = Math.hypot(this.handles[0].x - this.handles[1].x, this.handles[0].y - this.handles[1].y);
        const cx = (this.handles[0].x + this.handles[1].x) / 2;
        const cy = (this.handles[0].y + this.handles[1].y) / 2;
        const xf0 = (this.handles[0].y - cy) * 2 / this.wallLen;
        const xf1 = (this.handles[0].x - cx) * 2 / this.wallLen;
        EMStatic.setTransform(xf0, xf1, cx, -xf1, xf0, cy);
    }

    getBoundary(): any {
        this.setWallTransform();
        const len2 = Math.trunc(this.wallLen / 2);
        return Box.getBox(-2, -len2, 2, -len2, -2, len2, 2, len2);
    }

    getEditInfo(n: number): EditInfo | null {
        return super.getEditInfo(n + 1);
    }

    setEditValue(n: number, ei: EditInfo): void {
        super.setEditValue(n + 1, ei);
    }

    getDumpType(): number { return 'w'.charCodeAt(0); }
}
