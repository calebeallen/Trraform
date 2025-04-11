
import { writable } from "svelte/store"

const showSettingsModal = writable(false)
const showHowItWorksModal = writable(false)
const showNextStepsModal = writable(false)
const showAuthModal = writable(false)
const showResetPasswordModal = writable(false)
const showSendVerificationEmailModal = writable(false)
const showClaimModal = writable(false)
const showShareModal = writable(false)
const showReportModal = writable(false)
const showChangeUsernameModal = writable(false)
const modalsShowing = writable(0)

const showUserWidget = writable(false)

const user = writable(null)
const inputFocused = writable(false)
const isMobileBrowser = writable(false)
const insideOf = writable(null)
const notification = writable([])
const newPlots = writable(false)
const loadScreenOpacity = writable(100)
const leaderboard = writable([])
const tempEmail = writable("")
const myPlots = writable([])

const refs = {
    renderer: null,
    renderManager : null,
    scene: null,
    camera: null,
}

const defaultSettings = {
    fov: 90,
    sensitivity: 8,
    tagCount: 10,
    tagSize: 3,
    renderLimitLinear: 15412,
    renderLimit: 1542,
    lowLODDist: 50
}

const settings = Object.assign({}, structuredClone(defaultSettings))

export { 
    defaultSettings, 
    settings, 
    refs, 
    insideOf, 
    isMobileBrowser, 
    showHowItWorksModal, 
    showSettingsModal,
    notification, 
    newPlots, 
    loadScreenOpacity, 
    leaderboard, 
    showNextStepsModal, 
    showAuthModal, 
    showResetPasswordModal, 
    tempEmail, 
    showSendVerificationEmailModal, 
    user, 
    showUserWidget, 
    myPlots, 
    showClaimModal, 
    showShareModal,
    showReportModal,
    modalsShowing,
    inputFocused,
    showChangeUsernameModal
}
