import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import { Vector3 } from 'three'

/**
 * Loaders
 */
const loadingBarElement = document.querySelector('.loading-bar')

let sceneReady = false
const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
        // Wait a little
        window.setTimeout(() => {
            // Animate overlay
            //gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0, delay: 1 })

            // Update loadingBarElement
            loadingBarElement.classList.add('ended')
            loadingBarElement.style.transform = ''
        }, 500)

        window.setTimeout(() => {
            sceneReady = true
        }, 2000)
    },

    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => {
        // Calculate the progress and update the loadingBarElement
        const progressRatio = itemsLoaded / itemsTotal
        loadingBarElement.style.transform = `scaleX(${progressRatio})`
    }
)
const gltfLoader = new GLTFLoader(loadingManager)
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)

/**
 * Base
 */
// Debug
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// /**
//  * Overlay
//  */
// const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
// const overlayMaterial = new THREE.ShaderMaterial({
//     // wireframe: true,
//     transparent: true,
//     uniforms:
//     {
//         uAlpha: { value: 1 }
//     },
//     vertexShader: `
//         void main()
//         {
//             gl_Position = vec4(position, 1.0);
//         }
//     `,
//     fragmentShader: `
//         uniform float uAlpha;

//         void main()
//         {
//             gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
//         }
//     `
// })
// const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
// scene.add(overlay)


/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.jpg',
    '/textures/environmentMaps/0/nx.jpg',
    '/textures/environmentMaps/0/py.jpg',
    '/textures/environmentMaps/0/ny.jpg',
    '/textures/environmentMaps/0/pz.jpg',
    '/textures/environmentMaps/0/nz.jpg'
])

environmentMap.encoding = THREE.sRGBEncoding

scene.background = environmentMap
scene.environment = environmentMap

//debugObject.envMapIntensity = 5


/**
 * Points of interest
 */
const points = [
    {
        position: new THREE.Vector3(3, 0, 0),
        element: document.querySelector('.point-0')
    },
    {
        position: new THREE.Vector3(3, 0, 3),
        element: document.querySelector('.point-1')
    },
    {
        position: new THREE.Vector3(0, 0, 3),
        element: document.querySelector('.point-2')
    }
]



document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var keyCode = event.which;
    console.log(keyCode)

    if (keyCode == 39) { 
        nextPointArrow()
    } else if (keyCode == 37) {
        previusPointArrow()
    } else if (keyCode == 32) {
        showPointInCamera()
    } else if (keyCode == 82) {
        resetCameraToNord()
    } 
}


//changing point
let focusedPoint = -1
let changingPoint = false

function nextPointArrow() {
    focusedPoint++
    if (focusedPoint == points.length) {
        focusedPoint = 0
    }
    updateChangeDiv(focusedPoint)
    changingPoint = true
}
function previusPointArrow() {
    focusedPoint--
    if (focusedPoint < 0) {
        focusedPoint = points.length - 1
    }
    updateChangeDiv(focusedPoint)
    changingPoint = true
}

function showPointInCamera(){
    let cont1 = 0
    let fraseFinale1 = ""
    for (const point of points) {
        cont1++
        if (Array.from(point.element.classList).includes("visible") == true ){
            const fras1 = "Paragrafo "
            const fras2 = " visibile nell'area"
            const temp = getTranslateXY(point.element)
            let fraseX2D = temp.translateX > 0 ? " a destra" : " a sinistra"
            let fraseY2D = temp.translateY > 0 ? " in basso" : " in alto" 

            fraseFinale1 += fras1 + cont1.toString() + fras2 + fraseX2D + fraseY2D + " "
        }
    }
    if (fraseFinale1 != ""){
        document.getElementById("change").ariaLabel = fraseFinale1
    }

}

function getTranslateXY(element) {
    const style = window.getComputedStyle(element)
    const matrix = new DOMMatrixReadOnly(style.transform)
    return {
        translateX: matrix.m41,
        translateY: matrix.m42
    }
}

let cont = -1
for (const point of points) {

    cont++
    const num = cont

    point.element.addEventListener("mouseover", onOverOnPoint)

    function onOverOnPoint(event) {
        updateChangeDiv(num)
    }

}


//OPZIONALMENTE SI POTREBBE NOTIFICARE NON SUL PARAGRAFO NEUTRO MA SUL SINGOLO PUNTO
function updateChangeDiv(nParagrafo) {
    const frase1 = "Paragrafo "
    const frase2 = " in focus, si trova a"

    let fraseX = points[nParagrafo].position.x > 0 ? " nord" : " sud"
    let fraseY = points[nParagrafo].position.y > 0 ? " verso il basso" : " verso l'alto"
    let fraseZ = points[nParagrafo].position.z > 0 ? " est" : " ovest"

    let fraseCompleta = frase1 + (nParagrafo + 1).toString() + frase2 + fraseX + fraseZ + fraseY
    document.getElementById("change").ariaLabel = fraseCompleta
}

function resetCameraToNord(){

}
// function resetCameraToNord(){
//     controls.enabled = false;
    
//     console.log(camera.rotation)
//     const startOrientation = camera.quaternion.clone();
    
    
//     gsap.to( {}, {
//         duration: 2,
//         onUpdate: function() {
//             camera.quaternion.copy(startOrientation).slerp(targetOrientation, this.progress());
//         },
//         onComplete: function() {
//             controls.enabled = true;
//             console.log("reset")
//         }
//     } );

// }


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 0.1)
scene.add(camera)
const targetOrientation = camera.quaternion.clone();

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.rotateSpeed *= -0.7



/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})

renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 3

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const tick = () => {
    // Update controls
    //console.log(changingPoint)
    if (changingPoint == true) {

        /*// backup original rotation
        var startRotation = new THREE.Euler().copy( camera.rotation );

        // final rotation (with lookAt)
        camera.lookAt( points[focusedPoint].position );
        var endRotation = new THREE.Euler().copy( camera.rotation );

        // revert to original rotation
        camera.rotation.copy( startRotation );
        console.log(startRotation)
        console.log(endRotation)

        gsap.to(camera.rotation,{
            duration:1,
            x: endRotation.x,
            y: endRotation.y,
            z: endRotation.z,
        })*/
        camera.lookAt(points[focusedPoint].position)
   // else if (){
   //     camera.lookAt(new Vector3(0,1,0))
    } else {

        controls.update()
    }


    // Update points only when the scene is ready
    if (sceneReady) {
        camera.updateMatrix();
        camera.updateMatrixWorld();
        var frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
        );

        // Go through each point
        for (const point of points) {

            //3d point to check
            if (frustum.containsPoint(point.position)) {
                // Get 2D screen position
                const screenPosition = point.position.clone()
                screenPosition.project(camera)

                point.element.classList.add('visible')
                point.element.classList.add('visible')

                const translateX = screenPosition.x * sizes.width * 0.5
                const translateY = - screenPosition.y * sizes.height * 0.5
                //console.log(screenPosition.x, screenPosition.y)
                point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
            } else {
                //set no visible
                point.element.classList.remove('visible')
            }

        }
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()