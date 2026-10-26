import React, { useState } from 'react'
import { testarOCR } from '../services/ocr.ts';

const OCRteste = () => {
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function executarTeste() {
    setCarregando(true);
    setTexto('');

    try {
      const resultado = await testarOCR('/teste-val3.png');
      setTexto(resultado);
    } catch (erro) {
      console.error('Erro no OCR:', erro);
      setTexto('Erro ao executar o OCR. Consulte o console.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Teste mínimo do Tesseract OCR</h1>

      <button onClick={executarTeste} disabled={carregando}>
        {carregando ? 'Reconhecendo...' : 'Executar OCR'}
      </button>

      <h2>Texto reconhecido</h2>
      <pre>{texto || 'Aguardando teste...'}</pre>
    </main>
  )
}

export default OCRteste