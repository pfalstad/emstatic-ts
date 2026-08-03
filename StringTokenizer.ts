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

export class StringTokenizer {
    private pos = 0;
    private readonly str: string;
    private readonly len: number;
    private delim: string;

    constructor(str: string, delim: string = " \t\n\r\f") {
        this.str = str;
        this.len = str.length;
        this.delim = delim;
    }

    hasMoreTokens(): boolean {
        while (this.pos < this.len && this.delim.indexOf(this.str.charAt(this.pos)) >= 0)
            this.pos++;
        return this.pos < this.len;
    }

    nextToken(): string {
        if (this.pos < this.len && this.delim.indexOf(this.str.charAt(this.pos)) >= 0) {
            while (++this.pos < this.len && this.delim.indexOf(this.str.charAt(this.pos)) >= 0)
                ;
        }
        if (this.pos < this.len) {
            const start = this.pos;
            while (++this.pos < this.len && this.delim.indexOf(this.str.charAt(this.pos)) < 0)
                ;
            return this.str.substring(start, this.pos);
        }
        throw new Error("no more tokens");
    }
}
