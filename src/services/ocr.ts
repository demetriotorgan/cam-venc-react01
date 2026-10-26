
import { recognize } from 'tesseract.js';

export async function testarOCR(imagem: string) {
  const resultado = await recognize(imagem, 'por');

  console.log('Texto reconhecido:');
  console.log(resultado.data.text);

  console.log('Confiança:', resultado.data.confidence);

  return resultado.data.text;
}
