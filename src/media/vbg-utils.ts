import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

const video: HTMLVideoElement = document.createElement('video');
const videoCanvas: HTMLCanvasElement = document.createElement('canvas');
const videoCanvasContext: CanvasRenderingContext2D = videoCanvas.getContext('2d');
let offscreenCanvas: OffscreenCanvas;
let offscreenCanvasContext: OffscreenCanvasRenderingContext2D;

const tasksCanvas = document.createElement('canvas');
const toImageBitmap = createCopyTextureToCanvas(tasksCanvas);

// let backgroundImage: string = null;
let requestAnimationFrameId: number = null;
let imageSegmenter: ImageSegmenter = null;

export async function beginVGBProcess (mediaStream: MediaStream): Promise<MediaStream> {
    const videoTrack = mediaStream.getVideoTracks()[0];
    offscreenCanvas = new OffscreenCanvas(videoTrack.getSettings().width, videoTrack.getSettings().height);
    offscreenCanvasContext = offscreenCanvas.getContext('2d');
    await startSegmentationTask();
    videoCanvasContext.drawImage(offscreenCanvas, 0, 0);
    return videoCanvas.captureStream();
}

async function startSegmentationTask () {
    await createImageSegmenter();

    const input = await createImageBitmap(video);
    const frameId = requestAnimationFrameId || 0;
    const segmentationMask = await imageSegmenter.segmentForVideo(
        input,
        frameId
    );

    await drawSegmentationResult(segmentationMask.confidenceMasks, input);

    segmentationMask.close();

    requestAnimationFrameId = window.requestAnimationFrame(
        startSegmentationTask
    );
}

async function createImageSegmenter() {
    const wasmFileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    imageSegmenter = await ImageSegmenter.createFromOptions(wasmFileset, {
        baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-tasks/image_segmenter/selfie_segmentation.tflite',
            delegate: 'GPU'
        },
        // canvas: tasksCanvas,
        runningMode: 'VIDEO'
    })
}

async function drawSegmentationResult (segmentationResult, input) {
    const canvasWidth = offscreenCanvas.width;
    const canvasHeight = offscreenCanvas.height;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    const scaleX = canvasWidth / videoWidth;
    const scaleY = canvasHeight / videoHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = videoWidth * scale;
    const scaledHeight = videoHeight * scale;

    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;

    const segmentationMask = segmentationResult[0];
    const segmentationMaskBitmap = await toImageBitmap(segmentationMask);

    offscreenCanvasContext.save();
    offscreenCanvasContext.fillStyle = 'white';
    offscreenCanvasContext.clearRect(0, 0, scaledWidth, scaledHeight);

    offscreenCanvasContext.translate(canvasWidth, 0);
    offscreenCanvasContext.scale(-1, 1);
    offscreenCanvasContext.drawImage(
        segmentationMaskBitmap,
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight
    );

    offscreenCanvasContext.restore();
    offscreenCanvasContext.save();

    const blurBackgroundCanvas = new OffscreenCanvas(scaledWidth, scaledHeight);
    const blurBackgroundContext = blurBackgroundCanvas.getContext('2d');
    blurBackgroundContext.translate(canvasWidth, 0);
    blurBackgroundContext.scale(-1, 1);
    if (blurBackgroundContext.filter) {
        blurBackgroundContext.filter = 'blur(8px)';
        blurBackgroundContext.drawImage(input, 0, 0, scaledWidth, scaledHeight);
    }
    // } else {
    //     /*TODO: Safari Solution */
    // }

    offscreenCanvasContext.globalCompositeOperation = 'source-out';
    offscreenCanvasContext.drawImage(
        blurBackgroundCanvas,
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight
    );

    offscreenCanvasContext.restore();
    offscreenCanvasContext.save();

    offscreenCanvasContext.globalCompositeOperation = 'destination-atop';
    offscreenCanvasContext.translate(canvasWidth, 0);
    offscreenCanvasContext.scale(-1, 1);
    offscreenCanvasContext.drawImage(
        input,
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight
    );
    offscreenCanvasContext.restore();
}

function createShaderProgram (canvasWebGL2Context) {
    const vertexShaderSource = `
        attribute vec2 position;
        varying vec2 texCoords;

        void main() {
            texCoords = (position + 1.0) / 2.0;
            texCoords.y = 1.0 - texCoords.y;
            canvasWebGL2Context_Position = vec4(position, 0, 1.0);
        }
    `;

    const fragmentShaderSource = `
        precision highp float;
        varying vec2 texCoords;
        uniform sampler2D textureSampler;
        void main() {
            float a = texture2D(textureSampler, texCoords).r;
            canvasWebGL2Context_FragColor = vec4(a,a,a,a);
        }
    `;
    const vertexShader = canvasWebGL2Context.createShader(canvasWebGL2Context.VERTEX_SHADER);
    if (!vertexShader) {
        throw Error('can not create vertex shader');
    }
    canvasWebGL2Context.shaderSource(vertexShader, vertexShaderSource);
    canvasWebGL2Context.compileShader(vertexShader);

    // Create our fragment shader
    const fragmentShader = canvasWebGL2Context.createShader(canvasWebGL2Context.FRAGMENT_SHADER);
    if (!fragmentShader) {
        throw Error('can not create fragment shader');
    }
    canvasWebGL2Context.shaderSource(fragmentShader, fragmentShaderSource);
    canvasWebGL2Context.compileShader(fragmentShader);

    // Create our program
    const program = canvasWebGL2Context.createProgram();
    if (!program) {
        throw Error('can not create program');
    }
    canvasWebGL2Context.attachShader(program, vertexShader);
    canvasWebGL2Context.attachShader(program, fragmentShader);
    canvasWebGL2Context.linkProgram(program);

    return {
        vertexShader,
        fragmentShader,
        shaderProgram: program,
        attribLocations: {
            position: canvasWebGL2Context.getAttribLocation(program, 'position'),
        },
        uniformLocations: {
            textureSampler: canvasWebGL2Context.getUniformLocation(program, 'textureSampler'),
        },
    };
}

function createVertexBuffer (canvasWebGL2Context) {
    if (!canvasWebGL2Context) {
        return null;
    }
    const vertexBuffer = canvasWebGL2Context.createBuffer();
    canvasWebGL2Context.bindBuffer(canvasWebGL2Context.ARRAY_BUFFER, vertexBuffer);
    canvasWebGL2Context.bufferData(
        canvasWebGL2Context.ARRAY_BUFFER,
        new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]),
        canvasWebGL2Context.STATIC_DRAW
    );
    return vertexBuffer;
}

function createCopyTextureToCanvas(canvas) {
    const canvasWebGL2Context = canvas.getContext('webgl2');
    if (!canvasWebGL2Context) {
        return undefined;
    }

    const {
        shaderProgram,
        attribLocations: { position: positionLocation },
        uniformLocations: { textureSampler: textureLocation },
    } = createShaderProgram(canvasWebGL2Context);

    const vertexBuffer = createVertexBuffer(canvasWebGL2Context);

    return (mask) => {
        canvasWebGL2Context.viewport(0, 0, canvas.width, canvas.height);
        canvasWebGL2Context.clearColor(1.0, 1.0, 1.0, 1.0);
        canvasWebGL2Context.useProgram(shaderProgram);
        canvasWebGL2Context.clear(canvasWebGL2Context.COLOR_BUFFER_BIT);
        const texture = mask.getAsWebGLTexture();
        canvasWebGL2Context.bindBuffer(canvasWebGL2Context.ARRAY_BUFFER, vertexBuffer);
        canvasWebGL2Context.vertexAttribPointer(positionLocation, 2, canvasWebGL2Context.FLOAT, false, 0, 0);
        canvasWebGL2Context.enableVertexAttribArray(positionLocation);
        canvasWebGL2Context.activeTexture(canvasWebGL2Context.TEXTURE0);
        canvasWebGL2Context.bindTexture(canvasWebGL2Context.TEXTURE_2D, texture);
        canvasWebGL2Context.uniform1i(textureLocation, 0);
        canvasWebGL2Context.drawArrays(canvasWebGL2Context.TRIANGLES, 0, 6);
        return createImageBitmap(canvas);
    };
}



