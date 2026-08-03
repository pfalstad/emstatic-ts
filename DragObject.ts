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

import { EMStatic, renderer } from "./EMStatic";
import { DragHandle } from "./DragHandle";
import { StringTokenizer } from "./StringTokenizer";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";
import type { Editable } from "./EditInfo";
import { EditInfo } from "./EditInfo";
import { Choice } from "./Choice";

export abstract class DragObject implements Editable {
    handles: DragHandle[] = [];
    selected = false;
    sim: EMStatic;
    rotation = 0;
    transform: number[] | null = null;
    invTransform: number[] | null = null;
    centerX = 0;
    centerY = 0;
    conductorCharge = 0;
    chargeDensity = 0;
    potential = 0;
    permittivity = 0;
    totalChargeFloating = 0;
    materialType = 0;
    flags = 0;

    static MT_OTHER = 0;
    static MT_CHARGED = 1;
    static MT_CONDUCTING = 2;
    static MT_DIELECTRIC = 3;
    static MT_FLOATING = 4;
    static DO_DRAW = 0;
    static DO_DRAW_CHARGE = 1;
    static DO_CALC_CHARGE = 2;
    static currentFloatingConductor: DragObject | null = null;

    constructor(st?: StringTokenizer) {
        this.sim = EMStatic.theSim!;
        this.sim.recalcAndRepaint();
        if (st != null) {
            this.flags = parseInt(st.nextToken());
            this.materialType = parseInt(st.nextToken());
            if (this.materialType === DragObject.MT_CHARGED)
                this.chargeDensity = parseFloat(st.nextToken());
            else if (this.materialType === DragObject.MT_CONDUCTING)
                this.potential = parseFloat(st.nextToken());
            else if (this.materialType === DragObject.MT_DIELECTRIC)
                this.permittivity = parseFloat(st.nextToken());
            else if (this.materialType === DragObject.MT_FLOATING)
                this.totalChargeFloating = parseFloat(st.nextToken());
        } else {
            this.setTransform();
        }
    }

    prepare(): void {}
    setSelected(s: boolean): void { this.selected = s; }
    isSelected(): boolean { return this.selected; }
    delete(): void {}

    setTransform(): void {
        if (this.transform == null) {
            this.transform = new Array(6).fill(0);
            this.invTransform = new Array(6).fill(0);
        }
        let cx = 0, cy = 0;
        for (const dh of this.handles) {
            cx += dh.x;
            cy += dh.y;
        }
        cx /= this.handles.length;
        cy /= this.handles.length;
        this.centerX = cx;
        this.centerY = cy;

        const t = this.transform!;
        t[0] = t[4] = Math.cos(this.rotation);
        t[1] = Math.sin(this.rotation);
        t[3] = -t[1];
        t[2] = (1 - t[0]) * cx - t[1] * cy;
        t[5] = -t[3] * cx + (1 - t[4]) * cy;

        const it = this.invTransform!;
        it[0] = it[4] = t[0];
        it[1] = t[3];
        it[3] = t[1];
        it[2] = (1 - t[0]) * cx + t[1] * cy;
        it[5] = t[3] * cx + (1 - t[4]) * cy;
    }

    drag(dx: number, dy: number): boolean {
        for (const dh of this.handles) {
            dh.x += dx;
            dh.y += dy;
        }
        this.setTransform();
        return true;
    }

    display(): void {
        if (this.selected) {
            const t = this.transform!;
            for (const dh of this.handles) {
                const x = Math.round(dh.x * t[0] + dh.y * t[1] + t[2]);
                const y = Math.round(dh.x * t[3] + dh.y * t[4] + t[5]);
                EMStatic.drawHandle(x, y);
            }
        }
    }

    transformPoint(p: Point): Point {
        const t = this.transform!;
        const x = Math.round(p.x * t[0] + p.y * t[1] + t[2]);
        const y = Math.round(p.x * t[3] + p.y * t[4] + t[5]);
        return new Point(x, y);
    }

    inverseTransformPoint(p: Point): Point {
        const it = this.invTransform!;
        const x = Math.round(p.x * it[0] + p.y * it[1] + it[2]);
        const y = Math.round(p.x * it[3] + p.y * it[4] + it[5]);
        return new Point(x, y);
    }

    drawSelection(): void {}

    rotate(ang: number): void {
        this.rotation += ang;
        this.setTransform();
        this.sim.recalcAndRepaint();
    }

    rotateTo(x: number, y: number): void {
        this.rotation = Math.atan2(-y + this.centerY, x - this.centerX) - Math.PI / 2;
        const step = Math.PI / 12;
        this.rotation = Math.round(this.rotation / step) * step;
        this.setTransform();
        this.sim.recalcAndRepaint();
    }

    canRotate(): boolean { return false; }

    static hypotf(x: number, y: number): number {
        return Math.sqrt(x * x + y * y);
    }

    static distanceToLineSegment(x: number, y: number, lx1: number, ly1: number, lx2: number, ly2: number): number {
        x -= lx1;
        y -= ly1;
        lx2 -= lx1;
        ly2 -= ly1;
        const lr = DragObject.hypotf(lx2, ly2);
        const proj1 = (x * lx2 + y * ly2) / (lr * lr);
        if (proj1 < 0)
            return DragObject.hypotf(x, y);
        if (proj1 > 1) {
            x -= lx2;
            y -= ly2;
            return DragObject.hypotf(x, y);
        }
        const proj2 = x * ly2 - y * lx2;
        return Math.abs(proj2) / lr;
    }

    distanceToLineSegment(x: number, y: number, lx1: number, ly1: number, lx2: number, ly2: number): number {
        return DragObject.distanceToLineSegment(x, y, lx1, ly1, lx2, ly2);
    }

    hitTestInside(_x: number, _y: number): boolean { return false; }

    hitTest(x: number, y: number): number {
        if (this.handles.length === 1) {
            const dh = this.handles[0];
            return DragObject.hypotf(dh.x - x, dh.y - y);
        }
        const dh1 = this.handles[0];
        const dh2 = this.handles[1];
        return DragObject.distanceToLineSegment(x, y, dh1.x, dh1.y, dh2.x, dh2.y);
    }

    dragHandle(_dh: DragHandle, _x: number, _y: number): boolean {
        this.sim.recalcAndRepaint();
        return true;
    }

    setInitialPosition(): void {
        if (this.handles.length === 1) {
            const start = this.sim.findSpace(this, 0, 0);
            const dh = this.handles[0];
            dh.x = start.x;
            dh.y = start.y;
        }
        if (this.handles.length === 2) {
            const start = this.sim.findSpace(this, 40, 0);
            const dh1 = this.handles[0];
            const dh2 = this.handles[1];
            dh1.x = start.x;
            dh1.y = start.y;
            dh2.x = start.x + start.width;
            dh2.y = start.y;
        }
    }

    boundingBox(): Rectangle {
        let minx = 10000, miny = 10000, maxx = -10000, maxy = -10000;
        for (const dh of this.handles) {
            const p = this.transformPoint(new Point(dh.x, dh.y));
            if (p.x < minx) minx = p.x;
            if (p.y < miny) miny = p.y;
            if (p.x > maxx) maxx = p.x;
            if (p.y > maxy) maxy = p.y;
        }
        return new Rectangle(minx, miny, maxx - minx, maxy - miny);
    }

    abstract getDumpType(): number;

    dump(): string {
        const t = this.getDumpType();
        let out: string;
        if (t >= 200)
            out = t + " " + this.flags;
        else
            out = String.fromCharCode(t) + " " + this.flags;
        out += " " + this.materialType;
        if (this.materialType === DragObject.MT_CONDUCTING)
            out += " " + this.potential;
        else if (this.materialType === DragObject.MT_DIELECTRIC)
            out += " " + this.permittivity;
        else if (this.materialType === DragObject.MT_CHARGED)
            out += " " + this.chargeDensity;
        else if (this.materialType === DragObject.MT_FLOATING)
            out += " " + this.totalChargeFloating;
        out += this.dumpHandles();
        return out;
    }

    dumpHandles(): string {
        let out = "";
        for (const dh of this.handles)
            out += " " + dh.x + " " + dh.y;
        return out;
    }

    getEditInfo(n: number): EditInfo | null {
        if (n === 0 && this.materialType !== DragObject.MT_OTHER) {
            const ei = new EditInfo("Type", 0);
            ei.choice = new Choice();
            ei.choice.add("Charged");
            ei.choice.add("Conducting");
            ei.choice.add("Dielectric");
            ei.choice.add("Floating");
            ei.choice.setSelectedIndex(this.materialType - DragObject.MT_CHARGED);
            if (this.permittivity < 1)
                this.permittivity = 2;
            return ei;
        }
        if (n === 1 && this.materialType === DragObject.MT_CHARGED)
            return new EditInfo("Charge Density (C/m^2)", this.chargeDensity);
        if (n === 1 && this.materialType === DragObject.MT_DIELECTRIC)
            return new EditInfo("Relative Permittivity", this.permittivity);
        if (n === 1 && this.materialType === DragObject.MT_CONDUCTING)
            return new EditInfo("Potential (V)", this.potential);
        return null;
    }

    setEditValue(n: number, ei: EditInfo): void {
        if (n === 0 && this.materialType !== DragObject.MT_OTHER) {
            const type = ei.choice!.getSelectedIndex() + DragObject.MT_CHARGED;
            if (type === DragObject.MT_FLOATING && !this.sim.canMakeFloating(this)) {
                alert("Multiple floating conductors isn't supported.");
                ei.choice!.select(1);
                return;
            }
            this.materialType = type;
            ei.newDialog = true;
            return;
        }
        if (n === 1) {
            if (this.materialType === DragObject.MT_CHARGED)
                this.chargeDensity = ei.value;
            else if (this.materialType === DragObject.MT_DIELECTRIC)
                this.permittivity = ei.value;
            else if (this.materialType === DragObject.MT_CONDUCTING)
                this.potential = ei.value;
        }
    }

    writeCharge(): void {
        if (this.materialType === DragObject.MT_CHARGED) {
            DragObject.useMaterialType(DragObject.MT_CHARGED, 0,
                this.chargeDensity * this.sim.gridSizeX * this.sim.gridSizeY * this.sim.lengthScale * this.sim.lengthScale / EMStatic.e0, false);
            this.writeMaterials();
        }
    }

    useMaterial(): void {
        if (DragObject.currentFloatingConductor != null && this.isConductor()) {
            DragObject.useMaterialType(this.materialType, 0,
                DragObject.currentFloatingConductor === this ? 1 : 0, false);
        } else
            DragObject.useMaterialType(this.materialType, this.permittivity, this.potential, this.materialType === DragObject.MT_DIELECTRIC);
    }

    static useMaterialType(type: number, pm: number, pot: number, dielec: boolean): void {
        renderer.materialType = type;
        renderer.permittivity = dielec ? pm : 0;
        renderer.potential = pot;
    }

    rescale(scale: number): void {
        for (const dh of this.handles)
            dh.rescale(scale);
        this.setTransform();
    }

    selectText(): string | null {
        if (this.handles.length !== 2)
            return null;
        return "length = " + this.sim.getLengthText(this.length());
    }

    getBoundary(): any { return null; }

    intersects(obj: DragObject): boolean {
        const bounds1 = this.getBoundary();
        if (!bounds1)
            return false;
        renderer.transformBoundary(bounds1);
        const bounds2 = obj.getBoundary();
        if (!bounds2)
            return false;
        renderer.transformBoundary(bounds2);
        return renderer.checkIntersection(bounds1[0], bounds2[0]);
    }

    loadTransform(): void {
        const t = this.transform!;
        EMStatic.setTransform(t[0], t[1], t[2], t[3], t[4], t[5]);
    }

    writeMaterials(): void {
        const bounds = this.getBoundary();
        if (bounds)
            renderer.writeShape(bounds);
    }

    calcCharge(): void {
        const bounds = this.getBoundary();
        if (bounds)
            renderer.calcCharge(bounds);
    }

    drawFieldLinesShape(bound: any): void {
        renderer.drawFieldLinesShape(bound);
    }

    drawFieldLines(): void {
        if (this.isConductor() || this.isCharged()) {
            const bounds = this.getBoundary();
            if (bounds != null)
                this.drawFieldLinesShape(bounds);
        }
    }

    getDisplayedCharge(): number {
        if (this.isFloating())
            return this.totalChargeFloating;
        return this.conductorCharge;
    }

    length(): number {
        const dh1 = this.handles[0];
        const dh2 = this.handles[1];
        return Math.round(Math.hypot(dh1.x - dh2.x, dh1.y - dh2.y));
    }

    getMaterialType(): number { return this.materialType; }
    isConductor(): boolean { return this.materialType === DragObject.MT_CONDUCTING || this.materialType === DragObject.MT_FLOATING; }
    isFixedConductor(): boolean { return this.materialType === DragObject.MT_CONDUCTING; }
    isFloating(): boolean { return this.materialType === DragObject.MT_FLOATING; }
    isCharged(): boolean { return this.materialType === DragObject.MT_CHARGED; }
    isDielectric(): boolean { return this.materialType === DragObject.MT_DIELECTRIC; }
    setPotential(x: number): void { this.potential = x; }
    setConductorCharge(c: number): void { this.conductorCharge = c; }
    updateFloatingCharge(): void { this.totalChargeFloating = this.conductorCharge; }
}
