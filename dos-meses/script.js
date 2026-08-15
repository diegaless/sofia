const musicHandoffKey = 'sofia-music-handoff'
const chapterTwoAccessKey = 'sofia-chapter-two-access-v1'
const chapterTwoAccessHandoff = window.location.hash === '#acceso-concedido'
const chapterTwoAccessGranted = (() => {
    if (chapterTwoAccessHandoff) {
        try {
            sessionStorage.setItem(chapterTwoAccessKey, 'granted')
        } catch {
            // The one-time URL handoff also supports local-file previews.
        }
        return true
    }

    try {
        return sessionStorage.getItem(chapterTwoAccessKey) === 'granted'
    } catch {
        // Do not trap visitors in a redirect loop if storage is unavailable.
        return true
    }
})()

if (chapterTwoAccessHandoff) {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
}

const memories = [
    {
        number: '01',
        kicker: 'Nuestro lugar favorito',
        title: 'Donde estemos los dos',
        text: 'No importa dónde sea: si estoy contigo, ya es un buen lugar. Esta foto me recuerda que mis mejores planes siempre tienen tu sonrisa cerca.',
        image: '../assets/mes-2-paisaje.jpg',
        alt: 'Sofía y Diego juntos con un paisaje de montaña al fondo'
    },
    {
        number: '02',
        kicker: 'Mi debilidad favorita',
        title: 'Tu mirada',
        text: 'Dos meses después, me siguen gustando como el primer día. Y tú, con cada risa, cada conversación y cada momento compartido, todavía más.',
        image: '../assets/mes-2-beso-v2.webp',
        alt: 'Sofía y Diego posando juntos en un selfie'
    }
]

if (!chapterTwoAccessGranted) {
    window.location.replace('../yes.html#capitulo-2')
} else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage, { once: true })
} else {
    initPage()
}

function initPage() {
    const elements = {
        introScene: document.getElementById('intro-scene'),
        memoriesScene: document.getElementById('memories-scene'),
        gameScene: document.getElementById('game-scene'),
        letterScene: document.getElementById('letter-scene'),
        runnerRoot: document.getElementById('sofia-runner'),
        startButton: document.getElementById('start-mission'),
        memoryCards: [...document.querySelectorAll('.memory-card')],
        progressCount: document.getElementById('progress-count'),
        progressFill: document.getElementById('progress-fill'),
        missionMessage: document.getElementById('mission-message'),
        openLetterButton: document.getElementById('open-letter'),
        dialog: document.getElementById('memory-dialog'),
        closeDialogButton: document.getElementById('close-memory'),
        dialogPhotoWrap: document.querySelector('.memory-photo-wrap'),
        dialogImage: document.getElementById('memory-dialog-image'),
        dialogNumber: document.getElementById('memory-dialog-number'),
        dialogKicker: document.getElementById('memory-dialog-kicker'),
        dialogTitle: document.getElementById('memory-dialog-title'),
        dialogText: document.getElementById('memory-dialog-text'),
        celebrationLayer: document.getElementById('celebration-layer'),
        music: document.getElementById('bg-music'),
        musicToggle: document.getElementById('music-toggle')
    }

    if (Object.values(elements).some((element) => !element)) return

    const state = {
        openedMemories: new Set(),
        lastMemoryCard: null,
        musicPlaying: false,
        resumeMusicAfterGame: false
    }

    elements.startButton.addEventListener('click', () => {
        showScene(elements.introScene, elements.memoriesScene)
        ensureMusicPlaying(state, elements.music, elements.musicToggle)
    })

    elements.memoryCards.forEach((card) => {
        card.addEventListener('click', () => openMemory(Number(card.dataset.memory), state, elements))
    })

    elements.closeDialogButton.addEventListener('click', () => elements.dialog.close())
    elements.dialog.addEventListener('click', (event) => {
        if (event.target === elements.dialog) elements.dialog.close()
    })
    elements.dialog.addEventListener('close', () => {
        state.lastMemoryCard?.focus({ preventScroll: true })
    })

    initSecretVideoUnlock(elements.runnerRoot)

    const runner = window.createSofiaRunner?.({
        root: elements.runnerRoot,
        musicElement: elements.music,
        onContinue: () => {
            runner?.leave()
            document.body.classList.remove('is-runner-active')
            elements.music.volume = 0.3
            showScene(elements.gameScene, elements.letterScene)
            launchHearts(elements.celebrationLayer, 34)
            if (state.resumeMusicAfterGame) {
                ensureMusicPlaying(state, elements.music, elements.musicToggle)
            }
        }
    })

    elements.openLetterButton.addEventListener('click', () => {
        if (!runner) {
            showScene(elements.memoriesScene, elements.letterScene)
            launchHearts(elements.celebrationLayer, 34)
            return
        }

        elements.celebrationLayer.replaceChildren()
        showScene(elements.memoriesScene, elements.gameScene)
        document.body.classList.add('is-runner-active')
        state.resumeMusicAfterGame = !elements.music.paused
        elements.music.pause()
        state.musicPlaying = false
        updateMusicToggle(elements.musicToggle, false)
        window.requestAnimationFrame(() => runner.enter())
    })

    elements.musicToggle.addEventListener('click', () => toggleMusic(state, elements.music, elements.musicToggle))
    initializeMusic(state, elements.music, elements.musicToggle)
}

function initSecretVideoUnlock(runnerRoot) {
    const unlockCard = document.getElementById('runner-video-unlock')
    const openButton = document.getElementById('runner-video-open')
    const toast = document.getElementById('runner-video-toast')
    const dialog = document.getElementById('secret-video-dialog')
    const closeButton = document.getElementById('close-secret-video')
    const frame = document.getElementById('secret-video-frame')
    const videoFrame = dialog?.querySelector('.secret-video-frame')
    const videoStatus = document.getElementById('secret-video-status')
    if (!runnerRoot || !unlockCard || !openButton || !toast || !dialog || !closeButton || !frame || !videoFrame || !videoStatus) return

    let previouslyUnlocked = false
    let previousFocus = null
    let toastTimer = null

    const syncVideoScale = () => {
        const availableWidth = Number.parseFloat(window.getComputedStyle(videoFrame).width) || videoFrame.clientWidth
        if (availableWidth > 0) {
            frame.style.setProperty('--secret-video-scale', String(availableWidth / 360))
        }
    }

    if (typeof ResizeObserver === 'function') {
        const videoResizeObserver = new ResizeObserver(syncVideoScale)
        videoResizeObserver.observe(videoFrame)
    } else {
        window.addEventListener('resize', syncVideoScale, { passive: true })
    }

    const hideToast = () => {
        window.clearTimeout(toastTimer)
        toastTimer = null
        toast.classList.remove('is-visible')
        window.setTimeout(() => {
            if (!toast.classList.contains('is-visible')) toast.hidden = true
        }, 280)
    }

    const showToast = () => {
        window.clearTimeout(toastTimer)
        toast.hidden = false
        toast.classList.remove('is-visible')
        void toast.offsetWidth
        toast.classList.add('is-visible')
        toastTimer = window.setTimeout(hideToast, 3200)
    }

    const finishClosingDialog = () => {
        frame.removeAttribute('src')
        videoFrame.classList.remove('is-loading', 'is-ready', 'has-error')
        videoStatus.querySelector('strong').textContent = 'Cargando nuestro recuerdo…'
        document.body.classList.remove('is-secret-video-open')
        if (runnerRoot.dataset.wordComplete === 'true') {
            previousFocus?.focus?.({ preventScroll: true })
        }
        previousFocus = null
    }

    const closeDialog = () => {
        if (dialog.open && typeof dialog.close === 'function') {
            dialog.close()
            return
        }
        dialog.removeAttribute('open')
        finishClosingDialog()
    }

    const openDialog = () => {
        if (runnerRoot.dataset.wordComplete !== 'true') return
        previousFocus = document.activeElement
        if (!frame.hasAttribute('src')) {
            videoFrame.classList.add('is-loading')
            frame.src = frame.dataset.src
        }
        document.body.classList.add('is-secret-video-open')
        if (typeof dialog.showModal === 'function') dialog.showModal()
        else dialog.setAttribute('open', '')
        syncVideoScale()
        closeButton.focus({ preventScroll: true })
    }

    const syncUnlockState = () => {
        const unlocked = runnerRoot.dataset.wordComplete === 'true'
        runnerRoot.dataset.videoUnlocked = String(unlocked)
        unlockCard.hidden = !unlocked
        unlockCard.classList.toggle('is-revealed', unlocked)

        if (unlocked && !previouslyUnlocked) showToast()
        if (!unlocked) {
            hideToast()
            if (dialog.open) closeDialog()
        }
        previouslyUnlocked = unlocked
    }

    openButton.addEventListener('click', openDialog)
    closeButton.addEventListener('click', closeDialog)
    frame.addEventListener('load', () => {
        if (!dialog.open || !frame.hasAttribute('src')) return
        videoFrame.classList.remove('is-loading', 'has-error')
        videoFrame.classList.add('is-ready')
    })
    frame.addEventListener('error', () => {
        videoFrame.classList.remove('is-loading', 'is-ready')
        videoFrame.classList.add('has-error')
        videoStatus.querySelector('strong').textContent = 'No se pudo cargar aquí. Ábrelo en Drive.'
    })
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) closeDialog()
    })
    dialog.addEventListener('close', finishClosingDialog)

    const observer = new MutationObserver(syncUnlockState)
    observer.observe(runnerRoot, { attributes: true, attributeFilter: ['data-word-complete'] })
    syncUnlockState()
}

function showScene(currentScene, nextScene) {
    currentScene.classList.remove('is-active')
    currentScene.hidden = true
    nextScene.hidden = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
    requestAnimationFrame(() => nextScene.classList.add('is-active'))
}

function openMemory(index, state, elements) {
    const memory = memories[index]
    const card = elements.memoryCards[index]
    if (!memory || !card) return

    state.lastMemoryCard = card
    const hasImage = Boolean(memory.image)
    elements.dialog.classList.toggle('is-text-only', !hasImage)
    elements.dialogPhotoWrap.hidden = !hasImage
    if (hasImage) {
        elements.dialogImage.src = memory.image
        elements.dialogImage.alt = memory.alt
    } else {
        elements.dialogImage.removeAttribute('src')
        elements.dialogImage.alt = ''
    }
    elements.dialogNumber.textContent = memory.number
    elements.dialogKicker.textContent = memory.kicker
    elements.dialogTitle.textContent = memory.title
    elements.dialogText.textContent = memory.text

    if (typeof elements.dialog.showModal === 'function') {
        elements.dialog.showModal()
    } else {
        elements.dialog.setAttribute('open', '')
    }

    if (!state.openedMemories.has(index)) {
        state.openedMemories.add(index)
        card.classList.add('is-opened')
        card.querySelector('.memory-state').textContent = 'Volver a ver'
        updateMissionProgress(state, elements)
    }
}

function updateMissionProgress(state, elements) {
    const count = state.openedMemories.size
    elements.progressCount.textContent = String(count)
    elements.progressFill.style.width = `${count / memories.length * 100}%`

    if (count === 1) {
        elements.missionMessage.textContent = 'Has encontrado uno. Mía dice que todavía queda otro…'
        return
    }

    if (count === memories.length) {
        elements.missionMessage.textContent = 'Misión cumplida. Pero Mía todavía guarda algo para ti.'
        elements.openLetterButton.hidden = false
        launchHearts(elements.celebrationLayer, 18)
    }
}

function launchHearts(layer, amount) {
    const symbols = ['♥', '♡', '💕', '💗']
    const colors = ['#d95786', '#a42b59', '#ef8eb0', '#f4b4ca']

    for (let index = 0; index < amount; index += 1) {
        const heart = document.createElement('span')
        const startX = 8 + Math.random() * 84
        const endX = Math.max(2, Math.min(98, startX + (Math.random() - 0.5) * 32))
        heart.className = 'celebration-heart'
        heart.textContent = symbols[Math.floor(Math.random() * symbols.length)]
        heart.style.setProperty('--start-x', `${startX}vw`)
        heart.style.setProperty('--end-x', `${endX}vw`)
        heart.style.setProperty('--delay', `${Math.random() * 850}ms`)
        heart.style.setProperty('--heart-size', `${14 + Math.random() * 22}px`)
        heart.style.setProperty('--heart-color', colors[Math.floor(Math.random() * colors.length)])
        heart.addEventListener('animationend', () => heart.remove(), { once: true })
        layer.appendChild(heart)
    }
}

function initializeMusic(state, music, toggle) {
    music.volume = 0.3
    let handoff = null

    try {
        handoff = JSON.parse(sessionStorage.getItem(musicHandoffKey))
        sessionStorage.removeItem(musicHandoffKey)
    } catch {
        handoff = null
    }

    const restorePosition = () => {
        if (Number.isFinite(handoff?.currentTime)) {
            music.currentTime = handoff.currentTime
        }
        if (handoff?.playing) {
            ensureMusicPlaying(state, music, toggle)
        } else {
            updateMusicToggle(toggle, false)
        }
    }

    if (music.readyState >= 1) {
        restorePosition()
    } else {
        music.addEventListener('loadedmetadata', restorePosition, { once: true })
    }
}

function ensureMusicPlaying(state, music, toggle) {
    music.muted = false
    music.play().then(() => {
        state.musicPlaying = true
        updateMusicToggle(toggle, true)
    }).catch(() => {
        state.musicPlaying = false
        updateMusicToggle(toggle, false)
    })
}

function toggleMusic(state, music, toggle) {
    if (!music.paused) {
        music.pause()
        state.musicPlaying = false
        updateMusicToggle(toggle, false)
        return
    }

    ensureMusicPlaying(state, music, toggle)
}

function updateMusicToggle(toggle, isPlaying) {
    toggle.textContent = isPlaying ? '🔊' : '🔇'
    toggle.setAttribute('aria-label', isPlaying ? 'Silenciar música' : 'Activar música')
    toggle.setAttribute('aria-pressed', String(isPlaying))
    toggle.title = isPlaying ? 'Silenciar música' : 'Activar música'
}
