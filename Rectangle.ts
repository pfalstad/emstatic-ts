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

export class Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    toString(): string {
        return `Rect(${this.x},${this.y},${this.width},${this.height})`;
    }

    equals(other: unknown): boolean {
        if (other instanceof Rectangle)
            return this.x === other.x && this.y === other.y &&
                this.width === other.width && this.height === other.height;
        return false;
    }
}
