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

export class ExportAsLocalFileDialog {
    static lastFileName: string | null = null;

    dialogEl: HTMLDialogElement;
    private textBox: HTMLInputElement;
    private blobUrl: string;

    static downloadIsSupported(): boolean {
        return "download" in document.createElement("a");
    }

    static getBlobUrl(data: string): string {
        const oldBlob = (document as any).exportBlob;
        if (oldBlob)
            URL.revokeObjectURL(oldBlob);
        const blob = new Blob([data], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        (document as any).exportBlob = url;
        return url;
    }

    static setLastFileName(s: string | null): void {
        // remember filename for use when saving a new file.
        // if s is null or automatically generated then just clear out old filename.
        if (s == null || s.startsWith("emstatic-"))
            ExportAsLocalFileDialog.lastFileName = null;
        else
            ExportAsLocalFileDialog.lastFileName = s;
    }

    constructor(data: string) {
        this.dialogEl = document.createElement("dialog");
        this.dialogEl.className = "exportDialog";
        document.body.appendChild(this.dialogEl);

        const vp = document.createElement("div");
        this.dialogEl.appendChild(vp);

        const title = document.createElement("div");
        title.className = "dialogTitle";
        title.textContent = "Export as Local File";
        vp.appendChild(title);

        const label = document.createElement("div");
        label.textContent = "File name:";
        vp.appendChild(label);

        const tb = document.createElement("input");
        tb.type = "text";
        tb.style.width = "250px";
        this.textBox = tb;
        vp.appendChild(tb);

        this.blobUrl = ExportAsLocalFileDialog.getBlobUrl(data);

        let fname: string;
        if (ExportAsLocalFileDialog.lastFileName != null) {
            fname = ExportAsLocalFileDialog.lastFileName;
        } else {
            const now = new Date();
            const pad = (n: number) => String(n).padStart(2, "0");
            fname = `emstatic-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.txt`;
        }
        tb.value = fname;

        const hp = document.createElement("div");
        hp.className = "hpanel topSpace";
        vp.appendChild(hp);

        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.onclick = () => {
            this.apply();
            this.closeDialog();
        };
        hp.appendChild(okButton);

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.onclick = () => this.closeDialog();
        hp.appendChild(cancelButton);
    }

    apply(): void {
        let fname = this.textBox.value;
        if (!fname.includes("."))
            fname += ".txt";
        ExportAsLocalFileDialog.setLastFileName(fname);
        const a = document.createElement("a");
        a.href = this.blobUrl;
        a.setAttribute("download", fname);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    show(): void {
        this.dialogEl.showModal();
    }

    closeDialog(): void {
        this.dialogEl.close();
        document.body.removeChild(this.dialogEl);
    }
}
