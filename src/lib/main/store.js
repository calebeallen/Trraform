
import { writable } from "svelte/store"

const myPlots = writable([])
const walletAddress = writable(null)
const isMobileBrowser = writable(false)
const showSettingsModal = writable(false)
const showConnectWalletModal = writable(false)
const showConnectErrorModal = writable(false)
const insideOf = writable()
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
    updateInWorld: () => {},
    mousemoveCallback: () => {},
    walletConnectedCallback: () => {},
    walletConnectXCallback: () => {}

}

const defaultSettings = {
    general : {
        fov : 70,
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

function setNotification(header, text, icon = null, href = "", hrefTargert = "", duration = 5000) {

    notification.set({header, text, icon, href, hrefTargert, duration})

}

export { defaultSettings, settings, myPlots, walletAddress, refs, insideOf, isMobileBrowser, showSettingsModal, showConnectWalletModal, showConnectErrorModal, notification, setNotification, newPlots, loadScreenOpacity }
