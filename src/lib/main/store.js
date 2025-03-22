
import { writable } from "svelte/store"

const walletAddress = writable(null)
const walletConnection = writable(null)
const showConnectWalletModal = writable(false)
const showSettingsModal = writable(false)
const showHowItWorksModal = writable(false)
const showMyPlots = writable(false)
const myPlots = writable([])
const plotSearchFocused = writable(false)
const isMobileBrowser = writable(false)
const dbConnection = writable(null)
const insideOf = writable(null)
const notification = writable([])
const newPlots = writable(0)
const loadScreenOpacity = writable(100)

const refs = {
    tagCanvas: null,
    renderer: null,
    renderManager : null,
    scene: null,
    camera: null,
    viewMatrix: null
}

const defaultSettings = {
    fov: 90,
    sensitivity: 8,
    tagCount: 10,
    tagSize: 2,
    renderLimit: 1600,
    lowLODDist: 50
}

const settings = Object.assign({}, structuredClone(defaultSettings))

export { defaultSettings, settings, walletConnection, walletAddress, dbConnection, refs, insideOf, isMobileBrowser, showConnectWalletModal, showHowItWorksModal, myPlots, showSettingsModal, showMyPlots, plotSearchFocused, notification, newPlots, loadScreenOpacity }
