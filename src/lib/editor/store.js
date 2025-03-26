
import { writable } from 'svelte/store';
import { MAX_BUILD_SIZES } from '$lib/common/constants';

const LOADING = writable(true)
const EDITOR_VERSION = 0
const BUILD_SIZE = writable()
const MODE = writable("place")
const COLOR_INDEX = writable(15444)
const EYEDROP = writable(false)
const OBJECT_SELECT = writable(false)
const COLOR_SELECT = writable(false)
const OVERLAP = writable(false)
const SHOW_BLOCK_PANEL = writable(true)
const updateTransformUi = writable({ tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, scale: 1 })
const PLOTS_PLACED = writable()
const SELECTED_PLOT = writable(0)
const DOWNLOAD_MODAL = writable(false)
const NEW_BUILD_MODAL = writable(false)
const GRID_SIZING = writable(false)
const SELECTED = writable(false)
const SHOW_ONBOARDING_MODAL = writable(false)
const SHOW_DOCUMENTATION = writable(false)

const CONVERTING = writable(false)
const FACES_CONVERTED = writable(0)
const TOTAL_CONVERT = writable(0)

const NOTIFICATION = writable([])

const REFS = { 
    
    newBuild: () => {},
    clearBuild: () => {},
    renderloop: () => {},
    renderer: null,
    scene1: null,
    scene2: null,
    gridSizingScene: null,
    build: null,
    camera: null,
    transform: null,
    switchModes: null,
    buildSize: MAX_BUILD_SIZES[0],
    eventIndex: -1,
    eventQueue: [],
    diameter: 1,
    blockType: 0,
    setColorFromIndex: null,
    updateCameraControls: null,
    blockEvents: false

}

function addEvent( events, modeBefore, modeAfter = modeBefore ){

    REFS.eventIndex++

    REFS.eventQueue.splice(REFS.eventIndex)

    REFS.eventQueue.push({ events, modeBefore, modeAfter })

}

class ModifyEvent {

    constructor(indicies, before, after){

        this.indicies = indicies
        this.before = before
        this.after = after

    }

}

class InitTransformable {

    constructor( transformable ){

        this.transformable = transformable

    }

}

class EndTransformable {

    constructor( transformable ){

        this.transformable = transformable

    }

}

class TransformEvent {

    constructor( dP = null, dQ = null, dS = null ){

        this.dP = dP
        this.dQ = dQ
        this.dS = dS

    }
    
} 

class ConvertEvent {

    constructor(dir){ 

        this.dir = dir

    }

}

export { BUILD_SIZE, LOADING, EDITOR_VERSION, GRID_SIZING, MODE, COLOR_INDEX, EYEDROP, OBJECT_SELECT, COLOR_SELECT, OVERLAP, SELECTED_PLOT, SHOW_BLOCK_PANEL, PLOTS_PLACED, CONVERTING, SELECTED, DOWNLOAD_MODAL, NEW_BUILD_MODAL, REFS, FACES_CONVERTED, TOTAL_CONVERT, NOTIFICATION, SHOW_DOCUMENTATION, SHOW_ONBOARDING_MODAL, updateTransformUi, addEvent, ModifyEvent, InitTransformable, TransformEvent, EndTransformable, ConvertEvent }