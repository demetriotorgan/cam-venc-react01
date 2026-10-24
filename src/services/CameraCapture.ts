
export class CameraCapture {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private stream: MediaStream | null = null;  

  constructor({
    video,
    canvas,
  }: {
    video: HTMLVideoElement;
    canvas: HTMLCanvasElement;
  }) {
    this.video = video;
    this.canvas = canvas;
  }

  // Abre a câmera e inicia a reprodução.
  async abrirCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
    } catch (error: unknown) {
      console.warn(
        'Falha ao abrir a câmera preferencial. Tentando alternativa.',
        error,
      );

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    }

    this.video.srcObject = this.stream;

    try {
      if (this.video.readyState < 2) {
        await new Promise<void>((resolve, reject) => {
          this.video.addEventListener('loadeddata', () => resolve(), {
            once: true,
          });

          this.video.addEventListener(
            'error',
            () => reject(new Error('Falha ao carregar o vídeo da câmera.')),
            { once: true },
          );
        });
      }

      await this.video.play();

      console.log('Câmera iniciada com sucesso');
    } catch (error: unknown) {
      this.encerrarCamera();
      throw error;
    }
  }

  // Captura o quadro atual do vídeo.
  async capturarFoto(): Promise<Blob> {
    if (
      !this.stream ||
      !this.video.videoWidth ||
      !this.video.videoHeight
    ) {
      throw new Error(
        'A câmera precisa estar aberta para capturar a foto.',
      );
    }

    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    const contexto = this.canvas.getContext('2d');

    if (!contexto) {
      throw new Error('Não foi possível obter o contexto do canvas.');
    }

    contexto.drawImage(
      this.video,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      this.canvas.toBlob(
        (resultado) => {
          if (resultado) {
            resolve(resultado);
          } else {
            reject(new Error('Não foi possível gerar a imagem.'));
          }
        },
        'image/jpeg',
        0.95,
      );
    });    

    console.log('Foto capturada:', {
      largura: this.canvas.width,
      altura: this.canvas.height,
      tamanho: blob.size,
      tipo: blob.type,
    });

    return blob;
  }

  // Encerra a câmera e libera seus recursos.
  encerrarCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.video.pause();
    this.video.srcObject = null;    

    console.log('Câmera encerrada com sucesso');
  }
}
