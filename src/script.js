import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gsap } from 'gsap'
import { Vector3 } from 'three'
import maps from './descriptions.json'

/**
 * Loaders
 */
const loadingBarElement = document.querySelector('.loading-bar')

let sceneReady = false
const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
        // caricamento
        window.setTimeout(() => {

            // aggiornamento iniziale loadingBarElement
            loadingBarElement.classList.add('ended')
            loadingBarElement.style.transform = ''
        }, 500)

        window.setTimeout(() => {
            sceneReady = true
        }, 2000)
    },

    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => {
        // calcolo del progresso e aggiornamento loadingBarElement
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


/**
 * Environment map  
 */
const environmentMap = cubeTextureLoader.load([
    maps[0].map.px,
    maps[0].map.nx,
    maps[0].map.py,
    maps[0].map.ny,
    maps[0].map.pz,
    maps[0].map.nz
])

const environmentMap2 = cubeTextureLoader.load([
    '/textures/environmentMaps/1/px.jpg',
    '/textures/environmentMaps/1/nx.jpg',
    '/textures/environmentMaps/1/py.jpg',
    '/textures/environmentMaps/1/ny.jpg',
    '/textures/environmentMaps/1/pz.jpg',
    '/textures/environmentMaps/1/nz.jpg'
])

environmentMap.encoding = THREE.sRGBEncoding
environmentMap2.encoding = THREE.sRGBEncoding

scene.background = environmentMap
scene.environment = environmentMap

debugObject.envMapIntensity = 5

/**
 * Descrizioni con relativa altezza e "larghezza"
 */

const descrizioni = maps[0].punti
const alt = 3
const ore = 12

/**
 * Points of interest, prende in input quante altezze considerare e quante larghezze per trovare quanti punti sono (altezza*larghezza) e come sono distribuiti sulla mappa
 */
var points = createPoint({ height: alt, width: ore, descriptions: descrizioni })

function createPoint(obj) {
    var points2 = []
    var iteratorePunti = 0   //per i punti totali
    var iteratoreAltezza = 0   //per l'altezza
    while (iteratorePunti < obj.height * obj.width) {
        var iteratoreOre = 0   //per le ore
        while (iteratoreOre < obj.width) {
            //setta, se presente, la descrizione del punto e l'altezza, le ore e la posizione
            var singlePoint = { description: " ", link: false, mapTarget: " " }
            // (0,0,0.1) è la posizione della camera
            singlePoint.position = new THREE.Vector3(0, 0, 0.1).setFromCylindricalCoords(3, -iteratoreOre * Math.PI * 2 / obj.width, iteratoreAltezza)
            singlePoint.height = iteratoreAltezza
            singlePoint.width = iteratoreOre
            var s = 0
            while (s < obj.descriptions.length) {
                if ((obj.descriptions[s].altezza == singlePoint.height) && (obj.descriptions[s].larghezza == singlePoint.width + 1)) {
                    singlePoint.description = obj.descriptions[s].descr
                    if (obj.descriptions[s].link) {
                        singlePoint.link = true
                        singlePoint.mapTarget = obj.descriptions[s].idTarget
                    }
                    s = obj.descriptions.length
                }
                else {
                    s++
                }
            }
            points2.push(singlePoint)
            iteratorePunti = iteratorePunti + 1
            iteratoreOre = iteratoreOre + 1
        }
        // setta l'altezza successiva
        if (iteratoreAltezza <= 0) {
            iteratoreAltezza = 1 - iteratoreAltezza
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
function setInterestPoints(array) {
    var iteratorePunti = 0
    var iteratorePuntiVisibili = 0
    var iteratorePuntiNonVisibili = 0
    while (iteratorePunti < array.length) {
        if (array[iteratorePunti].description != " ") {
            iteratorePuntiNonVisibili++
        }
        iteratorePunti++
    }
    iteratorePunti = 0
    var parentNode = document.getElementById("pointOfInterest")
    //crea i div relativi ai vari punti
    while (iteratorePunti < array.length) {
        var div = document.createElement('div')
        div.setAttribute('class', 'point point-' + iteratorePunti)
        div.setAttribute('id', 'point-' + iteratorePunti)
        parentNode.appendChild(div)
        //cambia in button per fare in modo che aria-describedby sia leggibile
        var titolo = document.createElement('h2')
        titolo.setAttribute("class", "label")
        if (array[iteratorePunti].description == " ") {
            titolo.innerHTML = iteratorePuntiNonVisibili + 1
        }
        else {
            titolo.innerHTML = iteratorePuntiVisibili + 1
        }
        div.appendChild(titolo)
        let target = array[iteratorePunti].mapTarget
        if (array[iteratorePunti].link) {
            titolo.addEventListener("click", function () {
                switchScene(target)
            })
        }
        var paragrafo = document.createElement('p')
        paragrafo.setAttribute("class", "text")
        paragrafo.innerHTML = array[iteratorePunti].description
        div.appendChild(paragrafo)
        var paragrafoCordinate = document.createElement('p')
        paragrafoCordinate.setAttribute("class", "sr-only")
        paragrafoCordinate.innerHTML = "Altezza: " + array[iteratorePunti].height + " Ore: " + (array[iteratorePunti].width + 1)
        div.appendChild(paragrafoCordinate)

        //per nascondere i punti vuoti
        if (paragrafo.innerHTML == " ") {
            paragrafo.setAttribute('class', 'sr-only')
            titolo.setAttribute('class', 'sr-only')
            div.setAttribute('aria-hidden', 'true')
            iteratorePuntiNonVisibili++
        }
        else {
            iteratorePuntiVisibili = iteratorePuntiVisibili + 1
        }

        //una volta creato il punto viene associato al relativo elemento di points
        points[iteratorePunti].element = document.querySelector('.point-' + iteratorePunti)
        iteratorePunti = iteratorePunti + 1
    }
}
function switchScene(target) {
    let iteratoreMappe = 0
    while (iteratoreMappe < maps.length) {
        if (target == maps[iteratoreMappe].id) {
            let map = cubeTextureLoader.load([
                maps[iteratoreMappe].map.px,
                maps[iteratoreMappe].map.nx,
                maps[iteratoreMappe].map.py,
                maps[iteratoreMappe].map.ny,
                maps[iteratoreMappe].map.pz,
                maps[iteratoreMappe].map.nz
            ])
            map.encoding = THREE.sRGBEncoding

            scene.background = map
            scene.environment = map
            removeOldInterestPoints()
            points = createPoint({ height: alt, width: ore, descriptions: maps[iteratoreMappe].punti })
            setInterestPoints(points)
            iteratoreMappe = maps.length
        }
        else {
            iteratoreMappe++
        }
    }
}

function removeOldInterestPoints() {
    var iteratorePunti = 0
    while (iteratorePunti < alt * ore) {
        var element = document.getElementById('point-' + iteratorePunti)
        element.remove()
        iteratorePunti++
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
    } else if (keyCode == 38) {  //freccia su
        pointUpArrow()
    } else if (keyCode == 40) {  //freccia giù
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
function pointUpArrow() {
    if (focusedPoint == -1) {
        focusedPoint++
    }
    //cerca l'altezza e la larghezza del punto corrente, oltre all'altezza massima raggiungibile
    let currentHeight = points[focusedPoint].height
    let maxHeight = getMaxHeight(points)
    let currentWidth = points[focusedPoint].width

    if (currentHeight >= maxHeight) {

        let text = document.getElementById("change").innerHTML
        if (text.slice(0, 9) == "Paragrafo") {
            document.getElementById("change").innerHTML = "Sei in cima"
        }
        else {
            document.getElementById("change").innerHTML = text + "\u00A0"
        }
    }
    else {
        focusedPoint = 0
        let nextHeight = currentHeight + 1
        //finchè l'altezza non aumenta
        while (points[focusedPoint].height != nextHeight) {
            focusedPoint++
        }
        //calcola la larghezza del nuovo punto focalizzato
        focusedPoint = focusedPoint + currentWidth
        updateChangeDiv(focusedPoint)
    }
    changingPoint = true
}

//analoga alla funzione precedente
function pointDownArrow() {
    if (focusedPoint == -1) {
        focusedPoint++
    }
    let currentHeight = points[focusedPoint].height
    let minHeight = getMinHeight(points)
    let width = points[focusedPoint].width
    if (currentHeight <= minHeight) {
        //così è terribile
        let text = document.getElementById("change").innerHTML
        if (text.slice(0, 9) == "Paragrafo") {
            document.getElementById("change").innerHTML = "Sei in fondo"
        }
        else {
            document.getElementById("change").innerHTML = text + "\u00A0"
        }
    }
    else {
        focusedPoint = 0
        let previousHeight = currentHeight - 1
        while (points[focusedPoint].height != previousHeight) {
            focusedPoint++
        }
        focusedPoint = focusedPoint + width
        updateChangeDiv(focusedPoint)
    }
    changingPoint = true
}

//ottiene l'altezza massima prendendo in input l'array con tutti i punti
function getMaxHeight(array) {
    let max = 0
    array.forEach((element) => {
        if (element.height > max) {
            max = element.height
        }
    })
    return max
}
//ottiene l'altezza minima prendendo in input l'array con tutti i punti
function getMinHeight(array) {
    let min = 0
    array.forEach((element) => {
        if (element.height < min) {
            min = element.height
        }
    })
    return min
}

function showPointInCamera() {
    let cont1 = 0
    let fraseFinale1 = ""

    for (const point of points) {
        cont1++
        if (Array.from(point.element.classList).includes("visible") == true) {
            const fras1 = "Paragrafo "
            const fras2 = " visibile all'altezza "
            const fras3 = "  a ore "

            let fraseX2D = point.height
            let fraseY2D = point.width + 1

            fraseFinale1 += fras1 + cont1.toString() + fras2 + fraseX2D + fras3 + fraseY2D + " "
        }
    }
    if (fraseFinale1 != "") {
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
    const frase2 = " , altezza: "

    let fraseX = points[nParagrafo].height
    let fraseY = points[nParagrafo].width + 1

    let fraseCompleta = frase1 + (nParagrafo + 1).toString() + frase2 + fraseX + " ore: " + fraseY
    document.getElementById("change").innerHTML = fraseCompleta
}

function resetCameraToNord() {
    focusedPoint = 0
    updateChangeDiv(focusedPoint)
    changingPoint = true
}


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

        camera.lookAt(points[focusedPoint].position)

        controls.saveState()

        changingPoint = false
        firsttouch = false

    } else {
        if (firsttouch) {
            controls.update()
        }
    }


    // aggiorna i punti solo quando lo schermo è pronto
    if (sceneReady) {
        camera.updateMatrix();
        camera.updateMatrixWorld();
        var frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
        );

        // esegue per ogni punto
        for (const point of points) {

            //pprende i punti 3d
            if (frustum.containsPoint(point.position)) {
                // assegna posizione 2d
                const screenPosition = point.position.clone()
                screenPosition.project(camera)

                point.element.classList.add('visible')

                const translateX = screenPosition.x * sizes.width * 0.5
                const translateY = - screenPosition.y * sizes.height * 0.5

                point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
            } else {
                //setto non visibile
                point.element.classList.remove('visible')
            }

        }
    }

    // Render
    renderer.render(scene, camera)

    // richiamo tick per ogni frame
    window.requestAnimationFrame(tick)
}

tick()