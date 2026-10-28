
export interface OpcoesPreprocessamento {
    contraste: number;
}

export interface ResultadoPreprocessamento {
    imagem: HTMLCanvasElement;
    largura: number;
    altura: number;
}

export interface OpcoesBinarizacao {
  tamanhoJanela: number;
  sensibilidade: number;
}

export function preprocessarImagem(
    imagem: HTMLImageElement,
    opcoes: OpcoesPreprocessamento = { contraste: 1.5 },
): ResultadoPreprocessamento {
    if (!imagem.complete || imagem.naturalWidth === 0) {
        throw new Error("A imagem ainda não foi carregada corretamente.");
    }

    const largura = imagem.naturalWidth;
    const altura = imagem.naturalHeight;

    const canvas = document.createElement("canvas");
    const contexto = canvas.getContext("2d", {
        willReadFrequently: true,
    });

    if (!contexto) {
        throw new Error("Não foi possível criar o contexto Canvas 2D.");
    }

    canvas.width = largura;
    canvas.height = altura;

    contexto.drawImage(imagem, 0, 0, largura, altura);

    const dados = contexto.getImageData(0, 0, largura, altura);
    const pixels = dados.data;

    const contraste = Math.max(0, opcoes.contraste);
    const fator = contraste;

    for (let i = 0; i < pixels.length; i += 4) {
        const vermelho = pixels[i];
        const verde = pixels[i + 1];
        const azul = pixels[i + 2];

        const cinza =
            0.299 * vermelho +
            0.587 * verde +
            0.114 * azul;

        const ajustado = Math.max(
            0,
            Math.min(255, fator * (cinza - 128) + 128),
        );

        pixels[i] = ajustado;
        pixels[i + 1] = ajustado;
        pixels[i + 2] = ajustado;
        // Preserva o canal alfa original.
    }

    contexto.putImageData(dados, 0, 0);

    return {
        imagem: canvas,
        largura,
        altura,
    };
}

export function binarizarImagemAdaptativa(
  imagem: HTMLImageElement,
  opcoes: OpcoesBinarizacao = {
    tamanhoJanela: 21,
    sensibilidade: 5,
  },
): ResultadoPreprocessamento {
  if (!imagem.complete || imagem.naturalWidth === 0) {
    throw new Error("A imagem ainda não foi carregada corretamente.");
  }

  const largura = imagem.naturalWidth;
  const altura = imagem.naturalHeight;

  const tamanhoJanela = Math.max(
    3,
    Math.floor(opcoes.tamanhoJanela) % 2 === 0
      ? Math.floor(opcoes.tamanhoJanela) + 1
      : Math.floor(opcoes.tamanhoJanela),
  );

  const sensibilidade = opcoes.sensibilidade;

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;

  const contexto = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!contexto) {
    throw new Error("Não foi possível criar o contexto Canvas 2D.");
  }

  contexto.drawImage(imagem, 0, 0, largura, altura);

  const dados = contexto.getImageData(0, 0, largura, altura);
  const pixels = dados.data;

  // Converte os pixels para escala de cinza.
  const cinzas = new Uint8Array(largura * altura);

  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const indice = (y * largura + x) * 4;

      cinzas[y * largura + x] = Math.round(
        0.299 * pixels[indice] +
        0.587 * pixels[indice + 1] +
        0.114 * pixels[indice + 2],
      );
    }
  }

  // Soma acumulada para calcular médias locais rapidamente.
  const stride = largura + 1;
  const integral = new Float64Array((largura + 1) * (altura + 1));

  for (let y = 1; y <= altura; y++) {
    let somaLinha = 0;

    for (let x = 1; x <= largura; x++) {
      somaLinha += cinzas[(y - 1) * largura + (x - 1)];

      integral[y * stride + x] =
        integral[(y - 1) * stride + x] + somaLinha;
    }
  }

  const raio = Math.floor(tamanhoJanela / 2);

  for (let y = 0; y < altura; y++) {
    const y1 = Math.max(0, y - raio);
    const y2 = Math.min(altura, y + raio + 1);

    for (let x = 0; x < largura; x++) {
      const x1 = Math.max(0, x - raio);
      const x2 = Math.min(largura, x + raio + 1);

      const soma =
        integral[y2 * stride + x2] -
        integral[y1 * stride + x2] -
        integral[y2 * stride + x1] +
        integral[y1 * stride + x1];

      const quantidade = (x2 - x1) * (y2 - y1);
      const mediaLocal = soma / quantidade;
      const limiar = mediaLocal - sensibilidade;

      const valor = cinzas[y * largura + x];
      const indice = (y * largura + x) * 4;

      // Pixel escuro vira preto; pixel claro vira branco.
      const binario = valor <= limiar ? 0 : 255;

      pixels[indice] = binario;
      pixels[indice + 1] = binario;
      pixels[indice + 2] = binario;
      // O canal alfa permanece inalterado.
    }
  }

  contexto.putImageData(dados, 0, 0);

  return {
    imagem: canvas,
    largura,
    altura,
  };
}