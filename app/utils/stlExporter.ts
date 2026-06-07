// Generates two binary STL files for bicolor 3D printing.
//
// Bicolor technique: import BOTH files into your slicer (Bambu Studio, PrusaSlicer, Orca...)
// as a multi-material project. Assign color 1 to the base, color 2 to the modules.
// The slicer aligns them perfectly since they share the same coordinate origin.

export type StlOptions = {
  moduleSize: number   // mm per QR module
  baseHeight: number   // mm height of base plate
  moduleHeight: number // mm height of extruded modules above base
}

type Vec3 = [number, number, number]

type Triangle = {
  normal: Vec3
  v1: Vec3
  v2: Vec3
  v3: Vec3
}

const quad = (normal: Vec3, a: Vec3, b: Vec3, c: Vec3, d: Vec3): Triangle[] => {
  return [
    { normal, v1: a, v2: b, v3: c },
    { normal, v1: a, v2: c, v3: d },
  ]
}

const buildStlBlob = (triangles: Triangle[], header: string): Blob => {
  const count = triangles.length
  const buf = new ArrayBuffer(84 + count * 50)
  const view = new DataView(buf)

  for (let i = 0; i < Math.min(header.length, 80); i++) {
    view.setUint8(i, header.charCodeAt(i))
  }
  view.setUint32(80, count, true)

  let offset = 84
  for (const tri of triangles) {
    for (const [x, y, z] of [tri.normal, tri.v1, tri.v2, tri.v3]) {
      view.setFloat32(offset, x, true); offset += 4
      view.setFloat32(offset, y, true); offset += 4
      view.setFloat32(offset, z, true); offset += 4
    }
    view.setUint16(offset, 0, true); offset += 2
  }

  return new Blob([buf], { type: "application/octet-stream" })
}

export type StlPair = {
  merged: Blob  // single file, all geometry combined
  base: Blob    // color 1 — solid base plate
  modules: Blob // color 2 — raised QR modules only
}

export const generateStl = (matrix: boolean[][], opts: StlOptions): StlPair => {
  const { moduleSize, baseHeight, moduleHeight } = opts
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  const totalW = cols * moduleSize
  const totalH = rows * moduleSize
  const totalZ = baseHeight + moduleHeight

  const baseTris: Triangle[] = []
  const modTris: Triangle[] = []

  // --- BASE PLATE ---
  // Bottom face
  baseTris.push(...quad([0, 0, -1],
    [0, 0, 0], [totalW, 0, 0], [totalW, totalH, 0], [0, totalH, 0]
  ))
  // Outer walls
  baseTris.push(...quad([0, -1, 0],
    [0, 0, 0], [totalW, 0, 0], [totalW, 0, baseHeight], [0, 0, baseHeight]
  ))
  baseTris.push(...quad([0, 1, 0],
    [totalW, totalH, 0], [0, totalH, 0], [0, totalH, baseHeight], [totalW, totalH, baseHeight]
  ))
  baseTris.push(...quad([-1, 0, 0],
    [0, totalH, 0], [0, 0, 0], [0, 0, baseHeight], [0, totalH, baseHeight]
  ))
  baseTris.push(...quad([1, 0, 0],
    [totalW, 0, 0], [totalW, totalH, 0], [totalW, totalH, baseHeight], [totalW, 0, baseHeight]
  ))

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dark = matrix[row][col]
      const x0 = col * moduleSize
      const x1 = x0 + moduleSize
      const y0 = row * moduleSize
      const y1 = y0 + moduleSize

      if (dark) {
        // Top face of the base is covered by a module — skip it to avoid z-fighting.
        // Instead the module body starts flush at z=0 and goes to totalZ,
        // so the slicer correctly assigns the full column to color 2.
        modTris.push(...quad([0, 0, 1],
          [x0, y0, totalZ], [x1, y0, totalZ], [x1, y1, totalZ], [x0, y1, totalZ]
        ))
        modTris.push(...quad([0, 0, -1],
          [x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]
        ))
        modTris.push(...quad([0, -1, 0],
          [x0, y0, 0], [x1, y0, 0], [x1, y0, totalZ], [x0, y0, totalZ]
        ))
        modTris.push(...quad([0, 1, 0],
          [x1, y1, 0], [x0, y1, 0], [x0, y1, totalZ], [x1, y1, totalZ]
        ))
        modTris.push(...quad([-1, 0, 0],
          [x0, y1, 0], [x0, y0, 0], [x0, y0, totalZ], [x0, y1, totalZ]
        ))
        modTris.push(...quad([1, 0, 0],
          [x1, y0, 0], [x1, y1, 0], [x1, y1, totalZ], [x1, y0, totalZ]
        ))
      } else {
        // Top face of base plate where there is no module
        baseTris.push(...quad([0, 0, 1],
          [x0, y0, baseHeight], [x1, y0, baseHeight], [x1, y1, baseHeight], [x0, y1, baseHeight]
        ))
      }
    }
  }

  return {
    merged: buildStlBlob([...baseTris, ...modTris], "Lootopia QR - merged"),
    base: buildStlBlob(baseTris, "Lootopia QR - base plate (color 1)"),
    modules: buildStlBlob(modTris, "Lootopia QR - modules (color 2)"),
  }
}
