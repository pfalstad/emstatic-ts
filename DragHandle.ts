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

import type { DragObject } from "./DragObject";
import type { StringTokenizer } from "./StringTokenizer";

export class DragHandle {
    x: number = 0;
    y: number = 0;
    parent: DragObject;
    hidden = false;

    constructor(par: DragObject, xOrSt?: number | StringTokenizer, y?: number) {
        this.parent = par;
        if (typeof xOrSt === "number") {
            this.x = xOrSt;
            this.y = y as number;
        } else if (xOrSt != null) {
            this.x = parseInt(xOrSt.nextToken());
            this.y = parseInt(xOrSt.nextToken());
        }
    }

    toString(): string {
        return `DragHandle(${this.x},${this.y})`;
    }

    dragTo(xd: number, yd: number): boolean {
        if (this.parent.dragHandle(this, xd, yd)) {
            this.x = xd;
            this.y = yd;
            this.parent.setTransform();
            return true;
        }
        return false;
    }

    rescale(scale: number): void {
        this.x = Math.round(this.x * scale);
        this.y = Math.round(this.y * scale);
    }
}
