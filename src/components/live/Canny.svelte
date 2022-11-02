<script>
    import { onMount } from 'svelte';
    // Importing the tensorflow.js library
    import * as tf from "@tensorflow/tfjs"

    const constraints = {
        video: true,
    };

    let camera = null;
    let record = false;
    let lower_threshold_ratio = 0.15
    let upper_threshold_ratio = 0.2
    let sigma = 1

    // Get gaussian masks
    let {G: G, size: size} = generateGaussianMask()
    let G_prime = generateGaussianDerivative()

    function generateGaussianMask(){
        // Use input sigma to get an appropriate size for the kernels
        let radius = Math.round((2.5 * sigma) - 0.5)
        let size = (2 * radius) + 1

        let G = tf.zeros([size])
        let sumGauss = 0
        let denom = (2 * sigma * sigma)

        // Sample gaussian values for each i in the kernel
        for(let i = 0; i < size; i++){
            let num = -(i - radius) * (i - radius)
            G[i] = Math.exp(num / denom)
            sumGauss = sumGauss + G[i]
        }

        // Average the values
        for(let i = 0; i < size; i++){
            G[i] = G[i] / sumGauss
        }

        return {G, size}
    }

    function generateGaussianDerivative(){
        // Use input sigma to get an appropriate size for the kernels
        let radius = Math.round((2.5 * sigma) - 0.5)
        let size = (2 * radius) + 1

        let G_prime = tf.zeros([size])
        let sumGauss = 0
        let denom = (2 * Math.pow(sigma, 2))

        // Sample gaussian derivative values for each i in the kernel
        for(let i = 0; i < size; i++){
            let num = -(i - radius) * (i - radius)
            G_prime[i] = (-(i - radius) / (sigma * sigma)) * Math.exp(num / denom)
            sumGauss = sumGauss + (i * G_prime[i])
        }

        // Average the values
        for(let i = 0; i < size; i++){
            G_prime[i] = G_prime[i] / sumGauss
        }

        return G_prime
    }

    function Convolve(I){
        // Init
        let Ix = tf.zeros([I.shape[0], I.shape[1]]);
        let Iy = tf.zeros([I.shape[0], I.shape[1]])
        let y = I.shape[0];
        let x = I.shape[1];

        // Gaussian blur in x direction
        for(let j = 0; j < x; j++){
            // Don't overstep size of image
            if(j < x - size + 1){
                // Use numpy vectorization to speed up computation
                let dotResult = tf.dot(tf.slice(I, [0, j], [I.shape[0], j+size]), G);
                console.log(dotResult);

                // Assign values
                //Ix[:, j]
            }
        }

        // Gaussian blur in y direction
        for(let i = 0; i < y; i++){
            // Don't overstep size of image
            if(i < y - size + 1){
                // Use numpy vectorization to speed up computation
                Iy = tf.slice(Iy, [i, 0], [i, Iy.shape[1]]).assign(tf.dot(tf.slice(I, [i, 0], [i+size, I.shape[1]]).T, G));
            }
        }
        
        
        return {Ix, Iy}
    }

    function ConvolvePrime(Ix, Iy){
        // Init
        let Ixx = tf.zeros([Ix.shape[0], Ix.shape[1]])
        let Iyy = tf.zeros([Iy.shape[0], Iy.shape[1]])
        let {y: y, x: x} = Ix.shape

        // Image derivative in x direction
        for(let j = 0; j < x; j++){
            // Don't overstep size of image
            if(j < x - size + 1){
                // Use numpy vectorization to speed up calculation
                Ixx = tf.slice(Ixx, [0, j], [Ixx.shape[0], j]).assign(tf.dot(tf.slice(Iy, [0, j], [Iy.shape[0], j+size]), G_prime));
            }
        }
        
        // Image derivative in y direction
        for(let i = 0; i < y; i++){
            // Don't overstep size of image
            if(i < y - size + 1){
                    // Use numpy vectorization to speed up calculation
                    Iyy = tf.slice(Iyy, [i, 0], [i, Iyy.shape[1]]).assign(tf.dot(tf.slice(Ix, [i, j], [i+size, j]).T, G_prime));
            }
        }

        return {Ixx, Iyy}
    }

    function computeMagnitude(Ixx, Iyy){
        // Calc mag and gradient direction
        let M = tf.sqrt((tf.pow(Ixx, 2) + tf.pow(Iyy, 2)));
        let P = tf.atan2(Iyy, Ixx) * 180 / Math.pi;

        return {M, P}
    }

    async function tfCam(){
            // Webcam promise return
            camera = await tf.data.webcam(document.getElementById('player'));
            
            detectEdges();                
    }

    async function detectEdges(){
        // Image camera capture promise return.
        let image = await camera.capture();
        image = image
            .mean(2)
            .toFloat()
            .expandDims(-1);
        
        image = image.reshape([image.shape[0], image.shape[1]]);

        // Run the edge detection;
        // Get first convolution
        let {Ix: Ix, Iy: Iy} = Convolve(image);
        //console.log(Ix);

        // Get the derivative convolution
        let {Ixx: Ixx, Iyy: Iyy} = ConvolvePrime(Ix, Iy);
        //console.log(`Ixx: ${Ixx}`);
        
        // Get the magnitude and direction
        let {M: M, P: P} = computeMagnitude(Ixx, Iyy);
        //console.log(M);
    }

    onMount(() => {
        const supported = 'mediaDevices' in navigator;

        if(record){
            tfCam();
        }
        
    });

    function toggleVideo(){
        if(record){
            // Stop camera
            camera.stop();
        }
        else{
            // Restart the camera
            tfCam();
        }

        record = !record;
    }
    
</script>

<div style="position:relative">
    <video id="player" controls autoplay></video>
    <button class="btn btn-circle glass recording-btn {record ? 'color-red' : ''}" on:click={() => {toggleVideo()}}>
        {#if record}
            <i class="fa-solid fa-video"></i>
        {:else}
            <i class="fa-solid fa-video-slash"></i>
        {/if}
    </button>
</div>