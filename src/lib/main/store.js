
import { writable } from "svelte/store"

const walletAddress = writable(null)
const walletConnection = writable(null)
const showConnectWalletModal = writable(false)
const isMobileBrowser = writable(false)
const dbConnection = writable(null)

const showSettingsModal = writable(false)
const showConnectErrorModal = writable(false)
const insideOf = writable(null)
const notification = writable([])
const newPlots = writable(0)
const loadScreenOpacity = writable(100)

const refs = {

    disabled: false,
    lastPlotVisited: "0x0",
    tagCanvas: null,
    renderer: null,
    renderManager : null,
    scene: null,
    camera: null,
    viewMatrix: null,
    mousemoveCallback: () => {},
    walletConnectedCallback: () => {},
    walletConnectXCallback: () => {}

}

const defaultSettings = {
    general : {
        fov : 90,
        lookSens : 20,
        maxTags : 24,
        tagSize : 3
    },
    render : {
        limitType : 0, // 0:vram 1:plots
        vramLimit : 1000, //MB
        renderLimit : 1000,
        lowResDist : 50
    }
}

const settings = Object.assign({}, structuredClone(defaultSettings))


export { defaultSettings, settings, walletConnection, walletAddress, dbConnection, refs, insideOf, isMobileBrowser, showSettingsModal, showConnectWalletModal, showConnectErrorModal, notification, newPlots, loadScreenOpacity }
