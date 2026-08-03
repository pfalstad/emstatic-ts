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

import { Dimension } from "./Dimension";
import { Point } from "./Point";
import { Rectangle } from "./Rectangle";
import { Color } from "./Color";
import { Choice } from "./Choice";
import { Checkbox } from "./Checkbox";
import { Scrollbar } from "./Scrollbar";
import { EditDialog } from "./EditDialog";
import { EditOptions } from "./EditOptions";
import type { Editable } from "./EditInfo";
import { EditInfo } from "./EditInfo";
import { AboutBox } from "./AboutBox";
import { ExportAsUrlDialog } from "./ExportAsUrlDialog";
import { ExportAsTextDialog } from "./ExportAsTextDialog";
import { ExportAsLocalFileDialog } from "./ExportAsLocalFileDialog";
import { ImportFromTextDialog } from "./ImportFromTextDialog";
import { LoadFile } from "./LoadFile";
import { QueryParameters } from "./QueryParameters";
import { StringTokenizer } from "./StringTokenizer";
import { DragObject } from "./DragObject";
import { DragHandle } from "./DragHandle";
import { Charge } from "./Charge";
import { Wall } from "./Wall";
import { Box } from "./Box";
import { Ellipse } from "./Ellipse";
import { HollowBox } from "./HollowBox";
import { HollowEllipse } from "./HollowEllipse";
import { QuadrupoleLens } from "./QuadrupoleLens";

// the WebGL/multigrid renderer, defined in renderer.js (loaded as a classic <script>).
// `passCanvas` returns an object with all the drawing/solver callbacks used below.
export let renderer: any = null;

declare global {
    interface Document {
        passCanvas(cv: HTMLCanvasElement): any;
    }
}

interface MenuItemDesc {
    label?: string;
    html?: string;
    action?: () => void;
    element?: HTMLButtonElement;
    separator?: boolean;
}

abstract class Setup {
    abstract getName(): string;
    select(): void {}
}

class FileSetup extends Setup {
    title: string;
    file: string;
    sim: EMStatic;
    constructor(sim: EMStatic, t: string, f: string) {
        super();
        this.sim = sim;
        this.title = t;
        this.file = f;
    }
    select(): void {
        this.sim.readSetupFile(this.file, this.title);
    }
    getName(): string { return this.title; }
}

export class EMStatic {
    static theSim: EMStatic | null = null;
    static e0 = 8.854e-12;
    static MENUBARHEIGHT = 30;
    static MAXVERTICALPANELWIDTH = 166;
    static FASTTIMER = 33;

    static readonly MODE_SETFUNC = 0;
    static readonly MODE_WALLS = 1;
    static readonly MODE_MEDIUM = 2;
    static readonly MODE_FUNCHOLD = 3;
    static readonly DISP_FIELD = 0;
    static readonly DISP_LINES = 1;
    static readonly DISP_E_LINES = 2;
    static readonly DISP_POT = 3;
    static readonly DISP_3D = 4;
    static readonly DISP_CHARGE = 5;
    static readonly DISP_D = 6;
    static readonly DISP_P = 7;
    static readonly DISP_POLARIZATION_CHARGE = 8;
    static readonly DISP_E_RHO = 9;
    static readonly DISP_E_LINES_RHO = 10;
    static readonly DISP_E_POT = 11;
    static readonly DISP_E_LINES_POT = 12;
    static readonly DISP_EX = 13;
    static readonly DISP_EY = 14;
    static readonly DISP_DX = 15;
    static readonly DISP_DY = 16;

    // ---- DOM ----
    appEl!: HTMLElement;
    menuBarEl!: HTMLElement;
    sidebarEl!: HTMLElement;
    canvasWrapEl!: HTMLElement;
    cv!: HTMLCanvasElement;
    coordsLabel!: HTMLElement;

    // ---- state fields (mirrors EMStatic.java) ----
    winSize!: Dimension;
    gridSizeX = 0;
    gridSizeY = 0;
    gridSizeXY = 0;
    windowWidth = 50;
    windowHeight = 50;
    windowOffsetX = 0;
    windowOffsetY = 0;
    windowBottom = 0;
    windowRight = 0;
    static sourceRadius = 17;

    stoppedCheck!: Checkbox;
    equipCheck!: Checkbox;
    setupChooser!: Choice;
    colorChooser!: Choice;
    displayChooser!: Choice;
    setupList: Setup[] = [];
    dragObjects: DragObject[] = [];
    selectedObject: DragObject | null = null;
    mouseObject: DragObject | null = null;
    menuObject: DragObject | null = null;
    draggingHandle: DragHandle | null = null;
    setup: Setup | null = null;
    brightnessBar!: Scrollbar;
    equipotentialBar!: Scrollbar;
    vectorDensityBar!: Scrollbar;
    dampcoef = 1;
    zoom3d = 1.2;
    mouseLocation: Point | null = null;

    dragX = 0; dragY = 0; dragStartX = -1; dragStartY = 0;
    mouseWheelAccum = 0;
    dragging = false;
    dragClear = false;
    dragSet = false;
    calcLevel = 0;
    t = 0;
    lengthScale = 1;
    iters = 0;
    rotationMode = false;
    preserveSelection = false;

    loadFileInput: LoadFile | null = null;
    ripArea: Rectangle | null = null;
    clipboard = "";
    undoStack: string[] = [];
    redoStack: string[] = [];
    verticalPanelWidth = 0;
    chargeSource = 0;
    startLayoutText: string | null = null;
    versionString = "1.0.1";
    calcStart = 0;
    finalSrc = 0;

    dragPoint: Point | null = null;
    wallColor!: Color; posColor!: Color; negColor!: Color; zeroColor!: Color;
    medColor!: Color; posMedColor!: Color; negMedColor!: Color; sourceColor!: Color;
    schemeColors: Color[][] = [];

    editDialog: EditDialog | null = null;
    exportAsUrlDialog: ExportAsUrlDialog | null = null;
    exportAsTextDialog: ExportAsTextDialog | null = null;
    exportAsLocalFileDialog: ExportAsLocalFileDialog | null = null;
    importFromTextDialog: ImportFromTextDialog | null = null;
    aboutBox: AboutBox | null = null;

    // menu items that need to be enabled/disabled dynamically
    undoItem!: HTMLButtonElement;
    redoItem!: HTMLButtonElement;
    pasteItem!: HTMLButtonElement;
    importFromLocalFileItem!: HTMLButtonElement;
    exportAsLocalFileItem!: HTMLButtonElement;
    elmEditMenuItem!: HTMLButtonElement;
    elmRotateMenuItem!: HTMLButtonElement;
    mainMenuItems: MenuItemDesc[] = [];
    elmMenuItems: MenuItemDesc[] = [];

    needsRepaint = false;
    private repaintScheduled = false;

    constructor() {
        EMStatic.theSim = this;
    }

    // ==================== static renderer passthroughs ====================
    static console(text: string): void { console.log(text); }

    static passCanvas(cv: HTMLCanvasElement): any { return document.passCanvas(cv); }
    static displayScalar(src: number, rs: number, bright: number, potential: boolean): void {
        renderer.displayScalar(src, rs, bright, potential);
    }
    static displayScalarField(src: number, rs: number, m1: number, m2: number, m3: number, m4: number, m5: number): void {
        renderer.displayScalarField(src, rs, [m1, m2, m3, m4, m5]);
    }
    static displayEquip(src: number, rs: number, equipMult: number): void { renderer.drawSceneEquip(src, rs, equipMult); }
    static display3D(src: number, rs: number, bright: number, equipMult: number): void { renderer.drawScene3D(src, rs, bright, equipMult); }
    static displayField(src: number, rs: number, bright: number, emult: number, pmult: number, vecdensity: number): void {
        renderer.displayField(src, rs, bright, emult, pmult, vecdensity);
    }
    static setBrightnessGL(b: number): void { renderer.setBrightness(b); }
    static fetchPotentialPixels(src: number): void { renderer.fetchPotentialPixels(src); }
    static freePotentialPixels(): void { renderer.freePotentialPixels(); }
    static drawFieldLineGL(x: number, y: number, dir: number): void { renderer.drawFieldLine(x, y, dir); }
    static setDestinationRenderTexture(d: number): void { renderer.setDestination(d); }
    static clearDestination(): void { renderer.clearDestination(); }
    static clearDisplay(): void { renderer.clearDisplay(); }
    static runRelax(src: number, rsnum: number, residual: boolean, parity: number): void { renderer.runRelax(src, rsnum, residual, parity); }
    static copyTextureRG(src: number): void { renderer.copyRG(src); }
    static copyTextureRGB(src: number): void { renderer.copyRGB(src); }
    static calcDifference(src1: number, src2: number): number { return renderer.calcDifference(src1, src2); }
    static sumTexture(src: number): void { renderer.sum(src); }
    static computeEdgeWeights(rs: number): void { renderer.computeEdgeWeights(rs); }
    static restrictEdgeWeights(fineRs: number): void { renderer.restrictEdgeWeights(fineRs); }
    static addTextures(src: number, src2: number, rmult: number, gmult: number, rgmult: number): void {
        renderer.addMult(src, src2, [rmult, gmult, 0, rgmult]);
    }
    static getCharge(): number { return renderer.getCharge(); }
    static getRenderTextureCount(): number { return renderer.getRenderTextureCount(); }
    static set3dViewAngle(a1: number, a2: number): void { renderer.set3dViewAngle(a1, a2); }
    static set3dViewZoom(zoom: number): void { renderer.set3dViewZoom(zoom); }
    static setResolutionGL(x: number, y: number, wx: number, wy: number): void { renderer.setResolution(x, y, wx, wy); }
    static drawHandle(x: number, y: number): void { renderer.drawHandle(x, y); }
    static drawWall(x1: number, y1: number, x2: number, y2: number, pot: number): void { renderer.drawWall(x1, y1, x2, y2, pot); }
    static setDrawingSelection(ds: number): void { renderer.drawingSelection = ds; }
    static setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void { renderer.setTransform(a, b, c, d, e, f); }
    static setResidualFlag(res: boolean): void { renderer.residual = res; }
    static getProbeValue(x: number, y: number): number[] { return renderer.getProbeValue(x, y); }
    static setColors(wallColor: number, posColor: number, negColor: number, zeroColor: number, posMedColor: number,
        negMedColor: number, medColor: number, sourceColor: number, zeroColor3d: number): void {
        renderer.setColors(wallColor, posColor, negColor, zeroColor, posMedColor, negMedColor, medColor, sourceColor, zeroColor3d);
    }
    static setChargeSource(cs: number): void { renderer.chargeSource = cs; }

    console(text: string): void { EMStatic.console(text); }
    drawFieldLine(x: number, y: number, dir: number): void { EMStatic.drawFieldLineGL(x, y, dir); }

    // ==================== layout / init ====================

    setCanvasSize(): void {
        const fullwidth = document.documentElement.clientWidth;
        let height = document.documentElement.clientHeight - EMStatic.MENUBARHEIGHT;
        let width = fullwidth - EMStatic.MAXVERTICALPANELWIDTH;
        width = height = Math.min(width, height);
        this.winSize = new Dimension(width, height);
        this.verticalPanelWidth = fullwidth - width;
        if (this.sidebarEl)
            this.sidebarEl.style.width = this.verticalPanelWidth + "px";
        if (this.brightnessBar) {
            this.brightnessBar.setWidth(this.verticalPanelWidth);
            this.equipotentialBar.setWidth(this.verticalPanelWidth);
            this.vectorDensityBar.setWidth(this.verticalPanelWidth);
        }
        if (this.cv) {
            this.cv.style.width = width + "px";
            this.cv.style.height = height + "px";
            this.cv.width = width;
            this.cv.height = height;
        }
        if (this.coordsLabel)
            this.coordsLabel.style.top = (height - this.coordsLabel.offsetHeight) + "px";
        const h = Math.trunc(height / 5);
        this.ripArea = new Rectangle(0, 0, width, height - h);
    }

    init(): void {
        EMStatic.theSim = this;

        const qp = new QueryParameters();
        try {
            const cct = qp.getValue("rol");
            if (cct != null)
                this.startLayoutText = cct.replace(/%24/g, "$");
        } catch (e) { /* ignored */ }

        this.appEl = document.getElementById("app")!;
        this.appEl.innerHTML = "";

        this.menuBarEl = document.createElement("div");
        this.menuBarEl.id = "menubar";
        this.appEl.appendChild(this.menuBarEl);

        const bodyEl = document.createElement("div");
        bodyEl.id = "bodyrow";
        this.appEl.appendChild(bodyEl);

        this.canvasWrapEl = document.createElement("div");
        this.canvasWrapEl.id = "canvasWrap";
        bodyEl.appendChild(this.canvasWrapEl);

        this.cv = document.createElement("canvas");
        this.canvasWrapEl.appendChild(this.cv);
        renderer = EMStatic.passCanvas(this.cv);
        if (!this.cv) {
            this.canvasWrapEl.textContent = "Not working. You need a browser that supports the CANVAS element.";
            return;
        }

        this.coordsLabel = document.createElement("div");
        this.coordsLabel.className = "coordsLabel";
        this.coordsLabel.textContent = "(0,0)";
        this.canvasWrapEl.appendChild(this.coordsLabel);

        this.dragObjects = [];
        this.setCanvasSize();

        this.sidebarEl = document.createElement("div");
        this.sidebarEl.id = "sidebar";
        bodyEl.appendChild(this.sidebarEl);

        this.setupList = [];
        this.undoStack = [];
        this.redoStack = [];

        this.setupChooser = new Choice();
        this.setupChooser.addChangeHandler(() => this.onChange(this.setupChooser));
        this.getSetupList();

        this.colorChooser = new Choice();
        this.colorChooser.addChangeHandler(() => this.onChange(this.colorChooser));
        this.colorChooser.addStyleName("topSpace");

        this.displayChooser = new Choice();
        [
            "Show Electric Field (E)", "Show Field Lines", "Show E + lines", "Show Potential",
            "Show Potential in 3-D", "Show Charge (rho)", "Show Displacement (D)", "Show Polarization (P)",
            "Show Polarization Charge", "Show E/rho", "Show E lines/rho", "Show E/Potential",
            "Show E lines/Potential", "Show Ex", "Show Ey", "Show Dx", "Show Dy"
        ].forEach(s => this.displayChooser.add(s));
        this.displayChooser.addChangeHandler(() => this.onChange(this.displayChooser));
        this.displayChooser.addStyleName("topSpace");
        this.displayChooser.select(EMStatic.DISP_E_LINES_RHO);

        this.sidebarEl.appendChild(this.setupChooser.element);
        this.sidebarEl.appendChild(this.displayChooser.element);

        this.stoppedCheck = new Checkbox("Stopped");
        this.sidebarEl.appendChild(this.stoppedCheck.element);

        this.equipCheck = new Checkbox("Show Equipotentials", true);
        this.equipCheck.addClickHandler(() => this.repaint());
        this.sidebarEl.appendChild(this.equipCheck.element);

        if (LoadFile.isSupported()) {
            this.loadFileInput = new LoadFile(this);
            this.sidebarEl.appendChild(this.loadFileInput.element);
        }

        const addLabel = (text: string, topSpace: boolean = true): HTMLElement => {
            const l = document.createElement("div");
            l.textContent = text;
            if (topSpace) l.classList.add("topSpace");
            this.sidebarEl.appendChild(l);
            return l;
        };

        addLabel("Brightness");
        this.brightnessBar = new Scrollbar(Scrollbar.HORIZONTAL, 27, 1, 1, 2200, () => this.repaint());
        this.sidebarEl.appendChild(this.brightnessBar.element);

        addLabel("Equipotential Count");
        this.equipotentialBar = new Scrollbar(Scrollbar.HORIZONTAL, 27, 1, 1, 2200, () => this.repaint());
        this.sidebarEl.appendChild(this.equipotentialBar.element);

        addLabel("Vector Density");
        this.vectorDensityBar = new Scrollbar(Scrollbar.HORIZONTAL, 60, 1, 20, 200, () => this.repaint());
        this.sidebarEl.appendChild(this.vectorDensityBar.element);

        this.brightnessBar.setWidth(this.verticalPanelWidth);
        this.equipotentialBar.setWidth(this.verticalPanelWidth);
        this.vectorDensityBar.setWidth(this.verticalPanelWidth);

        this.createMenus();

        this.schemeColors = [];
        if (this.colorChooser.getItemCount() === 0)
            this.addDefaultColorScheme();
        this.doColor();
        this.setDamping();

        this.cv.addEventListener("mousemove", (e) => this.onMouseMove(e));
        this.cv.addEventListener("mousedown", (e) => this.onMouseDown(e));
        this.cv.addEventListener("mouseout", (e) => this.onMouseOut(e));
        this.cv.addEventListener("mouseup", (e) => this.onMouseUp(e));
        this.cv.addEventListener("wheel", (e) => this.onMouseWheel(e as WheelEvent), { passive: false });
        this.cv.addEventListener("click", (e) => this.onClick(e));
        this.cv.addEventListener("dblclick", (e) => this.onDoubleClick(e));
        this.cv.addEventListener("contextmenu", (e) => this.onContextMenu(e));
        this.doTouchHandlers(this.cv);

        this.reinit();
        EMStatic.set3dViewZoom(this.zoom3d);
        this.setCanvasSize();
        this.repaint();
    }

    // ==================== menus ====================

    private closeAllDropdowns(): void {
        document.querySelectorAll(".menu-dropdown.open").forEach(el => el.classList.remove("open"));
    }

    private makeMenuButton(container: HTMLElement, label: string): { btn: HTMLButtonElement, dropdown: HTMLElement } {
        const wrap = document.createElement("div");
        wrap.className = "menu";
        const btn = document.createElement("button");
        btn.className = "menu-label";
        btn.textContent = label;
        const dropdown = document.createElement("div");
        dropdown.className = "menu-dropdown";
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const wasOpen = dropdown.classList.contains("open");
            this.closeAllDropdowns();
            if (!wasOpen) dropdown.classList.add("open");
        });
        wrap.appendChild(btn);
        wrap.appendChild(dropdown);
        container.appendChild(wrap);
        return { btn, dropdown };
    }

    private addMenuItem(dropdown: HTMLElement, desc: MenuItemDesc): HTMLButtonElement {
        if (desc.separator) {
            const sep = document.createElement("div");
            sep.className = "menu-separator";
            dropdown.appendChild(sep);
            return null as any;
        }
        const item = document.createElement("button");
        item.className = "menu-item";
        if (desc.html != null)
            item.innerHTML = desc.html;
        else
            item.textContent = desc.label!;
        item.addEventListener("click", () => {
            this.closeAllDropdowns();
            desc.action!();
        });
        dropdown.appendChild(item);
        return item;
    }

    private buildMainMenuItems(): MenuItemDesc[] {
        return [
            { label: "Add Wall", action: () => this.menuPerformed("main", "Wall") },
            { label: "Add Point Charge", action: () => this.menuPerformed("main", "Charge") },
            { label: "Add Box", action: () => this.menuPerformed("main", "Box") },
            { label: "Add Circle/Cylinder", action: () => this.menuPerformed("main", "Circle") },
            { label: "Add Ellipse", action: () => this.menuPerformed("main", "Ellipse") },
            { label: "Add Hollow Box", action: () => this.menuPerformed("main", "HollowBox") },
            { label: "Add Hollow Circle/Cylinder", action: () => this.menuPerformed("main", "HollowCircle") },
            { label: "Add Hollow Ellipse", action: () => this.menuPerformed("main", "HollowEllipse") },
            { label: "Add Quadrupole Lens", action: () => this.menuPerformed("main", "QuadrupoleLens") },
        ];
    }

    createMenus(): void {
        document.addEventListener("click", () => this.closeAllDropdowns());

        // File menu
        const file = this.makeMenuButton(this.menuBarEl, "File");
        this.addMenuItem(file.dropdown, { label: "New", action: () => this.menuPerformed("file", "new") });
        this.importFromLocalFileItem = this.addMenuItem(file.dropdown, { label: "Import From Local File", action: () => this.menuPerformed("file", "importfromlocalfile") });
        this.importFromLocalFileItem.disabled = !LoadFile.isSupported();
        this.addMenuItem(file.dropdown, { label: "Import From Text", action: () => this.menuPerformed("file", "importfromtext") });
        this.addMenuItem(file.dropdown, { label: "Export As Link", action: () => this.menuPerformed("file", "exportasurl") });
        this.exportAsLocalFileItem = this.addMenuItem(file.dropdown, { label: "Export As Local File", action: () => this.menuPerformed("file", "exportaslocalfile") });
        this.exportAsLocalFileItem.disabled = !ExportAsLocalFileDialog.downloadIsSupported();
        this.addMenuItem(file.dropdown, { label: "Export As Text", action: () => this.menuPerformed("file", "exportastext") });
        this.addMenuItem(file.dropdown, { label: "Options...", action: () => this.menuPerformed("main", "Options") });
        this.addMenuItem(file.dropdown, { separator: true });
        this.addMenuItem(file.dropdown, { label: "About", action: () => this.menuPerformed("file", "about") });

        // Edit menu
        const edit = this.makeMenuButton(this.menuBarEl, "Edit");
        this.undoItem = this.addMenuItem(edit.dropdown, { html: `<div style="display:inline-block;width:80px;">Undo</div>Ctrl-Z`, action: () => this.menuPerformed("edit", "undo") });
        this.redoItem = this.addMenuItem(edit.dropdown, { html: `<div style="display:inline-block;width:80px;">Redo</div>Ctrl-Y`, action: () => this.menuPerformed("edit", "redo") });
        this.addMenuItem(edit.dropdown, { separator: true });
        this.addMenuItem(edit.dropdown, { html: `<div style="display:inline-block;width:80px;">Cut</div>Ctrl-X`, action: () => this.menuPerformed("edit", "cut") });
        this.addMenuItem(edit.dropdown, { html: `<div style="display:inline-block;width:80px;">Copy</div>Ctrl-C`, action: () => this.menuPerformed("edit", "copy") });
        this.pasteItem = this.addMenuItem(edit.dropdown, { html: `<div style="display:inline-block;width:80px;">Paste</div>Ctrl-V`, action: () => this.menuPerformed("edit", "paste") });
        this.pasteItem.disabled = true;
        this.addMenuItem(edit.dropdown, { html: `<div style="display:inline-block;width:80px;">Duplicate</div>Ctrl-D`, action: () => this.menuPerformed("edit", "duplicate") });
        this.addMenuItem(edit.dropdown, { separator: true });
        this.addMenuItem(edit.dropdown, { html: `<div style="display:inline-block;width:80px;">Select All</div>Ctrl-A`, action: () => this.menuPerformed("edit", "selectAll") });

        // Add menu
        const add = this.makeMenuButton(this.menuBarEl, "Add");
        this.mainMenuItems = this.buildMainMenuItems();
        for (const d of this.mainMenuItems)
            this.addMenuItem(add.dropdown, d);

        // element context menu descriptors (used for canvas right-click / long-press when object selected)
        this.elmMenuItems = [
            { label: "Edit", action: () => this.menuPerformed("elm", "edit") },
            { label: "Cut", action: () => this.menuPerformed("elm", "cut") },
            { label: "Copy", action: () => this.menuPerformed("elm", "copy") },
            { label: "Delete", action: () => this.menuPerformed("elm", "delete") },
            { label: "Rotate", action: () => this.menuPerformed("elm", "rotate") },
            { label: "Duplicate", action: () => this.menuPerformed("elm", "duplicate") },
        ];

        document.addEventListener("keydown", (e) => this.onKeyDown(e));
    }

    onKeyDown(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT"))
            return;
        const ctrl = e.ctrlKey || e.metaKey;
        if (!ctrl) return;
        switch (e.key.toLowerCase()) {
            case 'z': this.menuPerformed("edit", "undo"); e.preventDefault(); break;
            case 'y': this.menuPerformed("edit", "redo"); e.preventDefault(); break;
            case 'x': this.menuPerformed("edit", "cut"); e.preventDefault(); break;
            case 'c': this.menuPerformed("edit", "copy"); e.preventDefault(); break;
            case 'v': this.menuPerformed("edit", "paste"); e.preventDefault(); break;
            case 'd': this.menuPerformed("edit", "duplicate"); e.preventDefault(); break;
            case 'a': this.menuPerformed("edit", "selectAll"); e.preventDefault(); break;
        }
    }

    doTouchHandlers(cv: HTMLCanvasElement): void {
        let lastTap = 0;
        let tmout: ReturnType<typeof setTimeout> | null = null;
        const sim = this;

        function getTouchPos(touch: Touch) {
            const rect = cv.getBoundingClientRect();
            return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        }

        cv.addEventListener("touchstart", (e: TouchEvent) => {
            const touch = e.touches[0];
            let etype = "mousedown";
            if (tmout != null) clearTimeout(tmout);
            if (e.timeStamp - lastTap < 300) {
                etype = "dblclick";
            } else {
                tmout = setTimeout(() => sim.longPress(), 1000);
            }
            lastTap = e.timeStamp;
            const mouseEvent = new MouseEvent(etype, { clientX: touch.clientX, clientY: touch.clientY });
            e.preventDefault();
            cv.dispatchEvent(mouseEvent);
        }, { passive: false });

        cv.addEventListener("touchend", (e: TouchEvent) => {
            const mouseEvent = new MouseEvent("mouseup", {});
            e.preventDefault();
            if (tmout != null) clearTimeout(tmout);
            cv.dispatchEvent(mouseEvent);
        }, { passive: false });

        cv.addEventListener("touchmove", (e: TouchEvent) => {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent("mousemove", { clientX: touch.clientX, clientY: touch.clientY });
            e.preventDefault();
            if (tmout != null) clearTimeout(tmout);
            cv.dispatchEvent(mouseEvent);
        }, { passive: false });
    }

    menuPerformed(menu: string, item: string): void {
        if (item === "about")
            this.aboutBox = new AboutBox(this.versionString);
        if (item === "new") {
            this.pushUndo();
            this.deleteAllObjects();
        }
        if (item === "importfromlocalfile") {
            this.pushUndo();
            this.loadFileInput?.click();
        }
        if (item === "importfromtext")
            this.importFromTextDialog = new ImportFromTextDialog(this);
        if (item === "exportasurl")
            this.doExportAsUrl();
        if (item === "exportaslocalfile")
            this.doExportAsLocalFile();
        if (item === "exportastext")
            this.doExportAsText();

        if (item === "undo") this.doUndo();
        if (item === "redo") this.doRedo();
        if (item === "cut") {
            if (menu !== "elm") this.menuObject = null;
            this.doCut();
        }
        if (item === "copy") {
            if (menu !== "elm") this.menuObject = null;
            this.doCopy();
        }
        if (item === "delete") {
            if (menu !== "elm") this.menuObject = null;
            this.doDelete();
        }
        if (item === "paste") this.doPaste(null);
        if (item === "duplicate") {
            if (menu !== "elm") this.menuObject = null;
            this.doDuplicate();
        }
        if (item === "selectAll") this.doSelectAll();

        this.closeContextPanel();
        if (item === "edit") this.doEdit(this.selectedObject!);
        if (item === "rotate" && this.selectedObject != null && this.selectedObject.canRotate())
            this.rotationMode = true;

        let newObject: DragObject | null = null;
        if (item === "Wall") newObject = new Wall();
        if (item === "Ellipse") newObject = new Ellipse(false);
        if (item === "Circle") newObject = new Ellipse(true);
        if (item === "QuadrupoleLens") newObject = new QuadrupoleLens();
        if (item === "Box") newObject = new Box();
        if (item === "HollowBox") newObject = new HollowBox();
        if (item === "HollowEllipse") newObject = new HollowEllipse(false);
        if (item === "HollowCircle") newObject = new HollowEllipse(true);
        if (item === "Charge") newObject = new Charge();
        if (newObject != null) {
            this.pushUndo();
            newObject.setInitialPosition();
            this.dragObjects.push(newObject);
            this.setSelectedObject(newObject);
            this.preserveSelection = true;
        }
        if (item === "Options")
            this.doEdit(new EditOptions(this));
        this.repaint();
    }

    createObj(tint: number, st: StringTokenizer): DragObject | null {
        if (tint === 'e'.charCodeAt(0)) return new Ellipse(false, st);
        if (tint === 'E'.charCodeAt(0)) return new HollowEllipse(false, st);
        if (tint === 'b'.charCodeAt(0)) return new Box(st);
        if (tint === 'B'.charCodeAt(0)) return new HollowBox(st);
        if (tint === 'c'.charCodeAt(0)) return new Charge(st, 1);
        if (tint === 'w'.charCodeAt(0)) return new Wall(st);
        if (tint === 'q'.charCodeAt(0)) return new QuadrupoleLens(st);
        return null;
    }

    doEdit(eable: Editable): void {
        this.clearSelection();
        this.pushUndo();
        if (this.editDialog != null) {
            this.editDialog.setVisible(false);
            this.editDialog = null;
        }
        this.editDialog = new EditDialog(eable, this);
        this.editDialog.show();
    }

    doExportAsUrl(): void {
        const dump = this.dumpLayout();
        this.exportAsUrlDialog = new ExportAsUrlDialog(dump);
        this.exportAsUrlDialog.show();
    }

    doExportAsText(): void {
        const dump = this.dumpLayout();
        this.exportAsTextDialog = new ExportAsTextDialog(this, dump);
        this.exportAsTextDialog.show();
    }

    doExportAsLocalFile(): void {
        const dump = this.dumpLayout();
        this.exportAsLocalFileDialog = new ExportAsLocalFileDialog(dump);
        this.exportAsLocalFileDialog.show();
    }

    // ==================== multigrid solver driver ====================

    reinit(setup: boolean = true): void {
        this.gridSizeXY = this.gridSizeX * this.gridSizeY;
        if (setup)
            this.doSetup();
    }

    solveExactly(src: number, dest: number, rs: number): number {
        for (let i = 0; i !== 50; i++) {
            EMStatic.setDestinationRenderTexture(dest);
            EMStatic.runRelax(src, rs, false, 0);
            [dest, src] = [src, dest];
            EMStatic.setDestinationRenderTexture(dest);
            EMStatic.runRelax(src, rs, false, 1);
            [dest, src] = [src, dest];
        }
        return src;
    }

    multigridVCycle(src: number, dest: number, rsGrid: number): number {
        if (src < 3)
            return this.solveExactly(src, dest, rsGrid);

        const iterCount = (this.calcLevel === 0) ? 9 : 20;
        for (let i = 0; i !== iterCount; i++) {
            EMStatic.setDestinationRenderTexture(dest);
            EMStatic.runRelax(src, rsGrid, false, 0);
            [dest, src] = [src, dest];
            EMStatic.setDestinationRenderTexture(dest);
            EMStatic.runRelax(src, rsGrid, false, 1);
            [dest, src] = [src, dest];
        }

        EMStatic.setDestinationRenderTexture(dest);
        EMStatic.runRelax(src, rsGrid, true, 0);

        const coarseResidual = rsGrid - 3;
        EMStatic.setDestinationRenderTexture(coarseResidual);
        EMStatic.copyTextureRG(dest);

        EMStatic.restrictEdgeWeights(rsGrid);
        EMStatic.setResidualFlag(true);
        this.writeConductorMaterials();

        EMStatic.setDestinationRenderTexture(src - 3);
        EMStatic.clearDestination();

        const correction = this.multigridVCycle(src - 3, dest - 3, coarseResidual);

        EMStatic.setDestinationRenderTexture(dest);
        EMStatic.addTextures(correction, src, 1, 1, 0);
        [dest, src] = [src, dest];

        for (let i = 0; i !== iterCount; i++) {
            EMStatic.setDestinationRenderTexture(dest);
            EMStatic.runRelax(src, rsGrid, false, 0);
            [dest, src] = [src, dest];
            EMStatic.setDestinationRenderTexture(dest);
            EMStatic.runRelax(src, rsGrid, false, 1);
            [dest, src] = [src, dest];
        }

        return src;
    }

    createEmptyRightSide(dest: number): void {
        EMStatic.setDestinationRenderTexture(dest);
        EMStatic.clearDestination();
    }

    createRightSide(dest: number, scratch1: number, scratch2: number): void {
        EMStatic.setDestinationRenderTexture(dest);
        EMStatic.clearDestination();

        for (let j = 0; j !== this.dragObjects.length; j++) {
            EMStatic.setDestinationRenderTexture(scratch1);
            EMStatic.clearDestination();
            EMStatic.setTransform(1, 0, 0, 0, 1, 0);
            this.dragObjects[j].writeCharge();

            EMStatic.setDestinationRenderTexture(scratch2);
            EMStatic.addTextures(scratch1, dest, 1, 1, 0);

            EMStatic.setDestinationRenderTexture(dest);
            EMStatic.copyTextureRG(scratch2);
        }
    }

    writeMaterials(conductorsOnly: boolean = false): void {
        for (let i = 0; i !== this.dragObjects.length; i++) {
            const obj = this.dragObjects[i];
            if (obj.isCharged())
                continue;
            if (conductorsOnly && obj.isDielectric())
                continue;
            obj.useMaterial();
            const xform = obj.transform!;
            EMStatic.setTransform(xform[0], xform[1], xform[2], xform[3], xform[4], xform[5]);
            obj.writeMaterials();
        }
        EMStatic.setTransform(1, 0, 0, 0, 1, 0);
    }

    writeConductorMaterials(): void { this.writeMaterials(true); }

    recalcAndRepaint(): void {
        this.calcLevel = 0;
        this.repaint();
    }

    repaint(): void {
        if (!this.needsRepaint) {
            this.needsRepaint = true;
            this.forceRepaint();
        }
    }

    forceRepaint(): void {
        if (this.repaintScheduled)
            return;
        this.repaintScheduled = true;
        setTimeout(() => {
            this.repaintScheduled = false;
            this.update();
            this.needsRepaint = false;
        }, EMStatic.FASTTIMER);
    }

    needsRecalculate(): void { this.calcLevel = 0; }

    touchingFixedObject(obj: DragObject): boolean {
        for (let j = 0; j !== this.dragObjects.length; j++) {
            const obj2 = this.dragObjects[j];
            if (obj2 === obj) continue;
            if (obj2.isFixedConductor() && obj.intersects(obj2)) {
                obj.setPotential(obj2.potential);
                return true;
            }
        }
        return false;
    }

    recalculate(): void {
        if (this.calcLevel > 0) {
            for (let i = 0; i !== 2; i++) {
                this.recalculateStep(false, true);
                this.calcLevel++;
            }
            return;
        }

        DragObject.currentFloatingConductor = null;
        const floatingVec: DragObject[] = [];
        const touchingVec: DragObject[] = [];
        for (let i = 0; i !== this.dragObjects.length; i++) {
            const obj = this.dragObjects[i];
            if (!obj.isFloating())
                continue;
            if (this.touchingFixedObject(obj))
                touchingVec.push(obj);
            else {
                floatingVec.push(obj);
                obj.setPotential(0);
            }
        }

        this.recalculateStep(false, floatingVec.length === 0);

        for (let i = 0; i !== touchingVec.length; i++)
            touchingVec[i].updateFloatingCharge();

        if (floatingVec.length === 0) {
            this.calcLevel++;
            return;
        }

        const fct = floatingVec.length;
        const chargeMatrix: number[][] = [];
        for (let i = 0; i !== fct; i++) chargeMatrix.push(new Array(fct).fill(0));
        const baseCharge: number[] = [];
        for (let i = 0; i !== floatingVec.length; i++)
            baseCharge[i] = floatingVec[i].conductorCharge;

        for (let i = 0; i !== floatingVec.length; i++) {
            const fo = floatingVec[0];
            DragObject.currentFloatingConductor = fo;
            this.recalculateStep(true, false);
            for (let j = 0; j !== floatingVec.length; j++)
                chargeMatrix[i][j] = floatingVec[j].conductorCharge;
        }
        DragObject.currentFloatingConductor = null;

        if (fct === 1) {
            const f0 = floatingVec[0];
            const pot = (f0.totalChargeFloating - baseCharge[0]) / chargeMatrix[0][0];
            f0.setPotential(pot);
            this.recalculateStep(false, true);
        }
        this.calcLevel++;
    }

    recalculateStep(suppressCharges: boolean, finalResult: boolean): void {
        const rtnum = EMStatic.getRenderTextureCount();

        this.console("Recalc " + this.calcLevel);
        if (this.stoppedCheck.getState())
            return;

        EMStatic.setResidualFlag(false);

        if (suppressCharges)
            this.createEmptyRightSide(rtnum - 1);
        else
            this.createRightSide(rtnum - 1, rtnum - 2, rtnum - 3);
        this.writeMaterials();
        EMStatic.computeEdgeWeights(rtnum - 1);

        for (let i = rtnum - 1 - 3; i > 0; i -= 3) {
            EMStatic.setDestinationRenderTexture(i);
            EMStatic.copyTextureRG(i + 3);
            EMStatic.restrictEdgeWeights(i + 3);
            this.writeConductorMaterials();
        }

        if (this.calcLevel > 0 && finalResult) {
            EMStatic.setDestinationRenderTexture(rtnum - 3);
            EMStatic.copyTextureRG(this.finalSrc);
            const src = this.multigridVCycle(rtnum - 3, rtnum - 2, rtnum - 1);

            EMStatic.setDestinationRenderTexture(rtnum - 3);
            if (EMStatic.calcDifference(this.finalSrc, src) < 25)
                this.calcLevel = 5000;

            EMStatic.setDestinationRenderTexture(this.finalSrc);
            EMStatic.copyTextureRGB(src);
            const spare = (src === rtnum - 2) ? rtnum - 3 : rtnum - 2;
            this.calculateCharge(src, spare);
            return;
        }

        EMStatic.setDestinationRenderTexture(0);
        EMStatic.clearDestination();

        this.solveExactly(0, 1, 2);

        let src = 1;
        for (let i = 3; i < rtnum; i += 3) {
            EMStatic.setDestinationRenderTexture(i);
            EMStatic.copyTextureRG(src);
            src = this.multigridVCycle(i, i + 1, i + 2);
        }

        if (finalResult) {
            EMStatic.setDestinationRenderTexture(rtnum);
            EMStatic.copyTextureRGB(src);
            this.finalSrc = rtnum;
        }

        const spare = (src === rtnum - 2) ? rtnum - 3 : rtnum - 2;
        this.calculateCharge(src, spare);
    }

    calculateCharge(csrc: number, spare: number): void {
        EMStatic.setChargeSource(csrc);
        for (let i = 0; i !== this.dragObjects.length; i++) {
            let src = spare;
            const obj = this.dragObjects[i];
            if (!obj.isConductor())
                continue;

            EMStatic.setDestinationRenderTexture(src);
            EMStatic.clearDestination();
            const xform = obj.transform!;
            EMStatic.setTransform(xform[0], xform[1], xform[2], xform[3], xform[4], xform[5]);
            obj.calcCharge();

            while (src >= 3) {
                EMStatic.setDestinationRenderTexture(src - 3);
                EMStatic.clearDestination();
                EMStatic.sumTexture(src);
                src = src - 3;
            }
            obj.setConductorCharge(EMStatic.getCharge() * EMStatic.e0);
        }

        const src = spare;
        EMStatic.setDestinationRenderTexture(src);
        const rtnum = EMStatic.getRenderTextureCount();
        EMStatic.addTextures(rtnum - 1, rtnum - 1, 0, 0, .05e-4);
        for (let i = 0; i !== this.dragObjects.length; i++) {
            const obj = this.dragObjects[i];
            if (!obj.isConductor())
                continue;
            const xform = obj.transform!;
            EMStatic.setTransform(xform[0], xform[1], xform[2], xform[3], xform[4], xform[5]);
            obj.calcCharge();
        }
        EMStatic.setChargeSource(src);
        this.chargeSource = src;
    }

    update(): void {
        if (this.calcLevel === 0)
            this.calcStart = performance.now();
        const rtnum = EMStatic.getRenderTextureCount();
        if (rtnum === 0 || this.gridSizeX === 0)
            return;
        if (this.calcLevel < 2000) {
            this.recalculate();
            if (this.calcLevel < 2000)
                this.forceRepaint();
            else
                this.console("calc time: " + (performance.now() - this.calcStart));
        }

        const src = this.finalSrc;

        const brightMult = Math.exp(this.brightnessBar.getValue() / 100 - 5);
        let equipMult = Math.exp(this.equipotentialBar.getValue() / 100 - 5);
        equipMult *= brightMult / .9;
        if (!this.equipCheck.getState())
            equipMult = 0;
        const rsrc = rtnum - 1;
        let lines = false;
        switch (this.displayChooser.getSelectedIndex()) {
            case EMStatic.DISP_POT:
                EMStatic.displayScalar(src, rsrc, brightMult * .02666, true);
                EMStatic.displayEquip(src, rsrc, equipMult);
                break;
            case EMStatic.DISP_CHARGE:
                EMStatic.displayScalar(this.chargeSource, rsrc, brightMult, false);
                break;
            case EMStatic.DISP_E_LINES_RHO:
                lines = true;
            // fallthrough
            case EMStatic.DISP_E_RHO:
                EMStatic.displayScalar(this.chargeSource, rsrc, brightMult, false);
                EMStatic.displayField(src, rsrc, brightMult, 1, 0, this.vectorDensityBar.getValue());
                EMStatic.displayEquip(src, rsrc, equipMult);
                break;
            case EMStatic.DISP_3D:
                EMStatic.display3D(src, rsrc, brightMult * .05333, equipMult);
                break;
            case EMStatic.DISP_LINES:
                lines = true;
                EMStatic.displayScalar(src, rsrc, 0, true);
                break;
            case EMStatic.DISP_E_LINES:
                lines = true;
            // fallthrough
            case EMStatic.DISP_FIELD:
                EMStatic.displayScalar(src, rsrc, 0, true);
                EMStatic.displayField(src, rsrc, brightMult, 1, 0, this.vectorDensityBar.getValue());
                EMStatic.displayEquip(src, rsrc, equipMult);
                break;
            case EMStatic.DISP_E_LINES_POT:
                lines = true;
            // fallthrough
            case EMStatic.DISP_E_POT:
                EMStatic.displayScalar(src, rsrc, brightMult * .02666, true);
                EMStatic.displayField(src, rsrc, brightMult, 1, 0, this.vectorDensityBar.getValue());
                EMStatic.displayEquip(src, rsrc, equipMult);
                break;
            case EMStatic.DISP_D:
                EMStatic.displayScalar(src, rsrc, 0, true);
                EMStatic.displayField(src, rsrc, brightMult, 1, 1, this.vectorDensityBar.getValue());
                EMStatic.displayEquip(src, rsrc, equipMult);
                break;
            case EMStatic.DISP_P:
                EMStatic.displayScalar(src, rsrc, 0, true);
                EMStatic.displayField(src, rsrc, brightMult, 0, 1, this.vectorDensityBar.getValue());
                break;
            case EMStatic.DISP_POLARIZATION_CHARGE:
                EMStatic.displayScalarField(src, rsrc, 0, 0, 0, 0, brightMult);
                break;
            case EMStatic.DISP_EX:
                EMStatic.displayScalarField(src, rsrc, brightMult, 0, 0, -1, 0);
                break;
            case EMStatic.DISP_EY:
                EMStatic.displayScalarField(src, rsrc, 0, brightMult, 0, -1, 0);
                break;
            case EMStatic.DISP_DX:
                EMStatic.displayScalarField(src, rsrc, brightMult, 0, 1, 0, 0);
                break;
            case EMStatic.DISP_DY:
                EMStatic.displayScalarField(src, rsrc, 0, brightMult, 1, 0, 0);
                break;
        }
        if (lines) {
            EMStatic.fetchPotentialPixels(src);
            EMStatic.setBrightnessGL(brightMult);
            for (let i = 0; i !== this.dragObjects.length; i++)
                this.dragObjects[i].drawFieldLines();
            EMStatic.freePotentialPixels();
        }
        if (this.displayChooser.getSelectedIndex() !== EMStatic.DISP_3D)
            for (let i = 0; i !== this.dragObjects.length; i++) {
                const obj = this.dragObjects[i];
                if (obj.selected)
                    EMStatic.setDrawingSelection(.6 + .4 * Math.sin(this.t * .2));
                else
                    EMStatic.setDrawingSelection(1);
                const xform = obj.transform!;
                EMStatic.setTransform(xform[0], xform[1], xform[2], xform[3], xform[4], xform[5]);
                obj.display();
            }
        EMStatic.setTransform(1, 0, 0, 0, 1, 0);
        EMStatic.setDrawingSelection(-1);
        this.doCoordsLabel();
    }

    doCoordsLabel(): void {
        if (this.displayChooser.getSelectedIndex() === EMStatic.DISP_3D) {
            this.coordsLabel.style.display = "none";
            return;
        }
        if (this.calcLevel < 2000) {
            this.coordsLabel.textContent = "Calculating...";
            this.coordsLabel.style.display = "";
            return;
        }
        if (this.mouseLocation == null) {
            this.coordsLabel.style.display = "none";
            return;
        }
        EMStatic.setDestinationRenderTexture(this.finalSrc);
        const pt = this.mouseLocation;
        const probe = EMStatic.getProbeValue(pt.x, pt.y);
        let txt = "V = " + this.getUnitText(probe[0], "V") + ", E = (" +
            this.getUnitText((probe[3] - probe[4]) / (2 * this.lengthScale), "V/m") + ", " +
            this.getUnitText((probe[2] - probe[1]) / (2 * this.lengthScale), "V/m") + ")";
        if (this.selectedObject != null) {
            if (this.selectedObject.isConductor())
                txt += ", Q = " + this.getUnitText(this.selectedObject.getDisplayedCharge(), "C");
            const more = this.selectedObject.selectText();
            if (more != null)
                txt += ", " + more;
        }
        this.coordsLabel.textContent = `(${this.getLengthText(pt.x)}, ${this.getLengthText(this.windowHeight - 1 - pt.y)}) ${txt}`;
        if (pt.x < this.windowWidth / 4 && pt.y > this.windowHeight * 3 / 4)
            this.coordsLabel.style.top = "0px";
        else
            this.coordsLabel.style.top = (this.cv.offsetHeight - this.coordsLabel.offsetHeight) + "px";
        this.coordsLabel.style.display = "";
    }

    setDamping(): void { this.dampcoef = 1; }

    setResolution(ns: number, border: number = 0): void {
        let newSize = 1;
        while (newSize < ns) newSize *= 2;
        const oldWidth = this.windowWidth;
        if (newSize === this.gridSizeX && border === 0)
            return;
        if (border === 0) {
            border = newSize / 4;
            if (border < 20) border = 20;
        }
        this.gridSizeX = this.gridSizeY = newSize;
        this.windowWidth = this.windowHeight = newSize - border * 2;
        this.windowOffsetX = this.windowOffsetY = border;
        this.windowBottom = this.windowOffsetY + this.windowHeight - 1;
        this.windowRight = this.windowOffsetX + this.windowWidth - 1;
        EMStatic.setResolutionGL(this.gridSizeX, this.gridSizeY, this.windowOffsetX, this.windowOffsetY);
        this.console("res gs=" + this.gridSizeX + " ww=" + this.windowWidth + " wo=" + this.windowOffsetX + " " + ns);
        for (let i = 0; i !== this.dragObjects.length; i++)
            this.dragObjects[i].rescale(this.windowWidth / oldWidth);
        this.calcLevel = 0;
    }

    view3dDrag(x: number, y: number): void {
        EMStatic.set3dViewAngle(x - this.dragX, y - this.dragY);
        this.dragX = x;
        this.dragY = y;
    }

    deleteAllObjects(): void {
        this.dragObjects = [];
        this.selectedObject = null;
        this.needsRecalculate();
    }

    resetTime(): void {
        this.t = 0;
        this.iters = 0;
    }

    doSetup(): void {
        if (this.setupList.length === 0)
            return;
        this.resetTime();
        this.deleteAllObjects();
        this.setBrightness(10);
        this.setup = this.setupList[this.setupChooser.getSelectedIndex()];
        this.setup.select();
        this.setDamping();
        this.enableDisableUI();
    }

    setBrightness(x: number): void {
        let m = x / 5;
        m = (Math.log(m) + 5) * 100;
        this.brightnessBar.setValue(Math.round(m));
    }

    doColor(): void {
        const cn = this.colorChooser.getSelectedIndex();
        this.wallColor = this.schemeColors[cn][0];
        this.posColor = this.schemeColors[cn][1];
        this.negColor = this.schemeColors[cn][2];
        this.zeroColor = this.schemeColors[cn][3];
        this.posMedColor = this.schemeColors[cn][4];
        this.negMedColor = this.schemeColors[cn][5];
        this.medColor = this.schemeColors[cn][6];
        this.sourceColor = this.schemeColors[cn][7];
        let zerocol3d = this.zeroColor.toInteger();
        if (zerocol3d === 0)
            zerocol3d = 0x808080;
        EMStatic.setColors(this.wallColor.toInteger(), this.posColor.toInteger(), this.negColor.toInteger(),
            this.zeroColor.toInteger(), this.posMedColor.toInteger(), this.negMedColor.toInteger(),
            this.medColor.toInteger(), this.sourceColor.toInteger(), zerocol3d);
    }

    addDefaultColorScheme(): void {
        const schemes = [
            "#808080 #00ffff #000000 #008080 #0000ff #000000 #000080 #ffffff",
            "#000000 #404040 #00ff00 #ff0000 #ffff00 #0000ff #404040 #0000ff",
            "#800000 #00ffff #0000ff #000000 #80c8c8 #8080c8 #808080 #ffffff",
            "#800000 #ffffff #000000 #808080 #0000ff #000000 #000080 #00ff00",
            "#800000 #ffff00 #0000ff #000000 #ffff80 #8080ff #808080 #ffffff",
            "#808080 #00ff00 #ff0000 #FFFFFF #00ffff #ff00ff #0000ff #0000ff",
            "#FF0000 #00FF00 #0000FF #FFFF00 #00FFFF #FF00FF #FFFFFF #000000",
        ];
        for (let i = 0; i !== 7; i++)
            this.decodeColorScheme(i, schemes[i]);
        this.colorChooser.select(1);
    }

    decodeColorScheme(cn: number, s: string): void {
        const st = new StringTokenizer(s);
        this.schemeColors[cn] = [];
        while (st.hasMoreTokens()) {
            for (let i = 0; i !== 8; i++)
                this.schemeColors[cn][i] = Color.hex2Rgb(st.nextToken());
        }
        this.colorChooser.add("Color Scheme " + (cn + 1));
    }

    async getSetupList(): Promise<void> {
        try {
            const url = "setuplist.txt?v=" + Math.floor(Math.random() * 0x7fffffff);
            const response = await fetch(url);
            if (response.ok) {
                const text = await response.text();
                this.processSetupList(text);
                if (this.startLayoutText == null)
                    this.doSetup();
                else
                    this.readImport(this.startLayoutText);
            } else
                console.log("Bad file server response:" + response.statusText);
        } catch (e) {
            console.log("failed file reading", e);
        }
    }

    processSetupList(text: string): void {
        const lines = text.split("\n");
        for (const rawLine of lines) {
            const line = rawLine.replace(/\r$/, "");
            if (line.length === 0)
                continue;
            if (line.charAt(0) === '#')
                continue;
            const i = line.indexOf(' ');
            if (i > 0) {
                const title = line.substring(i + 1);
                const first = line.charAt(0) === '>';
                const file = line.substring(first ? 1 : 0, i);
                const s = new FileSetup(this, title, file);
                this.setupList.push(s);
                this.setupChooser.add("Example: " + title);
            }
        }
    }

    readSetupFile(str: string, _title: string): void {
        this.resetTime();
        this.console("reading example " + str);
        const url = "examples/" + str + "?v=" + Math.floor(Math.random() * 0x7fffffff);
        this.loadFileFromURL(url);
        this.enableDisableUI();
    }

    async loadFileFromURL(url: string): Promise<void> {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const text = await response.text();
                this.readImport(text);
            } else
                console.log("Bad file server response:" + response.statusText);
        } catch (e) {
            console.log("failed file reading", e);
        }
    }

    dumpLayout(): string {
        let dump = "$ 1 " + this.windowWidth + " " + this.windowOffsetX + " 0 " +
            this.displayChooser.getSelectedIndex() + " " + this.brightnessBar.getValue() + " " +
            this.lengthScale + " " + this.equipotentialBar.getValue() + "\n";
        for (let i = 0; i !== this.dragObjects.length; i++)
            dump += this.dragObjects[i].dump() + "\n";
        return dump;
    }

    readImport(s: string, retain: boolean = false): void {
        if (!retain) {
            this.resetTime();
            this.deleteAllObjects();
        }
        const lines = s.split(/\r\n|\r|\n/);
        let storedWidth = this.windowWidth;
        for (const line of lines) {
            if (line.length === 0)
                continue;
            const st = new StringTokenizer(line, " +\t\n\r\f");
            if (!st.hasMoreTokens())
                continue;
            const type = st.nextToken();
            let tint = type.charCodeAt(0);
            try {
                if (tint === '$'.charCodeAt(0)) {
                    const flags = parseInt(st.nextToken());
                    if ((flags & 1) === 0)
                        return;
                    const ww = parseInt(st.nextToken());
                    const wo = parseInt(st.nextToken());
                    storedWidth = ww;
                    this.setResolution(ww + wo * 2, wo);
                    this.reinit(false);

                    st.nextToken();
                    st.nextToken();

                    this.brightnessBar.setValue(parseInt(st.nextToken()));
                    this.lengthScale = parseFloat(st.nextToken());
                    try {
                        this.equipotentialBar.setValue(parseInt(st.nextToken()));
                    } catch (e) { /* ignored */ }
                    continue;
                }
                if (tint >= '0'.charCodeAt(0) && tint <= '9'.charCodeAt(0))
                    tint = parseInt(type);
                const newobj = this.createObj(tint, st);
                if (newobj == null) {
                    this.console("unrecognized dump type: " + type);
                    continue;
                }
                if (newobj.getDumpType() !== tint)
                    this.console("dump type mismatch for " + tint);
                this.dragObjects.push(newobj);
            } catch (ee) {
                this.console("got exception when reading setup");
                continue;
            }
        }

        for (let i = 0; i !== this.dragObjects.length; i++)
            this.dragObjects[i].rescale(this.windowWidth / storedWidth);

        this.setDamping();
        this.needsRecalculate();
        this.enableDisableUI();
    }

    // ==================== mouse / touch interaction ====================

    private eventPos(event: MouseEvent): { x: number, y: number } {
        const rect = this.cv.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    getPointFromEvent(event: MouseEvent): Point {
        const p = this.eventPos(event);
        const xp = Math.trunc(p.x * this.windowWidth / this.winSize.width);
        const yp = Math.trunc(p.y * this.windowHeight / this.winSize.height);
        return new Point(xp, yp);
    }

    getRealTime(): number { return this.t; }

    onMouseUp(event: MouseEvent): void {
        event.preventDefault();
        this.dragging = false;
        this.dragSet = this.dragClear = false;
        if (this.mouseObject == null)
            this.preserveSelection = false;
    }

    onMouseMove(event: MouseEvent): void {
        event.preventDefault();
        this.doMouseMove(event);
    }

    doMouseMove(event: MouseEvent): void {
        const pt = this.getPointFromEvent(event);
        this.mouseLocation = pt;
        if (this.rotationMode) {
            this.selectedObject!.rotateTo(pt.x, pt.y);
            return;
        }
        if (this.dragging) {
            this.dragMouse(event);
            this.repaint();
            return;
        }
        const p = this.eventPos(event);
        const x = p.x, y = p.y;

        this.dragPoint = this.getPointFromEvent(event);
        this.dragStartX = this.dragX = x;
        this.dragStartY = this.dragY = y;

        const minf = 5 * this.windowWidth / this.winSize.height + 1;
        let bestf = minf;
        const mp = this.getPointFromEvent(event);
        this.draggingHandle = null;
        if (this.selectedObject != null) {
            const pt2 = this.selectedObject.inverseTransformPoint(mp);
            for (let i = 0; i !== this.selectedObject.handles.length; i++) {
                const dh = this.selectedObject.handles[i];
                const r = DragObject.hypotf(pt2.x - dh.x, pt2.y - dh.y);
                if (r < bestf) {
                    this.draggingHandle = dh;
                    bestf = r;
                }
            }
            if (this.draggingHandle != null)
                return;
        }

        let sel: DragObject | null = null;
        bestf = 1e8;
        for (let i = 0; i !== this.dragObjects.length; i++) {
            const obj = this.dragObjects[i];
            const p2 = obj.inverseTransformPoint(mp);
            const ht = obj.hitTest(p2.x, p2.y);
            if (ht > minf && !obj.hitTestInside(p2.x, p2.y))
                continue;
            if (ht < bestf) {
                sel = obj;
                bestf = ht;
            }
        }
        if (!this.preserveSelection)
            this.setSelectedObject(sel);
        this.mouseObject = sel;
        this.repaint();
    }

    getUnitText(v: number, u: string): string {
        const va = Math.abs(v);
        const fmt2 = (x: number) => (Math.round(x * 100) / 100).toString();
        const fmt1 = (x: number) => (Math.round(x * 10) / 10).toString();
        if (va < 1e-14) return "0 " + u;
        if (va < 1e-9) return fmt2(v * 1e12) + " p" + u;
        if (va < 1e-6) return fmt2(v * 1e9) + " n" + u;
        if (va < 1e-3) return fmt2(v * 1e6) + " μ" + u;
        if (va < 1e-2 || (va < 1 && u !== "m")) return fmt2(v * 1e3) + " m" + u;
        if (va < 1) return fmt2(v * 1e2) + " c" + u;
        if (va < 1e3) return fmt2(v) + " " + u;
        if (va < 1e6) return fmt2(v * 1e-3) + " k" + u;
        if (va < 1e9) return fmt2(v * 1e-6) + " M" + u;
        if (va < 1e12) return fmt1(v * 1e-9) + " G" + u;
        if (va < 1e15) return fmt1(v * 1e-12) + " T" + u;
        if (va < 1e18) return fmt1(v * 1e-15) + " P" + u;
        return fmt2(v * 1e-18) + " E" + u;
    }

    getLengthText(px: number): string {
        return this.getUnitText(px * this.lengthScale, "m");
    }

    dragMouse(event: MouseEvent): void {
        if (this.displayChooser.getSelectedIndex() === EMStatic.DISP_3D) {
            const p = this.eventPos(event);
            this.view3dDrag(p.x, p.y);
            return;
        }
        this.dragging = true;

        const pt = this.getPointFromEvent(event);
        if (this.draggingHandle != null) {
            const mp = this.selectedObject!.inverseTransformPoint(pt);
            this.draggingHandle.dragTo(mp.x, mp.y);
            this.calcLevel = 0;
        } else if (this.isSelection()) {
            if (this.dragPoint!.x !== pt.x || this.dragPoint!.y !== pt.y) {
                for (let i = 0; i !== this.dragObjects.length; i++) {
                    const obj = this.dragObjects[i];
                    if (obj.isSelected())
                        obj.drag(pt.x - this.dragPoint!.x, pt.y - this.dragPoint!.y);
                }
                this.dragPoint = pt;
                this.calcLevel = 0;
            }
        }
    }

    isSelection(): boolean {
        for (let i = 0; i !== this.dragObjects.length; i++)
            if (this.dragObjects[i].isSelected())
                return true;
        return false;
    }

    enableDisableUI(): void {
        // (frequency bar UI removed upstream; kept as a no-op hook for parity)
    }

    onMouseDown(event: MouseEvent): void {
        event.preventDefault();
        this.pushUndo();
        this.doMouseMove(event);
        if (this.rotationMode) {
            this.rotationMode = false;
            return;
        }
        this.dragging = true;

        if (this.displayChooser.getSelectedIndex() === EMStatic.DISP_3D)
            return;

        if (this.draggingHandle == null) {
            if (this.mouseObject == null)
                this.setSelectedObject(null);
            else {
                if (!this.mouseObject.isSelected())
                    this.setSelectedObject(this.mouseObject);
                this.preserveSelection = true;
            }
        }
    }

    setSelectedObject(obj: DragObject | null): void {
        if (obj != null && obj.isSelected())
            return;
        for (let i = 0; i !== this.dragObjects.length; i++)
            this.dragObjects[i].setSelected(false);
        this.selectedObject = obj;
        if (obj != null)
            obj.setSelected(true);
        this.preserveSelection = false;
    }

    onMouseWheel(event: WheelEvent): void {
        event.preventDefault();
        if (this.selectedObject != null && this.selectedObject.canRotate()) {
            const dy = event.deltaY + this.mouseWheelAccum;
            const dy10 = Math.trunc(dy / 10);
            this.mouseWheelAccum = dy - dy10 * 10;
            this.selectedObject.rotate(dy10 * Math.PI / 12);
            this.preserveSelection = true;
        }
        if (this.displayChooser.getSelectedIndex() === EMStatic.DISP_3D) {
            this.zoom3d *= Math.exp(-event.deltaY * .01);
            EMStatic.set3dViewZoom(this.zoom3d);
        }
        this.repaint();
    }

    onMouseOut(_event: MouseEvent): void {
        this.dragging = false;
        this.dragSet = this.dragClear = false;
        this.mouseLocation = null;
    }

    private contextPanel: HTMLElement | null = null;
    menuX = 0;
    menuY = 0;

    onContextMenu(e: MouseEvent): void {
        e.preventDefault();
        this.menuX = e.clientX;
        this.menuY = e.clientY;
        this.doPopupMenu();
    }

    longPress(): void {
        this.menuX = this.dragStartX;
        this.menuY = this.dragStartY;
        this.doPopupMenu();
    }

    closeContextPanel(): void {
        if (this.contextPanel != null) {
            document.body.removeChild(this.contextPanel);
            this.contextPanel = null;
        }
    }

    doPopupMenu(): void {
        this.closeContextPanel();
        const panel = document.createElement("div");
        panel.className = "context-menu";
        document.body.appendChild(panel);
        this.contextPanel = panel;

        if (this.selectedObject != null) {
            for (const d of this.elmMenuItems) {
                const item = document.createElement("button");
                item.className = "menu-item";
                item.textContent = d.label!;
                if (d.label === "Edit")
                    item.disabled = this.selectedObject.getEditInfo(0) == null;
                if (d.label === "Rotate")
                    item.disabled = !this.selectedObject.canRotate();
                item.addEventListener("click", () => { this.closeContextPanel(); d.action!(); });
                panel.appendChild(item);
            }
            panel.style.left = this.menuX + "px";
            panel.style.top = this.menuY + "px";
        } else {
            for (const d of this.mainMenuItems) {
                const item = document.createElement("button");
                item.className = "menu-item";
                item.textContent = d.label!;
                item.addEventListener("click", () => { this.closeContextPanel(); d.action!(); });
                panel.appendChild(item);
            }
            const x = Math.max(0, Math.min(this.menuX, this.cv.width - 400));
            const y = Math.max(0, Math.min(this.menuY, this.cv.height - 450));
            panel.style.left = x + "px";
            panel.style.top = y + "px";
        }

        const closeOnOutside = (ev: MouseEvent) => {
            if (this.contextPanel && !this.contextPanel.contains(ev.target as Node)) {
                this.closeContextPanel();
                document.removeEventListener("mousedown", closeOnOutside);
            }
        };
        setTimeout(() => document.addEventListener("mousedown", closeOnOutside), 0);
    }

    onDoubleClick(event: MouseEvent): void {
        event.preventDefault();
    }

    doCreateWall(): void {
        const w = new Wall();
        w.setInitialPosition();
        this.dragObjects.push(w);
    }

    findSpace(obj: DragObject, _sx: number, _sy: number): Rectangle {
        const spsize = 20;
        const spacegrid: boolean[][] = [];
        for (let i = 0; i !== spsize; i++)
            spacegrid.push(new Array(spsize).fill(false));

        for (let i = 0; i !== this.dragObjects.length; i++) {
            const d = this.dragObjects[i];
            const r = d.boundingBox();
            for (let jx = Math.trunc(r.x * spsize / this.windowWidth); jx <= Math.trunc((r.x + r.width) * spsize / this.windowWidth); jx++)
                for (let jy = Math.trunc(r.y * spsize / this.windowHeight); jy <= Math.trunc((r.y + r.height) * spsize / this.windowHeight); jy++)
                    if (jx >= 0 && jy >= 0 && jx < spsize && jy < spsize)
                        spacegrid[jx][jy] = true;
        }

        let spiralIndex = 1, spiralCounter = 1;
        let tx = Math.trunc(spsize / 2);
        let ty = Math.trunc(spsize / 2);
        let dx = 1, dy = 0;
        while (true) {
            if (!spacegrid[tx][ty]) {
                return new Rectangle(Math.trunc(tx * this.windowWidth / spsize) + 2, Math.trunc(ty * this.windowHeight / spsize) + 2,
                    Math.trunc(this.windowWidth / spsize) - 4, Math.trunc(this.windowHeight / spsize) - 4);
            }
            tx += dx;
            ty += dy;
            if (--spiralIndex === 0) {
                const d0 = dx;
                dx = dy;
                dy = -d0;
                if (dy === 0) spiralCounter++;
                spiralIndex = spiralCounter;
            }
            if (tx < 0 || ty < 0 || tx >= spsize || ty >= spsize)
                break;
        }
        return new Rectangle(Math.trunc(this.gridSizeX / 2), Math.trunc(this.gridSizeY / 2), spsize, spsize);
    }

    onClick(_event: MouseEvent): void {
        this.repaint();
    }

    onChange(source: Choice): void {
        if (source === this.setupChooser)
            this.doSetup();
        if (source === this.colorChooser)
            this.doColor();
        this.repaint();
    }

    // ==================== undo / redo / clipboard ====================

    pushUndo(): void {
        const s = this.dumpLayout();
        if (this.undoStack.length > 0 && s === this.undoStack[this.undoStack.length - 1])
            return;
        this.redoStack = [];
        this.undoStack.push(s);
        this.enableUndoRedo();
    }

    doUndo(): void {
        if (this.undoStack.length === 0)
            return;
        this.redoStack.push(this.dumpLayout());
        const s = this.undoStack.pop()!;
        this.readImport(s);
        this.enableUndoRedo();
    }

    doRedo(): void {
        if (this.redoStack.length === 0)
            return;
        this.undoStack.push(this.dumpLayout());
        const s = this.redoStack.pop()!;
        this.readImport(s);
        this.enableUndoRedo();
    }

    enableUndoRedo(): void {
        this.redoItem.disabled = this.redoStack.length === 0;
        this.undoItem.disabled = this.undoStack.length === 0;
    }

    setMenuSelection(): void {
        if (this.menuObject != null) {
            if (this.menuObject.selected)
                return;
            this.clearSelection();
            this.menuObject.setSelected(true);
        }
    }

    doCut(): void {
        this.pushUndo();
        this.setMenuSelection();
        this.clipboard = "";
        for (let i = this.dragObjects.length - 1; i >= 0; i--) {
            const ce = this.dragObjects[i];
            if (ce.isSelected()) {
                this.clipboard = ce.dump() + "\n" + this.clipboard;
                ce.delete();
                this.dragObjects.splice(i, 1);
            }
        }
        this.writeClipboardToStorage();
        this.enablePaste();
        this.needsRecalculate();
    }

    writeClipboardToStorage(): void {
        try { localStorage.setItem("emstaticClipboard", this.clipboard); } catch (e) { /* ignored */ }
    }

    readClipboardFromStorage(): void {
        try {
            const v = localStorage.getItem("emstaticClipboard");
            if (v != null) this.clipboard = v;
        } catch (e) { /* ignored */ }
    }

    doDelete(): void {
        this.pushUndo();
        this.setMenuSelection();
        let hasDeleted = false;
        for (let i = this.dragObjects.length - 1; i >= 0; i--) {
            const ce = this.dragObjects[i];
            if (ce.isSelected()) {
                ce.delete();
                this.dragObjects.splice(i, 1);
                hasDeleted = true;
            }
        }
        if (hasDeleted)
            this.needsRecalculate();
    }

    doCopy(): void {
        this.clipboard = "";
        this.setMenuSelection();
        for (let i = this.dragObjects.length - 1; i >= 0; i--) {
            const ce = this.dragObjects[i];
            if (ce.isSelected())
                this.clipboard += ce.dump() + "\n";
        }
        this.writeClipboardToStorage();
        this.enablePaste();
    }

    enablePaste(): void {
        if (this.clipboard == null || this.clipboard.length === 0)
            this.readClipboardFromStorage();
        this.pasteItem.disabled = !(this.clipboard != null && this.clipboard.length > 0);
    }

    doDuplicate(): void {
        let s = "";
        this.setMenuSelection();
        for (let i = 0; i !== this.dragObjects.length; i++) {
            const ce = this.dragObjects[i];
            if (ce.isSelected())
                s += ce.dump() + "\n";
        }
        this.doPaste(s);
    }

    doPaste(dump: string | null): void {
        this.pushUndo();
        this.clearSelection();
        const oldsz = this.dragObjects.length;
        if (dump != null)
            this.readImport(dump, true);
        else {
            this.readClipboardFromStorage();
            this.readImport(this.clipboard, true);
        }

        for (let i = oldsz; i !== this.dragObjects.length; i++) {
            const ce = this.dragObjects[i];
            for (let j = 0; j !== oldsz; j++) {
                if (ce.boundingBox().equals(this.dragObjects[j].boundingBox())) {
                    ce.drag(Math.trunc(this.windowWidth / 32), 0);
                    j = -1;
                }
            }
            ce.setSelected(true);
        }
        if (this.dragObjects.length === oldsz + 1)
            this.selectedObject = this.dragObjects[oldsz];
        this.preserveSelection = true;
        this.needsRecalculate();
    }

    clearSelection(): void {
        for (let i = 0; i !== this.dragObjects.length; i++)
            this.dragObjects[i].setSelected(false);
        this.selectedObject = null;
        this.preserveSelection = false;
    }

    doSelectAll(): void {
        for (let i = 0; i !== this.dragObjects.length; i++)
            this.dragObjects[i].setSelected(true);
        this.selectedObject = null;
        this.preserveSelection = true;
    }

    createNewLoadFile(): void {
        if (this.loadFileInput == null)
            return;
        const old = this.loadFileInput.element;
        const newlf = new LoadFile(this);
        old.parentElement!.replaceChild(newlf.element, old);
        this.loadFileInput = newlf;
    }

    canMakeFloating(obj: DragObject): boolean {
        let ct = 0;
        for (let i = 0; i !== this.dragObjects.length; i++) {
            const ce = this.dragObjects[i];
            if (ce.isFloating() && obj !== ce)
                ct++;
        }
        return ct === 0;
    }
}
