function crc16(data: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i);
    for (let bit = 0; bit < 8; bit++) {
      const bitOn = ((charCode >> (7 - bit)) & 1) === 1;
      const crcBitOn = ((crc >> 15) & 1) === 1;
      crc <<= 1;
      if (bitOn !== crcBitOn) {
        crc ^= polynomial;
      }
    }
  }

  crc &= 0xffff;
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function formatEMVField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/**
 * Generates a valid Pix Static Copy-and-Paste (Copia e Cola) payload
 * pre-filled with the transaction value and key.
 */
export function generatePixPayload({
  key,
  amount,
  merchantName,
  merchantCity = "SAO PAULO",
  txId = "***",
}: {
  key: string;
  amount: number;
  merchantName: string;
  merchantCity?: string;
  txId?: string;
}): string {
  const cleanKey = key.trim();
  const cleanAmount = amount.toFixed(2);
  
  // Clean Merchant Name: uppercase, alphanumeric, max 25 chars
  const cleanName = merchantName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase()
    .substring(0, 25)
    .trim();

  // Clean Merchant City: uppercase, alphanumeric, max 15 chars
  const cleanCity = merchantCity
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase()
    .substring(0, 15)
    .trim();

  const payloadFormat = formatEMVField("00", "01");
  
  // Merchant Account Info (Tag 26)
  const gui = formatEMVField("00", "br.gov.bcb.pix");
  const keyField = formatEMVField("01", cleanKey);
  const merchantAccountInfo = formatEMVField("26", gui + keyField);
  
  const mcc = formatEMVField("52", "0000");
  const currency = formatEMVField("53", "986"); // BRL Code
  const amountField = formatEMVField("54", cleanAmount);
  const countryCode = formatEMVField("58", "BR");
  const nameField = formatEMVField("59", cleanName || "CASAMENTO");
  const cityField = formatEMVField("60", cleanCity || "SAO PAULO");
  
  // Additional Data Field (Tag 62)
  const cleanTxId = txId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 25) || "***";
  const txIdField = formatEMVField("05", cleanTxId);
  const additionalData = formatEMVField("62", txIdField);

  const rawPayload = 
    payloadFormat +
    merchantAccountInfo +
    mcc +
    currency +
    amountField +
    countryCode +
    nameField +
    cityField +
    additionalData +
    "6304";

  const crc = crc16(rawPayload);
  
  return rawPayload + crc;
}
