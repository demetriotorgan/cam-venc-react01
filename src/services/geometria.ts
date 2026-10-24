
export interface Retangulo {
  esquerda: number;
  topo: number;
  largura: number;
  altura: number;
}

export interface DimensoesImagem {
  largura: number;
  altura: number;
}

export interface CoordenadasRecorte {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

export interface TransformacaoVisual {
  areaVisualizacao: Retangulo;
  moldura: Retangulo;
  imagem: DimensoesImagem;
}

/**
 * Converte a moldura visual em coordenadas da imagem original.
 *
 * Modelo atual:
 * - object-fit: cover
 * - object-position: center
 * - imagem sem espelhamento ou zoom adicional
 *
 * Não depende de React nem do DOM.
 */
export function calcularRecorte({
  areaVisualizacao,
  moldura,
  imagem,
}: TransformacaoVisual): CoordenadasRecorte {
  const { largura: larguraImagem, altura: alturaImagem } = imagem;

  const { largura: larguraVisual, altura: alturaVisual } =
    areaVisualizacao;

  if (
    larguraImagem <= 0 ||
    alturaImagem <= 0 ||
    larguraVisual <= 0 ||
    alturaVisual <= 0
  ) {
    throw new Error(
      'As dimensões da imagem e da visualização devem ser positivas.',
    );
  }

  if (
    moldura.largura <= 0 ||
    moldura.altura <= 0
  ) {
    throw new Error(
      'As dimensões da moldura devem ser positivas.',
    );
  }

  // Posição da moldura relativa à área de visualização.
  const molduraX = moldura.esquerda - areaVisualizacao.esquerda;
  const molduraY = moldura.topo - areaVisualizacao.topo;

  // A moldura deve estar inteiramente dentro da visualização.
  const tolerancia = 0.01;

  if (
    molduraX < -tolerancia ||
    molduraY < -tolerancia ||
    molduraX + moldura.largura > larguraVisual + tolerancia ||
    molduraY + moldura.altura > alturaVisual + tolerancia
  ) {
    throw new Error(
      'A moldura precisa estar dentro da área de visualização.',
    );
  }

  // Escala uniforme usada pelo object-fit: cover.
  const escala = Math.max(
    larguraVisual / larguraImagem,
    alturaVisual / alturaImagem,
  );

  // Dimensões da imagem depois da ampliação.
  const larguraRenderizada = larguraImagem * escala;
  const alturaRenderizada = alturaImagem * escala;

  // Deslocamento causado pelo enquadramento central.
  // Valores negativos indicam partes da imagem fora da visualização.
  const deslocamentoX =
    (larguraVisual - larguraRenderizada) / 2;

  const deslocamentoY =
    (alturaVisual - alturaRenderizada) / 2;

  // Converte a moldura visual para coordenadas da imagem original.
  const xImagem = (molduraX - deslocamentoX) / escala;
  const yImagem = (molduraY - deslocamentoY) / escala;

  const larguraRecorte = moldura.largura / escala;
  const alturaRecorte = moldura.altura / escala;

  // Arredonda os limites, evitando ultrapassar a imagem original.
  const x = Math.max(0, Math.round(xImagem));
  const y = Math.max(0, Math.round(yImagem));

  const direita = Math.min(
    larguraImagem,
    Math.round(xImagem + larguraRecorte),
  );

  const base = Math.min(
    alturaImagem,
    Math.round(yImagem + alturaRecorte),
  );

  const resultado: CoordenadasRecorte = {
    x,
    y,
    largura: direita - x,
    altura: base - y,
  };

  if (
    resultado.largura <= 0 ||
    resultado.altura <= 0
  ) {
    throw new Error(
      'O cálculo produziu uma região de recorte inválida.',
    );
  }

  return resultado;
}
