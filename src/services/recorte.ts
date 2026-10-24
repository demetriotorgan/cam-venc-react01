import {
  calcularRecorte,
  type CoordenadasRecorte,
} from './geometria';

interface RecortarImagemParams {
  video: HTMLVideoElement;
  moldura: HTMLElement;
  imagem: HTMLImageElement;
}

export interface ResultadoRecorte {
  blob: Blob;
  coordenadas: CoordenadasRecorte;
  largura: number;
  altura: number;
}

/**
 * Recorta uma região da fotografia original.
 *
 * A geometria calcula as coordenadas.
 * Este módulo executa o recorte e gera um novo Blob.
 */
export async function recortarImagem({
  video,
  moldura,
  imagem,
}: RecortarImagemParams): Promise<ResultadoRecorte> {
  // Aguarda a fotografia estar disponível.
  if (!imagem.complete || !imagem.naturalWidth) {
    await imagem.decode();
  }

  if (!imagem.naturalWidth || !imagem.naturalHeight) {
    throw new Error('A imagem original não possui dimensões válidas.');
  }

   

  // console.group('[INSPEÇÃO DO RECORTE] 1. Elementos');

  // console.log('Vídeo na tela:', {
  //   esquerda: videoRect.left,
  //   topo: videoRect.top,
  //   largura: videoRect.width,
  //   altura: videoRect.height,
  // });

  // console.log('Moldura na tela:', {
  //   esquerda: molduraRect.left,
  //   topo: molduraRect.top,
  //   largura: molduraRect.width,
  //   altura: molduraRect.height,
  // });

  // console.log('Imagem original:', {
  //   largura: imagem.naturalWidth,
  //   altura: imagem.naturalHeight,
  // });

  // console.groupEnd();

  // Calcula as posições dos elementos na tela.

  const videoRect = video.getBoundingClientRect();
  const molduraRect = moldura.getBoundingClientRect();

  const coordenadas = calcularRecorte({
    areaVisualizacao: {
      esquerda: videoRect.left,
      topo: videoRect.top,
      largura: videoRect.width,
      altura: videoRect.height,
    },
    moldura: {
      esquerda: molduraRect.left,
      topo: molduraRect.top,
      largura: molduraRect.width,
      altura: molduraRect.height,
    },
    imagem: {
      largura: imagem.naturalWidth,
      altura: imagem.naturalHeight,
    },
  });

  const { x, y, largura, altura } = coordenadas;

  // Valida as coordenadas antes de recortar.
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    !Number.isInteger(largura) ||
    !Number.isInteger(altura) ||
    x < 0 ||
    y < 0 ||
    largura <= 0 ||
    altura <= 0 ||
    x + largura > imagem.naturalWidth ||
    y + altura > imagem.naturalHeight
  ) {
    throw new Error(
      'As coordenadas do recorte estão fora dos limites da imagem.',
    );
  }

  // Canvas exclusivo para o recorte.
  const canvasRecorte = document.createElement('canvas');

  canvasRecorte.width = largura;
  canvasRecorte.height = altura;

  const contexto = canvasRecorte.getContext('2d');

  if (!contexto) {
    throw new Error(
      'Não foi possível criar o contexto do Canvas.',
    );
  }

  // Copia somente a região selecionada.
  contexto.drawImage(
    imagem,
    x,
    y,
    largura,
    altura,
    0,
    0,
    largura,
    altura,
  );

  // Exporta o resultado como JPEG.
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvasRecorte.toBlob(
      (resultado) => {
        if (resultado) {
          resolve(resultado);
        } else {
          reject(
            new Error('Não foi possível gerar o recorte.'),
          );
        }
      },
      'image/jpeg',
      0.95,
    );
  });

  return {
    blob,
    coordenadas,
    largura: canvasRecorte.width,
    altura: canvasRecorte.height,
  };
}
