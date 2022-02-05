import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import { Vector3 } from 'three'
import descriptionPoints from './descriptions.json'

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
 * Descrizioni con relativa altezza e "larghezza"
 */

const descrizioni = descriptionPoints
/**
 * Points of interest, prende in input quante altezze considerare e quante larghezze per trovare quanti punti sono (altezza*larghezza) e come sono distribuiti sulla mappa
 */
const points = createPoint({height:3, width:12, descriptions: descrizioni})

function createPoint(obj){
    var points2 = []
    var iteratorePunti = 0   //per i punti totali
    var iteratoreAltezza = 0   //per l'altezza
    while (iteratorePunti<obj.height*obj.width){
        var iteratoreOre = 0   //per le ore
        while (iteratoreOre<obj.width){
            //setta, se presente, la descrizione del punto e l'altezza, le ore e la posizione
            var singlePoint = {description: "Punto vuoto"}
            // (0,0,0.1) è la posizione della camera
            singlePoint.position = new THREE.Vector3(0,0,0.1).setFromCylindricalCoords(3, -iteratoreOre*Math.PI*2/obj.width, iteratoreAltezza)
            singlePoint.height = iteratoreAltezza
            singlePoint.width = iteratoreOre
            var s = 0
            while (s<obj.descriptions.length){
                if ((obj.descriptions[s].altezza==singlePoint.height)&&(obj.descriptions[s].larghezza==singlePoint.width+1)){
                    singlePoint.description = obj.descriptions[s].descr
                    s = obj.descriptions.length
                }
                else {
                    s++
                }
            }
            points2.push(singlePoint)
            iteratorePunti = iteratorePunti+1
            iteratoreOre = iteratoreOre+1
        }
        // setta l'altezza successiva
        if (iteratoreAltezza<=0){
            iteratoreAltezza = 1-iteratoreAltezza
        }
        else {
            iteratoreAltezza = -iteratoreAltezza
        }
    }
    console.log(points2)
    return points2
}

setInterestPoints(points)
//setta i paragrafi per i punti di interesse
function setInterestPoints(array){
    var i = 0
    var parentNode = document.getElementById("pointOfInterest")
    //crea i div relativi ai vari punti
    while (i<array.length){
        var div = document.createElement('div')
        div.setAttribute('class', 'point point-'+i)
        parentNode.appendChild(div)
        var titolo = document.createElement('h2')
        titolo.setAttribute("class", "label")
        titolo.innerHTML = i+1
        div.appendChild(titolo)
        var paragrafo = document.createElement('p')
        paragrafo.setAttribute("class", "text")
        paragrafo.innerHTML = array[i].description
        div.appendChild(paragrafo)

        //per l'accessibilità, da aggiustare
        titolo.setAttribute('aria-describedby', 'pointDescription-'+i)
        paragrafo.setAttribute('id', 'pointDescription-'+i)

        //togli il commento per nascondere i punti vuoti
        if (paragrafo.innerHTML=="Punto vuoto"){
            paragrafo.style.display="none"
            titolo.style.display="none"
        }

        titolo.setAttribute('aria-label',"Altezza: "+array[i].height+" Ore: "+ (array[i].width+1))
        div.setAttribute('aria-live', 'polite')
        //una volta creato il punto viene associato al relativo elemento di points
        points[i].element = document.querySelector('.point-'+i)
        i = i+1
    }
}

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var keyCode = event.which;
    console.log(keyCode)

    if (keyCode == 39) { 
        nextPointArrow()
    } else if (keyCode == 37) {
        previusPointArrow()
    } else if (keyCode == 38){  //freccia su
        pointUpArrow()
    } else if (keyCode == 40){  //freccia giù
        pointDownArrow()
    } else if (keyCode == 32) { //space
        showPointInCamera()
    } else if (keyCode == 82) { //r
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
function pointUpArrow(){
    if (focusedPoint==-1){
        focusedPoint++
    }
    //cerca l'altezza e la larghezza del punto corrente, oltre all'altezza massima raggiungibile
    let currentHeight = points[focusedPoint].height
    let maxHeight = getMaxHeight(points)
    let currentWidth = points[focusedPoint].width 
    if (currentHeight>=maxHeight){
        console.log("sei in cima")
    }
    else{
        focusedPoint = 0
        let nextHeight = currentHeight+1
        //finchè l'altezza non aumenta
        while (points[focusedPoint].height!=nextHeight){
            focusedPoint++
        }
        //calcola la larghezza del nuovo punto focalizzato
        focusedPoint = focusedPoint + currentWidth
    }
    updateChangeDiv(focusedPoint)
    changingPoint = true
}
//analoga alla funzione precedente
function pointDownArrow(){
    if (focusedPoint==-1){
        focusedPoint++
    }
    let currentHeight = points[focusedPoint].height
    let minHeight = getMinHeight(points)
    let width = points[focusedPoint].width 
    if (currentHeight<=minHeight){
        console.log("sei in fondo")
    }
    else{
        focusedPoint = 0
        let previousHeight = currentHeight-1
        while (points[focusedPoint].height!=previousHeight){
            focusedPoint++
        }
        focusedPoint = focusedPoint + width
    }
    updateChangeDiv(focusedPoint)
    changingPoint = true
}
//ottiene l'altezza massima prendendo in input l'array con tutti i punti
function getMaxHeight(array){
    let max = 0
    array.forEach( (element) => {
        if (element.height > max){
            max = element.height
        }
    })
    return max
}
//ottiene l'altezza minima prendendo in input l'array con tutti i punti
function getMinHeight(array){
    let min = 0
    array.forEach( (element) => {
        if (element.height < min){
            min = element.height
        }
    })
    return min
}

function showPointInCamera(){           
    let cont1 = 0
    let fraseFinale1 = ""
    
    for (const point of points) {
        cont1++
        if (Array.from(point.element.classList).includes("visible") == true ){
            const fras1 = "Paragrafo "
            const fras2 = " visibile all'altezza "
            const fras3 = " ed alla larghezza "
            //const temp = getTranslateXY(point.element)
            let fraseX2D = point.height//temp.translateX > 0 ? " a destra" : " a sinistra"
            let fraseY2D = point.width//temp.translateY > 0 ? " in basso" : " in alto" 

            fraseFinale1 += fras1 + cont1.toString() + fras2 + fraseX2D + fras3 + fraseY2D + " "
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

    function onOverOnPoint() {
        updateChangeDiv(num)
    }

}


//OPZIONALMENTE SI POTREBBE NOTIFICARE NON SUL PARAGRAFO NEUTRO MA SUL SINGOLO PUNTO
function updateChangeDiv(nParagrafo) {
    const frase1 = "Paragrafo "
    const frase2 = " in focus, si trova all'altezza: "

    let fraseX = points[nParagrafo].height 
    let fraseY = points[nParagrafo].width +1 

    let fraseCompleta = frase1 + (nParagrafo + 1).toString() + frase2 + fraseX + " e ad ore: " + fraseY
    document.getElementById("change").ariaLabel = fraseCompleta
}

function resetCameraToNord(){
    focusedPoint = 0
    updateChangeDiv(focusedPoint)
    changingPoint = true
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
  

// Controls                                            
var controls = new OrbitControls(camera, canvas)
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

var firsttouch = true
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
        
        //camera.localToWorld(points[focusedPoint].position)
        //controls.object(camera)
        controls.saveState()
        //controls=new OrbitControls(camera, canvas)
        changingPoint=false
        firsttouch = false
   // else if (){
   //     camera.lookAt(new Vector3(0,1,0))
    } else {
        if (firsttouch){
            controls.update()
        }
        else{
            //camera.position.set (0,0,0.1)
            
        }
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