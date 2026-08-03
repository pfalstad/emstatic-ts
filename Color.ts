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

export class Color {
    private r: number;
    private g: number;
    private b: number;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    toInteger(): number {
        return (this.r << 16) | (this.g << 8) | this.b;
    }

    toString(): string {
        return `red=${this.r}, green=${this.g}, blue=${this.b}`;
    }

    static hex2Rgb(colorStr: string): Color {
        if (colorStr.length > 8) {
            return new Color(
                parseInt(colorStr.substring(3, 5), 16),
                parseInt(colorStr.substring(5, 7), 16),
                parseInt(colorStr.substring(7, 9), 16));
        }
        return new Color(
            parseInt(colorStr.substring(1, 3), 16),
            parseInt(colorStr.substring(3, 5), 16),
            parseInt(colorStr.substring(5, 7), 16));
    }
}
