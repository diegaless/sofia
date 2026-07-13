const gifSetName = document.body.dataset.gifSet || 'gifs'
const musicHandoffKey = 'sofia-music-handoff'
const gifAssetVersion = document.body.dataset.gifVersion
const gifStages = [
    'stage-0-normal.gif',
    'stage-1-confused.gif',
    'stage-2-pleading.gif',
    'stage-3-sad.gif',
    'stage-4-sadder.gif',
    'stage-5-devastated.gif',
    'stage-6-very-devastated.gif',
    'stage-7-crying-runaway.gif'
].map((filename) => {
    const src = `assets/${gifSetName}/${filename}`
    return gifAssetVersion ? `${src}?v=${gifAssetVersion}` : src
})

const noMessages = [
    'No',
    '¿Estás segura, ratita? 🤔',
    'Pero si hemos pasado un mes precioso... 🥺',
    'Prometo que será un plan muy bonito 💕',
    'Me vas a romper el corazoncito... 😢',
    '¿Ni siquiera por nuestro primer mes? 💔',
    'Ratita, piénsatelo una vez más...',
    '¡Última oportunidad! 😭',
    'Da igual, no puedes escapar de nuestro primer mes 😜'
]

const yesTeasePokes = [
    '¿Así de fácil? Primero intenta decir que no 😏',
    'Venga, pulsa “No” una vez... tengo una sorpresa 👀',
    'Te estás perdiendo a la ratita dramática 😈',
    'Pulsa “No”, te reto 😏'
]

if (document.getElementById('bg-music')) {
    initPage()
} else {
    document.addEventListener('DOMContentLoaded', initPage, { once: true })
}

function initPage() {
    if (!window.__ojitosPopstateBound) {
        window.__ojitosPopstateBound = true
        window.addEventListener('popstate', () => {
            window.location.reload()
        })
    }

    const elements = {
        container: document.querySelector('.container'),
        title: document.querySelector('.container h1'),
        buttons: document.querySelector('.buttons'),
        catGif: document.getElementById('cat-gif'),
        yesBtn: document.getElementById('yes-btn'),
        noBtn: document.getElementById('no-btn'),
        music: document.getElementById('bg-music'),
        musicToggle: document.getElementById('music-toggle'),
        teaseToast: document.getElementById('tease-toast')
    }

    if (!elements.catGif || !elements.yesBtn || !elements.noBtn || !elements.music || !elements.musicToggle || !elements.teaseToast) {
        return
    }

    const state = {
        yesTeasedCount: 0,
        noClickCount: 0,
        runawayEnabled: false,
        yesScreenVisible: false,
        musicPlaying: true,
        teaseToastTimerId: null
    }

    elements.yesBtn.addEventListener('click', () => handleYesClick(state, elements))
    elements.noBtn.addEventListener('click', () => handleNoClick(state, elements))
    elements.musicToggle.addEventListener('click', () => toggleMusic(state, elements))

    preloadGifStages()
    initializeMusic(state, elements)
}

function preloadGifStages() {
    gifStages.slice(1).forEach((src) => {
        const image = new Image()
        image.src = src
    })
}

function initializeMusic(state, elements) {
    const { music, musicToggle } = elements

    music.autoplay = true
    music.defaultMuted = true
    music.muted = true
    music.volume = 0.3

    music.play().then(() => {
        music.muted = false
        state.musicPlaying = true
        updateMusicToggle(musicToggle, true)
    }).catch(() => {
        state.musicPlaying = true
        updateMusicToggle(musicToggle, true)

        document.addEventListener('click', () => {
            music.muted = false
            music.play().catch(() => {})
            state.musicPlaying = true
            updateMusicToggle(musicToggle, true)
        }, { once: true })
    })
}

function updateMusicToggle(musicToggle, isPlaying) {
    musicToggle.textContent = isPlaying ? '🔊' : '🔇'
    musicToggle.setAttribute('aria-label', isPlaying ? 'Silenciar música' : 'Activar música')
    musicToggle.setAttribute('aria-pressed', String(isPlaying))
    musicToggle.title = isPlaying ? 'Silenciar música' : 'Activar música'
}

function toggleMusic(state, elements) {
    const { music, musicToggle } = elements

    if (state.musicPlaying) {
        music.pause()
        state.musicPlaying = false
        updateMusicToggle(musicToggle, false)
        return
    }

    music.muted = false
    music.play().then(() => {
        state.musicPlaying = true
        updateMusicToggle(musicToggle, true)
    }).catch(() => {})
}

function handleYesClick(state, elements) {
    if (!state.runawayEnabled) {
        const msg = yesTeasePokes[Math.min(state.yesTeasedCount, yesTeasePokes.length - 1)]
        state.yesTeasedCount += 1
        showTeaseMessage(state, elements.teaseToast, msg)
        return
    }

    showYesScreen(state, elements)
}

function showTeaseMessage(state, teaseToast, msg) {
    teaseToast.textContent = msg
    teaseToast.classList.add('show')

    clearTimeout(state.teaseToastTimerId)
    state.teaseToastTimerId = setTimeout(() => {
        teaseToast.classList.remove('show')
    }, 2500)
}

function handleNoClick(state, elements) {
    const { catGif, noBtn, yesBtn } = elements

    state.noClickCount += 1

    const msgIndex = Math.min(state.noClickCount, noMessages.length - 1)
    noBtn.textContent = noMessages[msgIndex]

    resizeYesButton(yesBtn, state.noClickCount)

    if (state.noClickCount >= 2) {
        resizeNoButton(noBtn, state.noClickCount)
    }

    const gifIndex = Math.min(state.noClickCount, gifStages.length - 1)
    swapGif(catGif, gifStages[gifIndex])

    if (state.noClickCount >= 5 && !state.runawayEnabled) {
        enableRunaway(noBtn)
        state.runawayEnabled = true
    }
}

function resizeYesButton(yesBtn, noClickCount) {
    const fontSize = 1.6 * (1.35 ** noClickCount)
    const padY = Math.min(18 + noClickCount * 5, 60)
    const padX = Math.min(45 + noClickCount * 10, 120)

    yesBtn.style.setProperty('--yes-font-size', `${fontSize}rem`)
    yesBtn.style.setProperty('--yes-pad-y', `${padY}px`)
    yesBtn.style.setProperty('--yes-pad-x', `${padX}px`)
}

function resizeNoButton(noBtn, noClickCount) {
    const fontSize = Math.max(0.625, 0.85 ** (noClickCount - 1))
    noBtn.style.setProperty('--no-font-size', `${fontSize}rem`)
}

let gifSwapId = 0

function swapGif(catGif, src) {
    const swapId = ++gifSwapId
    const nextGif = new Image()

    catGif.style.opacity = '0'
    nextGif.src = src

    const revealGif = () => {
        if (swapId !== gifSwapId) {
            return
        }
        catGif.src = src
        catGif.style.opacity = '1'
    }

    if (typeof nextGif.decode === 'function') {
        nextGif.decode().then(revealGif).catch(revealGif)
        return
    }

    nextGif.onload = revealGif
    nextGif.onerror = revealGif
}

function enableRunaway(noBtn) {
    noBtn.addEventListener('mouseover', () => runAway(noBtn))
    noBtn.addEventListener('touchstart', () => runAway(noBtn), { passive: true })
}

function runAway(noBtn) {
    const margin = 20
    const btnW = noBtn.offsetWidth
    const btnH = noBtn.offsetHeight
    const maxX = Math.max(window.innerWidth - btnW - margin, margin)
    const maxY = Math.max(window.innerHeight - btnH - margin, margin)

    const randomX = Math.random() * (maxX - margin) + margin / 2
    const randomY = Math.random() * (maxY - margin) + margin / 2

    noBtn.style.position = 'fixed'
    noBtn.style.left = `${randomX}px`
    noBtn.style.top = `${randomY}px`
    noBtn.style.zIndex = '50'
}

function showYesScreen(state, elements) {
    if (state.yesScreenVisible) {
        return
    }

    state.yesScreenVisible = true
    try {
        sessionStorage.setItem(musicHandoffKey, JSON.stringify({
            currentTime: elements.music.currentTime,
            playing: state.musicPlaying && !elements.music.paused
        }))
    } catch {
        // Continue navigating if storage is unavailable.
    }
    window.location.assign('yes.html')
}
