
import { useEffect, useState } from "react";
import {
  binarizarImagemAdaptativa,
  preprocessarImagem,
  type ResultadoPreprocessamento,
} from "../../services/preprocessamento";
import "./TesteRF28.css";

type Tecnica = "original" | "contraste" | "binarizacao";

export default function TesteRF28() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [imagemOriginal, setImagemOriginal] =
    useState<HTMLImageElement | null>(null);
  const [resultado, setResultado] =
    useState<ResultadoPreprocessamento | null>(null);

  const [tecnica, setTecnica] = useState<Tecnica>("binarizacao");
  const [contraste, setContraste] = useState(1.5);
  const [tamanhoJanela, setTamanhoJanela] = useState(21);
  const [sensibilidade, setSensibilidade] = useState(5);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!arquivo) {
      setImagemOriginal(null);
      setResultado(null);
      return;
    }

    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();

    imagem.onload = () => {
      setImagemOriginal(imagem);
      setErro("");
    };

    imagem.onerror = () => {
      setErro("Não foi possível carregar a imagem selecionada.");
    };

    imagem.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [arquivo]);

  useEffect(() => {
    if (!imagemOriginal || tecnica === "original") {
      setResultado(null);
      return;
    }

    try {
      const processada =
        tecnica === "contraste"
          ? preprocessarImagem(imagemOriginal, { contraste })
          : binarizarImagemAdaptativa(imagemOriginal, {
              tamanhoJanela,
              sensibilidade,
            });

      setResultado(processada);
      setErro("");
    } catch (erroProcessamento) {
      console.error(erroProcessamento);
      setResultado(null);
      setErro("Não foi possível processar a imagem.");
    }
  }, [
    imagemOriginal,
    tecnica,
    contraste,
    tamanhoJanela,
    sensibilidade,
  ]);

  function baixarImagemProcessada() {
    if (!resultado) return;

    resultado.imagem.toBlob((blob) => {
      if (!blob) {
        setErro("Não foi possível gerar o arquivo da imagem.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        tecnica === "binarizacao"
          ? "val1-binarizada.png"
          : "val1-contraste.png";

      link.click();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  const srcOriginal = imagemOriginal?.src;
  const srcProcessada =
    resultado?.imagem.toDataURL("image/png");

  return (
    <main className="laboratorio-rf28">
      <header>
        <h1>Laboratório RF28</h1>
        <p>
          Compare técnicas de pré-processamento sem alterar
          a imagem original nem o Prompt B.
        </p>
      </header>

      <section className="rf28-controles">
        <label htmlFor="imagem-rf28">Selecionar imagem</label>
        <input
          id="imagem-rf28"
          type="file"
          accept="image/*"
          onChange={(evento) =>
            setArquivo(evento.target.files?.[0] ?? null)
          }
        />

        <label htmlFor="tecnica-rf28">Técnica</label>
        <select
          id="tecnica-rf28"
          value={tecnica}
          onChange={(evento) =>
            setTecnica(evento.target.value as Tecnica)
          }
        >
          <option value="original">Original</option>
          <option value="contraste">Escala de cinza + contraste</option>
          <option value="binarizacao">Binarização adaptativa</option>
        </select>

        {tecnica === "contraste" && (
          <>
            <label htmlFor="contraste-rf28">
              Contraste: {contraste.toFixed(1)}
            </label>
            <input
              id="contraste-rf28"
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={contraste}
              onChange={(evento) =>
                setContraste(Number(evento.target.value))
              }
              disabled={!imagemOriginal}
            />
          </>
        )}

        {tecnica === "binarizacao" && (
          <>
            <label htmlFor="janela-rf28">
              Tamanho da janela: {tamanhoJanela}
            </label>
            <input
              id="janela-rf28"
              type="range"
              min="3"
              max="51"
              step="2"
              value={tamanhoJanela}
              onChange={(evento) =>
                setTamanhoJanela(Number(evento.target.value))
              }
              disabled={!imagemOriginal}
            />

            <label htmlFor="sensibilidade-rf28">
              Sensibilidade: {sensibilidade}
            </label>
            <input
              id="sensibilidade-rf28"
              type="range"
              min="-20"
              max="20"
              step="1"
              value={sensibilidade}
              onChange={(evento) =>
                setSensibilidade(Number(evento.target.value))
              }
              disabled={!imagemOriginal}
            />
          </>
        )}

        <button
          type="button"
          onClick={baixarImagemProcessada}
          disabled={!resultado}
        >
          Baixar imagem processada
        </button>
      </section>

      {erro && <p role="alert">{erro}</p>}

      {imagemOriginal && (
        <section className="rf28-comparacao">
          <article className="rf28-cartao">
            <h2>Imagem original</h2>
            <img
              src={srcOriginal}
              alt="Imagem original selecionada"
            />
            <p>
              {imagemOriginal.naturalWidth} ×{" "}
              {imagemOriginal.naturalHeight} pixels
            </p>
          </article>

          <article className="rf28-cartao">
            <h2>
              {tecnica === "original"
                ? "Sem tratamento"
                : tecnica === "contraste"
                  ? "Cinza + contraste"
                  : "Binarização adaptativa"}
            </h2>

            {tecnica === "original" ? (
              <img
                src={srcOriginal}
                alt="Imagem sem tratamento"
              />
            ) : srcProcessada ? (
              <img
                src={srcProcessada}
                alt="Imagem pré-processada"
              />
            ) : (
              <p>Processando imagem...</p>
            )}

            <p>
              {imagemOriginal.naturalWidth} ×{" "}
              {imagemOriginal.naturalHeight} pixels
            </p>
          </article>
        </section>
      )}
    </main>
  );
}
