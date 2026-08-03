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

export class Point {
    x: number;
    y: number;

    constructor();
    constructor(x: number, y: number);
    constructor(p: Point);
    constructor(arg0?: number | Point, arg1?: number) {
        if (arg0 === undefined) {
            this.x = 0;
            this.y = 0;
        } else if (arg0 instanceof Point) {
            this.x = arg0.x;
            this.y = arg0.y;
        } else {
            this.x = arg0;
            this.y = arg1 as number;
        }
    }

    setLocation(p: Point): void {
        this.x = p.x;
        this.y = p.y;
    }

    equals(other: unknown): boolean {
        if (other instanceof Point)
            return this.x === other.x && this.y === other.y;
        return false;
    }

    toString(): string {
        return `Point(${this.x},${this.y})`;
    }
}
