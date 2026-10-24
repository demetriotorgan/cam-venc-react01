
import { useEffect, useRef, useState } from 'react'
import './CameraView.css'
import { CameraCapture } from '../services/CameraCapture';
import { recortarImagem } from '../services/recorte';

const CameraView = () => {
    //-----Refs
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cameraRef = useRef<CameraCapture | null>(null);
    const molduraRef = useRef<HTMLDivElement | null>(null);
    const imagemOriginalRef = useRef<HTMLImageElement | null>(null);

    //---states
    const [cameraAtiva, setCameraAtiva] = useState(false);
    const [fotoUrl, setFotoUrl] = useState<string | null>(null);
    const [erro, setErro] = useState<string | null>(null);
    const [recorteUrl, setRecorteurl] = useState<string | null>(null);
    const [processandoRecorte, setProcessandoRecorte] = useState(false);

    const [diagnostico, setDiagnostico] = useState<object | null>(null);

    useEffect(() => {
        return () => {
            cameraRef.current?.encerrarCamera();

            if (fotoUrl) {
                URL.revokeObjectURL(fotoUrl);
            }
        };

    }, [fotoUrl]);

    useEffect(() => {
        return () => {
            if (recorteUrl) {
                URL.revokeObjectURL(recorteUrl)
            }
        }
    }, [recorteUrl])

    async function abrirCamera() {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            setErro('Não foi possivel preparar os elementos de camera');
            return;
        }
        try {
            if (!cameraRef.current) {
                cameraRef.current = new CameraCapture({ video, canvas });
            }
            await cameraRef.current.abrirCamera();
            setCameraAtiva(true);
        } catch (error: unknown) {
            console.error('Erro ao abrir a camera: ', error);
            setCameraAtiva(false);
            setErro(
                error instanceof Error ? error.message : 'Não foi possivel abrir a camera'
            );
        }
    };

    function encerrarCamera() {
        cameraRef.current?.encerrarCamera();
        setCameraAtiva(false);
        setErro(null);
    }

    async function capturarFoto() {
        const camera = cameraRef.current;
        try {
            if (!camera) {
                setErro('A camera nao está disponível');
                return;
            }
            setErro('');

            //1. Captura a imagem da camera
            const blob = await camera.capturarFoto();

            //2. Cria uma URL para imagem Original
            const novaFotoUrl = URL.createObjectURL(blob);

            //3. Carrega a imagem antes de executar o recorte
            const imagemCarregada = new Image();
            imagemCarregada.src = novaFotoUrl;

            await imagemCarregada.decode();

            //4. Atualiza a imagem original exibida
            setFotoUrl(novaFotoUrl);

            //5. Executar recorte usando imagem carregada
            await executarRecorte(imagemCarregada);

        } catch (error: unknown) {
            console.error('Erro ao capturar a foto: ', error);
            setErro(error instanceof Error ? error.message : 'Não foi possível capturar a foto')
        }
    };

    async function executarRecorte(imagemCarregada?: HTMLImageElement) {
        const video = videoRef.current;
        const moldura = molduraRef.current;
        const imagem = imagemCarregada ?? imagemOriginalRef.current;

        if (!video || !moldura || !imagem) {
            setErro('Não foi possível preparar os elementos para recorte')
            return;
        }

        setProcessandoRecorte(true);
        setErro('');

        try {
            const videoRect = video.getBoundingClientRect();
            const molduraRect = moldura.getBoundingClientRect();

            setDiagnostico({
                proporcaoVideo: Number(
                    (videoRect.width / videoRect.height).toFixed(4)
                ),
                proporcaoImagem: Number(
                    (imagem.naturalWidth / imagem.naturalHeight).toFixed(4)
                ),
                proporcaoMoldura: Number(
                    (molduraRect.width / molduraRect.height).toFixed(4)
                ),
                video: {
                    largura: videoRect.width,
                    altura: videoRect.height,
                },
                imagem: {
                    largura: imagem.naturalWidth,
                    altura: imagem.naturalHeight,
                },
                moldura: {
                    largura: molduraRect.width,
                    altura: molduraRect.height,
                },
                dimensoesReaisVideo: {
                    largura: video.videoWidth,
                    altura: video.videoHeight,
                },
            });
            const resultado = await recortarImagem({ video, moldura, imagem });
            const novaRecorteUrl = URL.createObjectURL(resultado.blob);
            setRecorteurl(novaRecorteUrl);
            console.log('Recorte realizado:', {
                coordenadas: resultado.coordenadas,
                largura: resultado.largura,
                altura: resultado.altura,
                tamanho: resultado.blob.size,
                tipo: resultado.blob.type,
            });
        } catch (error: unknown) {
            console.error('Erro ao recortar a imagem:', error);

            setErro(
                error instanceof Error
                    ? error.message
                    : 'Não foi possível recortar a imagem.',
            );
        } finally {
            setProcessandoRecorte(false);
        }
    }


    return (
        <main className="camera-page">
            <header className="camera-header">
                <div className="camera-brand">
                    <span className="camera-brand-icon">CV</span>

                    <div>
                        <h1>Leitor de Validade</h1>
                        <p>Capture a validade do produto</p>
                    </div>
                </div>
            </header>

            <section className="camera-content">
                <section className="camera-section">
                    <div className="section-heading">
                        <h2>Captura da imagem</h2>
                        <p>Posicione a validade dentro da moldura azul.</p>
                    </div>

                    <div className="camera-preview">
                        <video
                            ref={videoRef}
                            className='camera-video'
                            autoPlay
                            muted
                            playsInline
                        />
                        <canvas ref={canvasRef} hidden />

                        {!cameraAtiva && (
                            <div className="camera-placeholder">
                                <span className="camera-placeholder-icon">◎</span>
                                <p>A câmera está desligada</p>
                                <span>A imagem aparecerá aqui</span>
                            </div>
                        )}

                        <div ref={molduraRef} className="crop-frame" aria-hidden="true" />
                    </div>

                    <div className="camera-actions">
                        <button
                            type="button"
                            className="button button-primary"
                            onClick={abrirCamera}
                        >
                            <span aria-hidden="true">▣</span>
                            Abrir câmera
                        </button>

                        <div className="camera-secondary-actions">
                            <button
                                type="button"
                                onClick={capturarFoto}
                                className="button button-secondary"
                                disabled={!cameraAtiva}
                            >
                                Capturar foto
                            </button>

                            <button
                                type="button"
                                className="button button-danger"
                                onClick={encerrarCamera}
                                disabled={!cameraAtiva}
                            >
                                Encerrar câmera
                            </button>
                        </div>
                        {erro && (
                            <p className="camera-error" role="alert">
                                {erro}
                            </p>
                        )}
                    </div>
                </section>

                <section className="images-section">
                    <div className="section-heading">
                        <h2>Resultado da captura</h2>
                        <p>Compare a fotografia original com a região recortada.</p>
                    </div>

                    <div className="images-grid">
                        <article className="image-card">
                            <h3>Foto original</h3>
                            <div className="preview-card">
                                {fotoUrl ? (
                                    <img src={fotoUrl} alt="Foto capturada pela câmera" />
                                ) : (
                                    <div className="image-placeholder">
                                        <span aria-hidden="true">▧</span>
                                        <p>Nenhuma foto capturada</p>
                                    </div>
                                )}
                            </div>
                        </article>

                        <article className="image-card">
                            <h3>Imagem recortada</h3>
                            {recorteUrl ? (
                                <div className='preview-card'>
                                    <img src={recorteUrl} alt="" />
                                </div>
                            ) : (
                                <div className="image-placeholder">
                                    <span aria-hidden="true">▧</span>
                                    <p>{processandoRecorte ? 'Processando recorte' : 'Nenhum recorte disponivel'}</p>
                                </div>
                            )}
                        </article>
                    </div>
                </section>
                {diagnostico && (
                    <section className="diagnostico-section">
                        <h2>Diagnóstico da geometria</h2>

                        <pre>
                            {JSON.stringify(diagnostico, null, 2)}
                        </pre>
                    </section>
                )}
            </section>

            <footer className="camera-footer">
                <p>Leitor de Validade · Captura e recorte de imagens</p>
            </footer>
        </main>
    )
}

export default CameraView
