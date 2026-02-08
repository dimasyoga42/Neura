import axios from "axios";

export async function addOverlayFromUrl(imageUrl, text) {
  try {

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const inputBuffer = Buffer.from(response.data, 'binary');


    const metadata = await sharp(inputBuffer).metadata();
    const width = metadata.width;


    const overlayHeight = Math.floor(metadata.height * 0.15);


    const svgOverlay = `
        <svg width="${width}" height="${overlayHeight}">
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" />
            <text x="10%" y="50%" text-anchor="middle" dy=".3em"
                fill="white" font-family="Arial" font-size="${Math.floor(overlayHeight * 0.4)}" font-weight="bold">
                ${text}
            </text>
        </svg>`;


    const outputBuffer = await sharp(inputBuffer)
      .composite([{
        input: Buffer.from(svgOverlay),
        gravity: 'south'
      }])
      .toBuffer();

    return outputBuffer;
  } catch (error) {
    console.error("Gagal memproses gambar:", error);
    throw error;
  }
}
