import QRCode from "qrcode"

// Returns a 2D boolean array where true = dark module
export async function getQrMatrix(text: string): Promise<boolean[][]> {
  // Use error level H for maximum data recovery (matches QRCodeCanvas default)
  const data = await QRCode.create(text || " ", { errorCorrectionLevel: "H" })
  const size = data.modules.size
  const matrix: boolean[][] = []
  for (let r = 0; r < size; r++) {
    matrix[r] = []
    for (let c = 0; c < size; c++) {
      matrix[r][c] = data.modules.get(r, c) === 1
    }
  }
  return matrix
}
