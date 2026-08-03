# emstatic

Electrostatics, webgl version

Source for http://www.falstad.com/emstatic/

## Introduction

EMStatic is an electrostatics simulator that runs in the browser, using WebGL
(a multigrid solver) to compute and render potential, electric field, charge,
and polarization for arrangements of charges, conductors, and dielectrics.

This is a TypeScript/Vite port of the original GWT/Java version of EMStatic.
The WebGL rendering code (`renderer.js`) is carried over largely as-is; the
UI and simulation logic have been rewritten in TypeScript.

## Building and running

Requires [Node.js](https://nodejs.org/).

```bash
npm install
npm run dev
```

This starts a local dev server (default http://localhost:5174/) with hot
reload.

Other scripts:

```bash
npm run build    # type-check, then build a plain dist/ for local testing
npm run preview  # serve the last build of dist/ locally
npm run dist     # build a versioned distribution for deployment (see below)
```

## Deployment

`npm run dist` type-checks and builds a versioned distribution, mirroring
the deployment layout used by the original GWT app: each build goes into
its own `emstaticN/` directory (so old cached assets can never collide with
a new release), and `dist/EMStatic.html` is generated separately with a
`<base href="./emstaticN/">` tag pointing into it.

```
dist/
  EMStatic.html   - upload this and emstaticN/ to your web server
  emstatic5/
    assets/       - hashed JS/CSS bundle
    examples/     - example layouts
    setuplist.txt - index into examples/
    ... vendored WebGL libraries, favicon, etc.
```

The version number is tracked in `.dist-version` and bumped automatically
after each successful build. Upload `EMStatic.html` and the new `emstaticN/`
directory to your web server; there's no need to remove old `emstaticN/`
directories, since nothing links to them once `EMStatic.html` is updated to
point at the latest one.

`index.html` is not produced by this build - it's a separate landing page
(with brief instructions) that loads `EMStatic.html` in an iframe.

## URL query parameters

You can add query parameters to `EMStatic.html` to change the app's
startup behavior:

```
EMStatic.html?dc=<n>       // set the initial display mode (index into the "Show ..." dropdown)
EMStatic.html?eq=<0|1>     // turn "Show Equipotentials" off/on
EMStatic.html?example=<n>  // load the example at index n in the setup list, instead of the default
EMStatic.html?rol=<string> // load a full starting layout, in the same format used by Export as Text
```

Brightness, equipotential count, and vector density aren't settable this
way since they're already saved and restored as part of a layout (`rol`,
or a file loaded via Import).

## License

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
