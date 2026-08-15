(() => {
    'use strict'

    const BEST_SCORE_KEY = 'sofia-guardia-corazones-best-v2'
    const SCORE_HISTORY_KEY = 'sofia-guardia-corazones-history-v1'
    const SCORE_HISTORY_LIMIT = 10
    const TUTORIAL_KEY = 'sofia-guardia-corazones-tutorial-v1'
    const SOUND_MUTED_KEY = 'sofia-guardia-corazones-muted-v1'
    const VIEW_DISTANCE = 126
    const LANES = [-1, 0, 1]
    const SCENE_LENGTH = 340
    const SCENE_FADE = 36
    const ROAD_HORIZON_RATIO = 0.43
    const INITIAL_SPEED = 19
    const MAX_SPEED = 32
    const DIFFICULTY_DISTANCE = 900
    const SLIDE_DURATION = 1.08
    const SLIDE_ENTER_DURATION = 0.2
    const SLIDE_EXIT_DURATION = 0.24
    const LANDING_ROLL_DURATION = 0.76
    const JUMP_LAUNCH_SPEED_RATIO = 1.16
    const BOOST_JUMP_SPEED_RATIO = 1.34
    const JUMP_RISE_GRAVITY_RATIO = 2.85
    const JUMP_APEX_GRAVITY_RATIO = 1.7
    const JUMP_FALL_GRAVITY_RATIO = 2.18
    const JUMP_FAST_FALL_SPEED_RATIO = 1.12
    const JUMP_FAST_FALL_GRAVITY_RATIO = 4.15
    const MAX_FRAME_DELTA = 0.05
    const MAX_SIMULATION_STEP = 1 / 120
    const COMBO_TIMEOUT = 4.2
    const FEVER_CHARGE_TARGET = 24
    const FEVER_DURATION = 6.2
    const FLIGHT_LIFT_RATIO = 0.19
    const FLIGHT_RISE_RESPONSE = 4.8
    const FLIGHT_FALL_RESPONSE = 3.35
    const OBSTACLE_CONTACT_FRONT = 0.72
    const OBSTACLE_CONTACT_BACK = -0.78
    const PLAYER_STANDING_HEIGHT = 0.245
    const PLAYER_SLIDING_HEIGHT = 0.09
    const OBSTACLE_VERTICAL_PROFILES = {
        cart: { bottom: 0, top: 0.35 },
        spill: { bottom: 0, top: 0.062 },
        sheet: { bottom: 0.122, top: 0.36 }
    }
    const SCENES = [
        { key: 'lodares', label: 'Pasaje de Lodares + Altozano · Albacete', shortLabel: 'Albacete' },
        { key: 'aguamarina', label: 'Cala Aguamarina · Campoamor', shortLabel: 'Atardecer en Aguamarina' }
    ]
    const ROUTE_DISTANCE = SCENE_LENGTH * SCENES.length
    const FINAL_SCENE_KEY = SCENES[SCENES.length - 1].key
    const FINAL_CLEAR_ZONE = VIEW_DISTANCE + 72
    const SCENE_GAMEPLAY = {
        lodares: {
            level: 1,
            title: 'Albacete',
            mission: 'Encuentra el ritmo entre arcos y flores',
            speedMultiplier: 0.96,
            spawnMultiplier: 1.08,
            obstaclePool: ['cart', 'cart', 'spill', 'sheet'],
            powerups: ['shield', 'magnet', 'sneakers'],
            objective: { type: 'hearts', target: 10, label: 'Recoge 10 corazones' }
        },
        aguamarina: {
            level: 2,
            title: 'Aguamarina',
            mission: 'Encadena saltos y desliza junto al mar hasta la meta',
            speedMultiplier: 1.025,
            spawnMultiplier: 0.97,
            obstaclePool: ['spill', 'sheet', 'spill', 'cart'],
            powerups: ['magnet', 'sneakers', 'multiplier', 'shield'],
            objective: { type: 'combo', target: 12, label: 'Consigue una racha de 12' }
        }
    }
    const POWERUPS = {
        shield: { duration: 8, icon: '✦', label: 'Escudo', color: '#7de5d2' },
        magnet: { duration: 7.5, icon: '♥', label: 'Imán', color: '#ff8eb7' },
        multiplier: { duration: 8, icon: '×2', label: 'Puntos ×2', color: '#ffd56a' },
        sneakers: { duration: 9, icon: '↟', label: 'Super salto', color: '#b89cff' },
        flight: { duration: 6.1, icon: '♡', label: 'Vuelo de recuerdos', color: '#85dcff' }
    }
    const MAGNET_RANGE = 38
    const SCENE_TRANSITION_CLEARANCE = 34
    const MOVING_ENCOUNTER_CLEARANCE = 62

    const BACKGROUND_VARIANTS = {
        lodares: [
            {
                key: 'lodares-pasaje',
                path: 'assets/game/backgrounds/lodares.webp',
                horizon: 0.375,
                focusX: 0.5,
                routeStrength: 0.08
            },
            {
                key: 'lodares-altozano',
                path: 'assets/game/backgrounds/memories/altozano.webp',
                horizon: 0.5,
                focusX: 0.5,
                routeStrength: 0.6
            }
        ],
        aguamarina: [
            {
                key: 'aguamarina-playa-4',
                path: 'assets/game/backgrounds/memories/aguamarina-playa-4.webp',
                horizon: 0.58,
                focusX: 0.52,
                routeStrength: 0.72,
                weight: 1.55
            },
            {
                key: 'aguamarina-playa-1',
                path: 'assets/game/backgrounds/memories/aguamarina-playa-1.webp',
                horizon: 0.68,
                focusX: 0.5,
                routeStrength: 0.72,
                weight: 0.82
            },
            {
                key: 'aguamarina-playa-2',
                path: 'assets/game/backgrounds/memories/aguamarina-playa-2.webp',
                horizon: 0.4,
                focusX: 0.54,
                routeStrength: 0.7,
                weight: 0.82
            },
            {
                key: 'aguamarina-playa-3',
                path: 'assets/game/backgrounds/memories/aguamarina-playa-3.webp',
                horizon: 0.39,
                focusX: 0.59,
                routeStrength: 0.78,
                weight: 0.81
            }
        ]
    }
    const MEMORY_TOKENS = [
        {
            scene: 'lodares',
            distance: 320,
            lane: 0,
            title: 'Albacete',
            caption: 'Nuestro comienzo',
            imageKey: 'lodares-altozano',
            thumbnail: 'assets/game/backgrounds/memories/altozano.webp',
            accent: '#f29b79'
        },
        {
            scene: 'aguamarina',
            distance: 660,
            lane: 1,
            title: 'Aguamarina',
            caption: 'Nuestro atardecer',
            imageKey: 'aguamarina-playa-4',
            thumbnail: 'assets/game/backgrounds/memories/aguamarina-playa-4.webp',
            accent: '#61d4c2'
        }
    ]
    const WORD_HUNT_LABEL = 'SOFÍA'
    const WORD_HUNT_COMPLETION_BONUS = 1600
    const WORD_HUNT_TOKENS = [
        { letter: 'S', scene: 'lodares', distance: 74, lane: 1, accent: '#f09a78', dark: '#823653' },
        { letter: 'O', scene: 'lodares', distance: 286, lane: 0, accent: '#f2b569', dark: '#8f3d50' },
        { letter: 'F', scene: 'aguamarina', distance: 372, lane: 0, accent: '#55d4c0', dark: '#126f7b' },
        { letter: 'Í', scene: 'aguamarina', distance: 560, lane: 1, accent: '#70dced', dark: '#315b94' },
        { letter: 'A', scene: 'aguamarina', distance: 590, lane: 0, accent: '#80ddc9', dark: '#37628a' }
    ]
    const ROUTE_CRATES = [
        {
            scene: 'lodares',
            distance: 260,
            lane: -1,
            title: 'Caja de Albacete',
            caption: 'Un premio tras el vuelo',
            accent: '#f3a078',
            dark: '#7b3150',
            rewards: ['shield', 'hearts', 'multiplier']
        },
        {
            scene: 'aguamarina',
            distance: 530,
            lane: 0,
            title: 'Tesoro de Aguamarina',
            caption: 'Una sorpresa junto al mar',
            accent: '#58d7c6',
            dark: '#176c79',
            rewards: ['magnet', 'hearts', 'multiplier']
        }
    ]
    const CRATE_HEART_REWARD = 8
    const CRATE_SCORE_REWARD = 900
    const CRATE_COMPLETION_BONUS = 1200
    const SPECIAL_MIA_TOKENS = [
        { scene: 'lodares', distance: 42, lane: 0, accent: '#f2a45f', dark: '#6f294c' },
        { scene: 'aguamarina', distance: 500, lane: -1, accent: '#f28b72', dark: '#6f294c' },
        { scene: 'aguamarina', distance: 630, lane: 0, accent: '#69d9c8', dark: '#315b79' }
    ]
    const SPECIAL_MIA_SCORE_REWARD = 1200
    const MIA_BARK_PATH = 'assets/game/audio/mia-dachshund-bark.wav'
    const SIGNATURE_AIR_ROUTES = [
        { scene: 'aguamarina', powerDistance: 396, startDistance: 414, lane: -1 }
    ]
    const AIR_ROUTE_HEIGHTS = [5, 16, 34, 58, 86, 116, 150, 180, 154, 118, 76, 38]
    const AIR_ROUTE_SPACING = 5.2
    const AIR_JUMP_SPEED_RATIO = 0.96
    const SIGNATURE_FLIGHT_ROUTE = {
        scene: 'lodares',
        powerDistance: 112,
        startDistance: 128,
        lane: 0
    }
    const FLIGHT_ROUTE_LANES = [0, 0, 0, -1, -1, -1, 0, 0, 1, 1, 1, 0, 0, -1, -1, -1, 0, 0, 1, 1]
    const FLIGHT_ROUTE_HEIGHTS = [62, 82, 102, 116, 126, 132, 138, 142, 146, 142, 136, 130, 124, 120, 124, 132, 140, 146, 142, 126]
    const FLIGHT_ROUTE_SPACING = 5.55
    const OBJECT_ASSET_PATHS = {
        'lodares-cart': 'assets/game/objects/lodares-cart.webp',
        'lodares-spill': 'assets/game/objects/lodares-spill.webp',
        'lodares-sheet': 'assets/game/objects/lodares-sheet.webp',
        'aguamarina-cart': 'assets/game/objects/aguamarina-cart.webp',
        'aguamarina-spill': 'assets/game/objects/aguamarina-spill.webp',
        'aguamarina-sheet': 'assets/game/objects/aguamarina-sheet.webp',
        'collectible-heart': 'assets/game/objects/collectible-heart.webp',
        'collectible-shield': 'assets/game/objects/collectible-shield.webp',
        'collectible-mia-salchicha': 'assets/game/objects/mia-salchicha-special.webp'
    }
    const SOFIA_SPRITE_PATHS = {
        run: 'assets/game/characters/sofia-run-v3.webp',
        jump: 'assets/game/characters/sofia-jump-v3.webp',
        slide: 'assets/game/characters/sofia-slide-v3.webp'
    }
    const OBJECT_RENDER_METRICS = {
        lodares: {
            cart: { width: 96, height: 82, shadow: 48 },
            spill: { width: 108, height: 43, shadow: 45 },
            sheet: { width: 104, height: 135, shadow: 48 }
        },
        aguamarina: {
            cart: { width: 96, height: 103, shadow: 48 },
            spill: { width: 108, height: 50, shadow: 47 },
            sheet: { width: 166, height: 181, shadow: 55 }
        }
    }
    const OBJECT_CUES = {
        cart: { color: [218, 48, 72], text: '↔ CAMBIA', symbol: '↔' },
        spill: { color: [216, 142, 20], text: '↑ SALTA', symbol: '↑' },
        sheet: { color: [111, 78, 196], text: '↓ AGÁCHATE', symbol: '↓' }
    }

    const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value))
    const mix = (from, to, amount) => from + (to - from) * amount
    const smoothstep = (value) => {
        const amount = clamp(value, 0, 1)
        return amount * amount * (3 - 2 * amount)
    }
    const smootherstep = (value) => {
        const amount = clamp(value, 0, 1)
        return amount * amount * amount * (amount * (amount * 6 - 15) + 10)
    }
    const randomItem = (items) => items[Math.floor(Math.random() * items.length)]

    function loadGameImage(path) {
        const image = new Image()
        image.decoding = 'async'
        image.src = new URL(path, document.baseURI).href
        return image
    }

    function isImageReady(image) {
        return Boolean(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0)
    }

    window.createSofiaRunner = function createSofiaRunner({ root, onContinue, musicElement } = {}) {
        if (!root) return null

        const find = (selector) => root.querySelector(selector)
        const elements = {
            canvas: find('#runner-canvas'),
            score: find('#runner-score'),
            distance: find('#runner-distance'),
            coins: find('#runner-coins'),
            best: find('#runner-best'),
            lives: find('#runner-lives'),
            location: find('#runner-location'),
            actionCue: find('#runner-action-cue'),
            actionCueIcon: find('#runner-action-cue-icon'),
            actionCueText: find('#runner-action-cue-text'),
            countdown: find('#runner-countdown'),
            countdownValue: find('#runner-countdown-value'),
            countdownLabel: find('#runner-countdown-label'),
            combo: find('#runner-combo'),
            comboLabel: find('#runner-combo-label'),
            comboValue: find('#runner-combo-value'),
            comboMultiplier: find('#runner-combo-multiplier'),
            powerStatus: find('#runner-power-status'),
            powerIcon: find('#runner-power-icon'),
            powerLabel: find('#runner-power-label'),
            powerTime: find('#runner-power-time'),
            levelToast: find('#runner-level-toast'),
            levelToastNumber: find('#runner-level-toast-number'),
            levelToastTitle: find('#runner-level-toast-title'),
            levelToastMission: find('#runner-level-toast-mission'),
            memoryToast: find('#runner-memory-toast'),
            memoryToastImage: find('#runner-memory-toast-image'),
            memoryToastNumber: find('#runner-memory-toast-number'),
            memoryToastTitle: find('#runner-memory-toast-title'),
            memoryToastCaption: find('#runner-memory-toast-caption'),
            crateToast: find('#runner-crate-toast'),
            crateToastIcon: find('#runner-crate-toast-icon'),
            crateToastTitle: find('#runner-crate-toast-title'),
            crateToastReward: find('#runner-crate-toast-reward'),
            crateToastCaption: find('#runner-crate-toast-caption'),
            missionStatus: find('#runner-mission-status'),
            missionLabel: find('#runner-mission-label'),
            missionValue: find('#runner-mission-value'),
            missionTarget: find('#runner-mission-target'),
            wordHunt: find('#runner-word-hunt'),
            wordSlots: [...root.querySelectorAll('[data-runner-letter-slot]')],
            crateProgress: find('.runner-crate-progress'),
            crateCount: find('#runner-crate-count'),
            impactFlash: find('#runner-impact-flash'),
            startBest: find('#runner-start-best'),
            historyButtons: [...root.querySelectorAll('[data-runner-history-open]')],
            historyDialog: find('#runner-score-history'),
            historyClose: find('#runner-history-close'),
            historyList: find('#runner-history-list'),
            pauseButton: find('#runner-pause'),
            muteButton: find('#runner-mute'),
            feedback: find('#runner-feedback'),
            announcer: find('#runner-announcer'),
            startScreen: find('#runner-start-screen'),
            tutorial: find('#runner-tutorial'),
            pauseScreen: find('#runner-pause-screen'),
            endScreen: find('#runner-end-screen'),
            playButton: find('#runner-play'),
            tutorialStartButton: find('#runner-tutorial-start'),
            resumeButton: find('#runner-resume'),
            restartButton: find('#runner-restart'),
            continueButton: find('#runner-continue'),
            finalScore: find('#runner-final-score'),
            finalDistance: find('#runner-final-distance'),
            finalCoins: find('#runner-final-coins'),
            finalCombo: find('#runner-final-combo'),
            finalMemories: find('#runner-final-memories'),
            finalCrates: find('#runner-final-crates'),
            memorySlots: [...root.querySelectorAll('[data-runner-memory-slot]')],
            finalWord: find('#runner-final-word'),
            finalLetters: find('#runner-final-letters'),
            finalWordSlots: [...root.querySelectorAll('[data-runner-final-letter-slot]')],
            finalRank: find('#runner-final-rank'),
            endKicker: find('#runner-end-kicker'),
            endSummary: find('#runner-end-summary'),
            recordMessage: find('#runner-record-message'),
            endTitle: find('#runner-end-title'),
            touchButtons: [...root.querySelectorAll('[data-runner-action]')]
        }

        if (
            Object.values(elements).some((element) => !element) ||
            elements.historyButtons.length !== 2 ||
            elements.memorySlots.length !== MEMORY_TOKENS.length ||
            elements.wordSlots.length !== WORD_HUNT_TOKENS.length ||
            elements.finalWordSlots.length !== WORD_HUNT_TOKENS.length
        ) return null

        const context = elements.canvas.getContext('2d', { alpha: false })
        if (!context) return null
        const backgroundVariantCache = new Map()
        const sceneOverlayCache = new Map()

        const backgroundImages = Object.fromEntries(
            Object.values(BACKGROUND_VARIANTS)
                .flat()
                .map((variant) => [variant.key, loadGameImage(variant.path)])
        )
        const objectImages = Object.fromEntries(
            Object.entries(OBJECT_ASSET_PATHS).map(([key, path]) => [key, loadGameImage(path)])
        )
        const miaBarkAudio = typeof Audio === 'function'
            ? new Audio(new URL(MIA_BARK_PATH, document.baseURI).href)
            : null
        if (miaBarkAudio) {
            miaBarkAudio.preload = 'auto'
            miaBarkAudio.volume = 0.86
        }
        const sofiaSpriteImages = Object.fromEntries(
            Object.entries(SOFIA_SPRITE_PATHS).map(([key, path]) => [key, loadGameImage(path)])
        )

        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        const storedBest = readStoredNumber(BEST_SCORE_KEY)
        const storedScoreHistory = readScoreHistory(storedBest)
        const effectiveBest = Math.max(storedBest, ...storedScoreHistory.map((entry) => entry.score))
        if (effectiveBest > storedBest) writeStorage(BEST_SCORE_KEY, String(effectiveBest))
        const state = {
            active: false,
            mode: 'idle',
            width: 960,
            height: 600,
            dpr: 1,
            backgroundDpr: 1,
            renderScale: window.innerWidth <= 680 ? 2 : 2.15,
            backgroundRenderScale: window.innerWidth <= 680 ? 1.2 : 1.45,
            frameTimeAverage: 0,
            qualitySampleTimer: 0,
            qualityCooldown: 0,
            slowFrameTimer: 0,
            frameRequest: 0,
            lastFrameTime: 0,
            worldTime: 0,
            runPhase: 0,
            distance: 0,
            score: 0,
            bonusScore: 0,
            coins: 0,
            combo: 0,
            maxCombo: 0,
            comboTimer: 0,
            feverCharge: 0,
            feverTimer: 0,
            feverActivations: 0,
            obstaclesCleared: 0,
            best: effectiveBest,
            scoreHistory: storedScoreHistory,
            speed: INITIAL_SPEED,
            lane: 0,
            targetLane: 0,
            laneVelocity: 0,
            laneChangeTimer: 0,
            laneChangeDirection: 0,
            jumpElapsed: -1,
            jumpHeight: 0,
            jumpVelocity: 0,
            jumpBufferTimer: 0,
            airJumpUsed: false,
            airJumpPulseTimer: 0,
            fastFall: false,
            landingRollQueued: false,
            boostJump: false,
            slideTimer: 0,
            slideElapsed: -1,
            slideDuration: SLIDE_DURATION,
            slideDustTimer: 0,
            landingTimer: 0,
            stumbleTimer: 0,
            stumbleDuration: 0,
            stumbleDirection: 1,
            speedPenalty: 0,
            crashTimer: 0,
            invulnerableTimer: 0,
            shieldTimer: 0,
            magnetTimer: 0,
            multiplierTimer: 0,
            sneakersTimer: 0,
            flightTimer: 0,
            flightBlend: 0,
            flightElapsed: 0,
            flightSoundTimer: 0,
            flightEndSoundPlayed: false,
            activePowerType: '',
            cameraShake: 0,
            countdownTimer: 0,
            countdownStep: '',
            countdownMode: 'start',
            finishTimer: 0,
            routeCompleted: false,
            elapsedTime: 0,
            spawnTimer: 2.8,
            powerTimer: 7,
            lives: 3,
            objects: [],
            particles: [],
            pointerStart: null,
            muted: readStoredBoolean(SOUND_MUTED_KEY),
            audioContext: null,
            audioCompressor: null,
            sfxBus: null,
            noiseBuffer: null,
            gameMusic: musicElement || null,
            musicVolume: 0,
            musicDuck: 0,
            musicDuckTimer: 0,
            footstepTimer: 0,
            footstepSide: -1,
            lastFootstepIndex: -1,
            shieldChimeTimer: 0,
            feedbackTimer: 0,
            feedbackPriority: 0,
            hudTimer: 0,
            lastRoutePercent: -1,
            lastPowerProgress: -1,
            lastPowerSignature: '',
            tutorialSeen: readStoredBoolean(TUTORIAL_KEY),
            reducedMotion: reducedMotionQuery.matches,
            lastPattern: -1,
            boostPatternsSpawned: { aguamarina: false },
            movingPatternsSpawned: { aguamarina: false },
            lastPowerType: '',
            sceneIndex: -1,
            sceneDamageTaken: false,
            levelResults: [],
            levelToastTimer: 0,
            memoryToastTimer: -1,
            memoryTokens: MEMORY_TOKENS.map(() => false),
            memoriesCollected: 0,
            wordTokens: WORD_HUNT_TOKENS.map(() => false),
            lettersCollected: 0,
            wordCompletionAwarded: false,
            crateToastTimer: -1,
            crateTokens: ROUTE_CRATES.map(() => false),
            cratesOpened: 0,
            miaTokens: SPECIAL_MIA_TOKENS.map(() => false),
            miasCollected: 0,
            sceneCoins: 0,
            sceneMaxCombo: 0,
            scenePerfectClears: 0,
            missionCompleted: false,
            lastMissionProgress: -1,
            locationCueTimer: 0,
            actionCueKey: '',
            actionCueUrgency: -1
        }
        let historyPreviousFocus = null

        elements.best.textContent = String(state.best)
        elements.startBest.textContent = String(state.best)
        renderScoreHistory()
        updateAudioControls()
        setMode('idle')
        bindEvents()

        const resizeObserver = typeof ResizeObserver === 'function'
            ? new ResizeObserver(resizeCanvas)
            : null
        resizeObserver?.observe(elements.canvas)

        return {
            enter,
            leave
        }

        function bindEvents() {
            elements.playButton.addEventListener('click', handlePlay)
            elements.tutorialStartButton.addEventListener('click', beginRound)
            elements.pauseButton.addEventListener('click', togglePause)
            elements.resumeButton.addEventListener('click', resumeRound)
            elements.muteButton.addEventListener('click', toggleMute)
            elements.restartButton.addEventListener('click', beginRound)
            elements.continueButton.addEventListener('click', () => {
                leave()
                onContinue?.()
            })
            elements.historyButtons.forEach((button) => {
                button.addEventListener('click', openScoreHistory)
            })
            elements.historyClose.addEventListener('click', closeScoreHistory)
            elements.historyDialog.addEventListener('click', (event) => {
                if (event.target === elements.historyDialog) closeScoreHistory()
            })
            elements.historyDialog.addEventListener('close', restoreHistoryFocus)

            elements.touchButtons.forEach((button) => {
                button.addEventListener('pointerdown', (event) => {
                    event.preventDefault()
                    performAction(button.dataset.runnerAction)
                })
            })

            elements.canvas.addEventListener('pointerdown', handlePointerDown)
            elements.canvas.addEventListener('pointermove', handlePointerMove)
            elements.canvas.addEventListener('pointerup', handlePointerUp)
            elements.canvas.addEventListener('pointercancel', () => { state.pointerStart = null })
            elements.canvas.addEventListener('contextmenu', (event) => event.preventDefault())
            elements.canvas.addEventListener('wheel', (event) => event.preventDefault(), { passive: false })

            window.addEventListener('keydown', handleKeyDown)
            window.addEventListener('resize', resizeCanvas, { passive: true })
            window.addEventListener('blur', pauseFromOutside)
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) pauseFromOutside()
            })
            reducedMotionQuery.addEventListener?.('change', (event) => {
                state.reducedMotion = event.matches
            })
        }

        function openScoreHistory(event) {
            historyPreviousFocus = event.currentTarget
            renderScoreHistory()
            if (typeof elements.historyDialog.showModal === 'function') {
                elements.historyDialog.showModal()
            } else {
                elements.historyDialog.setAttribute('open', '')
            }
            elements.historyClose.focus({ preventScroll: true })
        }

        function closeScoreHistory() {
            if (elements.historyDialog.open && typeof elements.historyDialog.close === 'function') {
                elements.historyDialog.close()
                return
            }
            elements.historyDialog.removeAttribute('open')
            restoreHistoryFocus()
        }

        function restoreHistoryFocus() {
            historyPreviousFocus?.focus?.({ preventScroll: true })
            historyPreviousFocus = null
        }

        function renderScoreHistory() {
            const fragment = document.createDocumentFragment()
            if (!state.scoreHistory.length) {
                const empty = document.createElement('li')
                empty.className = 'runner-history-empty'
                empty.textContent = 'Completa tu primera partida y aquí aparecerá tu puntuación.'
                fragment.append(empty)
            } else {
                state.scoreHistory.forEach((entry, index) => {
                    const item = document.createElement('li')
                    item.className = 'runner-history-entry'

                    const position = document.createElement('span')
                    position.className = 'runner-history-position'
                    position.textContent = `#${index + 1}`

                    const copy = document.createElement('div')
                    const score = document.createElement('strong')
                    score.textContent = `${formatScore(entry.score)} puntos`
                    const details = document.createElement('small')
                    details.textContent = formatHistoryDetails(entry)
                    copy.append(score, details)

                    const result = document.createElement('em')
                    result.textContent = entry.completed === true
                        ? 'Meta'
                        : entry.completed === false
                            ? 'Intento'
                            : 'Récord'

                    item.append(position, copy, result)
                    fragment.append(item)
                })
            }
            elements.historyList.replaceChildren(fragment)
        }

        function enter() {
            state.active = true
            state.lastFrameTime = performance.now()
            window.requestAnimationFrame(() => {
                resizeCanvas()
                if (state.mode === 'idle') showOverlay('start')
                ensureAnimationLoop()
                elements.playButton.focus({ preventScroll: true })
            })
        }

        function leave() {
            state.active = false
            if (elements.historyDialog.open) closeScoreHistory()
            pauseGameMusic()
            if (miaBarkAudio) {
                miaBarkAudio.pause()
                miaBarkAudio.currentTime = 0
            }
            if (state.frameRequest) {
                window.cancelAnimationFrame(state.frameRequest)
                state.frameRequest = 0
            }
            if (state.mode === 'playing') setMode('paused')
            state.pointerStart = null
        }

        function ensureAnimationLoop() {
            if (!state.active || state.frameRequest) return
            state.frameRequest = window.requestAnimationFrame(frame)
        }

        function frame(timestamp) {
            state.frameRequest = 0
            if (!state.active) return

            const rawDelta = Math.max(0, (timestamp - state.lastFrameTime) / 1000)
            updateAdaptiveRenderScale(rawDelta)
            const delta = clamp(rawDelta, 0, MAX_FRAME_DELTA)
            state.lastFrameTime = timestamp

            if (state.mode === 'playing') updateRound(delta)
            if (state.mode === 'countdown') updateCountdown(delta)
            if (state.mode === 'crashing') updateCrash(delta)
            if (state.mode === 'celebrating') updateCelebration(delta)
            if (state.mode === 'idle' || state.mode === 'tutorial') {
                state.worldTime += delta
                state.runPhase += delta * 2.2
                updateParticles(delta)
            }

            updateAudioMix(delta)

            drawFrame(timestamp / 1000)
            ensureAnimationLoop()
        }

        function updateAdaptiveRenderScale(rawDelta) {
            if (state.mode !== 'playing' || document.hidden || rawDelta <= 0 || rawDelta > 0.18) return
            if (getSceneMix().blend > 0.001) {
                state.frameTimeAverage = 0
                state.qualitySampleTimer = 0
                state.slowFrameTimer = 0
                return
            }
            if (state.qualityCooldown > 0) {
                state.qualityCooldown = Math.max(0, state.qualityCooldown - rawDelta)
                state.frameTimeAverage = 0
                state.qualitySampleTimer = 0
                state.slowFrameTimer = 0
                return
            }
            const sample = Math.min(rawDelta, 0.075)
            state.frameTimeAverage = state.frameTimeAverage
                ? mix(state.frameTimeAverage, sample, 0.075)
                : sample
            state.qualitySampleTimer += sample
            const downgradeThreshold = state.dpr > 1.26 ? 0.025 : 0.032
            state.slowFrameTimer = state.frameTimeAverage > downgradeThreshold
                ? state.slowFrameTimer + sample
                : Math.max(0, state.slowFrameTimer - sample * 1.5)
            const compact = isCompactRunner()
            const minimumForegroundScale = compact ? 1.75 : 1.4
            const canReduceBackground = state.backgroundRenderScale > 1.01
            const canReduceForeground = state.renderScale > minimumForegroundScale + 0.01
            if (state.qualitySampleTimer < 1.35 || state.slowFrameTimer < 0.9 || (!canReduceBackground && !canReduceForeground)) return

            if (canReduceBackground) {
                state.backgroundRenderScale = Math.max(1, Math.round((state.backgroundRenderScale - 0.25) * 4) / 4)
            } else if (canReduceForeground) {
                state.renderScale = Math.max(
                    minimumForegroundScale,
                    Math.round((state.renderScale - 0.25) * 4) / 4
                )
            }
            state.frameTimeAverage = 0
            state.qualitySampleTimer = 0
            state.qualityCooldown = 1.8
            state.slowFrameTimer = 0
            resizeCanvas()
        }

        function handlePlay() {
            unlockAudio()
            startGameMusic()
            if (!state.tutorialSeen) {
                setMode('tutorial')
                showOverlay('tutorial')
                announce('Tutorial. Desliza a los lados, hacia arriba para saltar y hacia abajo para rodar.')
                elements.tutorialStartButton.focus({ preventScroll: true })
                return
            }
            beginRound()
        }

        function beginRound() {
            unlockAudio()
            if (!state.tutorialSeen) {
                state.tutorialSeen = true
                writeStorage(TUTORIAL_KEY, 'true')
            }

            state.worldTime = 0
            state.runPhase = 0
            state.distance = 0
            state.score = 0
            state.bonusScore = 0
            state.coins = 0
            state.combo = 0
            state.maxCombo = 0
            state.comboTimer = 0
            state.feverCharge = 0
            state.feverTimer = 0
            state.feverActivations = 0
            state.obstaclesCleared = 0
            state.speed = INITIAL_SPEED
            state.lane = 0
            state.targetLane = 0
            state.laneVelocity = 0
            state.laneChangeTimer = 0
            state.laneChangeDirection = 0
            state.jumpElapsed = -1
            state.jumpHeight = 0
            state.jumpVelocity = 0
            state.jumpBufferTimer = 0
            state.airJumpUsed = false
            state.airJumpPulseTimer = 0
            state.fastFall = false
            state.landingRollQueued = false
            state.boostJump = false
            state.slideTimer = 0
            state.slideElapsed = -1
            state.slideDuration = SLIDE_DURATION
            state.slideDustTimer = 0
            state.landingTimer = 0
            state.stumbleTimer = 0
            state.stumbleDuration = 0
            state.stumbleDirection = 1
            state.speedPenalty = 0
            state.crashTimer = 0
            state.invulnerableTimer = 0
            state.shieldTimer = 0
            state.magnetTimer = 0
            state.multiplierTimer = 0
            state.sneakersTimer = 0
            state.flightTimer = 0
            state.flightBlend = 0
            state.flightElapsed = 0
            state.flightSoundTimer = 0
            state.flightEndSoundPlayed = false
            state.activePowerType = ''
            state.cameraShake = 0
            state.countdownTimer = 0
            state.countdownStep = ''
            state.countdownMode = 'start'
            state.finishTimer = 0
            state.routeCompleted = false
            state.elapsedTime = 0
            state.spawnTimer = 2.85
            state.powerTimer = 5.6
            state.footstepTimer = 0.16
            state.footstepSide = -1
            state.lastFootstepIndex = -1
            state.shieldChimeTimer = 0
            state.hudTimer = 0
            state.lastRoutePercent = -1
            state.lastPowerProgress = -1
            state.lastPowerSignature = ''
            state.lives = 3
            state.objects = []
            state.memoryTokens = MEMORY_TOKENS.map(() => false)
            state.memoriesCollected = 0
            state.wordTokens = WORD_HUNT_TOKENS.map(() => false)
            state.lettersCollected = 0
            state.wordCompletionAwarded = false
            state.crateTokens = ROUTE_CRATES.map(() => false)
            state.cratesOpened = 0
            state.miaTokens = SPECIAL_MIA_TOKENS.map(() => false)
            state.miasCollected = 0
            root.dataset.miaCollected = '0'
            root.dataset.miaTotal = String(SPECIAL_MIA_TOKENS.length)
            root.dataset.miaComplete = 'false'
            root.dataset.miaBark = 'idle'
            if (miaBarkAudio) {
                miaBarkAudio.pause()
                miaBarkAudio.currentTime = 0
            }
            spawnSignatureFlightRoute()
            spawnSignatureAirRoutes()
            spawnMemoryTokens()
            spawnWordHuntTokens()
            spawnRouteCrates()
            spawnSpecialMias()
            spawnFinaleHearts()
            state.particles = []
            state.feedbackTimer = 0
            state.feedbackPriority = 0
            state.lastPattern = -1
            state.boostPatternsSpawned = { aguamarina: false }
            state.movingPatternsSpawned = { aguamarina: false }
            state.lastPowerType = ''
            state.sceneIndex = -1
            state.sceneDamageTaken = false
            state.levelResults = []
            state.levelToastTimer = 0
            state.memoryToastTimer = -1
            state.crateToastTimer = -1
            state.sceneCoins = 0
            state.sceneMaxCombo = 0
            state.scenePerfectClears = 0
            state.missionCompleted = false
            elements.memoryToast.hidden = true
            elements.memoryToast.classList.remove('is-visible')
            elements.crateToast.hidden = true
            elements.crateToast.classList.remove('is-visible')
            resetMemoryAlbum()
            resetWordHunt()
            updateCrateProgress()
            updateComboHud()
            state.lastMissionProgress = -1
            state.actionCueKey = ''
            state.actionCueUrgency = -1
            elements.feedback.classList.remove('is-visible')
            elements.levelToast.hidden = true
            hideActionCue()
            updateComboHud()

            showOverlay(null)
            setMode('countdown')
            updateHud()
            updateLocation(true)
            resetLevelMission(0)
            startCountdown('start')
            announce('Prepárate. La ruta de seiscientos ochenta metros está a punto de comenzar.')
            elements.canvas.focus({ preventScroll: true })
            if (isCompactRunner()) {
                window.requestAnimationFrame(() => {
                    root.querySelector('.runner-frame')?.scrollIntoView({
                        behavior: state.reducedMotion ? 'auto' : 'smooth',
                        block: 'center'
                    })
                })
            }
        }

        function startCountdown(mode = 'start') {
            state.countdownMode = mode
            state.countdownTimer = mode === 'resume' ? 1.55 : 3.2
            state.countdownStep = ''
            elements.countdown.hidden = false
            setCountdownStep(mode === 'resume' ? '2' : '3', mode === 'resume' ? 'Retoma el ritmo' : 'Prepárate')
        }

        function updateCountdown(delta) {
            state.worldTime += delta
            state.runPhase += delta * 2.2
            state.countdownTimer = Math.max(0, state.countdownTimer - delta)
            updateParticles(delta)

            if (state.countdownTimer <= 0) {
                elements.countdown.hidden = true
                setMode('playing')
                state.lastFrameTime = performance.now()
                if (state.countdownMode === 'start') showLevelToast(SCENES[0], true)
                announce(state.countdownMode === 'resume'
                    ? 'La partida continúa.'
                    : 'Comienza la ruta. Llega a la meta siguiendo los corazones.')
            } else if (state.countdownMode === 'resume') {
                if (state.countdownTimer > 0.92) setCountdownStep('2', 'Retoma el ritmo')
                else if (state.countdownTimer > 0.28) setCountdownStep('1', 'Mira la ruta')
                else setCountdownStep('¡YA!', 'Continúa, Sofía', 'go')
            } else if (state.countdownTimer > 2.2) setCountdownStep('3', 'Prepárate')
            else if (state.countdownTimer > 1.2) setCountdownStep('2', 'Tres lugares')
            else if (state.countdownTimer > 0.28) setCountdownStep('1', 'Una meta')
            else setCountdownStep('¡YA!', 'Corre, Sofía', 'go')
        }

        function setCountdownStep(value, label, phase = 'count') {
            const key = `${phase}-${value}`
            if (state.countdownStep === key) return
            state.countdownStep = key
            elements.countdownValue.textContent = value
            elements.countdownLabel.textContent = label
            elements.countdown.dataset.phase = phase
            elements.countdown.classList.remove('is-ticking')
            void elements.countdown.offsetWidth
            elements.countdown.classList.add('is-ticking')
            playSound(phase === 'go' ? 'go' : 'countdown')
        }

        function togglePause() {
            if (state.mode === 'playing') {
                pauseRound()
            } else if (state.mode === 'paused') {
                resumeRound()
            }
        }

        function pauseRound() {
            if (state.mode !== 'playing') return
            setMode('paused')
            showOverlay('pause')
            announce('Partida pausada.')
            elements.resumeButton.focus({ preventScroll: true })
        }

        function pauseFromOutside() {
            if (state.active && state.mode === 'playing') pauseRound()
        }

        function resumeRound() {
            if (state.mode !== 'paused') return
            showOverlay(null)
            setMode('countdown')
            startGameMusic()
            playSound('resume')
            state.lastFrameTime = performance.now()
            startCountdown('resume')
            announce('Prepárate para continuar.')
            elements.canvas.focus({ preventScroll: true })
        }

        function setMode(mode) {
            state.mode = mode
            root.dataset.gameState = mode
            if (mode === 'playing') {
                state.frameTimeAverage = 0
                state.qualitySampleTimer = 0
                state.slowFrameTimer = 0
            }
            if (mode !== 'playing') hideActionCue()
            const canPause = mode === 'playing' || mode === 'paused'
            elements.pauseButton.disabled = !canPause
            elements.pauseButton.textContent = mode === 'paused' ? '▶' : 'Ⅱ'
            elements.pauseButton.setAttribute('aria-label', mode === 'paused' ? 'Continuar partida' : 'Pausar partida')
            elements.pauseButton.title = mode === 'paused' ? 'Continuar partida' : 'Pausar partida'
            syncGameMusic()
        }

        function showOverlay(name) {
            elements.startScreen.hidden = name !== 'start'
            elements.tutorial.hidden = name !== 'tutorial'
            elements.pauseScreen.hidden = name !== 'pause'
            elements.endScreen.hidden = name !== 'end'
        }

        function handleKeyDown(event) {
            if (!state.active) return

            const actionByKey = {
                ArrowLeft: 'left',
                KeyA: 'left',
                ArrowRight: 'right',
                KeyD: 'right',
                ArrowUp: 'jump',
                KeyW: 'jump',
                Space: 'jump',
                ArrowDown: 'slide',
                KeyS: 'slide'
            }

            const action = actionByKey[event.code]
            if (action) {
                event.preventDefault()
                if (event.repeat) return
                performAction(action)
                return
            }

            if (event.code === 'Escape' || event.code === 'KeyP') {
                event.preventDefault()
                togglePause()
            }
            if (event.code === 'KeyM') {
                event.preventDefault()
                toggleMute()
            }
        }

        function handlePointerDown(event) {
            if (state.mode !== 'playing') return
            event.preventDefault()
            elements.canvas.setPointerCapture?.(event.pointerId)
            state.pointerStart = {
                id: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                time: performance.now(),
                handled: false
            }
        }

        function handlePointerMove(event) {
            if (!state.pointerStart || state.pointerStart.id !== event.pointerId) return
            event.preventDefault()
            if (state.pointerStart.handled) return
            const action = getPointerGestureAction(event, 0.9)
            if (!action) return
            state.pointerStart.handled = true
            performAction(action)
        }

        function handlePointerUp(event) {
            if (!state.pointerStart || state.pointerStart.id !== event.pointerId) return
            event.preventDefault()
            const elapsed = performance.now() - state.pointerStart.time
            const wasHandled = state.pointerStart.handled
            const action = wasHandled ? '' : getPointerGestureAction(event)
            state.pointerStart = null

            if (wasHandled || elapsed > 900 || !action) return
            performAction(action)
        }

        function getPointerGestureAction(event, thresholdMultiplier = 1) {
            if (!state.pointerStart) return ''
            const horizontal = event.clientX - state.pointerStart.x
            const vertical = event.clientY - state.pointerStart.y
            const threshold = Math.max(16, Math.min(state.width, state.height) * 0.04) * thresholdMultiplier
            if (Math.max(Math.abs(horizontal), Math.abs(vertical)) < threshold) return ''
            if (Math.abs(horizontal) > Math.abs(vertical)) return horizontal < 0 ? 'left' : 'right'
            return vertical < 0 ? 'jump' : 'slide'
        }

        function performAction(action) {
            if (state.mode !== 'playing') return

            if (action === 'left' || action === 'right') {
                const previousLane = state.targetLane
                const direction = action === 'left' ? -1 : 1
                state.targetLane = clamp(state.targetLane + direction, -1, 1)
                if (state.targetLane !== previousLane) {
                    const airborneSteer = state.jumpElapsed >= 0 || isFlightActive()
                    const slideSteer = state.slideTimer > 0
                    const impulse = airborneSteer ? 0.34 : slideSteer ? 0.26 : 0.42
                    state.laneVelocity += direction * impulse
                    state.laneChangeTimer = 0.38
                    state.laneChangeDirection = direction
                    playSound(action === 'left' ? 'moveLeft' : 'moveRight')
                }
            } else if ((action === 'jump' || action === 'slide') && isFlightActive()) {
                return
            } else if (action === 'jump') {
                if (state.jumpElapsed >= 0) {
                    tryAirJump()
                    return
                }
                state.jumpBufferTimer = state.slideTimer > 0.08 ? 0.28 : 0.18
                if (state.slideTimer > 0.08) {
                    state.slideTimer = Math.min(state.slideTimer, 0.06)
                    state.slideDuration = Math.max(0.12, state.slideElapsed + 0.06)
                }
                tryStartJump()
            } else if (action === 'slide') {
                if (state.jumpElapsed >= 0) {
                    const wasFastFalling = state.fastFall
                    state.fastFall = true
                    state.landingRollQueued = true
                    state.jumpVelocity = Math.min(state.jumpVelocity, -state.height * 0.38)
                    if (!wasFastFalling) playSound('fastFall')
                } else if (state.slideTimer <= 0) {
                    startRoll(SLIDE_DURATION)
                }
            }
        }

        function startRoll(duration = SLIDE_DURATION, fromLanding = false) {
            state.slideTimer = duration
            state.slideElapsed = 0
            state.slideDuration = duration
            state.slideDustTimer = 0.04
            state.landingRollQueued = false
            playSound(fromLanding ? 'landingRoll' : 'slide')
        }

        function tryStartJump() {
            if (isFlightActive() || state.jumpBufferTimer <= 0 || state.jumpElapsed >= 0 || state.slideTimer > 0.08) return
            state.jumpElapsed = 0
            state.jumpHeight = 0
            const sneakerBoost = state.sneakersTimer > 0 ? 1.1 : 1
            state.jumpVelocity = state.height * JUMP_LAUNCH_SPEED_RATIO * sneakerBoost
            state.jumpBufferTimer = 0
            state.airJumpUsed = false
            state.fastFall = false
            state.landingRollQueued = false
            state.boostJump = false
            state.landingTimer = 0
            spawnMovementDust(5)
            playSound(state.sneakersTimer > 0 ? 'sneakerJump' : 'jump')
        }

        function tryAirJump() {
            if (
                state.sneakersTimer <= 0 ||
                state.airJumpUsed ||
                state.jumpElapsed < 0.1 ||
                state.fastFall
            ) return false
            state.airJumpUsed = true
            state.jumpVelocity = Math.max(state.jumpVelocity, state.height * AIR_JUMP_SPEED_RATIO)
            state.fastFall = false
            state.landingRollQueued = false
            state.airJumpPulseTimer = 0.38
            const laneX = state.width / 2 + state.lane * (isCompactRunner() ? getLaneSpread(1) : state.width * 0.225)
            const runnerY = getRoadGroundY() - getJumpHeight()
            spawnParticles(laneX, runnerY + 10, '#c8b3ff', 'spark', 22)
            spawnParticles(laneX, runnerY - 8, '#fff0a8', 'heart', 8)
            const airJumpBonus = 75 * getScoreBoostMultiplier()
            state.bonusScore += airJumpBonus
            state.scenePerfectClears += 1
            state.cameraShake = Math.max(state.cameraShake, state.reducedMotion ? 0 : 0.055)
            setFeedback(`¡Segundo salto! · +${airJumpBonus}`, 2)
            playSound('airJump')
            pulseHaptics([10, 18, 12])
            checkLevelMission()
            return true
        }

        function updateRound(delta) {
            let remaining = delta
            while (remaining > 0 && state.mode === 'playing') {
                const step = Math.min(MAX_SIMULATION_STEP, remaining)
                simulateRound(step)
                remaining -= step
            }

            state.score = Math.floor(state.distance * 4 + state.coins * 85 + state.bonusScore)
            if (state.distance >= ROUTE_DISTANCE) {
                completeRoute()
                return
            }
            state.hudTimer -= delta
            if (state.hudTimer <= 0) {
                updateHud()
                state.hudTimer = 0.05
            }
            updateLocation()
            updateActionCue()
        }

        function simulateRound(delta) {
            state.worldTime += delta
            state.elapsedTime += delta
            const difficulty = clamp(state.distance / DIFFICULTY_DISTANCE, 0, 1)
            const scene = getSceneAtDistance(state.distance)
            const sceneGameplay = SCENE_GAMEPLAY[scene.key]
            const baseSpeed = mix(INITIAL_SPEED, MAX_SPEED, difficulty) * sceneGameplay.speedMultiplier
            state.speedPenalty *= Math.exp(-2.6 * delta)
            state.speed = baseSpeed * (1 - state.speedPenalty * 0.28)
            state.distance += state.speed * delta
            state.runPhase += delta * mix(10.6, 14.8, difficulty)

            const laneFrequency = isFlightActive()
                ? 11.4
                : state.jumpElapsed >= 0
                    ? 10.5
                    : state.slideTimer > 0
                        ? 12.5
                        : 13.5
            const laneAcceleration = (
                (state.targetLane - state.lane) * laneFrequency * laneFrequency -
                2 * laneFrequency * state.laneVelocity
            )
            state.laneVelocity += laneAcceleration * delta
            state.lane += state.laneVelocity * delta
            state.lane = clamp(state.lane, -1.04, 1.04)
            if (Math.abs(state.targetLane - state.lane) < 0.002 && Math.abs(state.laneVelocity) < 0.02) {
                state.lane = state.targetLane
                state.laneVelocity = 0
            }
            state.laneChangeTimer = Math.max(0, state.laneChangeTimer - delta)

            state.jumpBufferTimer = Math.max(0, state.jumpBufferTimer - delta)
            if (state.jumpElapsed >= 0) {
                state.jumpElapsed += delta
                const velocityRatio = state.jumpVelocity / Math.max(1, state.height)
                const gravityRatio = state.fastFall
                    ? JUMP_FAST_FALL_GRAVITY_RATIO
                    : velocityRatio > 0.24
                        ? JUMP_RISE_GRAVITY_RATIO
                        : velocityRatio > -0.18
                            ? JUMP_APEX_GRAVITY_RATIO
                            : JUMP_FALL_GRAVITY_RATIO
                state.jumpVelocity -= state.height * gravityRatio * delta
                if (state.fastFall) {
                    state.jumpVelocity = Math.max(state.jumpVelocity, -state.height * JUMP_FAST_FALL_SPEED_RATIO)
                }
                state.jumpHeight += state.jumpVelocity * delta
                if (state.jumpHeight <= 0 && state.jumpVelocity < 0) {
                    const shouldRoll = state.landingRollQueued
                    const wasBoostJump = state.boostJump
                    state.jumpElapsed = -1
                    state.jumpHeight = 0
                    state.jumpVelocity = 0
                    state.fastFall = false
                    state.boostJump = false
                    state.airJumpUsed = false
                    state.landingTimer = 0.22
                    state.cameraShake = Math.max(state.cameraShake, state.reducedMotion ? 0 : (wasBoostJump ? 0.09 : shouldRoll ? 0.055 : 0.038))
                    spawnMovementDust(wasBoostJump ? 11 : shouldRoll ? 8 : 5)
                    playSound('land')
                    if (shouldRoll) startRoll(LANDING_ROLL_DURATION, true)
                }
            }
            state.slideTimer = Math.max(0, state.slideTimer - delta)
            if (state.slideTimer > 0) {
                state.slideElapsed += delta
                state.slideDustTimer -= delta
                if (!state.reducedMotion && getSlideBlend() > 0.72 && state.slideDustTimer <= 0) {
                    spawnMovementDust(1)
                    state.slideDustTimer = 0.11
                }
            } else {
                state.slideElapsed = -1
                state.slideDustTimer = 0
            }
            tryStartJump()
            state.landingTimer = Math.max(0, state.landingTimer - delta)
            state.stumbleTimer = Math.max(0, state.stumbleTimer - delta)
            state.invulnerableTimer = Math.max(0, state.invulnerableTimer - delta)
            state.shieldTimer = Math.max(0, state.shieldTimer - delta)
            state.magnetTimer = Math.max(0, state.magnetTimer - delta)
            state.multiplierTimer = Math.max(0, state.multiplierTimer - delta)
            state.sneakersTimer = Math.max(0, state.sneakersTimer - delta)
            state.airJumpPulseTimer = Math.max(0, state.airJumpPulseTimer - delta)
            updateFlight(delta)
            updateFever(delta)
            state.cameraShake = Math.max(0, state.cameraShake - delta)
            updateLevelToast(delta)
            updateMemoryToast(delta)
            updateCrateToast(delta)
            updateComboTimer(delta)
            updateMovementAudio(delta)
            state.spawnTimer -= delta
            if (state.spawnTimer <= 0) {
                if (state.distance < ROUTE_DISTANCE - FINAL_CLEAR_ZONE) {
                    const pattern = spawnPattern(difficulty)
                    state.spawnTimer = (
                        mix(2.08, 1.14, difficulty) *
                        sceneGameplay.spawnMultiplier *
                        (0.93 + Math.random() * 0.14)
                    ) + pattern.recovery
                } else {
                    state.spawnTimer = 999
                }
            }

            state.powerTimer -= delta
            if (state.powerTimer <= 0) {
                if (state.distance < ROUTE_DISTANCE - FINAL_CLEAR_ZONE) {
                    spawnPowerup()
                    state.powerTimer = 7.5 + Math.random() * 3.5
                } else {
                    state.powerTimer = 999
                }
            }

            updateObjects(delta)
            updateParticles(delta)
            updateFeedback(delta)
        }

        function updateCrash(delta) {
            state.worldTime += delta
            state.runPhase += delta * 4
            state.crashTimer -= delta
            state.cameraShake = Math.max(0, state.cameraShake - delta)
            updateParticles(delta)
            updateFeedback(delta)
            if (state.crashTimer <= 0) finishRound(false)
        }

        function updateCelebration(delta) {
            state.worldTime += delta
            state.runPhase += delta * 3.2
            state.finishTimer -= delta
            state.cameraShake = Math.max(0, state.cameraShake - delta)
            updateParticles(delta)
            updateFeedback(delta)
            if (state.finishTimer <= 0) finishRound(true)
        }

        function completeRoute() {
            if (state.routeCompleted) return
            state.routeCompleted = true
            state.distance = ROUTE_DISTANCE
            completeLevel(SCENES.length - 1, true)
            state.bonusScore += state.lives * 250 + state.maxCombo * 22
            state.score = Math.floor(state.distance * 4 + state.coins * 85 + state.bonusScore)
            state.finishTimer = 1.15
            state.cameraShake = state.reducedMotion ? 0 : 0.18
            setMode('celebrating')
            hideActionCue()
            updateHud()
            triggerImpactFlash('finish')
            spawnFinishParticles()
            setFeedback('¡Meta completada!', 3)
            announce('Ruta completada. Sofía ha llegado a la meta.')
            playSound('finish')
            pulseHaptics([25, 45, 25, 45, 65])
        }

        function spawnPattern(difficulty) {
            const scene = getSceneAtDistance(state.distance + VIEW_DISTANCE)
            const gameplay = SCENE_GAMEPLAY[scene.key]
            const patternOptions = scene.key === 'lodares'
                ? (difficulty < 0.22
                    ? ['single', 'single', 'skill']
                    : ['single', 'skill', 'gate', 'mixed'])
                : scene.key === 'aguamarina'
                    ? ['skill', 'skill', 'mixed', 'sequence', 'boost', 'slalom', 'moving', 'moving']
                    : ['mixed', 'sequence', 'boost', 'slalom', 'moving', 'moving', 'gauntlet', 'gauntlet']
            const sceneRouteProgress = (state.distance + VIEW_DISTANCE) % SCENE_LENGTH
            const guaranteedBoost = scene.key !== 'lodares' &&
                !state.boostPatternsSpawned[scene.key] &&
                sceneRouteProgress >= 96 &&
                sceneRouteProgress <= SCENE_LENGTH - 96
            const movingWindowStart = 168
            const movingWindowEnd = SCENE_LENGTH - 74
            const movingEligible = scene.key !== 'lodares' &&
                sceneRouteProgress >= movingWindowStart &&
                sceneRouteProgress <= movingWindowEnd
            const guaranteedMoving = movingEligible &&
                !state.movingPatternsSpawned[scene.key] &&
                !guaranteedBoost
            const selectablePatterns = patternOptions.filter((option) => {
                if (option === 'boost') {
                    return state.boostPatternsSpawned[scene.key] || sceneRouteProgress >= 96
                }
                if (option === 'moving') return movingEligible
                return true
            })
            let pattern = guaranteedBoost
                ? 'boost'
                : guaranteedMoving
                    ? 'moving'
                    : randomItem(selectablePatterns)
            if (!guaranteedBoost && !guaranteedMoving && pattern === state.lastPattern && selectablePatterns.length > 1) {
                pattern = selectablePatterns[(selectablePatterns.indexOf(pattern) + 1) % selectablePatterns.length]
            }
            state.lastPattern = pattern
            if (pattern === 'boost') state.boostPatternsSpawned[scene.key] = true

            const obstacleDistance = getTransitionSafeSpawnDistance(VIEW_DISTANCE + 2)
            let safeLane = randomItem(LANES)
            let recovery = 0

            if (pattern === 'single') {
                const blockedLane = randomItem(LANES)
                const type = randomItem(gameplay.obstaclePool)
                addObstacle(type, blockedLane, obstacleDistance)
                safeLane = randomItem(LANES.filter((lane) => lane !== blockedLane))
                const rewardLane = type === 'cart' || Math.random() < 0.34 ? safeLane : blockedLane
                addHeartTrail(rewardLane, obstacleDistance - 31, 6, 4.5, type)
            } else if (pattern === 'gate') {
                safeLane = randomItem(LANES)
                LANES.filter((lane) => lane !== safeLane).forEach((lane) => addObstacle('cart', lane, obstacleDistance))
                addHeartTrail(safeLane, obstacleDistance - 31, 7, 4.4)
            } else if (pattern === 'skill') {
                const challengeLane = randomItem(LANES)
                const actionType = randomItem(gameplay.obstaclePool.filter((type) => type !== 'cart'))
                addObstacle(actionType, challengeLane, obstacleDistance)
                addHeartTrail(challengeLane, obstacleDistance - 32, 7, 4.5, actionType)
            } else if (pattern === 'mixed') {
                safeLane = randomItem(LANES)
                const blocked = LANES.filter((lane) => lane !== safeLane)
                addObstacle('cart', blocked[0], obstacleDistance)
                const actionType = randomItem(['spill', 'sheet'])
                addObstacle(actionType, blocked[1], obstacleDistance)
                const skillRoute = difficulty > 0.44 && Math.random() > 0.42
                addHeartTrail(skillRoute ? blocked[1] : safeLane, obstacleDistance - 31, 7, 4.5, skillRoute ? actionType : '')
            } else if (pattern === 'sequence') {
                const firstLane = randomItem(LANES)
                const firstType = randomItem(['spill', 'sheet'])
                const secondLane = randomItem(LANES.filter((lane) => lane !== firstLane))
                const secondType = firstType === 'spill' ? 'sheet' : 'spill'
                addObstacle(firstType, firstLane, obstacleDistance)
                addHeartTrail(firstLane, obstacleDistance - 29, 6, 4.4, firstType)
                addObstacle(secondType, secondLane, obstacleDistance + 47)
                addHeartTrail(secondLane, obstacleDistance + 18, 6, 4.4, secondType)
                recovery = 0.9
            } else if (pattern === 'boost') {
                const boostLane = randomItem(LANES)
                addBoostPad(boostLane, obstacleDistance)
                LANES.filter((lane) => lane !== boostLane).forEach((lane) => addObstacle('cart', lane, obstacleDistance + 2))
                addHeartTrail(boostLane, obstacleDistance - 26, 10, 5, 'boost')
                recovery = 1.05
            } else if (pattern === 'moving') {
                const side = randomItem([-1, 1])
                const startLane = side
                const targetLane = 0
                const staticLane = -side
                const routeLane = side
                const movingDistance = getMovingEncounterSafeDistance(obstacleDistance, scene.key)
                const added = Number.isFinite(movingDistance) &&
                    addMovingObstacle(startLane, targetLane, movingDistance, scene.key)
                if (added) {
                    state.movingPatternsSpawned[scene.key] = true
                    const staticDistance = movingDistance - 16
                    addObstacle('cart', staticLane, staticDistance)
                    addHeartTrail(routeLane, movingDistance - 34, 8, 4.5)
                    recovery = 2
                } else {
                    addHeartTrail(routeLane, obstacleDistance - 28, 6, 4.5)
                    recovery = 0.8
                }
            } else if (pattern === 'slalom') {
                const blockedLanes = [randomItem(LANES)]
                blockedLanes.push(randomItem(LANES.filter((lane) => lane !== blockedLanes[0])))
                blockedLanes.push(randomItem(LANES.filter((lane) => lane !== blockedLanes[1])))
                blockedLanes.forEach((blockedLane, index) => {
                    const rowDistance = obstacleDistance + index * 35
                    addObstacle('cart', blockedLane, rowDistance)
                    const routeLane = randomItem(LANES.filter((lane) => lane !== blockedLane))
                    addHeartTrail(routeLane, rowDistance - 22, 4, 4.3)
                })
                recovery = 1.05
            } else {
                const firstSafeLane = randomItem(LANES)
                const secondSafeLane = randomItem(LANES.filter((lane) => lane !== firstSafeLane))
                LANES.filter((lane) => lane !== firstSafeLane).forEach((lane) => {
                    addObstacle(lane === 0 ? 'sheet' : 'cart', lane, obstacleDistance)
                })
                addHeartTrail(firstSafeLane, obstacleDistance - 30, 6, 4.4)
                LANES.filter((lane) => lane !== secondSafeLane).forEach((lane) => {
                    addObstacle(lane === 0 ? 'spill' : 'cart', lane, obstacleDistance + 45)
                })
                addHeartTrail(secondSafeLane, obstacleDistance + 15, 6, 4.4)
                recovery = 1.2
            }

            return { name: pattern, recovery }
        }

        function getTransitionSafeSpawnDistance(distance) {
            const absoluteDistance = state.distance + distance
            const sceneProgress = absoluteDistance % SCENE_LENGTH
            if (sceneProgress < SCENE_TRANSITION_CLEARANCE) {
                return distance + SCENE_TRANSITION_CLEARANCE - sceneProgress
            }
            if (sceneProgress > SCENE_LENGTH - SCENE_TRANSITION_CLEARANCE) {
                return distance + SCENE_LENGTH + SCENE_TRANSITION_CLEARANCE - sceneProgress
            }
            return distance
        }

        function getMovingEncounterSafeDistance(distance, sceneKey) {
            let safeDistance = distance
            for (let attempt = 0; attempt < 5; attempt += 1) {
                const nearestConflict = state.objects
                    .filter((object) => (
                        object.kind === 'obstacle' &&
                        !object.handled &&
                        object.scene === sceneKey &&
                        Math.abs(object.distance - safeDistance) < MOVING_ENCOUNTER_CLEARANCE
                    ))
                    .sort((first, second) => second.distance - first.distance)[0]
                if (!nearestConflict) break
                safeDistance = getTransitionSafeSpawnDistance(
                    nearestConflict.distance + MOVING_ENCOUNTER_CLEARANCE
                )
            }

            const absoluteDistance = state.distance + safeDistance
            const scene = getSceneAtDistance(absoluteDistance)
            const sceneProgress = absoluteDistance % SCENE_LENGTH
            if (
                scene.key !== sceneKey ||
                sceneProgress > SCENE_LENGTH - SCENE_TRANSITION_CLEARANCE - 8
            ) return Number.NaN
            return safeDistance
        }

        function getObjectSceneKey(distance) {
            return getSceneAtDistance(clamp(state.distance + distance, 0, ROUTE_DISTANCE - 0.001)).key
        }

        function addHeartTrail(lane, startDistance, amount = 6, spacing = 4.5, actionType = '') {
            for (let index = 0; index < amount; index += 1) {
                const progress = amount <= 1 ? 0 : index / (amount - 1)
                const height = actionType === 'spill'
                    ? Math.sin(progress * Math.PI) * 21
                    : actionType === 'sheet'
                        ? 1.5 + Math.sin(progress * Math.PI) * 1.5
                        : actionType === 'boost'
                            ? progress < 0.34
                                ? progress / 0.34 * 6
                                : 7 + Math.sin((progress - 0.34) / 0.66 * Math.PI) * 30
                        : Math.sin(progress * Math.PI) * 3
                const distance = startDistance + index * spacing
                state.objects.push({
                    kind: 'coin',
                    lane,
                    distance,
                    height,
                    spin: Math.random() * Math.PI * 2,
                    guide: index === 0,
                    scene: getObjectSceneKey(distance),
                    handled: false
                })
            }
        }

        function spawnMemoryTokens() {
            MEMORY_TOKENS.forEach((memory, memoryIndex) => {
                state.objects.push({
                    kind: 'memory',
                    memoryIndex,
                    lane: memory.lane,
                    distance: memory.distance,
                    height: 10,
                    spin: memoryIndex * 1.7,
                    guide: true,
                    scene: memory.scene,
                    handled: false
                })
            })
        }

        function spawnWordHuntTokens() {
            WORD_HUNT_TOKENS.forEach((token, letterIndex) => {
                addHeartTrail(token.lane, token.distance - 17, 3, 5.5)
                state.objects.push({
                    kind: 'letter',
                    letterIndex,
                    letter: token.letter,
                    lane: token.lane,
                    distance: token.distance,
                    height: 8,
                    spin: letterIndex * 1.13,
                    guide: true,
                    scene: token.scene,
                    handled: false
                })
            })
        }

        function spawnRouteCrates() {
            ROUTE_CRATES.forEach((crate, crateIndex) => {
                state.objects.push({
                    kind: 'crate',
                    crateIndex,
                    lane: crate.lane,
                    distance: crate.distance,
                    height: 3,
                    spin: crateIndex * 1.37,
                    guide: true,
                    scene: crate.scene,
                    handled: false
                })
            })
        }

        function spawnSpecialMias() {
            SPECIAL_MIA_TOKENS.forEach((token, miaIndex) => {
                addHeartTrail(token.lane, token.distance - 22, 4, 5.2)
                state.objects.push({
                    kind: 'mia',
                    miaIndex,
                    lane: token.lane,
                    distance: token.distance,
                    height: 5,
                    spin: 0.86 + miaIndex * 1.27,
                    guide: true,
                    scene: token.scene,
                    handled: false
                })
            })
        }

        function spawnSignatureFlightRoute() {
            const route = SIGNATURE_FLIGHT_ROUTE
            state.objects.push({
                kind: 'power',
                powerType: 'flight',
                lane: route.lane,
                distance: route.powerDistance,
                height: 8,
                spin: 0.7,
                guide: true,
                signature: true,
                flightSignature: true,
                scene: route.scene,
                handled: false
            })

            FLIGHT_ROUTE_LANES.forEach((lane, coinIndex) => {
                const previousLane = FLIGHT_ROUTE_LANES[Math.max(0, coinIndex - 1)]
                state.objects.push({
                    kind: 'coin',
                    lane,
                    distance: route.startDistance + coinIndex * FLIGHT_ROUTE_SPACING,
                    height: FLIGHT_ROUTE_HEIGHTS[coinIndex],
                    spin: coinIndex * 0.63,
                    guide: coinIndex === 0 || lane !== previousLane,
                    flightRoute: true,
                    flightRouteIndex: coinIndex,
                    scene: route.scene,
                    handled: false
                })
            })

            addHeartTrail(-1, 258, 4, 8, '')
        }

        function spawnSignatureAirRoutes() {
            SIGNATURE_AIR_ROUTES.forEach((route, routeIndex) => {
                state.objects.push({
                    kind: 'power',
                    powerType: 'sneakers',
                    lane: route.lane,
                    distance: route.powerDistance,
                    height: 8,
                    spin: routeIndex * 1.9,
                    guide: true,
                    signature: true,
                    scene: route.scene,
                    handled: false
                })
                AIR_ROUTE_HEIGHTS.forEach((height, coinIndex) => {
                    state.objects.push({
                        kind: 'coin',
                        lane: route.lane,
                        distance: route.startDistance + coinIndex * AIR_ROUTE_SPACING,
                        height,
                        spin: coinIndex * 0.68 + routeIndex,
                        guide: coinIndex === 0 || coinIndex === 5,
                        airRoute: true,
                        airRouteIndex: routeIndex,
                        requiresJump: coinIndex >= 2,
                        requiresAirJump: coinIndex >= 6 && coinIndex <= 8,
                        scene: route.scene,
                        handled: false
                    })
                })
            })
        }

        function isMemoryLaneReserved(lane, relativeDistance, clearance = 48) {
            const absoluteDistance = state.distance + relativeDistance
            return MEMORY_TOKENS.some((memory, memoryIndex) => (
                !state.memoryTokens[memoryIndex] &&
                memory.lane === lane &&
                Math.abs(memory.distance - absoluteDistance) < clearance
            ))
        }

        function isWordHuntLaneReserved(lane, relativeDistance, clearance = 44) {
            const absoluteDistance = state.distance + relativeDistance
            return WORD_HUNT_TOKENS.some((token, letterIndex) => (
                !state.wordTokens[letterIndex] &&
                token.lane === lane &&
                Math.abs(token.distance - absoluteDistance) < clearance
            ))
        }

        function isRouteCrateLaneReserved(lane, relativeDistance, clearance = 46) {
            const absoluteDistance = state.distance + relativeDistance
            return ROUTE_CRATES.some((crate, crateIndex) => (
                !state.crateTokens[crateIndex] &&
                crate.lane === lane &&
                Math.abs(crate.distance - absoluteDistance) < clearance
            ))
        }

        function isSpecialMiaLaneReserved(lane, relativeDistance, clearance = 52) {
            const absoluteDistance = state.distance + relativeDistance
            return SPECIAL_MIA_TOKENS.some((token, miaIndex) => (
                !state.miaTokens[miaIndex] &&
                lane === token.lane &&
                Math.abs(token.distance - absoluteDistance) < clearance
            ))
        }

        function isSignatureAirRouteReserved(lane, relativeDistance) {
            const absoluteDistance = state.distance + relativeDistance
            return SIGNATURE_AIR_ROUTES.some((route) => {
                const routeEnd = route.startDistance + (AIR_ROUTE_HEIGHTS.length - 1) * AIR_ROUTE_SPACING
                const launchZoneReserved = absoluteDistance > route.powerDistance - 32 &&
                    absoluteDistance < route.powerDistance + 52
                const aerialLaneReserved = lane === route.lane &&
                    absoluteDistance >= route.powerDistance + 52 &&
                    absoluteDistance < routeEnd + 20
                return launchZoneReserved || aerialLaneReserved
            })
        }

        function isSignatureFlightRouteReserved(lane, relativeDistance) {
            const absoluteDistance = state.distance + relativeDistance
            return lane === SIGNATURE_FLIGHT_ROUTE.lane &&
                absoluteDistance > SIGNATURE_FLIGHT_ROUTE.powerDistance - 22 &&
                absoluteDistance < SIGNATURE_FLIGHT_ROUTE.powerDistance + 20
        }

        function spawnFinaleHearts() {
            const firstDistance = ROUTE_DISTANCE - 102
            for (let index = 0; index < 12; index += 1) {
                state.objects.push({
                    kind: 'coin',
                    lane: 0,
                    distance: firstDistance + index * 7,
                    height: 3 + Math.sin(index / 11 * Math.PI) * 12,
                    spin: index * 0.72,
                    guide: index === 0,
                    finale: true,
                    scene: FINAL_SCENE_KEY,
                    handled: false
                })
            }
        }

        function addObstacle(type, lane, distance) {
            if (
                isMemoryLaneReserved(lane, distance) ||
                isWordHuntLaneReserved(lane, distance) ||
                isRouteCrateLaneReserved(lane, distance) ||
                isSpecialMiaLaneReserved(lane, distance) ||
                isSignatureAirRouteReserved(lane, distance) ||
                isSignatureFlightRouteReserved(lane, distance)
            ) return
            state.objects.push({
                kind: 'obstacle',
                type,
                lane,
                distance,
                scene: getObjectSceneKey(distance),
                handled: false
            })
        }

        function addMovingObstacle(startLane, targetLane, distance, sceneKey) {
            if (
                isMemoryLaneReserved(targetLane, distance) ||
                isWordHuntLaneReserved(targetLane, distance) ||
                isWordHuntLaneReserved(startLane, distance, 30) ||
                isRouteCrateLaneReserved(targetLane, distance) ||
                isRouteCrateLaneReserved(startLane, distance, 32) ||
                isSpecialMiaLaneReserved(targetLane, distance) ||
                isSpecialMiaLaneReserved(startLane, distance, 36) ||
                isSignatureAirRouteReserved(targetLane, distance) ||
                isSignatureAirRouteReserved(startLane, distance) ||
                isSignatureFlightRouteReserved(targetLane, distance) ||
                isSignatureFlightRouteReserved(startLane, distance)
            ) return false

            state.objects.push({
                kind: 'obstacle',
                type: 'cart',
                lane: startLane,
                startLane,
                targetLane,
                threatLane: targetLane,
                moving: true,
                movingProgress: 0,
                laneMotionVelocity: 0,
                spawnDistance: distance,
                moveEndDistance: 44,
                approachSpeed: 3.6,
                warningPlayed: false,
                distance,
                scene: sceneKey,
                handled: false
            })
            return true
        }

        function getObstacleThreatLane(object) {
            return object?.moving ? object.threatLane : object?.lane
        }

        function addBoostPad(lane, distance) {
            if (
                isWordHuntLaneReserved(lane, distance, 34) ||
                isRouteCrateLaneReserved(lane, distance, 34) ||
                isSpecialMiaLaneReserved(lane, distance, 40) ||
                isSignatureAirRouteReserved(lane, distance) ||
                isSignatureFlightRouteReserved(lane, distance)
            ) return
            state.objects.push({
                kind: 'boost',
                lane,
                distance,
                height: 0,
                spin: 0,
                guide: true,
                scene: getObjectSceneKey(distance),
                handled: false
            })
        }

        function spawnPowerup() {
            const distance = getTransitionSafeSpawnDistance(VIEW_DISTANCE - 8)
            const availableLanes = LANES.filter((lane) => !state.objects.some((object) => (
                !object.handled &&
                (
                    object.kind === 'obstacle'
                        ? getObstacleThreatLane(object) === lane && Math.abs(object.distance - distance) < 32
                        : (
                            object.kind === 'letter' && object.lane === lane && Math.abs(object.distance - distance) < 28 ||
                            object.kind === 'crate' && object.lane === lane && Math.abs(object.distance - distance) < 34 ||
                            object.kind === 'mia' && object.lane === lane && Math.abs(object.distance - distance) < 38
                        )
                )
            )))
            if (!availableLanes.length) return
            const scene = getSceneAtDistance(state.distance + distance)
            const options = SCENE_GAMEPLAY[scene.key].powerups
            let powerType = randomItem(options)
            if (powerType === state.lastPowerType && options.length > 1) {
                powerType = options[(options.indexOf(powerType) + 1) % options.length]
            }
            state.lastPowerType = powerType
            const preferredLane = availableLanes.includes(state.targetLane)
                ? state.targetLane
                : randomItem(availableLanes)
            state.objects.push({
                kind: 'power',
                powerType,
                lane: preferredLane,
                distance,
                height: 8,
                spin: 0,
                guide: true,
                scene: scene.key,
                handled: false
            })
        }

        function updateObjects(delta) {
            state.objects.forEach((object) => {
                object.distance -= (state.speed + (object.approachSpeed || 0)) * delta
                if (object.moving && !object.handled) {
                    const previousLane = object.lane
                    const travel = Math.max(1, object.spawnDistance - object.moveEndDistance)
                    const progress = 1 - clamp((object.distance - object.moveEndDistance) / travel, 0, 1)
                    object.movingProgress = smootherstep(progress)
                    object.lane = mix(object.startLane, object.targetLane, object.movingProgress)
                    object.laneMotionVelocity = (object.lane - previousLane) / Math.max(delta, 0.001)
                    if (
                        !object.warningPlayed &&
                        object.distance < 86 &&
                        object.distance > 16 &&
                        !isFlightActive()
                    ) {
                        object.warningPlayed = true
                        playSound('oncoming')
                        pulseHaptics(8)
                    }
                }
                if (object.spin != null) object.spin += delta * 5
                const attractionRange = state.magnetTimer > 0
                    ? MAGNET_RANGE
                    : state.feverTimer > 0
                        ? 25
                        : 0
                if (
                    attractionRange > 0 &&
                    object.kind === 'coin' &&
                    !object.airRoute &&
                    !object.flightRoute &&
                    !object.handled &&
                    object.distance > -1.1 &&
                    object.distance < attractionRange
                ) {
                    const attraction = 1 - Math.exp(-delta * mix(5.5, 11, 1 - object.distance / attractionRange))
                    object.lane = mix(object.lane, state.lane, attraction)
                    object.height = mix(object.height || 0, 9, attraction * 0.72)
                    object.magnetized = true
                }
                if (!object.handled && object.kind === 'obstacle' && object.distance < OBSTACLE_CONTACT_BACK) {
                    handleObstacleCleared(object, object.moving ? 'movingDodge' : 'dodge')
                    return
                }
                const contactFront = object.kind === 'obstacle'
                    ? OBSTACLE_CONTACT_FRONT
                    : object.kind === 'letter' || object.kind === 'crate' || object.kind === 'mia'
                        ? 3
                        : 1.65
                const contactBack = object.kind === 'obstacle'
                    ? OBSTACLE_CONTACT_BACK
                    : object.kind === 'letter' || object.kind === 'crate' || object.kind === 'mia'
                        ? -2.2
                        : -1.25
                if (object.handled || object.distance > contactFront || object.distance < contactBack) return
                const laneTolerance = object.kind === 'obstacle'
                    ? 0.34
                    : object.kind === 'boost'
                        ? 0.64
                        : object.kind === 'power'
                            ? object.signature ? 0.66 : 0.48
                            : object.kind === 'memory'
                                ? 0.68
                            : object.kind === 'letter'
                                ? 0.7
                            : object.kind === 'crate'
                                ? 0.68
                            : object.kind === 'mia'
                                ? 0.72
                            : object.flightRoute
                                ? 0.52
                                : 0.4
                if (Math.abs(object.lane - state.lane) > laneTolerance) return

                if (
                    isFlightActive() &&
                    !object.flightRoute &&
                    (object.kind === 'boost' || object.kind === 'memory' || object.kind === 'letter' || object.kind === 'crate' || object.kind === 'mia' || object.kind === 'power')
                ) return

                if (object.kind === 'boost') {
                    activateBoostPad(object)
                    return
                }

                if (object.kind === 'coin') {
                    if (!isAirRouteCoinReachable(object)) return
                    object.handled = true
                    state.coins += 1
                    state.sceneCoins += 1
                    const multiplier = advanceCombo()
                    const scoreBoost = getScoreBoostMultiplier()
                    state.bonusScore += 25 * multiplier * scoreBoost
                    const heartMilestone = state.coins % 10 === 0
                    if (heartMilestone) {
                        state.bonusScore += 100 * multiplier * scoreBoost
                        spawnObjectParticles(object, '#ffe39a', 'heart', 18)
                        setFeedback(`¡${state.coins} corazones! · +${100 * multiplier * scoreBoost}`, 1)
                        playSound('heartMilestone')
                        pulseHaptics([12, 28, 12])
                    } else {
                        spawnObjectParticles(object, '#ff79aa', 'heart', 7)
                        const totalMultiplier = multiplier * scoreBoost
                        setFeedback(totalMultiplier > 1 ? `+ corazón · ×${totalMultiplier}` : '+ corazón')
                        playSound('coin')
                    }
                    checkLevelMission()
                    return
                }

                if (object.kind === 'memory') {
                    activateMemoryToken(object)
                    return
                }

                if (object.kind === 'letter') {
                    activateWordHuntToken(object)
                    return
                }

                if (object.kind === 'crate') {
                    activateRouteCrate(object)
                    return
                }

                if (object.kind === 'mia') {
                    activateSpecialMia(object)
                    return
                }

                if (object.kind === 'power') {
                    activatePowerup(object)
                    return
                }

                if (isObstacleVerticallyClear(object)) {
                    handleObstacleCleared(object, object.type)
                    return
                }

                collideWithObstacle(object)
            })

            state.objects = state.objects.filter((object) => (
                object.distance > -7 && (
                    !object.handled ||
                    object.kind === 'obstacle'
                )
            ))
        }

        function isAirRouteCoinReachable(object) {
            if (object.flightRoute) return isFlightActive() && state.flightBlend > 0.2
            if (isFlightActive()) return false
            if (!object.airRoute || object.magnetized) return true
            const jumpRatio = getJumpHeight() / Math.max(1, state.height)
            if (object.requiresAirJump) return state.airJumpUsed && jumpRatio >= 0.2
            if (object.requiresJump) return state.jumpElapsed >= 0 && jumpRatio >= 0.035
            return true
        }

        function activateBoostPad(object) {
            object.handled = true
            state.slideTimer = 0
            state.slideElapsed = -1
            state.jumpBufferTimer = 0
            state.jumpElapsed = 0
            state.jumpHeight = Math.max(0, state.jumpHeight)
            state.jumpVelocity = state.height * BOOST_JUMP_SPEED_RATIO
            state.fastFall = false
            state.landingRollQueued = false
            state.boostJump = true
            state.landingTimer = 0
            const boostPoints = 120 * getScoreBoostMultiplier()
            state.bonusScore += boostPoints
            advanceCombo()
            state.scenePerfectClears += 1
            spawnObjectParticles(object, '#ffe083', 'spark', 24)
            state.cameraShake = Math.max(state.cameraShake, state.reducedMotion ? 0 : 0.07)
            setFeedback(`¡Impulso aéreo! · +${boostPoints}`, 1)
            announce('Rampa de impulso activada.')
            playSound('boost')
            pulseHaptics([10, 22, 12])
            checkLevelMission()
        }

        function activateMemoryToken(object) {
            const memory = MEMORY_TOKENS[object.memoryIndex]
            if (!memory || state.memoryTokens[object.memoryIndex]) return
            object.handled = true
            state.memoryTokens[object.memoryIndex] = true
            state.memoriesCollected += 1
            const comboMultiplier = advanceCombo(2)
            const scoreBoost = getScoreBoostMultiplier()
            const bonus = 420 * comboMultiplier * scoreBoost
            state.bonusScore += bonus
            spawnObjectParticles(object, memory.accent, 'heart', 26)
            spawnObjectParticles(object, '#fff1ae', 'spark', 16)
            state.cameraShake = Math.max(state.cameraShake, state.reducedMotion ? 0 : 0.08)
            showMemoryToast(object.memoryIndex)
            setFeedback(`Recuerdo guardado · +${bonus}`, 2)
            announce(`Recuerdo fotográfico de ${memory.title} guardado. ${state.memoriesCollected} de ${MEMORY_TOKENS.length}.`)
            playSound('memory')
            pulseHaptics([16, 28, 18, 34, 26])
            checkLevelMission()
        }

        function activateSpecialMia(object) {
            const token = SPECIAL_MIA_TOKENS[object.miaIndex]
            if (!token || state.miaTokens[object.miaIndex]) return
            object.handled = true
            state.miaTokens[object.miaIndex] = true
            state.miasCollected += 1
            root.dataset.miaCollected = String(state.miasCollected)
            root.dataset.miaComplete = String(state.miasCollected === SPECIAL_MIA_TOKENS.length)
            const scoreBoost = getScoreBoostMultiplier()
            const reward = SPECIAL_MIA_SCORE_REWARD * scoreBoost
            state.bonusScore += reward
            advanceCombo(3)
            spawnObjectParticles(object, token.accent, 'spark', 34)
            spawnObjectParticles(object, '#ff86b4', 'heart', 22)
            state.cameraShake = Math.max(state.cameraShake, state.reducedMotion ? 0 : 0.11)
            setFeedback(`¡Mía salchicha ${state.miasCollected}/${SPECIAL_MIA_TOKENS.length}! · +${reward}`, 3)
            announce(`Mía salchicha recogida. ${state.miasCollected} de ${SPECIAL_MIA_TOKENS.length}. Bonificación especial de ${reward} puntos.`)
            playMiaBark()
            pulseHaptics([18, 24, 18, 42, 22])
        }

        function showMemoryToast(memoryIndex) {
            const memory = MEMORY_TOKENS[memoryIndex]
            if (!memory) return
            if (!elements.crateToast.hidden) {
                elements.crateToast.classList.remove('is-visible', 'is-complete')
                elements.crateToast.hidden = true
                state.crateToastTimer = -1
            }
            elements.memoryToastImage.src = new URL(memory.thumbnail, document.baseURI).href
            elements.memoryToastImage.alt = ''
            elements.memoryToastNumber.textContent = `Recuerdo ${state.memoriesCollected} de ${MEMORY_TOKENS.length}`
            elements.memoryToastTitle.textContent = memory.title
            elements.memoryToastCaption.textContent = memory.caption
            elements.memoryToast.style.setProperty('--memory-accent', memory.accent)
            elements.memoryToast.hidden = false
            elements.memoryToast.classList.remove('is-visible')
            void elements.memoryToast.offsetWidth
            elements.memoryToast.classList.add('is-visible')
            state.memoryToastTimer = 2.2
        }

        function updateMemoryToast(delta) {
            if (state.memoryToastTimer < 0) return
            state.memoryToastTimer -= delta
            if (state.memoryToastTimer <= 0 && elements.memoryToast.classList.contains('is-visible')) {
                elements.memoryToast.classList.remove('is-visible')
            }
            if (state.memoryToastTimer <= -0.38) {
                elements.memoryToast.hidden = true
                state.memoryToastTimer = -1
            }
        }

        function resetMemoryAlbum() {
            elements.finalMemories.textContent = `0/${MEMORY_TOKENS.length}`
            elements.memorySlots.forEach((slot, memoryIndex) => {
                const memory = MEMORY_TOKENS[memoryIndex]
                slot.classList.remove('is-collected')
                slot.style.backgroundImage = ''
                slot.setAttribute('aria-label', `Recuerdo ${memoryIndex + 1}, todavía no recogido`)
            })
        }

        function updateMemoryAlbum() {
            elements.finalMemories.textContent = `${state.memoriesCollected}/${MEMORY_TOKENS.length}`
            elements.memorySlots.forEach((slot, memoryIndex) => {
                const memory = MEMORY_TOKENS[memoryIndex]
                const collected = state.memoryTokens[memoryIndex]
                slot.classList.toggle('is-collected', collected)
                slot.style.backgroundImage = collected ? `url("${new URL(memory.thumbnail, document.baseURI).href}")` : ''
                slot.setAttribute(
                    'aria-label',
                    collected ? `Recuerdo de ${memory.title} recogido` : `Recuerdo ${memoryIndex + 1}, no recogido`
                )
            })
        }

        function activateWordHuntToken(object) {
            const token = WORD_HUNT_TOKENS[object.letterIndex]
            if (!token || state.wordTokens[object.letterIndex]) return

            object.handled = true
            state.wordTokens[object.letterIndex] = true
            state.lettersCollected += 1
            const comboMultiplier = advanceCombo(2)
            const scoreBoost = getScoreBoostMultiplier()
            const letterBonus = 260 * comboMultiplier * scoreBoost
            const wordComplete = state.lettersCollected === WORD_HUNT_TOKENS.length
            let completionBonus = 0
            if (wordComplete && !state.wordCompletionAwarded) {
                state.wordCompletionAwarded = true
                completionBonus = WORD_HUNT_COMPLETION_BONUS * scoreBoost
            }
            state.bonusScore += letterBonus + completionBonus

            spawnObjectParticles(object, token.accent, 'spark', wordComplete ? 30 : 18)
            spawnObjectParticles(object, '#fff0a8', 'heart', wordComplete ? 18 : 8)
            state.cameraShake = Math.max(state.cameraShake, state.reducedMotion ? 0 : wordComplete ? 0.095 : 0.045)
            updateWordHunt(object.letterIndex)

            if (wordComplete) {
                setFeedback(`¡${WORD_HUNT_LABEL} completa! · recuerdo desbloqueado · +${completionBonus}`, 3)
                announce(`Palabra ${WORD_HUNT_LABEL} completada. El vídeo que regalaste por vuestros dos meses se ha desbloqueado.`)
                playSound('wordComplete')
                pulseHaptics([16, 26, 18, 34, 20, 42])
            } else {
                setFeedback(`Letra ${token.letter} guardada · +${letterBonus}`, 2)
                announce(`Letra ${token.letter} recogida. ${state.lettersCollected} de ${WORD_HUNT_TOKENS.length}.`)
                playSound('letter')
                pulseHaptics([10, 18, 12])
            }
        }

        function resetWordHunt() {
            root.dataset.wordComplete = 'false'
            elements.wordHunt.classList.remove('is-complete')
            elements.finalWord.classList.remove('is-complete')
            updateWordHunt()
        }

        function updateWordHunt(pulseIndex = -1) {
            const complete = state.lettersCollected === WORD_HUNT_TOKENS.length
            const progressLabel = `Palabra ${WORD_HUNT_LABEL}, ${state.lettersCollected} de ${WORD_HUNT_TOKENS.length} letras${complete ? ', completa' : ''}`
            root.dataset.wordComplete = String(complete)
            elements.wordHunt.classList.toggle('is-complete', complete)
            elements.finalWord.classList.toggle('is-complete', complete)
            elements.wordHunt.setAttribute('aria-label', progressLabel)
            elements.finalWord.setAttribute('aria-label', progressLabel)
            setTextIfChanged(elements.finalLetters, `${state.lettersCollected}/${WORD_HUNT_TOKENS.length}`)

            ;[elements.wordSlots, elements.finalWordSlots].forEach((slots) => {
                slots.forEach((slot, letterIndex) => {
                    const token = WORD_HUNT_TOKENS[letterIndex]
                    const collected = state.wordTokens[letterIndex]
                    slot.textContent = token.letter
                    slot.classList.toggle('is-collected', collected)
                    slot.setAttribute(
                        'aria-label',
                        collected ? `Letra ${token.letter} recogida` : `Letra ${token.letter}, todavía no recogida`
                    )
                    if (letterIndex === pulseIndex) {
                        slot.classList.remove('is-new')
                        void slot.offsetWidth
                        slot.classList.add('is-new')
                    } else {
                        slot.classList.remove('is-new')
                    }
                })
            })
        }

        function activateRouteCrate(object) {
            const crate = ROUTE_CRATES[object.crateIndex]
            if (!crate || state.crateTokens[object.crateIndex]) return

            object.handled = true
            state.crateTokens[object.crateIndex] = true
            state.cratesOpened += 1
            const scoreBoost = getScoreBoostMultiplier()
            const comboMultiplier = advanceCombo(2)
            const rewardType = selectRouteCrateReward(crate, object.crateIndex)
            const reward = applyRouteCrateReward(rewardType, scoreBoost)
            const baseBonus = 180 * comboMultiplier * scoreBoost
            const allCratesOpened = state.cratesOpened === ROUTE_CRATES.length
            const completionBonus = allCratesOpened ? CRATE_COMPLETION_BONUS * scoreBoost : 0
            state.bonusScore += baseBonus + completionBonus

            spawnObjectParticles(object, crate.accent, 'spark', allCratesOpened ? 34 : 22)
            spawnObjectParticles(object, '#fff0a8', 'heart', allCratesOpened ? 20 : 10)
            state.cameraShake = Math.max(state.cameraShake, state.reducedMotion ? 0 : allCratesOpened ? 0.11 : 0.065)
            showCrateToast(object.crateIndex, reward, allCratesOpened)
            updateCrateProgress(true)

            if (allCratesOpened) {
                setFeedback(`¡${ROUTE_CRATES.length} cajas abiertas! · ${reward.label} · +${completionBonus}`, 3)
                announce(`Todas las cajas de recuerdos están abiertas. ${reward.announcement}`)
                playSound('crateComplete')
                pulseHaptics([18, 28, 18, 38, 24, 48])
            } else {
                setFeedback(`${reward.label} · caja ${state.cratesOpened}/${ROUTE_CRATES.length}`, 2)
                announce(`${crate.title} abierta. ${reward.announcement}`)
                playSound('crate')
                pulseHaptics([14, 22, 16, 30])
            }
            updateHud()
        }

        function selectRouteCrateReward(crate, crateIndex) {
            if (state.lives < 3) return 'life'
            const availableRewards = crate.rewards.map((reward) => reward === 'life' ? 'score' : reward)
            const rewardIndex = Math.abs(state.coins + state.maxCombo * 2 + crateIndex * 5) % availableRewards.length
            return availableRewards[rewardIndex]
        }

        function applyRouteCrateReward(rewardType, scoreBoost) {
            if (rewardType === 'life') {
                if (state.lives < 3) {
                    state.lives += 1
                    return {
                        icon: '+♥',
                        label: 'Vida recuperada',
                        caption: 'Mía vuelve a ponerte en pie',
                        announcement: 'Mía ha recuperado una vida.'
                    }
                }
                rewardType = 'score'
            }

            if (rewardType === 'hearts') {
                state.coins += CRATE_HEART_REWARD
                state.sceneCoins += CRATE_HEART_REWARD
                checkLevelMission()
                return {
                    icon: '♥',
                    label: `+${CRATE_HEART_REWARD} corazones`,
                    caption: 'Una lluvia de recuerdos',
                    announcement: `${CRATE_HEART_REWARD} corazones añadidos.`
                }
            }

            if (rewardType === 'shield') {
                state.shieldTimer = Math.max(state.shieldTimer, 10)
                state.shieldChimeTimer = 1.8
                state.activePowerType = 'shield'
                return {
                    icon: '✦',
                    label: 'Escudo · 10 s',
                    caption: 'Protección para el siguiente tramo',
                    announcement: 'Escudo activo durante diez segundos.'
                }
            }

            if (rewardType === 'magnet') {
                state.magnetTimer = Math.max(state.magnetTimer, 9)
                state.activePowerType = 'magnet'
                return {
                    icon: '♥',
                    label: 'Imán · 9 s',
                    caption: 'Los corazones vienen a ti',
                    announcement: 'Imán de corazones activo durante nueve segundos.'
                }
            }

            if (rewardType === 'multiplier') {
                state.multiplierTimer = Math.max(state.multiplierTimer, 9)
                state.activePowerType = 'multiplier'
                return {
                    icon: '×2',
                    label: 'Puntos ×2 · 9 s',
                    caption: 'Cada recuerdo vale el doble',
                    announcement: 'Multiplicador de puntos activo durante nueve segundos.'
                }
            }

            const scoreReward = CRATE_SCORE_REWARD * scoreBoost
            state.bonusScore += scoreReward
            return {
                icon: '★',
                label: `+${scoreReward} puntos`,
                caption: 'Premio especial de Mía',
                announcement: `${scoreReward} puntos extra añadidos.`
            }
        }

        function showCrateToast(crateIndex, reward, complete) {
            const crate = ROUTE_CRATES[crateIndex]
            if (!crate) return
            if (!elements.memoryToast.hidden) {
                elements.memoryToast.classList.remove('is-visible')
                elements.memoryToast.hidden = true
                state.memoryToastTimer = -1
            }
            elements.crateToastIcon.textContent = reward.icon
            elements.crateToastTitle.textContent = crate.title
            elements.crateToastReward.textContent = reward.label
            elements.crateToastCaption.textContent = complete
                ? `${reward.caption} · colección completa`
                : reward.caption
            elements.crateToast.style.setProperty('--crate-accent', crate.accent)
            elements.crateToast.style.setProperty('--crate-dark', crate.dark)
            elements.crateToast.hidden = false
            elements.crateToast.classList.remove('is-visible', 'is-complete')
            void elements.crateToast.offsetWidth
            elements.crateToast.classList.toggle('is-complete', complete)
            elements.crateToast.classList.add('is-visible')
            state.crateToastTimer = complete ? 2.75 : 2.25
        }

        function updateCrateToast(delta) {
            if (state.crateToastTimer < 0) return
            state.crateToastTimer -= delta
            if (state.crateToastTimer <= 0 && elements.crateToast.classList.contains('is-visible')) {
                elements.crateToast.classList.remove('is-visible')
            }
            if (state.crateToastTimer <= -0.38) {
                elements.crateToast.hidden = true
                elements.crateToast.classList.remove('is-complete')
                state.crateToastTimer = -1
            }
        }

        function updateCrateProgress(pulse = false) {
            const complete = state.cratesOpened === ROUTE_CRATES.length
            const progressLabel = `${state.cratesOpened} de ${ROUTE_CRATES.length} cajas abiertas${complete ? ', colección completa' : ''}`
            setTextIfChanged(elements.crateCount, `${state.cratesOpened}/${ROUTE_CRATES.length}`)
            setTextIfChanged(elements.finalCrates, `▣ ${state.cratesOpened}/${ROUTE_CRATES.length} cajas`)
            elements.crateProgress.setAttribute('aria-label', progressLabel)
            elements.crateProgress.classList.toggle('is-complete', complete)
            root.dataset.cratesComplete = String(complete)
            if (!pulse) return
            elements.crateProgress.classList.remove('is-pulsing')
            void elements.crateProgress.offsetWidth
            elements.crateProgress.classList.add('is-pulsing')
        }

        function activatePowerup(object) {
            const powerType = object.powerType || 'shield'
            const power = POWERUPS[powerType]
            if (!power) return
            object.handled = true
            state.activePowerType = powerType
            if (powerType === 'shield') {
                state.shieldTimer = Math.max(state.shieldTimer, power.duration)
                state.shieldChimeTimer = 1.8
            } else if (powerType === 'magnet') {
                state.magnetTimer = Math.max(state.magnetTimer, power.duration)
            } else if (powerType === 'multiplier') {
                state.multiplierTimer = Math.max(state.multiplierTimer, power.duration)
            } else if (powerType === 'sneakers') {
                state.sneakersTimer = Math.max(state.sneakersTimer, power.duration)
                state.airJumpUsed = false
            } else if (powerType === 'flight') {
                state.flightTimer = Math.max(state.flightTimer, power.duration)
                state.flightElapsed = 0
                state.flightSoundTimer = 1.15
                state.flightEndSoundPlayed = false
                state.flightBlend = Math.max(state.flightBlend, 0.035)
                state.jumpElapsed = -1
                state.jumpHeight = 0
                state.jumpVelocity = 0
                state.jumpBufferTimer = 0
                state.fastFall = false
                state.boostJump = false
                state.slideTimer = 0
                state.slideElapsed = -1
            }
            state.bonusScore += 150
            spawnObjectParticles(object, power.color, powerType === 'magnet' ? 'heart' : 'spark', 20)
            const duration = Math.round(power.duration)
            setFeedback(`${power.label} · ${duration} s`, 1)
            announce(`Potenciador recogido. ${power.label} activo durante ${duration} segundos.`)
            const powerSound = powerType === 'shield'
                ? 'power'
                : powerType === 'magnet'
                    ? 'powerMagnet'
                    : powerType === 'sneakers'
                        ? 'powerSneakers'
                        : powerType === 'flight'
                            ? 'powerFlight'
                        : 'powerMultiplier'
            playSound(powerSound)
            pulseHaptics([18, 32, 18])
            updateHud()
        }

        function getPowerTimer(powerType) {
            if (powerType === 'shield') return state.shieldTimer
            if (powerType === 'magnet') return state.magnetTimer
            if (powerType === 'multiplier') return state.multiplierTimer
            if (powerType === 'sneakers') return state.sneakersTimer
            if (powerType === 'flight') return state.flightTimer
            return 0
        }

        function getScoreBoostMultiplier() {
            const powerMultiplier = state.multiplierTimer > 0 ? 2 : 1
            const feverMultiplier = state.feverTimer > 0 ? 2 : 1
            return powerMultiplier * feverMultiplier
        }

        function activateFever() {
            if (state.feverTimer > 0) return
            state.feverCharge = 0
            state.feverTimer = FEVER_DURATION
            state.feverActivations += 1
            state.comboTimer = Math.max(state.comboTimer, COMBO_TIMEOUT)
            state.cameraShake = Math.max(state.cameraShake, state.reducedMotion ? 0 : 0.1)
            spawnParticles(state.width * 0.5, state.height * 0.59, '#fff0a8', 'spark', 28)
            spawnParticles(state.width * 0.5, state.height * 0.55, '#ff87b2', 'heart', 14)
            triggerImpactFlash('fever')
            setFeedback('¡Modo recuerdo! · Imán + puntos ×2', 2)
            announce('Modo recuerdo activado. Los corazones se acercan y los puntos se duplican.')
            playSound('fever')
            pulseHaptics([15, 26, 15, 26, 45])
            updateComboHud(true)
        }

        function updateFever(delta) {
            if (state.feverTimer <= 0) return
            state.feverTimer = Math.max(0, state.feverTimer - delta)
            if (state.feverTimer <= 0) updateComboHud()
        }

        function updateFlight(delta) {
            const hadFlightTime = state.flightTimer > 0
            if (hadFlightTime) {
                state.flightTimer = Math.max(0, state.flightTimer - delta)
                state.flightElapsed += delta
                state.flightSoundTimer -= delta
                if (state.flightSoundTimer <= 0 && state.flightTimer > 0.55) {
                    state.flightSoundTimer = 1.35
                    playSound('flightGlide')
                }
            }

            const target = state.flightTimer > 0 ? 1 : 0
            const response = target > state.flightBlend ? FLIGHT_RISE_RESPONSE : FLIGHT_FALL_RESPONSE
            state.flightBlend = mix(
                state.flightBlend,
                target,
                1 - Math.exp(-response * delta)
            )
            if (target === 0 && state.flightBlend < 0.002) state.flightBlend = 0

            if (hadFlightTime && state.flightTimer <= 0 && !state.flightEndSoundPlayed) {
                state.flightEndSoundPlayed = true
                setFeedback('Descenso suave · vuelve a la ruta', 1)
                playSound('flightEnd')
            }
        }

        function isFlightActive() {
            return state.flightTimer > 0 || state.flightBlend > 0.08
        }

        function getFlightHeight() {
            const lift = smootherstep(state.flightBlend)
            const hover = state.reducedMotion || lift < 0.35
                ? 0
                : Math.sin(state.worldTime * 2.8) * state.height * 0.004
            return state.height * FLIGHT_LIFT_RATIO * lift + hover
        }

        function getPlayerVerticalHitbox() {
            const slideBlend = getSlideBlend()
            const feet = (getJumpHeight() + getFlightHeight()) / Math.max(1, state.height)
            const bodyHeight = mix(PLAYER_STANDING_HEIGHT, PLAYER_SLIDING_HEIGHT, slideBlend)
            return {
                bottom: feet,
                top: feet + bodyHeight
            }
        }

        function isObstacleVerticallyClear(object) {
            if (object.kind !== 'obstacle') return false
            if (isFlightActive()) return true
            if (object.type === 'cart') return false
            const obstacle = OBSTACLE_VERTICAL_PROFILES[object.type]
            if (!obstacle) return false
            const player = getPlayerVerticalHitbox()
            const overlapsVertically = player.bottom < obstacle.top && player.top > obstacle.bottom
            return !overlapsVertically
        }

        function handleObstacleCleared(object, method) {
            object.handled = true
            if (isFlightActive()) {
                object.clearedBy = 'flight'
                object.perfectClear = true
                state.obstaclesCleared += 1
                state.scenePerfectClears += 1
                state.bonusScore += 24 * getScoreBoostMultiplier()
                checkLevelMission()
                return
            }
            object.clearedBy = method
            state.obstaclesCleared += 1
            const player = getPlayerVerticalHitbox()
            const obstacle = OBSTACLE_VERTICAL_PROFILES[method]
            const clearance = method === 'spill' && obstacle
                ? player.bottom - obstacle.top
                : method === 'sheet' && obstacle
                    ? obstacle.bottom - player.top
                    : 0
            const isMovingDodge = method === 'movingDodge'
            const isLaneDodge = method === 'dodge' || isMovingDodge
            const isPerfect = isLaneDodge || clearance >= 0.022
            object.perfectClear = isPerfect
            if (isPerfect) state.scenePerfectClears += 1
            const multiplier = advanceCombo()
            const scoreBoost = getScoreBoostMultiplier()
            const basePoints = isMovingDodge ? 68 : method === 'dodge' ? 35 : isPerfect ? 55 : 42
            state.bonusScore += basePoints * multiplier * scoreBoost
            const message = isMovingDodge
                ? '¡Cruce perfecto!'
                : method === 'spill'
                    ? isPerfect ? '¡Salto perfecto!' : '¡Buen salto!'
                    : method === 'sheet'
                        ? isPerfect ? '¡Deslizamiento perfecto!' : '¡Buen deslizamiento!'
                        : '¡Esquiva limpia!'
            if (!isLaneDodge) {
                spawnObjectParticles(object, method === 'spill' ? '#ffd98c' : '#a9f2df', 'spark', isPerfect ? 12 : 7)
                if (isPerfect) state.cameraShake = Math.max(state.cameraShake, state.reducedMotion ? 0 : 0.045)
            } else if (isMovingDodge) {
                spawnObjectParticles(object, '#91e9f4', 'spark', 9)
                state.cameraShake = Math.max(state.cameraShake, state.reducedMotion ? 0 : 0.035)
            }
            const totalMultiplier = multiplier * scoreBoost
            setFeedback(
                totalMultiplier > 1 ? `${message} · ×${totalMultiplier}` : message,
                isMovingDodge ? 2 : 0
            )
            playSound(isMovingDodge ? 'movingClear' : method === 'dodge' || !isPerfect ? 'clear' : 'perfect')
            if (isMovingDodge) pulseHaptics([8, 18, 10])
            else if (method !== 'dodge') pulseHaptics(10)
            checkLevelMission()
        }

        function getComboMultiplier() {
            if (state.combo >= 15) return 4
            if (state.combo >= 8) return 3
            if (state.combo >= 4) return 2
            return 1
        }

        function advanceCombo(amount = 1) {
            const previousMultiplier = getComboMultiplier()
            state.combo += amount
            state.maxCombo = Math.max(state.maxCombo, state.combo)
            state.sceneMaxCombo = Math.max(state.sceneMaxCombo, state.combo)
            state.comboTimer = COMBO_TIMEOUT
            if (state.feverTimer <= 0) {
                state.feverCharge = Math.min(FEVER_CHARGE_TARGET, state.feverCharge + amount)
                if (state.feverCharge >= FEVER_CHARGE_TARGET) activateFever()
            }
            const multiplier = getComboMultiplier()
            updateComboHud(true)
            if (multiplier > previousMultiplier) playSound('combo')
            return multiplier
        }

        function updateComboTimer(delta) {
            if (state.comboTimer <= 0) return
            if (state.feverTimer > 0) {
                state.comboTimer = Math.max(state.comboTimer, Math.min(COMBO_TIMEOUT, state.feverTimer))
                return
            }
            state.comboTimer = Math.max(0, state.comboTimer - delta)
            if (state.comboTimer <= 0) resetCombo()
        }

        function resetCombo() {
            if (state.combo <= 0) return
            state.combo = 0
            state.comboTimer = 0
            state.feverCharge = 0
            state.feverTimer = 0
            updateComboHud()
        }

        function updateComboHud(pulse = false) {
            elements.combo.hidden = state.combo < 2
            const feverActive = state.feverTimer > 0
            const feverProgress = feverActive
                ? state.feverTimer / FEVER_DURATION
                : state.feverCharge / FEVER_CHARGE_TARGET
            setTextIfChanged(elements.comboLabel, feverActive ? 'Modo recuerdo' : 'Racha')
            setTextIfChanged(elements.comboValue, String(state.combo))
            setTextIfChanged(elements.comboMultiplier, `×${getComboMultiplier() * getScoreBoostMultiplier()}`)
            elements.combo.dataset.fever = feverActive ? 'true' : 'false'
            elements.combo.style.setProperty('--fever-charge', `${Math.round(clamp(feverProgress, 0, 1) * 100)}%`)
            if (!pulse || elements.combo.hidden) return
            elements.combo.classList.remove('is-pulsing')
            void elements.combo.offsetWidth
            elements.combo.classList.add('is-pulsing')
        }

        function collideWithObstacle(object) {
            object.handled = true
            object.collided = true
            if (state.invulnerableTimer > 0) return

            const impactProjection = project(object.lane, 2)
            spawnParticles(impactProjection.x, impactProjection.y - 28, '#ffd1df', 'spark', 15)
            state.cameraShake = state.reducedMotion ? 0 : 0.52
            state.invulnerableTimer = 1.35
            state.stumbleDirection = Math.abs(state.laneVelocity) > 0.08
                ? -Math.sign(state.laneVelocity)
                : state.lane <= 0 ? 1 : -1

            if (state.shieldTimer > 0) {
                state.shieldTimer = 0
                state.stumbleTimer = 0.35
                state.stumbleDuration = 0.35
                state.speedPenalty = Math.max(state.speedPenalty, 0.12)
                triggerImpactFlash('shield')
                setFeedback('El escudo os ha protegido', 3)
                announce('El escudo de cuidado ha bloqueado un golpe.')
                playSound('shieldHit')
                pulseHaptics([24, 35, 18])
                return
            }

            state.lives -= 1
            state.sceneDamageTaken = true
            resetCombo()
            state.stumbleTimer = 0.72
            state.stumbleDuration = 0.72
            state.speedPenalty = Math.max(state.speedPenalty, 0.42)
            triggerImpactFlash('hit')
            setFeedback(state.lives > 0 ? 'Tropezón… ¡Sofía sigue!' : 'Fin del recorrido', 3)
            playSound('impact')
            pulseHaptics(state.lives > 0 ? 55 : [70, 55, 90])
            updateHud()

            if (state.lives <= 0) {
                state.crashTimer = 0.95
                setMode('crashing')
                announce('La partida ha terminado.')
            }
        }

        function triggerImpactFlash(kind) {
            elements.impactFlash.classList.remove('is-hit', 'is-shield', 'is-finish', 'is-fever')
            void elements.impactFlash.offsetWidth
            elements.impactFlash.classList.add(`is-${kind}`)
        }

        function finishRound(completed) {
            const finalScore = Math.floor(state.score)
            const isRecord = finalScore > state.best
            if (isRecord) {
                state.best = finalScore
                writeStorage(BEST_SCORE_KEY, String(state.best))
            }
            recordScoreHistory({
                score: finalScore,
                distance: Math.floor(state.distance),
                coins: state.coins,
                completed,
                timestamp: Date.now()
            })

            elements.finalScore.textContent = String(finalScore)
            elements.finalDistance.textContent = `${Math.floor(state.distance)} m`
            elements.finalCoins.textContent = String(state.coins)
            elements.finalCombo.textContent = String(state.maxCombo)
            updateMemoryAlbum()
            updateWordHunt()
            elements.endKicker.textContent = completed ? 'Ruta completada' : 'La ruta continúa'
            elements.endTitle.textContent = completed
                ? (isRecord ? '¡Meta y nuevo récord!' : '¡Llegaste, Sofía!')
                : (isRecord ? '¡Nuevo récord, Sofía!' : '¡Qué viaje, Sofía!')
            const perfectLevels = state.levelResults.filter((result) => result?.flawless).length
            const completedMissions = state.levelResults.filter((result) => result?.mission).length
            const completeWord = state.lettersCollected === WORD_HUNT_TOKENS.length
            const completeCrates = state.cratesOpened === ROUTE_CRATES.length
            const wordResult = completeWord
                ? `formas la palabra ${WORD_HUNT_LABEL}`
                : `reúnes ${state.lettersCollected}/${WORD_HUNT_TOKENS.length} letras de ${WORD_HUNT_LABEL}`
            const crateResult = completeCrates
                ? `abres las ${ROUTE_CRATES.length} cajas sorpresa`
                : `abres ${state.cratesOpened}/${ROUTE_CRATES.length} cajas sorpresa`
            const miaResult = state.miasCollected === SPECIAL_MIA_TOKENS.length
                ? `recoges los ${SPECIAL_MIA_TOKENS.length} perritos salchicha de Mía`
                : `recoges ${state.miasCollected}/${SPECIAL_MIA_TOKENS.length} perritos salchicha de Mía`
            elements.endSummary.textContent = completed
                ? `Has unido los dos escenarios en ${formatDuration(state.elapsedTime)}, conservas ${state.lives} ${state.lives === 1 ? 'vida' : 'vidas'}, guardas ${state.memoriesCollected}/${MEMORY_TOKENS.length} recuerdos, ${wordResult}, ${crateResult}, ${miaResult}, completas ${perfectLevels} ${perfectLevels === 1 ? 'nivel perfecto' : 'niveles perfectos'} y ${completedMissions}/${SCENES.length} objetivos.`
                : `Esta vez el turno terminó antes de la meta, pero ya guardaste ${state.memoriesCollected}/${MEMORY_TOKENS.length} recuerdos, ${wordResult}, ${crateResult}, ${miaResult} y la carta sigue esperándote.`
            elements.finalRank.textContent = getFinalRank(completed)
            elements.continueButton.textContent = completed ? 'Abrir la carta 💌' : 'Continuar a la carta 💌'
            elements.recordMessage.textContent = isRecord
                ? `Nueva mejor marca: ${state.best}`
                : `Tu mejor marca sigue siendo ${state.best}`
            elements.best.textContent = String(state.best)
            elements.startBest.textContent = String(state.best)

            setMode('gameover')
            showOverlay('end')
            if (!completed) playSound(isRecord ? 'record' : 'end')
            announce(`${completed ? 'Ruta completada' : 'Partida terminada'}. ${finalScore} puntos, ${Math.floor(state.distance)} metros, ${state.coins} corazones, ${state.lettersCollected} de ${WORD_HUNT_TOKENS.length} letras, ${state.cratesOpened} de ${ROUTE_CRATES.length} cajas, ${state.miasCollected} de ${SPECIAL_MIA_TOKENS.length} perritos de Mía y racha máxima de ${state.maxCombo}.`)
            ;(completed ? elements.continueButton : elements.restartButton).focus({ preventScroll: true })
        }

        function getFinalRank(completed) {
            if (!completed) return state.distance >= ROUTE_DISTANCE * 0.66
                ? 'Corazón incansable'
                : 'Aprendiz de la ruta'
            const perfectLevels = state.levelResults.filter((result) => result?.flawless).length
            const completedMissions = state.levelResults.filter((result) => result?.mission).length
            const completeAlbum = state.memoriesCollected === MEMORY_TOKENS.length
            const completeWord = state.lettersCollected === WORD_HUNT_TOKENS.length
            const completeCrates = state.cratesOpened === ROUTE_CRATES.length
            const completeMias = state.miasCollected === SPECIAL_MIA_TOKENS.length
            if (state.lives === 3 && perfectLevels === SCENES.length && completedMissions === SCENES.length && completeAlbum && completeWord && completeCrates && completeMias && state.maxCombo >= 15) return 'Guardiana legendaria'
            if (state.lives === 3 && completeAlbum && completeWord && completeCrates && completeMias && state.maxCombo >= 15) return 'Guardiana de oro'
            if (state.lives >= 2 && state.maxCombo >= 8) return 'Guardiana de plata'
            return 'Guardiana de los recuerdos'
        }

        function formatDuration(seconds) {
            const rounded = Math.max(0, Math.round(seconds))
            const minutes = Math.floor(rounded / 60)
            const remainder = String(rounded % 60).padStart(2, '0')
            return `${minutes}:${remainder}`
        }

        function updateParticles(delta) {
            state.particles.forEach((particle) => {
                particle.life -= delta
                particle.x += particle.vx * delta
                particle.y += particle.vy * delta
                particle.vy += particle.gravity * delta
                particle.rotation += particle.spin * delta
            })
            state.particles = state.particles.filter((particle) => particle.life > 0)
        }

        function spawnObjectParticles(object, color, shape, amount) {
            const point = project(object.lane, Math.max(0, object.distance), object.height || 0)
            spawnParticles(point.x, point.y - 20 * point.scale, color, shape, amount)
        }

        function spawnMovementDust(amount) {
            if (state.reducedMotion) return
            const compact = isCompactRunner()
            const x = state.width / 2 + state.lane * (compact ? getLaneSpread(1) : state.width * 0.225)
            const y = compact ? getRoadGroundY() - state.height * 0.018 : state.height * 0.81
            const sceneKey = getSceneMix().current.key
            const color = sceneKey === 'aguamarina'
                ? 'rgba(255, 226, 172, 0.88)'
                : 'rgba(255, 216, 190, 0.82)'
            spawnParticles(x, y, color, 'spark', amount)
        }

        function spawnParticles(x, y, color, shape, amount) {
            for (let index = 0; index < amount; index += 1) {
                state.particles.push({
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 120,
                    vy: -35 - Math.random() * 100,
                    gravity: 110 + Math.random() * 70,
                    life: 0.45 + Math.random() * 0.5,
                    maxLife: 0.95,
                    size: 3 + Math.random() * 5,
                    rotation: Math.random() * Math.PI * 2,
                    spin: (Math.random() - 0.5) * 7,
                    color,
                    shape
                })
            }
        }

        function spawnFinishParticles() {
            const centerX = state.width * 0.5
            const centerY = state.height * 0.48
            spawnParticles(centerX, centerY, '#ff79aa', 'heart', 28)
            spawnParticles(centerX - state.width * 0.16, centerY + 20, '#ffe39a', 'spark', 20)
            spawnParticles(centerX + state.width * 0.16, centerY + 20, '#7de5d2', 'spark', 20)
        }

        function setFeedback(message, priority = 0) {
            if (state.feedbackTimer > 0 && priority < state.feedbackPriority) return
            elements.feedback.textContent = message
            elements.feedback.classList.add('is-visible')
            state.feedbackPriority = priority
            state.feedbackTimer = priority > 0 ? 1.28 : 1.05
        }

        function updateFeedback(delta) {
            if (state.feedbackTimer <= 0) return
            state.feedbackTimer -= delta
            if (state.feedbackTimer <= 0) {
                state.feedbackPriority = 0
                elements.feedback.classList.remove('is-visible')
            }
        }

        function updateHud() {
            const routeProgress = clamp(state.distance / ROUTE_DISTANCE, 0, 1)
            const routePercent = Math.round(routeProgress * 100)
            setTextIfChanged(elements.score, String(Math.floor(state.score)))
            setTextIfChanged(elements.distance, `${Math.floor(Math.min(state.distance, ROUTE_DISTANCE))} m`)
            setTextIfChanged(elements.coins, String(state.coins))
            setTextIfChanged(elements.best, String(Math.max(state.best, Math.floor(state.score))))
            setTextIfChanged(elements.lives, `${'♥ '.repeat(state.lives)}${'♡ '.repeat(3 - state.lives)}`.trim())
            updateComboHud()
            setAttributeIfChanged(elements.lives.parentElement, 'aria-label', `${state.lives} oportunidades restantes`)
            if (routePercent !== state.lastRoutePercent) {
                state.lastRoutePercent = routePercent
                elements.location.style.setProperty('--route-progress', `${routePercent}%`)
                setAttributeIfChanged(
                    elements.location,
                    'aria-label',
                    `${elements.location.textContent}, progreso de la ruta ${routePercent} por ciento`
                )
            }
            const activePowerTypes = Object.keys(POWERUPS).filter((powerType) => getPowerTimer(powerType) > 0)
            const activePowerType = getPowerTimer(state.activePowerType) > 0
                ? state.activePowerType
                : activePowerTypes.sort((first, second) => getPowerTimer(second) - getPowerTimer(first))[0] || ''
            state.activePowerType = activePowerType
            const shouldHidePower = !activePowerType
            if (elements.powerStatus.hidden !== shouldHidePower) elements.powerStatus.hidden = shouldHidePower
            if (activePowerType) {
                const power = POWERUPS[activePowerType]
                const remaining = getPowerTimer(activePowerType)
                const extraCount = Math.max(0, activePowerTypes.length - 1)
                const powerLabel = `${power.label}${extraCount ? ` +${extraCount}` : ''}`
                setTextIfChanged(elements.powerIcon, power.icon)
                setTextIfChanged(elements.powerLabel, powerLabel)
                setTextIfChanged(elements.powerTime, `${Math.ceil(remaining)} s`)
                if (elements.powerStatus.dataset.power !== activePowerType) {
                    elements.powerStatus.dataset.power = activePowerType
                }
                const powerProgress = Math.round(clamp(remaining / power.duration, 0, 1) * 100)
                if (powerProgress !== state.lastPowerProgress) {
                    state.lastPowerProgress = powerProgress
                    elements.powerStatus.style.setProperty('--power-progress', `${powerProgress}%`)
                }
                const powerSignature = activePowerTypes
                    .map((powerType) => `${POWERUPS[powerType].label} ${Math.ceil(getPowerTimer(powerType))} segundos`)
                    .join(', ')
                if (powerSignature !== state.lastPowerSignature) {
                    state.lastPowerSignature = powerSignature
                    elements.powerStatus.title = powerSignature
                }
            } else {
                state.lastPowerProgress = -1
                state.lastPowerSignature = ''
                delete elements.powerStatus.dataset.power
                elements.powerStatus.removeAttribute('title')
            }
        }

        function setTextIfChanged(element, value) {
            if (element.textContent !== value) element.textContent = value
        }

        function setAttributeIfChanged(element, name, value) {
            if (element.getAttribute(name) !== value) element.setAttribute(name, value)
        }

        function updateActionCue() {
            if (state.mode !== 'playing') {
                hideActionCue()
                return
            }

            if (state.flightTimer > 0) {
                const flightTarget = state.objects
                    .filter((object) => (
                        object.kind === 'coin' &&
                        object.flightRoute &&
                        object.guide &&
                        !object.handled &&
                        object.distance > 4 &&
                        object.distance < 48
                    ))
                    .sort((first, second) => first.distance - second.distance)[0]

                if (flightTarget) {
                    const direction = Math.sign(flightTarget.lane - state.targetLane)
                    showActionCue(
                        {
                            kind: 'flight',
                            icon: direction < 0 ? '←' : direction > 0 ? '→' : '♡',
                            text: direction < 0
                                ? 'VUELA A LA IZQUIERDA'
                                : direction > 0
                                    ? 'VUELA A LA DERECHA'
                                    : 'SIGUE EL VUELO'
                        },
                        `flight-route-${flightTarget.flightRouteIndex}-${direction}`
                    )
                } else {
                    hideActionCue()
                }
                return
            }

            const signatureFlight = state.objects
                .filter((object) => (
                    object.kind === 'power' &&
                    object.powerType === 'flight' &&
                    object.flightSignature &&
                    !object.handled &&
                    object.distance > 4 &&
                    object.distance < 76
                ))
                .sort((first, second) => first.distance - second.distance)[0]

            const protectedAirRouteCoins = state.objects
                .filter((object) => (
                    object.kind === 'coin' &&
                    object.airRoute &&
                    !object.handled &&
                    object.distance > 4 &&
                    object.distance < 54
                ))
                .sort((first, second) => first.distance - second.distance)
            const protectedAirRouteLead = protectedAirRouteCoins[0]

            if (state.sneakersTimer > 0 && protectedAirRouteLead) {
                const protectedAirJumpTarget = protectedAirRouteCoins.find((object) => (
                    object.requiresAirJump && object.distance < 46
                ))
                if (
                    protectedAirJumpTarget &&
                    state.jumpElapsed >= 0 &&
                    !state.airJumpUsed
                ) {
                    showActionCue(
                        { kind: 'air', icon: '↟', text: 'SALTA OTRA VEZ' },
                        `protected-air-jump-${protectedAirJumpTarget.airRouteIndex}`,
                        0.72
                    )
                    return
                }

                const routeDirection = Math.sign(protectedAirRouteLead.lane - state.targetLane)
                if (routeDirection !== 0 || state.jumpElapsed < 0) {
                    showActionCue(
                        {
                            kind: 'air',
                            icon: routeDirection < 0 ? '←' : routeDirection > 0 ? '→' : '↑',
                            text: routeDirection < 0
                                ? 'IZQUIERDA · SUPER RUTA'
                                : routeDirection > 0
                                    ? 'DERECHA · SUPER RUTA'
                                    : 'SALTA · SUPER RUTA'
                        },
                        `protected-air-route-${protectedAirRouteLead.airRouteIndex}-${routeDirection}`
                    )
                } else {
                    hideActionCue()
                }
                return
            }

            const relevantObstacle = state.objects
                .filter((object) => (
                    object.kind === 'obstacle' &&
                    !object.handled &&
                    object.distance > OBSTACLE_CONTACT_FRONT &&
                    object.distance < getObstacleCueDistance(object) &&
                    Math.min(
                        Math.abs(getObstacleThreatLane(object) - state.lane),
                        Math.abs(getObstacleThreatLane(object) - state.targetLane)
                    ) < 0.39
                ))
                .sort((first, second) => first.distance - second.distance)[0]

            const obstacleNeedsImmediateAttention = relevantObstacle && (
                !signatureFlight ||
                relevantObstacle.distance < 24 ||
                relevantObstacle.distance + 8 < signatureFlight.distance
            )

            if (obstacleNeedsImmediateAttention) {
                const cues = {
                    spill: { kind: 'jump', icon: '↑', text: 'SALTA AHORA' },
                    sheet: { kind: 'slide', icon: '↓', text: 'DESLIZA AHORA' }
                }
                const cue = relevantObstacle.type === 'cart'
                    ? getCartAvoidanceCue(relevantObstacle)
                    : cues[relevantObstacle.type]
                const cueDistance = getObstacleCueDistance(relevantObstacle)
                const urgency = 1 - clamp((relevantObstacle.distance - 4) / Math.max(1, cueDistance - 4), 0, 1)
                showActionCue(
                    cue,
                    `obstacle-${relevantObstacle.type}-${getObstacleThreatLane(relevantObstacle)}-${Math.round((state.distance + relevantObstacle.distance) / 4)}`,
                    urgency
                )
                return
            }

            const priorityMia = state.objects
                .filter((object) => (
                    object.kind === 'mia' &&
                    !object.handled &&
                    object.distance > 4 &&
                    object.distance < 68 &&
                    !isRewardRouteBlocked(object)
                ))
                .sort((first, second) => first.distance - second.distance)[0]

            if (priorityMia) {
                const miaDirection = Math.sign(priorityMia.lane - state.targetLane)
                showActionCue(
                    {
                        kind: 'mia',
                        icon: miaDirection < 0 ? '←' : miaDirection > 0 ? '→' : '🐾',
                        text: miaDirection < 0
                            ? 'IZQUIERDA · MÍA SALCHICHA'
                            : miaDirection > 0
                                ? 'DERECHA · MÍA SALCHICHA'
                                : '¡COGE A MÍA SALCHICHA!'
                    },
                    `mia-special-${priorityMia.miaIndex}-${miaDirection}`
                )
                return
            }

            const priorityCrate = state.objects
                .filter((object) => (
                    object.kind === 'crate' &&
                    !object.handled &&
                    object.distance > 4 &&
                    object.distance < 60 &&
                    !isRewardRouteBlocked(object)
                ))
                .sort((first, second) => first.distance - second.distance)[0]

            if (priorityCrate) {
                const crateDirection = Math.sign(priorityCrate.lane - state.targetLane)
                showActionCue(
                    {
                        kind: 'crate',
                        icon: crateDirection < 0 ? '←' : crateDirection > 0 ? '→' : '▣',
                        text: crateDirection < 0
                            ? 'IZQUIERDA · CAJA'
                            : crateDirection > 0
                                ? 'DERECHA · CAJA'
                                : 'ABRE LA CAJA'
                    },
                    `crate-${priorityCrate.crateIndex}-${crateDirection}`
                )
                return
            }

            const priorityLetter = state.objects
                .filter((object) => (
                    object.kind === 'letter' &&
                    !object.handled &&
                    object.distance > 4 &&
                    object.distance < 64 &&
                    !isRewardRouteBlocked(object)
                ))
                .sort((first, second) => first.distance - second.distance)[0]

            if (priorityLetter) {
                const letterDirection = Math.sign(priorityLetter.lane - state.targetLane)
                showActionCue(
                    {
                        kind: 'letter',
                        icon: letterDirection < 0 ? '←' : letterDirection > 0 ? '→' : priorityLetter.letter,
                        text: letterDirection < 0
                            ? `IZQUIERDA · LETRA ${priorityLetter.letter}`
                            : letterDirection > 0
                                ? `DERECHA · LETRA ${priorityLetter.letter}`
                                : `COGE LA LETRA ${priorityLetter.letter}`
                    },
                    `letter-${priorityLetter.letterIndex}-${letterDirection}`
                )
                return
            }

            if (signatureFlight) {
                const flightDirection = Math.sign(signatureFlight.lane - state.targetLane)
                showActionCue(
                    {
                        kind: 'flight',
                        icon: flightDirection < 0 ? '←' : flightDirection > 0 ? '→' : '♡',
                        text: flightDirection < 0
                            ? 'IZQUIERDA · VUELO'
                            : flightDirection > 0
                                ? 'DERECHA · VUELO'
                                : 'COGE EL VUELO'
                    },
                    `signature-flight-${flightDirection}`
                )
                return
            }

            const signatureSneakers = state.objects
                .filter((object) => (
                    object.kind === 'power' &&
                    object.powerType === 'sneakers' &&
                    object.signature &&
                    !object.handled &&
                    object.distance > 4 &&
                    object.distance < 68
                ))
                .sort((first, second) => first.distance - second.distance)[0]

            if (signatureSneakers) {
                const sneakerDirection = Math.sign(signatureSneakers.lane - state.targetLane)
                showActionCue(
                    {
                        kind: 'air',
                        icon: sneakerDirection < 0 ? '←' : sneakerDirection > 0 ? '→' : '↟',
                        text: sneakerDirection < 0
                            ? 'IZQUIERDA · SUPER SALTO'
                            : sneakerDirection > 0
                                ? 'DERECHA · SUPER SALTO'
                                : 'COGE SUPER SALTO'
                    },
                    `signature-sneakers-${signatureSneakers.scene}-${sneakerDirection}`
                )
                return
            }

            const airRouteCoins = state.objects
                .filter((object) => (
                    object.kind === 'coin' &&
                    object.airRoute &&
                    !object.handled &&
                    object.distance > 4 &&
                    object.distance < 52
                ))
                .sort((first, second) => first.distance - second.distance)
            const airJumpTarget = airRouteCoins.find((object) => object.requiresAirJump && object.distance < 46)

            if (
                airJumpTarget &&
                state.sneakersTimer > 0 &&
                state.jumpElapsed >= 0 &&
                !state.airJumpUsed
            ) {
                showActionCue(
                    { kind: 'air', icon: '↟', text: 'SALTA OTRA VEZ' },
                    `air-jump-${airJumpTarget.airRouteIndex}`,
                    0.72
                )
                return
            }

            const airRouteLead = airRouteCoins[0]
            if (airRouteLead && airRouteLead.distance < 36) {
                const routeDirection = Math.sign(airRouteLead.lane - state.targetLane)
                if (routeDirection !== 0 || state.jumpElapsed < 0) {
                    showActionCue(
                        {
                            kind: 'air',
                            icon: routeDirection < 0 ? '←' : routeDirection > 0 ? '→' : '↑',
                            text: routeDirection < 0
                                ? 'IZQUIERDA · SUPER RUTA'
                                : routeDirection > 0
                                    ? 'DERECHA · SUPER RUTA'
                                    : 'SALTA · SUPER RUTA'
                        },
                        `air-route-${airRouteLead.airRouteIndex}-${routeDirection}`
                    )
                    return
                }
            }

            const priorityBoost = state.objects
                .filter((object) => (
                    object.kind === 'boost' &&
                    !object.handled &&
                    object.distance > 4 &&
                    object.distance < 74
                ))
                .sort((first, second) => first.distance - second.distance)[0]

            if (priorityBoost) {
                const boostDirection = Math.sign(priorityBoost.lane - state.targetLane)
                const boostText = boostDirection < 0
                    ? 'IZQUIERDA · IMPULSO'
                    : boostDirection > 0
                        ? 'DERECHA · IMPULSO'
                        : 'PISA EL IMPULSO'
                showActionCue(
                    {
                        kind: 'reward',
                        icon: boostDirection < 0 ? '←' : boostDirection > 0 ? '→' : '↟',
                        text: boostText
                    },
                    `boost-route-${priorityBoost.lane}-${Math.round((state.distance + priorityBoost.distance) / 4)}`
                )
                return
            }

            const priorityMemory = state.objects
                .filter((object) => (
                    object.kind === 'memory' &&
                    !object.handled &&
                    object.distance > 4 &&
                    object.distance < 58
                ))
                .sort((first, second) => first.distance - second.distance)[0]

            if (priorityMemory) {
                const memoryDirection = Math.sign(priorityMemory.lane - state.targetLane)
                showActionCue(
                    {
                        kind: 'memory',
                        icon: memoryDirection < 0 ? '←' : memoryDirection > 0 ? '→' : '▣',
                        text: memoryDirection < 0
                            ? 'IZQUIERDA · RECUERDO'
                            : memoryDirection > 0
                                ? 'DERECHA · RECUERDO'
                                : 'COGE EL RECUERDO'
                    },
                    `memory-${priorityMemory.memoryIndex}`
                )
                return
            }

            const relevantReward = state.objects
                .filter((object) => (
                    (object.kind === 'coin' || object.kind === 'power' || object.kind === 'boost' || object.kind === 'memory' || object.kind === 'letter' || object.kind === 'crate' || object.kind === 'mia') &&
                    !object.handled &&
                    object.distance > 4 &&
                    object.distance < 54 &&
                    !isRewardRouteBlocked(object) &&
                    (
                        object.kind === 'power' ||
                        object.kind === 'boost' ||
                        object.kind === 'memory' ||
                        object.kind === 'letter' ||
                        object.kind === 'crate' ||
                        object.kind === 'mia' ||
                        object.guide ||
                        Math.abs(object.lane - state.targetLane) < 0.42
                    )
                ))
                .sort((first, second) => {
                    const firstPriority = first.kind === 'mia' ? 58 : first.kind === 'letter' ? 52 : first.kind === 'crate' ? 48 : first.kind === 'memory' ? 44 : first.kind === 'boost' ? 32 : first.kind === 'power' ? 12 : 0
                    const secondPriority = second.kind === 'mia' ? 58 : second.kind === 'letter' ? 52 : second.kind === 'crate' ? 48 : second.kind === 'memory' ? 44 : second.kind === 'boost' ? 32 : second.kind === 'power' ? 12 : 0
                    return (first.distance - firstPriority) - (second.distance - secondPriority)
                })[0]

            if (relevantReward) {
                const guidedReward = relevantReward.kind === 'power' || relevantReward.kind === 'boost' || relevantReward.kind === 'memory' || relevantReward.kind === 'letter' || relevantReward.kind === 'crate' || relevantReward.kind === 'mia' || relevantReward.guide
                const rewardDirection = guidedReward
                    ? Math.sign(relevantReward.lane - state.targetLane)
                    : 0
                const rewardLabel = relevantReward.kind === 'boost'
                    ? 'IMPULSO'
                    : relevantReward.kind === 'memory'
                        ? 'RECUERDO'
                    : relevantReward.kind === 'letter'
                        ? `LETRA ${relevantReward.letter}`
                    : relevantReward.kind === 'crate'
                        ? 'CAJA'
                    : relevantReward.kind === 'mia'
                        ? 'MÍA SALCHICHA'
                    : relevantReward.kind === 'coin'
                        ? 'CORAZONES'
                        : (POWERUPS[relevantReward.powerType || 'shield']?.label || 'POTENCIADOR').toUpperCase()
                const rewardText = guidedReward
                    ? rewardDirection < 0
                        ? `IZQUIERDA · ${rewardLabel}`
                        : rewardDirection > 0
                            ? `DERECHA · ${rewardLabel}`
                            : relevantReward.kind === 'boost'
                                ? 'PISA EL IMPULSO'
                                : relevantReward.kind === 'coin'
                                    ? (isCompactRunner() ? 'SIGUE LOS CORAZONES' : 'RECOGE LOS CORAZONES')
                                    : relevantReward.kind === 'memory'
                                        ? 'COGE EL RECUERDO'
                                    : relevantReward.kind === 'letter'
                                        ? `COGE LA LETRA ${relevantReward.letter}`
                                    : relevantReward.kind === 'crate'
                                        ? 'ABRE LA CAJA'
                                    : relevantReward.kind === 'mia'
                                        ? '¡COGE A MÍA SALCHICHA!'
                                    : `${isCompactRunner() ? 'COGE' : 'RECOGE'} ${rewardLabel}`
                    : (isCompactRunner() ? 'SIGUE LOS CORAZONES' : 'RECOGE LOS CORAZONES')
                showActionCue(
                    {
                        kind: 'reward',
                        icon: rewardDirection < 0 ? '←' : rewardDirection > 0 ? '→' : relevantReward.kind === 'boost' ? '↟' : relevantReward.kind === 'memory' || relevantReward.kind === 'crate' ? '▣' : relevantReward.kind === 'letter' ? relevantReward.letter : relevantReward.kind === 'mia' ? '🐾' : '✓',
                        text: rewardText
                    },
                    `reward-${relevantReward.kind}-${relevantReward.lane}-${Math.round((state.distance + relevantReward.distance) / 4)}`
                )
                return
            }

            hideActionCue()
        }

        function isRewardRouteBlocked(reward) {
            if (reward.kind === 'memory' || reward.kind === 'boost' || reward.kind === 'crate' || reward.kind === 'mia') return false
            const cartLookahead = Math.max(62, reward.distance + 32)
            return state.objects.some((object) => (
                object.kind === 'obstacle' &&
                object.type === 'cart' &&
                !object.handled &&
                getObstacleThreatLane(object) === reward.lane &&
                object.distance > OBSTACLE_CONTACT_FRONT &&
                object.distance < cartLookahead
            ))
        }

        function getCartAvoidanceCue(obstacle) {
            const blockedLanes = new Set(
                state.objects
                    .filter((object) => (
                        object.kind === 'obstacle' &&
                        !object.handled &&
                        Math.abs(object.distance - obstacle.distance) < 20
                    ))
                    .map((object) => getObstacleThreatLane(object))
            )
            const safeLanes = LANES.filter((lane) => !blockedLanes.has(lane))
            const routedReward = state.objects
                .filter((object) => (
                    (object.kind === 'coin' || object.kind === 'power' || object.kind === 'boost' || object.kind === 'memory' || object.kind === 'letter' || object.kind === 'crate' || object.kind === 'mia') &&
                    !object.handled &&
                    object.guide &&
                    safeLanes.includes(object.lane) &&
                    object.distance > obstacle.distance - 40 &&
                    object.distance < obstacle.distance + 20
                ))
                .sort((first, second) => Math.abs(first.distance - obstacle.distance) - Math.abs(second.distance - obstacle.distance))[0]
            const preferredLane = routedReward?.lane ?? safeLanes
                .slice()
                .sort((first, second) => {
                    const firstDistance = Math.abs(first - state.targetLane)
                    const secondDistance = Math.abs(second - state.targetLane)
                    if (firstDistance !== secondDistance) return firstDistance - secondDistance
                    return second - first
                })[0]
            const direction = Number.isFinite(preferredLane)
                ? Math.sign(preferredLane - state.targetLane || preferredLane - state.lane)
                : 0
            return {
                kind: obstacle.moving ? 'moving' : 'avoid',
                icon: direction < 0 ? '←' : direction > 0 ? '→' : '↔',
                text: obstacle.moving
                    ? direction < 0
                        ? 'CRUCE · IZQUIERDA'
                        : direction > 0
                            ? 'CRUCE · DERECHA'
                            : 'CRUCE · CAMBIA'
                    : direction < 0
                        ? 'IZQUIERDA AHORA'
                        : direction > 0
                            ? 'DERECHA AHORA'
                            : 'CAMBIA DE CARRIL'
            }
        }

        function getObstacleCueDistance(obstacle) {
            const type = typeof obstacle === 'string' ? obstacle : obstacle?.type
            if (obstacle?.moving) return 94
            if (type === 'cart') return 78
            if (type === 'spill') return clamp(state.speed * 0.72, 16, 23)
            if (type === 'sheet') return clamp(state.speed * 0.68, 15, 22)
            return 20
        }

        function showActionCue(cue, key, urgency = 0) {
            if (!cue) return
            const isNewCue = state.actionCueKey !== key
            const contentChanged = (
                elements.actionCueIcon.textContent !== cue.icon ||
                elements.actionCueText.textContent !== cue.text ||
                elements.actionCue.dataset.kind !== cue.kind
            )
            if (contentChanged) {
                elements.actionCueIcon.textContent = cue.icon
                elements.actionCueText.textContent = cue.text
                elements.actionCue.dataset.kind = cue.kind
            }
            state.actionCueKey = key
            const urgencyAmount = clamp(urgency, 0, 1)
            const quantizedUrgency = Math.round(urgencyAmount * 20) / 20
            if (quantizedUrgency !== state.actionCueUrgency) {
                state.actionCueUrgency = quantizedUrgency
                elements.actionCue.style.setProperty('--cue-brightness', (1 + quantizedUrgency * 0.13).toFixed(3))
                elements.actionCue.style.setProperty('--cue-icon-scale', (1 + quantizedUrgency * 0.09).toFixed(3))
            }
            if (elements.actionCue.hidden) elements.actionCue.hidden = false
            if (isNewCue && cue.kind !== 'reward' && cue.kind !== 'letter' && cue.kind !== 'crate' && cue.kind !== 'mia') playSound('warning')
        }

        function hideActionCue() {
            if (!elements.actionCue.hidden) elements.actionCue.hidden = true
            if (state.actionCueUrgency !== -1) {
                elements.actionCue.style.setProperty('--cue-brightness', '1')
                elements.actionCue.style.setProperty('--cue-icon-scale', '1')
            }
            state.actionCueKey = ''
            state.actionCueUrgency = -1
        }

        function getSceneAtDistance(distance) {
            const safeDistance = clamp(distance, 0, ROUTE_DISTANCE - 0.001)
            const sceneIndex = Math.floor(safeDistance / SCENE_LENGTH)
            return SCENES[sceneIndex]
        }

        function getSceneMix() {
            const safeDistance = clamp(state.distance, 0, ROUTE_DISTANCE - 0.001)
            const sceneIndex = Math.floor(safeDistance / SCENE_LENGTH)
            const progress = safeDistance - sceneIndex * SCENE_LENGTH
            const isFinalScene = sceneIndex === SCENES.length - 1
            const blend = isFinalScene
                ? 0
                : clamp((progress - (SCENE_LENGTH - SCENE_FADE)) / SCENE_FADE, 0, 1)
            return {
                current: SCENES[sceneIndex],
                next: isFinalScene ? SCENES[sceneIndex] : SCENES[sceneIndex + 1],
                blend: blend * blend * (3 - 2 * blend),
                progress: progress / SCENE_LENGTH
            }
        }

        function updateLocation(force = false) {
            const safeDistance = clamp(state.distance, 0, ROUTE_DISTANCE - 0.001)
            const sceneIndex = Math.floor(safeDistance / SCENE_LENGTH)
            if (!force && sceneIndex === state.sceneIndex) return

            const previousSceneIndex = state.sceneIndex
            if (!force && previousSceneIndex >= 0 && sceneIndex > previousSceneIndex) {
                completeLevel(previousSceneIndex)
            }
            state.sceneIndex = sceneIndex
            const scene = SCENES[sceneIndex]
            const gameplay = SCENE_GAMEPLAY[scene.key]
            elements.location.textContent = `Nivel ${gameplay.level}/${SCENES.length} · ${scene.label}`
            const routePercent = Math.round(clamp(state.distance / ROUTE_DISTANCE, 0, 1) * 100)
            setAttributeIfChanged(
                elements.location,
                'aria-label',
                `${scene.label}, progreso de la ruta ${routePercent} por ciento`
            )
            elements.location.classList.remove('is-changing')
            void elements.location.offsetWidth
            elements.location.classList.add('is-changing')
            if (state.locationCueTimer) window.clearTimeout(state.locationCueTimer)
            state.locationCueTimer = window.setTimeout(() => {
                elements.location.classList.remove('is-changing')
            }, 760)
            if (!force && state.distance > 3) {
                state.sceneDamageTaken = false
                resetLevelMission(sceneIndex)
                showLevelToast(scene)
                playSound('scene')
                announce(`Nivel ${gameplay.level} de ${SCENES.length}. ${scene.label}. ${gameplay.mission}. Objetivo: ${gameplay.objective.label}.`)
            }
        }

        function completeLevel(sceneIndex, finalLevel = false) {
            if (sceneIndex < 0 || state.levelResults[sceneIndex]) return null
            const scene = SCENES[sceneIndex]
            const gameplay = SCENE_GAMEPLAY[scene.key]
            const flawless = !state.sceneDamageTaken
            const bonus = 180 + gameplay.level * 90 + (flawless ? 220 : 0)
            state.levelResults[sceneIndex] = { flawless, bonus, mission: state.missionCompleted }
            state.bonusScore += bonus
            if (!finalLevel) {
                setFeedback(`${flawless ? '¡Nivel perfecto!' : 'Nivel superado'} · +${bonus}`, 1)
                spawnParticles(state.width / 2, state.height * 0.38, flawless ? '#ffe39a' : '#7de5d2', 'spark', flawless ? 24 : 14)
            }
            return state.levelResults[sceneIndex]
        }

        function getMissionProgress() {
            const scene = SCENES[Math.max(0, state.sceneIndex)]
            const objective = SCENE_GAMEPLAY[scene.key].objective
            if (objective.type === 'hearts') return state.sceneCoins
            if (objective.type === 'combo') return state.sceneMaxCombo
            if (objective.type === 'perfects') return state.scenePerfectClears
            return 0
        }

        function resetLevelMission(sceneIndex) {
            const scene = SCENES[clamp(sceneIndex, 0, SCENES.length - 1)]
            const objective = SCENE_GAMEPLAY[scene.key].objective
            state.sceneCoins = 0
            state.sceneMaxCombo = 0
            state.scenePerfectClears = 0
            state.missionCompleted = false
            state.lastMissionProgress = -1
            elements.missionStatus.hidden = false
            elements.missionStatus.dataset.state = 'active'
            setTextIfChanged(elements.missionLabel, objective.label)
            setTextIfChanged(elements.missionTarget, String(objective.target))
            updateMissionHud()
        }

        function updateMissionHud(pulse = false) {
            const scene = SCENES[Math.max(0, state.sceneIndex)]
            const objective = SCENE_GAMEPLAY[scene.key].objective
            const progress = Math.min(getMissionProgress(), objective.target)
            if (progress !== state.lastMissionProgress) {
                state.lastMissionProgress = progress
                setTextIfChanged(elements.missionValue, String(progress))
                elements.missionStatus.style.setProperty('--mission-progress', `${Math.round(progress / objective.target * 100)}%`)
            }
            elements.missionStatus.dataset.state = state.missionCompleted ? 'complete' : 'active'
            if (!pulse) return
            elements.missionStatus.classList.remove('is-pulsing')
            void elements.missionStatus.offsetWidth
            elements.missionStatus.classList.add('is-pulsing')
        }

        function checkLevelMission() {
            if (state.missionCompleted || state.sceneIndex < 0) {
                updateMissionHud()
                return
            }
            const scene = SCENES[state.sceneIndex]
            const gameplay = SCENE_GAMEPLAY[scene.key]
            const progress = getMissionProgress()
            updateMissionHud()
            if (progress < gameplay.objective.target) return

            state.missionCompleted = true
            const bonus = 260 + gameplay.level * 110
            state.bonusScore += bonus
            updateMissionHud(true)
            setFeedback(`¡Objetivo del nivel cumplido! · +${bonus}`, 2)
            announce(`Objetivo completado: ${gameplay.objective.label}.`)
            spawnParticles(state.width * 0.78, state.height * 0.78, '#ffe083', 'spark', 22)
            playSound('mission')
            pulseHaptics([12, 28, 12, 36])
        }

        function showLevelToast(scene, isFirstLevel = false) {
            const gameplay = SCENE_GAMEPLAY[scene.key]
            setTextIfChanged(elements.levelToastNumber, `Nivel ${gameplay.level} de ${SCENES.length}`)
            setTextIfChanged(elements.levelToastTitle, gameplay.title)
            setTextIfChanged(elements.levelToastMission, `Objetivo · ${gameplay.objective.label}`)
            elements.levelToast.dataset.scene = scene.key
            elements.levelToast.hidden = false
            elements.levelToast.classList.remove('is-visible')
            void elements.levelToast.offsetWidth
            elements.levelToast.classList.add('is-visible')
            state.levelToastTimer = isFirstLevel ? 2.5 : 1.25
        }

        function updateLevelToast(delta) {
            if (state.levelToastTimer <= 0) return
            state.levelToastTimer = Math.max(0, state.levelToastTimer - delta)
            if (state.levelToastTimer > 0) return
            elements.levelToast.classList.remove('is-visible')
            elements.levelToast.hidden = true
        }

        function announce(message) {
            elements.announcer.textContent = ''
            window.requestAnimationFrame(() => { elements.announcer.textContent = message })
        }

        function getJumpHeight() {
            return state.jumpElapsed < 0 ? 0 : Math.max(0, state.jumpHeight)
        }

        function getSlideBlend() {
            return getSlidePose().amount
        }

        function getRollProgress() {
            if (state.slideElapsed < 0 || state.slideDuration <= 0) return 0
            return clamp(state.slideElapsed / state.slideDuration, 0, 1)
        }

        function getSlidePose() {
            if (state.slideTimer <= 0 || state.slideElapsed < 0 || state.slideDuration <= 0) {
                return { amount: 0, progress: 0, entry: 0, glide: 0, recovery: 0, motion: 0 }
            }

            const progress = getRollProgress()
            const entering = smootherstep(state.slideElapsed / SLIDE_ENTER_DURATION)
            const leaving = smootherstep(state.slideTimer / SLIDE_EXIT_DURATION)
            const amount = Math.min(entering, leaving)
            const entry = amount * (1 - smootherstep(state.slideElapsed / 0.34))
            const recovery = amount * (1 - smootherstep(state.slideTimer / 0.36))
            const glide = amount * smootherstep((state.slideElapsed - 0.14) / 0.2) * smootherstep((state.slideTimer - 0.14) / 0.2)
            const motion = state.reducedMotion ? 0 : Math.sin(progress * Math.PI * 2.1) * glide

            return { amount, progress, entry, glide, recovery, motion }
        }

        function getJumpPose() {
            const landingAmount = state.landingTimer > 0
                ? Math.sin(clamp(1 - state.landingTimer / 0.22, 0, 1) * Math.PI)
                : 0
            if (state.flightBlend > 0.02) {
                const amount = smootherstep(state.flightBlend)
                const rising = state.flightTimer > 0 && state.flightElapsed < 0.95
                return {
                    amount,
                    airborne: true,
                    phase: 0.5,
                    takeoff: rising ? amount * (1 - clamp(state.flightElapsed / 0.62, 0, 1)) : 0,
                    ascent: rising ? amount * 0.42 : 0,
                    apex: amount,
                    fall: state.flightTimer <= 0 ? amount * (1 - state.flightBlend) : 0,
                    landing: 0
                }
            }
            if (state.jumpElapsed < 0) {
                return {
                    amount: landingAmount,
                    airborne: false,
                    phase: landingAmount > 0 ? 0.94 + (1 - landingAmount) * 0.06 : 1,
                    takeoff: 0,
                    ascent: 0,
                    apex: 0,
                    fall: 0,
                    landing: landingAmount
                }
            }

            const height = Math.max(1, state.height)
            const velocityRatio = state.jumpVelocity / height
            const heightRatio = getJumpHeight() / height
            const launchProgress = 1 - clamp(velocityRatio / JUMP_LAUNCH_SPEED_RATIO, 0, 1)
            const fallProgress = clamp(-velocityRatio / JUMP_FAST_FALL_SPEED_RATIO, 0, 1)
            const phase = velocityRatio >= 0
                ? mix(0.05, 0.5, smootherstep(launchProgress))
                : mix(0.5, 0.93, smootherstep(fallProgress))
            const takeoff = smootherstep(1 - state.jumpElapsed / 0.2) * smootherstep(state.jumpElapsed / 0.075)
            const amount = Math.max(takeoff * 0.88, smootherstep(heightRatio / 0.055))
            return {
                amount,
                airborne: true,
                phase,
                takeoff,
                ascent: amount * smootherstep(clamp(velocityRatio / 0.72, 0, 1)),
                apex: amount * (1 - smootherstep(clamp(Math.abs(velocityRatio) / 0.34, 0, 1))),
                fall: amount * smootherstep(clamp(-velocityRatio / 0.78, 0, 1)),
                landing: amount * smootherstep(clamp((0.105 - heightRatio) / 0.075, 0, 1)) * smootherstep(fallProgress)
            }
        }

        function getSpecialMotionPose() {
            const celebration = state.mode === 'celebrating'
                ? smootherstep(1 - clamp(state.finishTimer / 1.15, 0, 1))
                : 0
            const crash = state.mode === 'crashing'
                ? smootherstep(1 - clamp(state.crashTimer / 0.95, 0, 1))
                : 0
            return { celebration, crash }
        }

        function resizeCanvas() {
            const bounds = elements.canvas.getBoundingClientRect()
            if (bounds.width < 2 || bounds.height < 2) return
            const compact = bounds.width <= 680 && bounds.height > bounds.width * 1.05
            const renderScaleFloor = compact ? 1.75 : 1.4
            const renderScaleCap = compact ? 2.15 : 2.25
            const backgroundScaleCap = compact ? 1.25 : 1.5
            const previousBackgroundDpr = state.backgroundDpr
            state.renderScale = clamp(state.renderScale, renderScaleFloor, renderScaleCap)
            state.backgroundRenderScale = clamp(state.backgroundRenderScale, 1, backgroundScaleCap)
            state.dpr = Math.min(window.devicePixelRatio || 1, state.renderScale)
            state.backgroundDpr = Math.min(
                window.devicePixelRatio || 1,
                state.backgroundRenderScale,
                state.dpr
            )
            state.width = bounds.width
            state.height = bounds.height
            const pixelWidth = Math.round(bounds.width * state.dpr)
            const pixelHeight = Math.round(bounds.height * state.dpr)
            let resized = Math.abs(previousBackgroundDpr - state.backgroundDpr) > 0.001
            if (elements.canvas.width !== pixelWidth || elements.canvas.height !== pixelHeight) {
                elements.canvas.width = pixelWidth
                elements.canvas.height = pixelHeight
                resized = true
            }
            context.imageSmoothingEnabled = true
            context.imageSmoothingQuality = 'high'
            if (resized) {
                backgroundVariantCache.clear()
                sceneOverlayCache.clear()
            }
        }

        function isCompactRunner() {
            const compactPortrait = state.width <= 680 && state.height > state.width * 1.05
            const compactLandscape = window.innerWidth <= 820 && window.innerHeight <= 650
            return compactPortrait || compactLandscape
        }

        function getRoadHorizonY() {
            return state.height * (isCompactRunner() ? 0.29 : ROAD_HORIZON_RATIO)
        }

        function getRoadGroundY() {
            return state.height * (isCompactRunner() ? 0.94 : 0.89)
        }

        function getLaneSpread(depth) {
            const farSpread = isCompactRunner() ? 0.012 : 0.018
            const nearSpread = isCompactRunner() ? 0.258 : 0.242
            return state.width * (farSpread + nearSpread * depth)
        }

        function drawFrame(time) {
            const width = state.width
            const height = state.height
            if (width < 2 || height < 2) return

            const moving = state.mode === 'playing' || state.mode === 'countdown'
            const grounded = state.jumpElapsed < 0 && state.slideTimer <= 0 && !isFlightActive()
            const effort = clamp((state.speed - INITIAL_SPEED) / Math.max(1, MAX_SPEED - INITIAL_SPEED), 0, 1)
            const bob = moving && grounded && !state.reducedMotion
                ? Math.cos(state.runPhase * 2) * mix(0.55, 1.05, effort)
                : 0
            const cameraTrauma = state.reducedMotion ? 0 : state.cameraShake * state.cameraShake
            const shakeStrength = cameraTrauma * 16
            const shakeX = (Math.sin(time * 47.3) + Math.sin(time * 71.9) * 0.45) * shakeStrength * 0.48
            const shakeY = (Math.sin(time * 53.7 + 1.7) + Math.sin(time * 83.1) * 0.35) * shakeStrength * 0.42
            const laneFollow = state.reducedMotion ? 0 : clamp(-state.laneVelocity * 0.72, -3.2, 3.2)
            const jumpCameraFollow = state.reducedMotion ? 0 : getJumpHeight() * 0.055
            const flightCameraFollow = state.reducedMotion ? 0 : getFlightHeight() * 0.095
            const slideCameraFollow = state.reducedMotion ? 0 : getSlideBlend() * height * 0.006
            const cameraY = bob + shakeY + jumpCameraFollow + flightCameraFollow + slideCameraFollow
            const cameraRoll = state.reducedMotion
                ? 0
                : clamp(-state.laneVelocity * 0.0009, -0.004, 0.004) + Math.sin(time * 61.7) * cameraTrauma * 0.004

            context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0)
            context.imageSmoothingEnabled = true
            context.imageSmoothingQuality = 'medium'
            context.clearRect(0, 0, width, height)

            const backgroundOverscan = 1.008 + effort * 0.004 + cameraTrauma * 0.012
            context.save()
            context.translate(width / 2, height / 2)
            context.rotate(cameraRoll)
            context.scale(backgroundOverscan, backgroundOverscan)
            context.translate(-width / 2 + laneFollow + shakeX, -height / 2 + cameraY)
            drawWorld(time)
            context.restore()

            context.imageSmoothingQuality = 'high'
            context.save()
            context.translate(width / 2, height / 2)
            context.rotate(cameraRoll)
            context.translate(-width / 2 + laneFollow + shakeX, -height / 2 + cameraY)

            const worldObjects = [...state.objects]
            const finishDistance = ROUTE_DISTANCE - state.distance
            if (finishDistance <= VIEW_DISTANCE + 8 && finishDistance > -7) {
                worldObjects.push({
                    kind: 'finish',
                    lane: 0,
                    distance: finishDistance,
                    scene: FINAL_SCENE_KEY,
                    handled: false
                })
            }

            const sortedWorldObjects = worldObjects
                .sort((first, second) => second.distance - first.distance)
            const foregroundObjects = []

            sortedWorldObjects.forEach((object) => {
                if (shouldDrawObjectInForeground(object)) foregroundObjects.push(object)
                else drawWorldObject(object, time)
            })

            drawSofiaHero(time)
            foregroundObjects.forEach((object) => drawWorldObject(object, time))
            drawParticles()
            drawCinematicAtmosphere(time)
            context.restore()
        }

        function shouldDrawObjectInForeground(object) {
            const passingUnderOverhead = (
                object.kind === 'obstacle' &&
                object.type === 'sheet' &&
                !object.collided &&
                object.distance < 2.4 &&
                object.distance > -5 &&
                Math.abs(object.lane - state.lane) < 0.5 &&
                (getSlideBlend() > 0.76 || object.clearedBy === 'sheet')
            )
            if (passingUnderOverhead) return true

            const hasPassedPlayer = (
                object.kind === 'obstacle' &&
                object.distance < -0.12 &&
                object.distance > -5
            )
            const crossingFinish = object.kind === 'finish' && object.distance < 2.2
            return hasPassedPlayer || crossingFinish
        }

        function drawWorld(time) {
            const sceneMix = getSceneMix()
            drawScene(sceneMix.current, time, 1, sceneMix.progress)
            if (sceneMix.blend > 0.001) drawScene(sceneMix.next, time, sceneMix.blend, 0)
        }

        function drawScene(scene, time, opacity, progress) {
            context.save()
            context.globalAlpha *= opacity
            if (!drawPhotographicScene(scene, progress)) {
                if (scene.key === 'lodares') drawLodaresScene(time)
                else if (scene.key === 'aguamarina') drawAguamarinaScene(time)
                else drawAguamarinaScene(time)
            }
            context.restore()
        }

        function drawPhotographicScene(scene, progress) {
            const variants = BACKGROUND_VARIANTS[scene.key] || []
            const fallbackVariant = variants.find((variant) => isImageReady(backgroundImages[variant.key]))
            if (!fallbackVariant) return false

            const timeline = getBackgroundVariantTimeline(variants, progress)
            const variantIndex = timeline.index
            const localProgress = timeline.localProgress
            const requestedCurrent = variants[variantIndex]
            const requestedNext = variants[variantIndex + 1]
            const currentVariant = isImageReady(backgroundImages[requestedCurrent?.key])
                ? requestedCurrent
                : fallbackVariant
            const nextVariant = requestedNext && isImageReady(backgroundImages[requestedNext.key])
                ? requestedNext
                : null
            const variantBlend = nextVariant
                ? smoothstep((localProgress - 0.84) / 0.16)
                : 0

            drawBackgroundVariant(currentVariant, 1)
            if (variantBlend > 0.001) drawBackgroundVariant(nextVariant, variantBlend)

            const routeStrength = nextVariant
                ? mix(currentVariant.routeStrength, nextVariant.routeStrength, variantBlend)
                : currentVariant.routeStrength
            drawPhotoRunnerRoute(scene.key, routeStrength)
            drawCachedPhotoOverlay(scene.key)
            return true
        }

        function getBackgroundVariantTimeline(variants, progress) {
            const weights = variants.map((variant) => Math.max(0.1, variant.weight || 1))
            const totalWeight = weights.reduce((total, weight) => total + weight, 0)
            const timelinePosition = clamp(progress, 0, 0.9999) * totalWeight
            let elapsedWeight = 0

            for (let index = 0; index < variants.length; index += 1) {
                const nextWeight = elapsedWeight + weights[index]
                if (timelinePosition < nextWeight || index === variants.length - 1) {
                    return {
                        index,
                        localProgress: clamp((timelinePosition - elapsedWeight) / weights[index], 0, 1)
                    }
                }
                elapsedWeight = nextWeight
            }

            return { index: 0, localProgress: 0 }
        }

        function drawBackgroundVariant(variant, opacity) {
            const image = backgroundImages[variant.key]
            if (!isImageReady(image) || opacity <= 0) return

            const width = state.width
            const laneDrift = state.reducedMotion
                ? 0
                : -state.lane * width * (isCompactRunner() ? 0.016 : 0.009)
            const cachedVariant = getCachedBackgroundVariant(variant)
            if (!cachedVariant) return

            context.save()
            context.globalAlpha *= opacity
            context.drawImage(
                cachedVariant.canvas,
                -cachedVariant.marginX + laneDrift,
                -cachedVariant.marginY,
                cachedVariant.width,
                cachedVariant.height
            )
            context.restore()
        }

        function getCachedBackgroundVariant(variant) {
            const image = backgroundImages[variant.key]
            if (!isImageReady(image)) return null
            const pixelWidth = Math.round(state.width * state.backgroundDpr)
            const pixelHeight = Math.round(state.height * state.backgroundDpr)
            const key = `${variant.key}:${pixelWidth}x${pixelHeight}`
            const cached = backgroundVariantCache.get(key)
            if (cached) return cached

            const width = state.width
            const height = state.height
            const marginX = Math.ceil(width * 0.04) + 4
            const marginY = Math.ceil(height * 0.025) + 4
            const bufferWidth = width + marginX * 2
            const bufferHeight = height + marginY * 2
            const imageHorizon = clamp(variant.horizon || 0.47, 0.08, 0.92)
            const desiredHorizon = getRoadHorizonY() + marginY
            const horizonScale = Math.max(
                bufferWidth / image.naturalWidth,
                desiredHorizon / (image.naturalHeight * imageHorizon),
                (bufferHeight - desiredHorizon) / (image.naturalHeight * (1 - imageHorizon))
            )
            const fixedZoom = 1.045
            const drawWidth = image.naturalWidth * horizonScale * fixedZoom
            const drawHeight = image.naturalHeight * horizonScale * fixedZoom
            const focusX = clamp(variant.focusX || 0.5, 0, 1)
            const drawX = clamp(bufferWidth * 0.5 - drawWidth * focusX, bufferWidth - drawWidth, 0)
            const drawY = desiredHorizon - drawHeight * imageHorizon
            const buffer = document.createElement('canvas')
            buffer.width = Math.round(bufferWidth * state.backgroundDpr)
            buffer.height = Math.round(bufferHeight * state.backgroundDpr)
            const bufferContext = buffer.getContext('2d', { alpha: false })
            if (!bufferContext) return null
            bufferContext.setTransform(state.backgroundDpr, 0, 0, state.backgroundDpr, 0, 0)
            bufferContext.imageSmoothingEnabled = true
            bufferContext.imageSmoothingQuality = 'high'
            bufferContext.drawImage(image, drawX, drawY, drawWidth, drawHeight)
            const entry = { canvas: buffer, width: bufferWidth, height: bufferHeight, marginX, marginY }
            backgroundVariantCache.set(key, entry)
            return entry
        }

        function drawCachedPhotoOverlay(sceneKey) {
            const overlay = getCachedPhotoOverlay(sceneKey)
            if (overlay) context.drawImage(overlay, 0, 0, state.width, state.height)
        }

        function getCachedPhotoOverlay(sceneKey) {
            const pixelWidth = Math.round(state.width * state.backgroundDpr)
            const pixelHeight = Math.round(state.height * state.backgroundDpr)
            const key = `${sceneKey}:${pixelWidth}x${pixelHeight}`
            const cached = sceneOverlayCache.get(key)
            if (cached) return cached

            const width = state.width
            const height = state.height
            const desiredHorizon = getRoadHorizonY()
            const buffer = document.createElement('canvas')
            buffer.width = pixelWidth
            buffer.height = pixelHeight
            const bufferContext = buffer.getContext('2d')
            if (!bufferContext) return null
            bufferContext.setTransform(state.backgroundDpr, 0, 0, state.backgroundDpr, 0, 0)

            const horizonHaze = bufferContext.createRadialGradient(
                width * 0.5,
                desiredHorizon,
                0,
                width * 0.5,
                desiredHorizon,
                Math.max(width, height) * 0.56
            )
            horizonHaze.addColorStop(0, sceneKey === 'hospital'
                ? 'rgba(235, 252, 249, 0.18)'
                : 'rgba(255, 244, 218, 0.16)')
            horizonHaze.addColorStop(0.48, 'rgba(255, 255, 255, 0.015)')
            horizonHaze.addColorStop(1, 'rgba(20, 17, 25, 0)')
            bufferContext.fillStyle = horizonHaze
            bufferContext.fillRect(0, 0, width, height)

            const floorDepth = bufferContext.createLinearGradient(0, desiredHorizon, 0, height)
            floorDepth.addColorStop(0, 'rgba(13, 19, 23, 0)')
            floorDepth.addColorStop(0.68, 'rgba(18, 17, 24, 0.025)')
            floorDepth.addColorStop(1, 'rgba(16, 13, 20, 0.14)')
            bufferContext.fillStyle = floorDepth
            bufferContext.fillRect(0, desiredHorizon, width, height - desiredHorizon)

            sceneOverlayCache.set(key, buffer)
            return buffer
        }

        function drawPhotoRunnerRoute(sceneKey, routeStrength) {
            const strength = clamp(routeStrength, 0, 1)
            const horizon = getRoadHorizonY()
            const roadColors = {
                lodares: [67, 50, 43],
                aguamarina: [94, 69, 48],
                hospital: [47, 76, 78]
            }[sceneKey] || [54, 51, 56]
            const road = context.createLinearGradient(0, horizon, 0, getRoadGroundY())
            road.addColorStop(0, `rgba(${roadColors.join(', ')}, 0)`)
            road.addColorStop(0.42, `rgba(${roadColors.join(', ')}, ${0.05 + strength * 0.12})`)
            road.addColorStop(1, `rgba(${roadColors.join(', ')}, ${0.14 + strength * 0.38})`)

            context.save()
            fillRoad(road)
            context.globalAlpha *= 0.48 + strength * 0.52
            drawLaneDepthCorridors(sceneKey, strength)
            drawPerspectiveSurface(sceneKey)
            if (sceneKey === 'aguamarina') drawBeachRouteUmbrellas(state.worldTime)
            else if (sceneKey === 'lodares') drawLodaresRoutePlanters(state.worldTime)
            else if (sceneKey === 'hospital') drawHospitalRouteBeacons(state.worldTime)

            ;[-1.68, 1.68].forEach((laneEdge) => {
                const far = project(laneEdge, VIEW_DISTANCE)
                const near = project(laneEdge, 0)
                if (isCompactRunner()) {
                    context.strokeStyle = 'rgba(13, 20, 28, 0.48)'
                    context.lineWidth = 5
                    context.beginPath()
                    context.moveTo(far.x, far.y)
                    context.lineTo(near.x, near.y)
                    context.stroke()
                }
                context.strokeStyle = sceneKey === 'hospital'
                    ? 'rgba(218, 255, 248, 0.72)'
                    : 'rgba(255, 240, 202, 0.72)'
                context.lineWidth = isCompactRunner() ? 2.5 : 1.65
                context.beginPath()
                context.moveTo(far.x, far.y)
                context.lineTo(near.x, near.y)
                context.stroke()
            })
            context.restore()
        }

        function drawBeachRouteUmbrellas(time) {
            const spacing = 31
            const firstDistance = spacing - (state.distance % spacing)

            for (let distance = firstDistance; distance < VIEW_DISTANCE; distance += spacing) {
                const worldIndex = Math.floor((state.distance + distance) / spacing)
                const side = worldIndex % 2 === 0 ? -1 : 1
                const point = project(side * 1.82, distance)
                if (point.alpha <= 0) continue

                context.save()
                context.globalAlpha *= point.alpha * (0.58 + point.depth * 0.42)
                context.translate(point.x, point.y)
                context.scale(point.scale * (isCompactRunner() ? 0.72 : 0.82), point.scale * (isCompactRunner() ? 0.72 : 0.82))
                if (side < 0) context.scale(-1, 1)
                drawBeachSideUmbrella(worldIndex, time)
                context.restore()
            }
        }

        function drawBeachSideUmbrella(index, time) {
            const palette = index % 3 === 0
                ? ['#fff0c9', '#d95679', '#2f999d']
                : index % 3 === 1
                    ? ['#fff2d5', '#ef9a58', '#d95377']
                    : ['#f7ebcb', '#2f9ea1', '#e36783']
            const sway = state.reducedMotion ? 0 : Math.sin(time * 1.15 + index) * 1.5

            drawObjectShadow(54, 0.17, 2)
            context.strokeStyle = '#6f4a30'
            context.lineWidth = 5
            context.lineCap = 'round'
            context.beginPath()
            context.moveTo(18, 0)
            context.lineTo(10 + sway, -126)
            context.stroke()
            context.strokeStyle = 'rgba(255, 238, 195, 0.56)'
            context.lineWidth = 1.5
            context.beginPath()
            context.moveTo(16, -4)
            context.lineTo(9 + sway, -124)
            context.stroke()

            context.save()
            context.translate(10 + sway, -123)
            context.scale(1, 0.47)
            for (let panel = 0; panel < 6; panel += 1) {
                const start = Math.PI + panel * Math.PI / 6
                const end = start + Math.PI / 6
                context.fillStyle = palette[panel % palette.length]
                context.beginPath()
                context.moveTo(0, 0)
                context.arc(0, 0, 62, start, end)
                context.closePath()
                context.fill()
            }
            context.strokeStyle = 'rgba(88, 50, 35, 0.5)'
            context.lineWidth = 2.6
            context.beginPath()
            context.arc(0, 0, 62, Math.PI, Math.PI * 2)
            context.stroke()
            context.restore()

            context.fillStyle = palette[1]
            ;[-42, -21, 0, 21, 42].forEach((x) => {
                context.beginPath()
                context.arc(10 + sway + x, -122, 5.5, 0, Math.PI)
                context.fill()
            })

            context.save()
            context.translate(-20, -2)
            context.rotate(-0.08)
            context.fillStyle = 'rgba(255, 240, 204, 0.92)'
            fillRoundedRect(-24, -7, 48, 12, 3)
            context.fillStyle = palette[2]
            fillRoundedRect(-17, -7, 7, 12, 1)
            fillRoundedRect(3, -7, 7, 12, 1)
            context.restore()
        }

        function drawLodaresRoutePlanters(time) {
            const spacing = 27
            const firstDistance = spacing - (state.distance % spacing)
            for (let distance = firstDistance; distance < VIEW_DISTANCE; distance += spacing) {
                const worldIndex = Math.floor((state.distance + distance) / spacing)
                const side = worldIndex % 2 === 0 ? -1 : 1
                const point = project(side * 1.82, distance)
                if (point.alpha <= 0) continue
                context.save()
                context.globalAlpha *= point.alpha * (0.46 + point.depth * 0.42)
                context.translate(point.x, point.y)
                context.scale(point.scale * 0.7, point.scale * 0.7)
                if (side < 0) context.scale(-1, 1)
                const sway = state.reducedMotion ? 0 : Math.sin(time * 1.5 + worldIndex) * 1.6
                drawObjectShadow(31, 0.16, 3)
                const pot = context.createLinearGradient(-25, -28, 25, 0)
                pot.addColorStop(0, '#d9b27a')
                pot.addColorStop(0.48, '#fff0c6')
                pot.addColorStop(1, '#9b6a42')
                context.fillStyle = pot
                context.beginPath()
                context.moveTo(-24, -28)
                context.lineTo(24, -28)
                context.lineTo(18, 0)
                context.lineTo(-18, 0)
                context.closePath()
                context.fill()
                context.fillStyle = '#557d4f'
                ;[-15, -6, 4, 14].forEach((x, index) => {
                    context.save()
                    context.translate(x, -28)
                    context.rotate(sway * 0.01 * (index % 2 ? 1 : -1))
                    context.beginPath()
                    context.ellipse(0, -15 - (index % 2) * 5, 10, 21, x * 0.012, 0, Math.PI * 2)
                    context.fill()
                    context.restore()
                })
                ;[-18, -9, 0, 10, 18].forEach((x, index) => {
                    context.fillStyle = index % 2 ? '#ffefb8' : '#e96d94'
                    context.beginPath()
                    context.arc(x + sway * 0.25, -43 - (index % 3) * 8, 5.5, 0, Math.PI * 2)
                    context.fill()
                })
                context.restore()
            }
        }

        function drawHospitalRouteBeacons(time) {
            const spacing = 32
            const firstDistance = spacing - (state.distance % spacing)
            for (let distance = firstDistance; distance < VIEW_DISTANCE; distance += spacing) {
                const worldIndex = Math.floor((state.distance + distance) / spacing)
                ;[-1, 1].forEach((side) => {
                    const point = project(side * 1.84, distance)
                    if (point.alpha <= 0) return
                    context.save()
                    context.globalAlpha *= point.alpha * (0.42 + point.depth * 0.36)
                    context.translate(point.x, point.y)
                    context.scale(point.scale * 0.66, point.scale * 0.66)
                    const pulse = state.reducedMotion ? 0.65 : 0.62 + Math.sin(time * 2.4 + worldIndex + side) * 0.18
                    drawObjectShadow(26, 0.12, 2)
                    context.fillStyle = 'rgba(40, 74, 78, 0.94)'
                    fillRoundedRect(-20, -91, 40, 91, 8)
                    context.strokeStyle = 'rgba(223, 255, 249, 0.86)'
                    context.lineWidth = 2
                    context.strokeRect(-17, -87, 34, 80)
                    context.fillStyle = `rgba(111, 236, 211, ${pulse})`
                    fillRoundedRect(-13, -70, 26, 31, 6)
                    context.fillStyle = '#f4fffc'
                    context.fillRect(-3, -64, 6, 19)
                    context.fillRect(-9, -58, 18, 6)
                    context.fillStyle = 'rgba(255, 255, 255, 0.72)'
                    fillRoundedRect(-10, -28, 20, 3, 2)
                    fillRoundedRect(-7, -19, 14, 3, 2)
                    context.restore()
                })
            }
        }

        function drawLodaresScene(time) {
            const width = state.width
            const height = state.height
            const horizon = getRoadHorizonY()
            const ground = getRoadGroundY()

            const stoneGlow = context.createLinearGradient(0, 0, 0, height)
            stoneGlow.addColorStop(0, '#8ca6b6')
            stoneGlow.addColorStop(0.24, '#ddc9a8')
            stoneGlow.addColorStop(0.58, '#ae8969')
            stoneGlow.addColorStop(1, '#4f3d3b')
            context.fillStyle = stoneGlow
            context.fillRect(0, 0, width, height)

            const roofLight = context.createLinearGradient(0, 0, 0, horizon * 1.22)
            roofLight.addColorStop(0, '#bad7e6')
            roofLight.addColorStop(0.5, '#f6ebd3')
            roofLight.addColorStop(1, '#8da6ad')
            context.fillStyle = roofLight
            context.beginPath()
            context.moveTo(width * 0.12, 0)
            context.lineTo(width * 0.88, 0)
            context.lineTo(width * 0.565, horizon)
            context.lineTo(width * 0.435, horizon)
            context.closePath()
            context.fill()

            const roofShade = context.createLinearGradient(0, 0, width * 0.44, 0)
            roofShade.addColorStop(0, 'rgba(44, 52, 57, 0.78)')
            roofShade.addColorStop(1, 'rgba(89, 77, 65, 0.12)')
            context.fillStyle = roofShade
            context.beginPath()
            context.moveTo(0, 0)
            context.lineTo(width * 0.12, 0)
            context.lineTo(width * 0.435, horizon)
            context.lineTo(0, height * 0.55)
            context.closePath()
            context.fill()
            context.save()
            context.translate(width, 0)
            context.scale(-1, 1)
            context.fill()
            context.restore()

            drawLodaresRoof()

            const leftWall = context.createLinearGradient(0, 0, width * 0.45, 0)
            leftWall.addColorStop(0, '#5b4944')
            leftWall.addColorStop(0.45, '#98775e')
            leftWall.addColorStop(1, '#d0b690')
            context.fillStyle = leftWall
            context.beginPath()
            context.moveTo(0, height * 0.16)
            context.lineTo(width * 0.435, horizon)
            context.lineTo(width * 0.08, ground)
            context.lineTo(0, height)
            context.closePath()
            context.fill()

            const rightWall = context.createLinearGradient(width, 0, width * 0.55, 0)
            rightWall.addColorStop(0, '#4f413f')
            rightWall.addColorStop(0.45, '#8b705a')
            rightWall.addColorStop(1, '#c8ae87')
            context.fillStyle = rightWall
            context.beginPath()
            context.moveTo(width, height * 0.16)
            context.lineTo(width * 0.565, horizon)
            context.lineTo(width * 0.92, ground)
            context.lineTo(width, height)
            context.closePath()
            context.fill()

            const floor = context.createLinearGradient(0, horizon, 0, ground)
            floor.addColorStop(0, '#75645e')
            floor.addColorStop(0.42, '#b9a89e')
            floor.addColorStop(0.76, '#d7cbc0')
            floor.addColorStop(1, '#88766f')
            fillRoad(floor)

            drawPerspectiveSurface('lodares')
            drawLodaresArchitecture(time)

            const daylight = context.createRadialGradient(width / 2, horizon * 0.82, 0, width / 2, horizon, width * 0.5)
            daylight.addColorStop(0, 'rgba(255, 247, 218, 0.52)')
            daylight.addColorStop(0.45, 'rgba(255, 231, 190, 0.13)')
            daylight.addColorStop(1, 'rgba(255, 227, 183, 0)')
            context.fillStyle = daylight
            context.fillRect(0, 0, width, height * 0.75)
        }

        function drawLodaresRoof() {
            const width = state.width
            const height = state.height
            const horizon = getRoadHorizonY()
            context.save()
            context.strokeStyle = 'rgba(52, 61, 62, 0.6)'
            context.lineWidth = Math.max(1, width * 0.004)
            for (let index = 0; index <= 8; index += 1) {
                const amount = index / 8
                const topX = mix(width * 0.12, width * 0.88, amount)
                const farX = mix(width * 0.435, width * 0.565, amount)
                context.beginPath()
                context.moveTo(topX, -2)
                context.lineTo(farX, horizon)
                context.stroke()
            }

            const offset = state.distance % 18
            for (let index = 0; index < 9; index += 1) {
                const distance = (index * 18 - offset + VIEW_DISTANCE) % VIEW_DISTANCE
                const closeness = clamp(1 - distance / VIEW_DISTANCE, 0, 1)
                const y = horizon * (1 - Math.pow(closeness, 1.7))
                const left = mix(width * 0.435, width * 0.12, Math.pow(closeness, 1.4))
                const right = width - left
                context.strokeStyle = `rgba(56, 65, 65, ${0.22 + closeness * 0.48})`
                context.lineWidth = 1 + closeness * 3
                context.beginPath()
                context.moveTo(left, y)
                context.quadraticCurveTo(width / 2, y - 14 - closeness * 24, right, y)
                context.stroke()
            }
            context.restore()
        }

        function drawLodaresArchitecture(time) {
            const spacing = 24
            const offset = state.distance % spacing
            for (let index = 0; index < 7; index += 1) {
                const distance = (index * spacing - offset + VIEW_DISTANCE) % VIEW_DISTANCE
                const closeness = clamp(1 - distance / VIEW_DISTANCE, 0, 1)
                const scale = project(0, distance).scale
                ;[-1, 1].forEach((side) => {
                    const point = project(side * 2.03, distance)
                    context.save()
                    context.translate(point.x, point.y)
                    context.scale(scale, scale)
                    drawLodaresBay(side, index, time)
                    context.restore()
                })

                if (index % 2 === 0) {
                    const lamp = project(0, distance, 98)
                    context.save()
                    context.globalAlpha = lamp.alpha
                    context.translate(lamp.x, lamp.y)
                    context.scale(lamp.scale, lamp.scale)
                    drawHangingLamp(time + index)
                    context.restore()
                }

                if (closeness > 0.2) {
                    const reflection = project(0, distance)
                    const glow = context.createRadialGradient(reflection.x, reflection.y, 0, reflection.x, reflection.y, 35 * scale)
                    glow.addColorStop(0, 'rgba(255, 226, 163, 0.13)')
                    glow.addColorStop(1, 'rgba(255, 226, 163, 0)')
                    context.fillStyle = glow
                    context.fillRect(reflection.x - 42 * scale, reflection.y - 15 * scale, 84 * scale, 45 * scale)
                }
            }
        }

        function drawLodaresBay(side, index, time) {
            const mirror = side < 0 ? -1 : 1
            context.save()
            context.scale(mirror, 1)

            const shopGlow = context.createLinearGradient(-72, -116, -18, -25)
            shopGlow.addColorStop(0, '#3d3434')
            shopGlow.addColorStop(0.55, '#786354')
            shopGlow.addColorStop(1, '#dfc796')
            context.fillStyle = shopGlow
            fillRoundedRect(-86, -132, 72, 112, 5)

            context.fillStyle = '#252d2c'
            fillRoundedRect(-78, -87, 47, 58, 4)
            const glass = context.createLinearGradient(-75, -85, -35, -32)
            glass.addColorStop(0, 'rgba(186, 218, 220, 0.76)')
            glass.addColorStop(0.5, 'rgba(50, 67, 71, 0.86)')
            glass.addColorStop(1, 'rgba(230, 194, 133, 0.35)')
            context.fillStyle = glass
            fillRoundedRect(-75, -84, 41, 51, 2)
            context.fillStyle = 'rgba(255, 236, 193, 0.78)'
            fillRoundedRect(-70, -73, 28, 2, 1)
            fillRoundedRect(-67, -62, 22, 2, 1)

            const column = context.createLinearGradient(-20, 0, 17, 0)
            column.addColorStop(0, '#725d4d')
            column.addColorStop(0.24, '#d9c4a1')
            column.addColorStop(0.55, '#f1dfbd')
            column.addColorStop(0.82, '#b89c78')
            column.addColorStop(1, '#604d42')
            context.fillStyle = column
            fillRoundedRect(-17, -164, 34, 147, 7)
            context.fillStyle = '#c8af86'
            fillRoundedRect(-24, -171, 48, 13, 4)
            fillRoundedRect(-28, -181, 56, 11, 4)
            context.fillStyle = '#e7d2ad'
            context.beginPath()
            context.arc(-17, -174, 6.5, 0, Math.PI * 2)
            context.arc(17, -174, 6.5, 0, Math.PI * 2)
            context.fill()
            context.strokeStyle = '#856e55'
            context.lineWidth = 1.5
            context.beginPath()
            context.arc(-17, -174, 4.2, 0.15, Math.PI * 1.9)
            context.arc(17, -174, 4.2, Math.PI * 1.1, Math.PI * 2.85)
            context.stroke()
            context.strokeStyle = 'rgba(119, 92, 70, 0.34)'
            context.lineWidth = 1.2
            for (let flute = -10; flute <= 10; flute += 5) {
                context.beginPath()
                context.moveTo(flute, -155)
                context.lineTo(flute, -29)
                context.stroke()
            }
            context.fillStyle = '#7b6554'
            fillRoundedRect(-25, -22, 50, 9, 3)
            fillRoundedRect(-29, -14, 58, 10, 3)

            context.strokeStyle = '#3b3936'
            context.lineWidth = 4
            context.beginPath()
            context.moveTo(-82, -119)
            context.lineTo(-29, -119)
            context.stroke()
            context.lineWidth = 2
            for (let rail = -78; rail <= -34; rail += 9) {
                context.beginPath()
                context.moveTo(rail, -120)
                context.quadraticCurveTo(rail + 5, -139, rail + 9, -120)
                context.stroke()
            }

            const shimmer = 0.14 + Math.sin(time * 0.7 + index) * 0.04
            context.fillStyle = `rgba(255, 245, 209, ${shimmer})`
            fillRoundedRect(-72, -155, 42, 23, 4)
            context.restore()
        }

        function drawHangingLamp(time) {
            context.strokeStyle = '#3b3936'
            context.lineWidth = 2.8
            context.beginPath()
            context.moveTo(0, -42)
            context.lineTo(0, -12)
            context.stroke()
            const glow = context.createRadialGradient(0, 2, 1, 0, 2, 30)
            glow.addColorStop(0, `rgba(255, 237, 178, ${0.6 + Math.sin(time) * 0.04})`)
            glow.addColorStop(1, 'rgba(255, 220, 145, 0)')
            context.fillStyle = glow
            context.beginPath()
            context.arc(0, 2, 30, 0, Math.PI * 2)
            context.fill()
            context.fillStyle = '#433d39'
            context.beginPath()
            context.moveTo(-14, -10)
            context.lineTo(14, -10)
            context.lineTo(9, 8)
            context.lineTo(-9, 8)
            context.closePath()
            context.fill()
            context.fillStyle = '#ffdd91'
            context.beginPath()
            context.arc(0, 1, 5, 0, Math.PI * 2)
            context.fill()
        }

        function drawAguamarinaScene(time) {
            const width = state.width
            const height = state.height
            const horizon = getRoadHorizonY()

            const sky = context.createLinearGradient(0, 0, 0, horizon * 1.35)
            sky.addColorStop(0, '#3d9ed1')
            sky.addColorStop(0.56, '#8ed2e9')
            sky.addColorStop(1, '#f2e5cf')
            context.fillStyle = sky
            context.fillRect(0, 0, width, height)

            drawSun(width * 0.78, height * 0.13, Math.min(width, height) * 0.062)
            drawCoastalCloud(width * 0.2 - (state.distance * 0.08) % (width * 1.2), height * 0.12, width * 0.22, 0.5)
            drawCoastalCloud(width * 0.76 - (state.distance * 0.035) % (width * 1.45), height * 0.205, width * 0.15, 0.28)

            const sea = context.createLinearGradient(0, horizon, 0, height)
            sea.addColorStop(0, '#4daec2')
            sea.addColorStop(0.34, '#137c96')
            sea.addColorStop(1, '#074d68')
            context.fillStyle = sea
            context.fillRect(0, horizon, width, height - horizon)
            drawSeaHighlights(time)

            drawAguamarinaCliff(time)

            const boardwalk = context.createLinearGradient(0, horizon, 0, height * 0.9)
            boardwalk.addColorStop(0, '#8f6e52')
            boardwalk.addColorStop(0.44, '#bc8e65')
            boardwalk.addColorStop(0.78, '#d2aa7d')
            boardwalk.addColorStop(1, '#7b5a45')
            fillRoad(boardwalk)
            drawPerspectiveSurface('aguamarina')
            drawBeachRailings(time)
            drawBeachNature(time)

            const saltHaze = context.createLinearGradient(0, horizon * 0.6, 0, height * 0.72)
            saltHaze.addColorStop(0, 'rgba(255, 247, 220, 0.28)')
            saltHaze.addColorStop(1, 'rgba(255, 247, 220, 0)')
            context.fillStyle = saltHaze
            context.fillRect(0, 0, width, height * 0.72)
        }

        function drawSun(x, y, radius) {
            const glow = context.createRadialGradient(x, y, radius * 0.08, x, y, radius * 3.4)
            glow.addColorStop(0, 'rgba(255, 252, 219, 1)')
            glow.addColorStop(0.25, 'rgba(255, 227, 153, 0.78)')
            glow.addColorStop(1, 'rgba(255, 218, 139, 0)')
            context.fillStyle = glow
            context.beginPath()
            context.arc(x, y, radius * 3.4, 0, Math.PI * 2)
            context.fill()
            context.fillStyle = '#fff4c8'
            context.beginPath()
            context.arc(x, y, radius, 0, Math.PI * 2)
            context.fill()
        }

        function drawCoastalCloud(x, y, size, opacity) {
            const wrappedX = ((x % (state.width + size * 2)) + state.width + size * 2) % (state.width + size * 2) - size
            context.save()
            context.globalAlpha *= opacity
            const cloud = context.createLinearGradient(0, y - size * 0.2, 0, y + size * 0.22)
            cloud.addColorStop(0, '#ffffff')
            cloud.addColorStop(1, '#c9e2e7')
            context.fillStyle = cloud
            context.beginPath()
            context.ellipse(wrappedX, y, size * 0.48, size * 0.13, 0, 0, Math.PI * 2)
            context.ellipse(wrappedX - size * 0.18, y - size * 0.08, size * 0.24, size * 0.16, 0, 0, Math.PI * 2)
            context.ellipse(wrappedX + size * 0.1, y - size * 0.1, size * 0.3, size * 0.19, 0, 0, Math.PI * 2)
            context.fill()
            context.restore()
        }

        function drawSeaHighlights(time) {
            const width = state.width
            const horizon = getRoadHorizonY()
            for (let band = 0; band < 18; band += 1) {
                const depth = band / 18
                const y = horizon + Math.pow(depth, 1.55) * state.height * 0.66
                const waveWidth = 12 + depth * width * 0.14
                const drift = Math.sin(time * 0.7 + band * 1.7) * width * 0.05
                context.strokeStyle = `rgba(210, 253, 255, ${0.11 + depth * 0.2})`
                context.lineWidth = 0.7 + depth * 1.6
                context.beginPath()
                for (let part = 0; part < 4; part += 1) {
                    const x = ((band * 71 + part * 127 + drift) % (width * 1.3)) - width * 0.12
                    context.moveTo(x, y + part * depth * 2)
                    context.quadraticCurveTo(x + waveWidth * 0.45, y - 2 - depth * 3, x + waveWidth, y)
                }
                context.stroke()
            }
        }

        function drawAguamarinaCliff(time) {
            const width = state.width
            const height = state.height
            const horizon = getRoadHorizonY()
            const rock = context.createLinearGradient(0, horizon, width * 0.43, height)
            rock.addColorStop(0, '#d2a16d')
            rock.addColorStop(0.36, '#b16c49')
            rock.addColorStop(0.7, '#804835')
            rock.addColorStop(1, '#4f352d')
            context.fillStyle = rock
            context.beginPath()
            context.moveTo(0, horizon * 0.72)
            context.lineTo(width * 0.3, horizon * 0.9)
            context.lineTo(width * 0.43, horizon * 1.04)
            context.lineTo(width * 0.28, height * 0.52)
            context.lineTo(width * 0.18, height * 0.73)
            context.lineTo(width * 0.07, height)
            context.lineTo(0, height)
            context.closePath()
            context.fill()

            context.strokeStyle = 'rgba(248, 201, 143, 0.38)'
            context.lineWidth = 2
            for (let ridge = 0; ridge < 8; ridge += 1) {
                const startY = horizon + ridge * height * 0.09 + Math.sin(ridge * 2.1) * 6
                context.beginPath()
                context.moveTo(0, startY)
                context.bezierCurveTo(width * 0.08, startY - 14, width * 0.18, startY + 17, width * (0.32 - ridge * 0.02), startY - 4)
                context.stroke()
            }

            context.fillStyle = 'rgba(84, 48, 39, 0.18)'
            for (let grain = 0; grain < 34; grain += 1) {
                const x = (grain * 43.7) % (width * 0.31)
                const depth = (grain * 67.3) % (height * 0.66)
                const y = horizon * 0.78 + depth
                const radius = 1.2 + (grain % 5) * 0.8
                context.beginPath()
                context.ellipse(x, y, radius * 1.7, radius, -0.2, 0, Math.PI * 2)
                context.fill()
            }

            const scrub = context.createLinearGradient(0, 0, width * 0.32, 0)
            scrub.addColorStop(0, '#425e36')
            scrub.addColorStop(1, '#7d8d4d')
            context.fillStyle = scrub
            for (let shrub = 0; shrub < 17; shrub += 1) {
                const x = (shrub * 47 + Math.sin(shrub * 2.3) * 19) % (width * 0.36)
                const y = horizon * 0.75 + (shrub % 5) * 9 + Math.sin(time * 0.35 + shrub) * 1.1
                const leafSize = 5 + shrub % 3 * 2
                for (let leaf = 0; leaf < 4; leaf += 1) {
                    context.save()
                    context.translate(x, y)
                    context.rotate(-0.75 + leaf * 0.48)
                    context.beginPath()
                    context.ellipse(0, -leafSize, leafSize * 0.56, leafSize * 1.5, 0, 0, Math.PI * 2)
                    context.fill()
                    context.restore()
                }
            }
        }

        function drawBeachRailings() {
            const spacing = 15
            const offset = state.distance % spacing
            for (let index = 0; index < 10; index += 1) {
                const distance = (index * spacing - offset + VIEW_DISTANCE) % VIEW_DISTANCE
                const point = project(1.82, distance)
                const previous = project(1.82, Math.min(VIEW_DISTANCE, distance + spacing))
                context.save()
                context.globalAlpha = point.alpha
                context.strokeStyle = '#76543d'
                context.lineCap = 'round'
                context.lineWidth = Math.max(1, point.scale * 6)
                context.beginPath()
                context.moveTo(point.x, point.y + 2)
                context.lineTo(point.x, point.y - 58 * point.scale)
                context.stroke()
                context.strokeStyle = '#b8865e'
                context.lineWidth = Math.max(0.7, point.scale * 3)
                context.beginPath()
                context.moveTo(point.x, point.y - 52 * point.scale)
                context.lineTo(previous.x, previous.y - 52 * previous.scale)
                context.moveTo(point.x, point.y - 29 * point.scale)
                context.lineTo(previous.x, previous.y - 29 * previous.scale)
                context.stroke()
                context.restore()
            }
        }

        function drawBeachNature(time) {
            const spacing = 22
            const offset = state.distance % spacing
            for (let index = 0; index < 7; index += 1) {
                const distance = (index * spacing - offset + VIEW_DISTANCE) % VIEW_DISTANCE
                const point = project(-1.95, distance)
                context.save()
                context.globalAlpha = point.alpha
                context.translate(point.x, point.y)
                context.scale(point.scale, point.scale)
                const sway = state.reducedMotion ? 0 : Math.sin(time * 1.4 + index) * 0.04
                context.rotate(sway)
                context.fillStyle = '#4f6540'
                for (let leaf = 0; leaf < 7; leaf += 1) {
                    context.save()
                    context.rotate(-0.7 + leaf * 0.24)
                    context.beginPath()
                    context.ellipse(0, -18, 5, 18, 0, 0, Math.PI * 2)
                    context.fill()
                    context.restore()
                }
                context.fillStyle = '#c78d58'
                context.beginPath()
                context.ellipse(5, 1, 22, 8, -0.12, 0, Math.PI * 2)
                context.fill()
                context.restore()
            }
        }

        function drawHospitalScene(time) {
            const width = state.width
            const height = state.height
            const horizon = getRoadHorizonY()
            const ground = getRoadGroundY()

            const ambient = context.createLinearGradient(0, 0, 0, height)
            ambient.addColorStop(0, '#d9e6e8')
            ambient.addColorStop(0.33, '#f6f7f4')
            ambient.addColorStop(0.72, '#c5d8d8')
            ambient.addColorStop(1, '#6f8b8d')
            context.fillStyle = ambient
            context.fillRect(0, 0, width, height)

            const ceiling = context.createLinearGradient(0, 0, 0, horizon)
            ceiling.addColorStop(0, '#c3d0d1')
            ceiling.addColorStop(0.75, '#f9fbf8')
            ceiling.addColorStop(1, '#ccd9d9')
            context.fillStyle = ceiling
            context.beginPath()
            context.moveTo(0, 0)
            context.lineTo(width, 0)
            context.lineTo(width * 0.56, horizon)
            context.lineTo(width * 0.44, horizon)
            context.closePath()
            context.fill()

            const leftWall = context.createLinearGradient(0, 0, width * 0.44, 0)
            leftWall.addColorStop(0, '#8ca8aa')
            leftWall.addColorStop(0.46, '#dfe8e6')
            leftWall.addColorStop(1, '#f7f7f2')
            context.fillStyle = leftWall
            context.beginPath()
            context.moveTo(0, 0)
            context.lineTo(width * 0.44, horizon)
            context.lineTo(width * 0.09, ground)
            context.lineTo(0, height)
            context.closePath()
            context.fill()

            const rightWall = context.createLinearGradient(width, 0, width * 0.56, 0)
            rightWall.addColorStop(0, '#7a999d')
            rightWall.addColorStop(0.46, '#d5e4e2')
            rightWall.addColorStop(1, '#f6f8f4')
            context.fillStyle = rightWall
            context.beginPath()
            context.moveTo(width, 0)
            context.lineTo(width * 0.56, horizon)
            context.lineTo(width * 0.91, ground)
            context.lineTo(width, height)
            context.closePath()
            context.fill()

            const floor = context.createLinearGradient(0, horizon, 0, ground)
            floor.addColorStop(0, '#90a9aa')
            floor.addColorStop(0.35, '#dbe3df')
            floor.addColorStop(0.74, '#f2f2ec')
            floor.addColorStop(1, '#a3b4b4')
            fillRoad(floor)
            drawPerspectiveSurface('hospital')
            drawHospitalCeilingLights()
            drawHospitalArchitecture(time)

            const clinicalGlow = context.createRadialGradient(width / 2, horizon, 0, width / 2, horizon, width * 0.46)
            clinicalGlow.addColorStop(0, 'rgba(255, 255, 245, 0.76)')
            clinicalGlow.addColorStop(0.42, 'rgba(215, 246, 240, 0.12)')
            clinicalGlow.addColorStop(1, 'rgba(215, 246, 240, 0)')
            context.fillStyle = clinicalGlow
            context.fillRect(0, 0, width, height * 0.76)
        }

        function drawHospitalCeilingLights() {
            const offset = state.distance % 19
            for (let index = 0; index < 7; index += 1) {
                const distance = (index * 19 - offset + VIEW_DISTANCE) % VIEW_DISTANCE
                const closeness = clamp(1 - distance / VIEW_DISTANCE, 0, 1)
                const depth = Math.pow(closeness, 1.55)
                const lightWidth = 9 + depth * state.width * 0.16
                const y = state.height * 0.257 - depth * state.height * 0.25
                const light = context.createLinearGradient(state.width / 2 - lightWidth, y, state.width / 2 + lightWidth, y)
                light.addColorStop(0, 'rgba(225, 255, 249, 0)')
                light.addColorStop(0.5, 'rgba(250, 255, 239, 0.98)')
                light.addColorStop(1, 'rgba(225, 255, 249, 0)')
                context.fillStyle = light
                fillRoundedRect(state.width / 2 - lightWidth, y, lightWidth * 2, 3 + depth * 7, 4)
            }
        }

        function drawHospitalArchitecture(time) {
            const spacing = 26
            const offset = state.distance % spacing
            for (let index = 0; index < 7; index += 1) {
                const distance = (index * spacing - offset + VIEW_DISTANCE) % VIEW_DISTANCE
                const pointScale = project(0, distance).scale
                ;[-1, 1].forEach((side) => {
                    const point = project(side * 2.04, distance)
                    context.save()
                    context.globalAlpha = point.alpha
                    context.translate(point.x, point.y)
                    context.scale(pointScale * (side < 0 ? -1 : 1), pointScale)
                    drawHospitalDoor(index, side, time)
                    context.restore()
                })
            }
        }

        function drawHospitalDoor(index, side, time) {
            context.fillStyle = '#6e8587'
            fillRoundedRect(10, -144, 75, 139, 5)
            const door = context.createLinearGradient(15, -138, 79, -10)
            door.addColorStop(0, '#ddebea')
            door.addColorStop(0.48, '#9ebfc0')
            door.addColorStop(1, '#63868a')
            context.fillStyle = door
            fillRoundedRect(15, -137, 64, 126, 3)
            context.fillStyle = 'rgba(45, 76, 82, 0.64)'
            fillRoundedRect(23, -124, 48, 43, 3)
            const windowLight = context.createLinearGradient(26, -121, 66, -84)
            windowLight.addColorStop(0, 'rgba(205, 245, 238, 0.9)')
            windowLight.addColorStop(0.5, 'rgba(95, 158, 166, 0.58)')
            windowLight.addColorStop(1, 'rgba(243, 255, 247, 0.85)')
            context.fillStyle = windowLight
            fillRoundedRect(27, -120, 40, 35, 2)
            context.fillStyle = '#325f65'
            fillRoundedRect(20, -157, 54, 15, 4)
            context.fillStyle = '#effff9'
            context.font = '800 10px sans-serif'
            context.textAlign = 'center'
            context.save()
            if (side < 0) {
                context.translate(94, 0)
                context.scale(-1, 1)
            }
            context.fillText(`${(index % 4) + 2}0${side > 0 ? 2 : 1}`, 47, -146)
            context.restore()

            context.strokeStyle = '#4a7679'
            context.lineWidth = 6
            context.beginPath()
            context.moveTo(-8, -48)
            context.lineTo(85, -48)
            context.stroke()
            context.strokeStyle = 'rgba(242, 255, 251, 0.58)'
            context.lineWidth = 1.8
            context.beginPath()
            context.moveTo(-8, -50)
            context.lineTo(85, -50)
            context.stroke()

            context.fillStyle = '#dae5df'
            fillRoundedRect(-37, -128, 35, 46, 4)
            context.fillStyle = index % 2 ? '#4d9792' : '#cc5d7e'
            fillRoundedRect(-22, -120, 6, 28, 2)
            fillRoundedRect(-31, -109, 24, 6, 2)

            const pulse = 0.55 + Math.sin(time * 2 + index) * 0.12
            context.fillStyle = `rgba(126, 231, 196, ${pulse})`
            context.beginPath()
            context.arc(74, -72, 3, 0, Math.PI * 2)
            context.fill()
        }

        function fillRoad(fillStyle) {
            const farLeft = project(-1.68, VIEW_DISTANCE)
            const farRight = project(1.68, VIEW_DISTANCE)
            const nearLeft = project(-1.68, 0)
            const nearRight = project(1.68, 0)
            context.fillStyle = fillStyle
            context.beginPath()
            context.moveTo(farLeft.x, farLeft.y)
            context.lineTo(farRight.x, farRight.y)
            context.lineTo(nearRight.x, nearRight.y)
            context.lineTo(nearLeft.x, nearLeft.y)
            context.closePath()
            context.fill()
        }

        function drawLaneDepthCorridors(sceneKey, strength) {
            const laneColor = {
                lodares: [255, 236, 205],
                aguamarina: [225, 250, 244],
                hospital: [219, 255, 249]
            }[sceneKey] || [255, 255, 255]
            const boundaries = [-1.5, -0.5, 0.5, 1.5]
            const compact = isCompactRunner()

            for (let laneIndex = 0; laneIndex < 3; laneIndex += 1) {
                const farLeft = project(boundaries[laneIndex], VIEW_DISTANCE - 1)
                const farRight = project(boundaries[laneIndex + 1], VIEW_DISTANCE - 1)
                const nearLeft = project(boundaries[laneIndex], 0)
                const nearRight = project(boundaries[laneIndex + 1], 0)
                const alpha = compact
                    ? (laneIndex === 1 ? 0.075 : 0.12) + strength * 0.035
                    : (laneIndex === 1 ? 0.052 : 0.032) + strength * 0.035

                context.fillStyle = compact && laneIndex !== 1
                    ? `rgba(14, 24, 32, ${alpha})`
                    : `rgba(${laneColor.join(', ')}, ${alpha})`
                context.beginPath()
                context.moveTo(farLeft.x, farLeft.y)
                context.lineTo(farRight.x, farRight.y)
                context.lineTo(nearRight.x, nearRight.y)
                context.lineTo(nearLeft.x, nearLeft.y)
                context.closePath()
                context.fill()
            }
        }

        function drawPerspectiveSurface(sceneKey) {
            const style = {
                lodares: {
                    cross: 'rgba(72, 54, 50, 0.25)',
                    lanes: 'rgba(255, 243, 219, 0.34)',
                    spacing: 9
                },
                aguamarina: {
                    cross: 'rgba(240, 229, 201, 0.42)',
                    lanes: 'rgba(234, 255, 247, 0.48)',
                    spacing: 6.5
                },
                hospital: {
                    cross: 'rgba(69, 102, 104, 0.22)',
                    lanes: 'rgba(255, 255, 255, 0.5)',
                    spacing: 8
                }
            }[sceneKey]

            const offset = state.distance % style.spacing
            for (let index = 0; index < 18; index += 1) {
                const distance = (index * style.spacing - offset + VIEW_DISTANCE) % VIEW_DISTANCE
                const left = project(-1.68, distance)
                const right = project(1.68, distance)
                context.strokeStyle = style.cross
                context.lineWidth = Math.max(0.45, left.scale * (sceneKey === 'aguamarina' ? 2.5 : 1.5))
                context.beginPath()
                context.moveTo(left.x, left.y)
                context.lineTo(right.x, right.y)
                context.stroke()

                if (sceneKey === 'lodares' && index % 2 === 0) {
                    const center = project(0, distance)
                    context.fillStyle = `rgba(255, 244, 218, ${0.02 + center.depth * 0.06})`
                    context.beginPath()
                    context.ellipse(center.x, center.y, 35 * center.scale, 5 * center.scale, 0, 0, Math.PI * 2)
                    context.fill()
                }
            }

            drawTemplePathChevrons(sceneKey)

            ;[-0.5, 0.5].forEach((laneEdge) => {
                const far = project(laneEdge, VIEW_DISTANCE)
                const near = project(laneEdge, 0)
                if (isCompactRunner()) {
                    context.strokeStyle = 'rgba(12, 21, 29, 0.72)'
                    context.lineWidth = 5
                    context.beginPath()
                    context.moveTo(far.x, far.y)
                    context.lineTo(near.x, near.y)
                    context.stroke()
                }
                context.strokeStyle = style.lanes
                context.lineWidth = isCompactRunner() ? 2.35 : 1.1
                context.setLineDash(isCompactRunner() ? [] : [9, 13])
                context.beginPath()
                context.moveTo(far.x, far.y)
                context.lineTo(near.x, near.y)
                context.stroke()
                context.setLineDash([])
            })

            if (sceneKey === 'hospital') {
                const reflection = context.createLinearGradient(0, state.height * 0.35, 0, state.height * 0.88)
                reflection.addColorStop(0, 'rgba(255, 255, 255, 0)')
                reflection.addColorStop(0.75, 'rgba(255, 255, 255, 0.15)')
                reflection.addColorStop(1, 'rgba(190, 231, 228, 0.02)')
                fillRoad(reflection)
            }
        }

        function drawTemplePathChevrons(sceneKey) {
            const spacing = 18
            const offset = state.distance % spacing
            const color = sceneKey === 'aguamarina'
                ? [255, 222, 157]
                : sceneKey === 'hospital'
                    ? [171, 244, 224]
                    : [255, 220, 180]

            for (let index = 0; index < 8; index += 1) {
                const distance = (index * spacing - offset + VIEW_DISTANCE) % VIEW_DISTANCE
                const point = project(0, distance)
                if (point.depth < 0.04) continue
                const width = Math.max(3, getLaneSpread(point.depth) * 0.18)
                const height = Math.max(2, 3 + point.depth * 8)
                context.strokeStyle = `rgba(${color.join(', ')}, ${0.09 + point.depth * 0.22})`
                context.lineWidth = 0.8 + point.depth * 1.8
                context.lineCap = 'round'
                context.beginPath()
                context.moveTo(point.x - width, point.y + height)
                context.lineTo(point.x, point.y - height)
                context.lineTo(point.x + width, point.y + height)
                context.stroke()
            }
        }

        function project(lane, distance, height = 0) {
            const closeness = clamp(1 - distance / VIEW_DISTANCE, 0, 1)
            const depth = Math.pow(closeness, 1.68)
            const horizon = getRoadHorizonY()
            const ground = getRoadGroundY()
            const laneSpread = getLaneSpread(depth)
            const scale = isCompactRunner()
                ? 0.068 + depth * 0.917
                : 0.108 + depth * 1.042
            return {
                x: state.width / 2 + lane * laneSpread,
                y: horizon + (ground - horizon) * depth - height * scale,
                scale,
                depth,
                alpha: clamp((VIEW_DISTANCE - distance) / 22, 0, 1)
            }
        }

        function drawParticles() {
            state.particles.forEach((particle) => {
                const opacity = clamp(particle.life / particle.maxLife, 0, 1)
                context.save()
                context.globalAlpha = opacity
                context.translate(particle.x, particle.y)
                context.rotate(particle.rotation)
                if (particle.shape === 'heart') {
                    drawHeart(0, 0, particle.size, particle.color)
                } else {
                    context.fillStyle = particle.color
                    context.beginPath()
                    context.arc(0, 0, particle.size, 0, Math.PI * 2)
                    context.fill()
                }
                context.restore()
            })
        }

        function drawWorldObject(object, time) {
            if (object.distance > VIEW_DISTANCE + 8 || object.distance < -5) return
            const point = project(object.lane, object.distance, object.height || 0)
            if (point.alpha <= 0) return
            const sceneKey = object.scene || getSceneMix().current.key
            const containmentScale = getWorldObjectContainmentScale(object, sceneKey, point)
            const verticalContainmentScale = getWorldObjectVerticalContainmentScale(object, containmentScale)
            const beaconDistance = isCompactRunner() ? 56 : 68
            const belowFlight = isFlightActive() &&
                !object.flightRoute &&
                object.kind !== 'finish' &&
                !(object.kind === 'power' && object.powerType === 'flight')

            if (object.moving && !belowFlight) drawMovingObstacleTrack(object, time)

            if (object.kind === 'obstacle' && object.distance > beaconDistance && !belowFlight) {
                const beaconPoint = object.moving
                    ? project(getObstacleThreatLane(object), object.distance, object.height || 0)
                    : point
                drawDistantObjectBeacon(object, beaconPoint, sceneKey, time, verticalContainmentScale, beaconDistance)
            }

            context.save()
            context.globalAlpha = point.alpha * (0.72 + point.depth * 0.28) * (belowFlight ? 0.3 : 1)
            context.translate(point.x, point.y)
            context.scale(point.scale * containmentScale, point.scale * verticalContainmentScale)
            if (object.moving) {
                context.rotate(clamp(-object.laneMotionVelocity * 0.007, -0.09, 0.09))
            }

            if (object.kind === 'finish') {
                drawFinishGate(time)
                context.restore()
                return
            }

            if (!object.handled && !belowFlight) drawObjectGuidance(object, sceneKey, time)

            if (object.kind === 'memory') {
                drawMemoryCollectible(object, time)
            } else if (object.kind === 'mia') {
                drawMiaCollectible(object, time)
            } else if (object.kind === 'letter') {
                drawWordHuntCollectible(object, time)
            } else if (object.kind === 'crate') {
                drawRouteCrate(object, time)
            } else if (object.kind === 'coin') {
                if (!drawPhotographicCollectible('heart', object, time)) drawGlassHeart(object, time)
            } else if (object.kind === 'power') {
                drawPowerCollectible(object, time)
            } else if (object.kind === 'boost') {
                drawBoostPad(sceneKey, time)
            } else if (sceneKey === 'aguamarina' && object.type === 'sheet') {
                drawBeachCanopy(time)
            } else if (!drawPhotographicObstacle(sceneKey, object.type)) {
                if (object.type === 'cart') drawSceneSolidObstacle(sceneKey, time)
                else if (object.type === 'spill') drawSceneJumpObstacle(sceneKey, time)
                else drawSceneOverheadObstacle(sceneKey, time)
            }
            context.restore()
        }

        function drawMovingObstacleTrack(object, time) {
            if (!object.moving || object.distance > 100 || object.distance < 6) return
            const start = project(object.startLane, object.distance)
            const target = project(object.targetLane, object.distance)
            if (start.alpha <= 0 || target.alpha <= 0) return

            const scenePalette = object.scene === 'hospital'
                ? { path: [126, 232, 211], target: [218, 61, 91] }
                : { path: [109, 218, 238], target: [224, 74, 104] }
            const pulse = state.reducedMotion ? 0.55 : 0.5 + Math.sin(time * 6.4 + object.startLane) * 0.5
            const approach = clamp((100 - object.distance) / 88, 0, 1)
            const fadeAfterCrossing = 1 - smootherstep((object.movingProgress - 0.86) / 0.14) * 0.48
            const direction = Math.sign(target.x - start.x)

            context.save()
            context.globalAlpha = start.alpha * (0.45 + approach * 0.45) * fadeAfterCrossing
            context.lineCap = 'round'
            context.strokeStyle = `rgba(${scenePalette.path.join(', ')}, ${0.62 + pulse * 0.22})`
            context.lineWidth = 2 + target.depth * 3.4
            context.setLineDash([8 + target.depth * 9, 7 + target.depth * 6])
            context.beginPath()
            context.moveTo(start.x, start.y + 3)
            context.bezierCurveTo(
                mix(start.x, target.x, 0.28),
                start.y - 5 - target.depth * 9,
                mix(start.x, target.x, 0.72),
                target.y - 5 - target.depth * 9,
                target.x,
                target.y + 3
            )
            context.stroke()
            context.setLineDash([])

            const markerRadiusX = 14 + target.depth * 30
            const markerRadiusY = 5 + target.depth * 9
            context.strokeStyle = `rgba(${scenePalette.target.join(', ')}, ${0.76 + pulse * 0.2})`
            context.lineWidth = 2 + target.depth * 2.2
            context.setLineDash([6, 5])
            context.beginPath()
            context.ellipse(target.x, target.y + 5, markerRadiusX, markerRadiusY, 0, 0, Math.PI * 2)
            context.stroke()
            context.setLineDash([])

            if (Math.abs(target.x - start.x) > 8) {
                const arrowX = mix(start.x, target.x, 0.56)
                const arrowY = mix(start.y, target.y, 0.56) - 6 - target.depth * 7
                const arrowSize = 6 + target.depth * 7
                context.fillStyle = 'rgba(255, 255, 255, 0.94)'
                context.strokeStyle = `rgba(${scenePalette.path.join(', ')}, 0.98)`
                context.lineWidth = 2
                context.beginPath()
                context.arc(arrowX, arrowY, arrowSize + 2, 0, Math.PI * 2)
                context.fill()
                context.stroke()
                context.fillStyle = `rgb(${scenePalette.target.join(', ')})`
                context.font = `900 ${Math.round(8 + target.depth * 8)}px system-ui, sans-serif`
                context.textAlign = 'center'
                context.textBaseline = 'middle'
                context.fillText(direction < 0 ? '←' : '→', arrowX, arrowY + 0.5)
            }
            context.restore()
        }

        function getWorldObjectContainmentScale(object, sceneKey, point) {
            if (!isCompactRunner() || object.kind !== 'obstacle') return 1
            const metrics = OBJECT_RENDER_METRICS[sceneKey]?.[object.type]
            if (!metrics) return 1

            const renderedWidth = metrics.width * point.scale
            const availableWidth = Math.max(10, getLaneSpread(point.depth) * 0.74)
            return clamp(availableWidth / renderedWidth, 0.42, 1)
        }

        function getWorldObjectVerticalContainmentScale(object, horizontalScale) {
            if (!isCompactRunner() || object.kind !== 'obstacle') return horizontalScale
            if (object.type === 'sheet') return Math.max(horizontalScale, 0.72)
            return horizontalScale
        }

        function drawDistantObjectBeacon(object, point, sceneKey, time, containmentScale = 1, beaconDistance = 68) {
            const cue = OBJECT_CUES[object.type]
            const metrics = OBJECT_RENDER_METRICS[sceneKey]?.[object.type]
            if (!cue || !metrics) return

            const approach = clamp((VIEW_DISTANCE - object.distance) / (VIEW_DISTANCE - beaconDistance), 0, 1)
            const pulse = state.reducedMotion ? 0.5 : 0.5 + Math.sin(time * 5.2 + object.lane) * 0.5
            const markerRadius = 8 + approach * 2
            const markerY = point.y - metrics.height * point.scale * containmentScale - 17 - approach * 4
            const [red, green, blue] = cue.color

            context.save()
            context.globalAlpha = point.alpha * (0.76 + approach * 0.24)
            context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${0.58 + pulse * 0.2})`
            context.lineWidth = 1.5
            context.setLineDash([3, 4])
            context.beginPath()
            context.moveTo(point.x, markerY + markerRadius + 3)
            context.lineTo(point.x, point.y - 3)
            context.stroke()
            context.setLineDash([])

            context.fillStyle = 'rgba(255, 255, 255, 0.96)'
            context.beginPath()
            context.arc(point.x, markerY, markerRadius + 2.5, 0, Math.PI * 2)
            context.fill()
            context.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.98)`
            context.beginPath()
            context.arc(point.x, markerY, markerRadius, 0, Math.PI * 2)
            context.fill()
            context.fillStyle = '#ffffff'
            context.font = `900 ${Math.round(9 + approach * 2)}px system-ui, sans-serif`
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillText(cue.symbol, point.x, markerY + 0.5)
            context.restore()
        }

        function drawFinishGate(time) {
            const pulse = state.reducedMotion ? 0.5 : 0.5 + Math.sin(time * 4.2) * 0.5
            drawObjectShadow(108, 0.24, 7)

            const glow = context.createRadialGradient(0, -70, 8, 0, -70, 145)
            glow.addColorStop(0, `rgba(255, 236, 178, ${0.18 + pulse * 0.08})`)
            glow.addColorStop(0.52, `rgba(255, 113, 165, ${0.12 + pulse * 0.05})`)
            glow.addColorStop(1, 'rgba(255, 113, 165, 0)')
            context.fillStyle = glow
            context.beginPath()
            context.arc(0, -70, 145, 0, Math.PI * 2)
            context.fill()

            const arch = context.createLinearGradient(-100, -130, 100, 0)
            arch.addColorStop(0, '#f06d9f')
            arch.addColorStop(0.45, '#ffe19a')
            arch.addColorStop(1, '#55cdbd')
            context.strokeStyle = arch
            context.lineWidth = 11
            context.lineCap = 'round'
            context.beginPath()
            context.moveTo(-92, 0)
            context.lineTo(-92, -86)
            context.bezierCurveTo(-92, -142, 92, -142, 92, -86)
            context.lineTo(92, 0)
            context.stroke()

            context.strokeStyle = 'rgba(255, 255, 255, 0.78)'
            context.lineWidth = 2.2
            context.beginPath()
            context.moveTo(-88, -1)
            context.lineTo(-88, -85)
            context.bezierCurveTo(-88, -132, 88, -132, 88, -85)
            context.lineTo(88, -1)
            context.stroke()

            context.fillStyle = 'rgba(71, 28, 54, 0.94)'
            fillRoundedRect(-63, -137, 126, 34, 17)
            context.strokeStyle = 'rgba(255, 255, 255, 0.9)'
            context.lineWidth = 2
            context.beginPath()
            context.moveTo(-45, -103)
            context.lineTo(45, -103)
            context.stroke()
            context.fillStyle = '#ffffff'
            context.font = '900 15px system-ui, sans-serif'
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillText('META  ♥', 0, -120)

            ;[-66, -34, 0, 34, 66].forEach((x, index) => {
                const y = -112 - Math.sqrt(Math.max(0, 1 - Math.pow(x / 84, 2))) * 24
                drawHeart(x, y, 7 + (index === 2 ? 2 : 0), index % 2 ? '#fff2b3' : '#ff8eb7')
            })

            context.strokeStyle = 'rgba(255, 247, 220, 0.9)'
            context.lineWidth = 5
            context.setLineDash([13, 9])
            context.beginPath()
            context.moveTo(-108, 4)
            context.lineTo(108, 4)
            context.stroke()
            context.setLineDash([])
        }

        function drawObjectGuidance(object, sceneKey, time) {
            const pulse = state.reducedMotion ? 0.5 : 0.5 + Math.sin(time * 5.1 + object.lane) * 0.5

            if (object.kind === 'mia') {
                const mia = SPECIAL_MIA_TOKENS[object.miaIndex] || SPECIAL_MIA_TOKENS[0]
                context.save()
                const glow = context.createRadialGradient(0, -57, 5, 0, -57, 88)
                glow.addColorStop(0, `rgba(255, 222, 126, ${0.42 + pulse * 0.12})`)
                glow.addColorStop(0.5, `rgba(255, 116, 169, ${0.2 + pulse * 0.08})`)
                glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
                context.fillStyle = glow
                context.beginPath()
                context.arc(0, -57, 88, 0, Math.PI * 2)
                context.fill()

                context.strokeStyle = `rgba(255, 211, 102, ${0.86 + pulse * 0.12})`
                context.lineWidth = 4
                context.setLineDash([10, 6])
                context.beginPath()
                context.ellipse(0, 8, 52, 15, 0, 0, Math.PI * 2)
                context.stroke()
                context.setLineDash([])

                context.fillStyle = 'rgba(255, 249, 219, 0.98)'
                context.strokeStyle = mia.accent
                context.lineWidth = 2.6
                context.beginPath()
                context.arc(0, -204, 17, 0, Math.PI * 2)
                context.fill()
                context.stroke()
                context.fillStyle = mia.dark
                context.font = '900 15px system-ui, sans-serif'
                context.textAlign = 'center'
                context.textBaseline = 'middle'
                context.fillText('🐾', 0, -203.5)
                context.restore()
                return
            }

            if (object.kind === 'crate') {
                const crate = ROUTE_CRATES[object.crateIndex]
                if (!crate) return
                context.save()
                const glow = context.createRadialGradient(0, -31, 4, 0, -31, 72)
                glow.addColorStop(0, `rgba(255, 239, 156, ${0.38 + pulse * 0.1})`)
                glow.addColorStop(0.48, `${crate.accent}3d`)
                glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
                context.fillStyle = glow
                context.beginPath()
                context.arc(0, -31, 72, 0, Math.PI * 2)
                context.fill()
                context.strokeStyle = crate.accent
                context.globalAlpha *= 0.82 + pulse * 0.16
                context.lineWidth = 3.8
                context.setLineDash([10, 6])
                context.beginPath()
                context.ellipse(0, 8, 52, 14, 0, 0, Math.PI * 2)
                context.stroke()
                context.setLineDash([])
                context.fillStyle = 'rgba(255, 249, 207, 0.98)'
                context.strokeStyle = crate.accent
                context.lineWidth = 2.5
                context.beginPath()
                context.arc(0, -101, 17, 0, Math.PI * 2)
                context.fill()
                context.stroke()
                context.fillStyle = crate.dark
                context.font = '900 15px system-ui, sans-serif'
                context.textAlign = 'center'
                context.textBaseline = 'middle'
                context.fillText('▣', 0, -100.5)
                context.restore()
                return
            }

            if (object.kind === 'letter') {
                const token = WORD_HUNT_TOKENS[object.letterIndex]
                if (!token) return
                context.save()
                const glow = context.createRadialGradient(0, -32, 3, 0, -32, 66)
                glow.addColorStop(0, `rgba(255, 241, 166, ${0.34 + pulse * 0.08})`)
                glow.addColorStop(0.48, `rgba(103, 224, 204, ${0.16 + pulse * 0.06})`)
                glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
                context.fillStyle = glow
                context.beginPath()
                context.arc(0, -32, 66, 0, Math.PI * 2)
                context.fill()
                context.strokeStyle = token.accent
                context.globalAlpha *= 0.8 + pulse * 0.18
                context.lineWidth = 3.5
                context.setLineDash([8, 6])
                context.beginPath()
                context.ellipse(0, 6, 43, 12, 0, 0, Math.PI * 2)
                context.stroke()
                context.setLineDash([])
                context.fillStyle = 'rgba(255, 249, 214, 0.98)'
                context.strokeStyle = token.accent
                context.lineWidth = 2.5
                context.beginPath()
                context.arc(0, -92, 15, 0, Math.PI * 2)
                context.fill()
                context.stroke()
                context.fillStyle = token.dark
                context.font = '900 14px Georgia, serif'
                context.textAlign = 'center'
                context.textBaseline = 'middle'
                context.fillText(token.letter, 0, -91.5)
                context.restore()
                return
            }

            if (object.kind === 'memory') {
                const memory = MEMORY_TOKENS[object.memoryIndex]
                const accent = memory?.accent || '#f079a5'
                context.save()
                const glow = context.createRadialGradient(0, -38, 4, 0, -38, 76)
                glow.addColorStop(0, 'rgba(255, 222, 235, 0.38)')
                glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
                context.fillStyle = glow
                context.beginPath()
                context.arc(0, -38, 76, 0, Math.PI * 2)
                context.fill()
                context.strokeStyle = accent
                context.globalAlpha *= 0.78 + pulse * 0.2
                context.lineWidth = 3.5
                context.setLineDash([8, 6])
                context.beginPath()
                context.ellipse(0, 7, 47, 13, 0, 0, Math.PI * 2)
                context.stroke()
                context.setLineDash([])
                context.fillStyle = 'rgba(255, 255, 255, 0.97)'
                context.strokeStyle = accent
                context.lineWidth = 2.5
                context.beginPath()
                context.arc(0, -108, 16, 0, Math.PI * 2)
                context.fill()
                context.stroke()
                context.fillStyle = '#741b43'
                context.font = '900 15px system-ui, sans-serif'
                context.textAlign = 'center'
                context.textBaseline = 'middle'
                context.fillText('▣', 0, -107.5)
                context.restore()
                return
            }

            if (object.kind === 'boost') {
                context.save()
                const guideGlow = context.createRadialGradient(0, -13, 2, 0, -13, 66)
                guideGlow.addColorStop(0, `rgba(255, 235, 151, ${0.24 + pulse * 0.08})`)
                guideGlow.addColorStop(0.62, `rgba(77, 230, 205, ${0.14 + pulse * 0.05})`)
                guideGlow.addColorStop(1, 'rgba(77, 230, 205, 0)')
                context.fillStyle = guideGlow
                context.beginPath()
                context.arc(0, -13, 66, 0, Math.PI * 2)
                context.fill()

                context.strokeStyle = `rgba(255, 229, 126, ${0.82 + pulse * 0.16})`
                context.lineWidth = 3.5
                context.setLineDash([9, 6])
                context.beginPath()
                context.ellipse(0, 7, 58, 16, 0, 0, Math.PI * 2)
                context.stroke()
                context.setLineDash([])

                if (!isCompactRunner() && object.distance <= 68) {
                    context.fillStyle = 'rgba(255, 255, 255, 0.97)'
                    fillRoundedRect(-52, -80, 104, 31, 15)
                    const labelGradient = context.createLinearGradient(-50, -78, 50, -51)
                    labelGradient.addColorStop(0, '#168e82')
                    labelGradient.addColorStop(1, '#d86b76')
                    context.fillStyle = labelGradient
                    fillRoundedRect(-50, -78, 100, 27, 13)
                    context.fillStyle = '#ffffff'
                    context.font = '900 12px system-ui, sans-serif'
                    context.textAlign = 'center'
                    context.textBaseline = 'middle'
                    context.fillText('↟  IMPULSO', 0, -64.5)
                }
                context.restore()
                return
            }

            if (object.kind === 'coin' || object.kind === 'power') {
                const power = object.kind === 'power' ? POWERUPS[object.powerType || 'shield'] : null
                const ringColor = power?.color || '#6cf2c4'
                context.save()
                context.strokeStyle = object.kind === 'power'
                    ? ringColor
                    : `rgba(108, 242, 196, ${0.62 + pulse * 0.2})`
                context.globalAlpha *= object.kind === 'power' ? 0.78 + pulse * 0.18 : 1
                context.lineWidth = 3
                context.setLineDash([7, 6])
                context.beginPath()
                context.ellipse(0, 5, object.kind === 'power' ? 38 : 28, object.kind === 'power' ? 12 : 9, 0, 0, Math.PI * 2)
                context.stroke()
                context.setLineDash([])

                if (object.guide) {
                    const labelY = object.kind === 'power' ? -88 : -63
                    context.fillStyle = 'rgba(12, 111, 91, 0.94)'
                    context.strokeStyle = 'rgba(238, 255, 250, 0.95)'
                    context.lineWidth = 2
                    context.beginPath()
                    context.arc(0, labelY, 14, 0, Math.PI * 2)
                    context.fill()
                    context.stroke()
                    context.fillStyle = '#ffffff'
                    context.font = '900 16px system-ui, sans-serif'
                    context.textAlign = 'center'
                    context.textBaseline = 'middle'
                    context.fillText('✓', 0, labelY + 0.5)
                }
                context.restore()
                return
            }

            const metrics = OBJECT_RENDER_METRICS[sceneKey]?.[object.type] || { height: 100, width: 100 }
            const cue = OBJECT_CUES[object.type]
            if (!cue) return

            const [red, green, blue] = cue.color
            const labelWidth = object.type === 'cart' ? 100 : 94
            const labelY = -metrics.height - 35
            const auraY = -metrics.height * 0.42
            const auraRadius = Math.max(metrics.width * 0.72, 64)

            context.save()
            const aura = context.createRadialGradient(0, auraY, 3, 0, auraY, auraRadius)
            aura.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${0.16 + pulse * 0.06})`)
            aura.addColorStop(0.62, `rgba(${red}, ${green}, ${blue}, ${0.1 + pulse * 0.05})`)
            aura.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)
            context.fillStyle = aura
            context.beginPath()
            context.arc(0, auraY, auraRadius, 0, Math.PI * 2)
            context.fill()

            context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${0.84 + pulse * 0.12})`
            context.lineWidth = 4
            context.setLineDash([10, 7])
            context.beginPath()
            context.ellipse(0, 5, Math.max(metrics.width * 0.54, 50), 14, 0, 0, Math.PI * 2)
            context.stroke()
            context.setLineDash([])

            if (isCompactRunner() || object.distance > 68) {
                context.restore()
                return
            }

            context.fillStyle = 'rgba(255, 255, 255, 0.96)'
            fillRoundedRect(-labelWidth / 2 - 2, labelY - 2, labelWidth + 4, 31, 15)
            context.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.95)`
            fillRoundedRect(-labelWidth / 2, labelY, labelWidth, 27, 13)
            context.fillStyle = '#ffffff'
            context.font = '900 12px system-ui, sans-serif'
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillText(cue.text, 0, labelY + 13.5)
            context.restore()
        }

        function drawBoostPad(sceneKey, time) {
            const palette = sceneKey === 'aguamarina'
                ? { dark: '#0a6e70', mid: '#1bc8b7', light: '#fff0a7', edge: '#ff7f8f' }
                : sceneKey === 'hospital'
                    ? { dark: '#286b83', mid: '#73d5cb', light: '#f4fff9', edge: '#8ccfff' }
                    : { dark: '#823251', mid: '#ef7b9f', light: '#ffe49b', edge: '#ffd1de' }
            const pulse = state.reducedMotion ? 0.5 : 0.5 + Math.sin(time * 6.2) * 0.5

            drawObjectShadow(54, 0.24, 7)

            context.save()
            context.translate(0, 2)
            const glow = context.createRadialGradient(0, -9, 2, 0, -9, 62)
            glow.addColorStop(0, `rgba(255, 236, 150, ${0.28 + pulse * 0.08})`)
            glow.addColorStop(0.55, `rgba(80, 230, 207, ${0.16 + pulse * 0.05})`)
            glow.addColorStop(1, 'rgba(80, 230, 207, 0)')
            context.fillStyle = glow
            context.beginPath()
            context.arc(0, -8, 62, 0, Math.PI * 2)
            context.fill()

            context.fillStyle = palette.dark
            context.beginPath()
            context.moveTo(-54, 5)
            context.lineTo(54, 5)
            context.lineTo(38, -25)
            context.lineTo(-38, -25)
            context.closePath()
            context.fill()

            const surface = context.createLinearGradient(0, -27, 0, 4)
            surface.addColorStop(0, palette.light)
            surface.addColorStop(0.43, palette.mid)
            surface.addColorStop(1, palette.dark)
            context.fillStyle = surface
            context.strokeStyle = palette.edge
            context.lineWidth = 3
            context.beginPath()
            context.moveTo(-46, 1)
            context.lineTo(46, 1)
            context.lineTo(34, -21)
            context.lineTo(-34, -21)
            context.closePath()
            context.fill()
            context.stroke()

            context.strokeStyle = `rgba(255, 255, 246, ${0.82 + pulse * 0.16})`
            context.lineWidth = 4
            context.lineCap = 'round'
            ;[0, 1].forEach((index) => {
                const y = -2 - index * 10
                const spread = 16 - index * 2
                context.beginPath()
                context.moveTo(-spread, y + 4)
                context.lineTo(0, y - 4)
                context.lineTo(spread, y + 4)
                context.stroke()
            })

            context.strokeStyle = 'rgba(255, 255, 255, 0.44)'
            context.lineWidth = 1.5
            context.beginPath()
            context.moveTo(-35, -20)
            context.lineTo(35, -20)
            context.stroke()
            context.restore()
        }

        function drawPhotographicObstacle(sceneKey, type) {
            const image = objectImages[`${sceneKey}-${type}`]
            const metrics = OBJECT_RENDER_METRICS[sceneKey]?.[type]
            if (!metrics || !isImageReady(image)) return false

            const isGroundObstacle = type === 'spill'
            drawObjectShadow(
                metrics.shadow,
                isGroundObstacle ? 0.09 : 0.27,
                isGroundObstacle ? 2 : 5
            )
            context.drawImage(
                image,
                -metrics.width / 2,
                -metrics.height + (isGroundObstacle ? 3 : 5),
                metrics.width,
                metrics.height
            )
            return true
        }

        function drawMemoryCollectible(object, time) {
            const memory = MEMORY_TOKENS[object.memoryIndex]
            if (!memory) return
            const image = backgroundImages[memory.imageKey]
            const pulse = 1 + (state.reducedMotion ? 0 : Math.sin(time * 4.2 + object.spin) * 0.035)
            const tilt = state.reducedMotion ? -0.035 : Math.sin(time * 1.85 + object.memoryIndex) * 0.055

            drawObjectShadow(36, 0.2, 9)
            const aura = context.createRadialGradient(0, -39, 3, 0, -39, 62)
            aura.addColorStop(0, 'rgba(255, 249, 218, 0.8)')
            aura.addColorStop(0.42, 'rgba(255, 126, 176, 0.24)')
            aura.addColorStop(1, 'rgba(255, 255, 255, 0)')
            context.fillStyle = aura
            context.beginPath()
            context.arc(0, -39, 62, 0, Math.PI * 2)
            context.fill()

            context.save()
            context.translate(0, -40)
            context.rotate(tilt)
            context.scale(pulse, pulse)
            context.shadowColor = 'rgba(61, 20, 45, 0.34)'
            context.shadowBlur = 14
            context.shadowOffsetY = 7
            context.fillStyle = 'rgba(255, 253, 248, 0.99)'
            fillRoundedRect(-38, -48, 76, 94, 8)
            context.shadowColor = 'transparent'

            context.save()
            roundedRectPath(-32, -42, 64, 58, 5)
            context.clip()
            if (isImageReady(image)) {
                drawImageCover(image, -32, -42, 64, 58)
            } else {
                const fallback = context.createLinearGradient(-32, -42, 32, 16)
                fallback.addColorStop(0, memory.accent)
                fallback.addColorStop(1, '#ffe2b9')
                context.fillStyle = fallback
                context.fillRect(-32, -42, 64, 58)
            }
            context.restore()

            context.strokeStyle = 'rgba(116, 27, 67, 0.16)'
            context.lineWidth = 1.3
            roundedRectPath(-32, -42, 64, 58, 5)
            context.stroke()
            drawHeart(-20, 29, 4.8, memory.accent, '#982e5d')
            context.fillStyle = '#741b43'
            context.font = '900 9px system-ui, sans-serif'
            context.textAlign = 'left'
            context.textBaseline = 'middle'
            context.fillText(memory.title.toUpperCase(), -11, 29.5)

            context.fillStyle = memory.accent
            context.strokeStyle = 'rgba(255, 255, 255, 0.94)'
            context.lineWidth = 2
            context.beginPath()
            context.arc(30, -39, 10, 0, Math.PI * 2)
            context.fill()
            context.stroke()
            context.fillStyle = '#ffffff'
            context.font = '900 9px system-ui, sans-serif'
            context.textAlign = 'center'
            context.fillText(String(object.memoryIndex + 1), 30, -38.5)
            context.restore()
        }

        function drawMiaCollectible(object, time) {
            const image = objectImages['collectible-mia-salchicha']
            const mia = SPECIAL_MIA_TOKENS[object.miaIndex] || SPECIAL_MIA_TOKENS[0]
            const pulse = 1 + (state.reducedMotion ? 0 : Math.sin(time * 4.6 + object.spin) * 0.035)
            const bob = state.reducedMotion ? 0 : Math.sin(time * 3.2 + object.spin * 0.35) * 3.5
            const tilt = state.reducedMotion ? 0 : Math.sin(time * 2.1 + object.spin) * 0.035

            drawObjectShadow(48, 0.24, 9)
            const aura = context.createRadialGradient(0, -68, 8, 0, -68, 92)
            aura.addColorStop(0, 'rgba(255, 248, 197, 0.72)')
            aura.addColorStop(0.42, 'rgba(255, 139, 179, 0.26)')
            aura.addColorStop(1, 'rgba(255, 255, 255, 0)')
            context.fillStyle = aura
            context.beginPath()
            context.arc(0, -68, 92, 0, Math.PI * 2)
            context.fill()

            context.save()
            context.translate(0, bob)
            context.rotate(tilt)
            context.scale(pulse, pulse)
            if (isImageReady(image)) {
                const height = 154
                const width = height * image.naturalWidth / image.naturalHeight
                context.shadowColor = 'rgba(66, 24, 38, 0.34)'
                context.shadowBlur = 14
                context.shadowOffsetY = 8
                context.drawImage(image, -width / 2, -height + 7, width, height)
                context.shadowColor = 'transparent'
            } else {
                context.fillStyle = '#fff4c9'
                context.strokeStyle = mia.accent
                context.lineWidth = 3
                context.beginPath()
                context.arc(0, -66, 45, 0, Math.PI * 2)
                context.fill()
                context.stroke()
                context.fillStyle = mia.dark
                context.font = '900 34px system-ui, sans-serif'
                context.textAlign = 'center'
                context.textBaseline = 'middle'
                context.fillText('🐾', 0, -64)
            }

            context.fillStyle = 'rgba(255, 250, 223, 0.98)'
            context.strokeStyle = mia.accent
            context.lineWidth = 2.4
            fillRoundedRect(-34, -173, 68, 22, 11)
            context.strokeStyle = 'rgba(111, 41, 76, 0.24)'
            roundedRectPath(-34, -173, 68, 22, 11)
            context.stroke()
            context.fillStyle = mia.dark
            context.font = '900 9px system-ui, sans-serif'
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillText(`MÍA ${object.miaIndex + 1}/${SPECIAL_MIA_TOKENS.length}`, 0, -161.8)
            context.restore()
        }

        function drawWordHuntCollectible(object, time) {
            const token = WORD_HUNT_TOKENS[object.letterIndex]
            if (!token) return
            const pulse = 1 + (state.reducedMotion ? 0 : Math.sin(time * 4.8 + object.spin) * 0.045)
            const flip = state.reducedMotion ? 1 : 0.58 + Math.abs(Math.cos(time * 1.25 + object.spin * 0.22)) * 0.42
            const tilt = state.reducedMotion ? 0 : Math.sin(time * 1.8 + object.letterIndex) * 0.055

            drawObjectShadow(32, 0.18, 8)
            const aura = context.createRadialGradient(0, -32, 3, 0, -32, 55)
            aura.addColorStop(0, 'rgba(255, 251, 217, 0.92)')
            aura.addColorStop(0.44, `${token.accent}55`)
            aura.addColorStop(1, 'rgba(255, 255, 255, 0)')
            context.fillStyle = aura
            context.beginPath()
            context.arc(0, -32, 55, 0, Math.PI * 2)
            context.fill()

            context.save()
            context.translate(0, -33)
            context.rotate(tilt)
            context.scale(flip * pulse, pulse)
            context.shadowColor = `${token.dark}66`
            context.shadowBlur = 15
            context.shadowOffsetY = 7
            const tile = context.createLinearGradient(-28, -30, 28, 31)
            tile.addColorStop(0, '#fff4b8')
            tile.addColorStop(0.34, token.accent)
            tile.addColorStop(1, token.dark)
            context.fillStyle = tile
            fillRoundedRect(-28, -31, 56, 62, 14)
            context.shadowColor = 'transparent'
            context.strokeStyle = 'rgba(255, 255, 255, 0.92)'
            context.lineWidth = 3
            roundedRectPath(-25.5, -28.5, 51, 57, 12)
            context.stroke()

            context.save()
            context.globalAlpha = 0.22
            context.strokeStyle = '#ffffff'
            context.lineWidth = 2.2
            if (token.scene === 'lodares') {
                context.beginPath()
                context.moveTo(-18, 19)
                context.lineTo(-18, 3)
                context.bezierCurveTo(-18, -12, 18, -12, 18, 3)
                context.lineTo(18, 19)
                context.stroke()
            } else if (token.scene === 'aguamarina') {
                ;[-1, 0, 1].forEach((wave) => {
                    context.beginPath()
                    context.arc(wave * 14, 13, 12, Math.PI * 1.08, Math.PI * 1.92)
                    context.stroke()
                })
            } else {
                context.fillStyle = '#ffffff'
                fillRoundedRect(-5, -21, 10, 42, 4)
                fillRoundedRect(-19, -7, 38, 14, 4)
            }
            context.restore()

            context.fillStyle = '#ffffff'
            context.shadowColor = 'rgba(55, 24, 44, 0.32)'
            context.shadowBlur = 4
            context.font = '900 36px "DM Serif Display", Georgia, serif'
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillText(token.letter, 0, -1)
            context.shadowColor = 'transparent'
            drawHeart(18, 20, 4.5, '#fff0a8', '#f079a5')
            context.restore()
        }

        function drawRouteCrate(object, time) {
            const crate = ROUTE_CRATES[object.crateIndex]
            if (!crate) return
            const pulse = state.reducedMotion ? 0.5 : 0.5 + Math.sin(time * 4.5 + object.crateIndex) * 0.5
            const bob = state.reducedMotion ? 0 : Math.sin(time * 2.15 + object.crateIndex * 0.8) * 2.4
            const lidLift = state.reducedMotion ? 0 : pulse * 1.8

            drawObjectShadow(43, 0.24, 9)
            const aura = context.createRadialGradient(0, -34, 5, 0, -34, 67)
            aura.addColorStop(0, `rgba(255, 248, 194, ${0.58 + pulse * 0.13})`)
            aura.addColorStop(0.48, `${crate.accent}42`)
            aura.addColorStop(1, 'rgba(255, 255, 255, 0)')
            context.fillStyle = aura
            context.beginPath()
            context.arc(0, -34, 67, 0, Math.PI * 2)
            context.fill()

            context.save()
            context.translate(0, bob - 31)
            context.shadowColor = `${crate.dark}70`
            context.shadowBlur = 16
            context.shadowOffsetY = 8

            const bodyGradient = context.createLinearGradient(-42, -25, 42, 29)
            bodyGradient.addColorStop(0, crate.accent)
            bodyGradient.addColorStop(0.62, crate.dark)
            bodyGradient.addColorStop(1, '#48243d')
            context.fillStyle = bodyGradient
            fillRoundedRect(-43, -25, 86, 53, 10)
            context.shadowColor = 'transparent'

            context.fillStyle = `${crate.dark}cc`
            context.beginPath()
            context.moveTo(34, -20)
            context.lineTo(43, -25)
            context.lineTo(43, 20)
            context.lineTo(34, 27)
            context.closePath()
            context.fill()

            context.save()
            context.translate(0, -lidLift)
            const lidGradient = context.createLinearGradient(-46, -43, 46, -19)
            lidGradient.addColorStop(0, '#fff0a4')
            lidGradient.addColorStop(0.3, crate.accent)
            lidGradient.addColorStop(1, crate.dark)
            context.fillStyle = lidGradient
            fillRoundedRect(-47, -43, 94, 24, 8)
            context.strokeStyle = 'rgba(255, 255, 255, 0.84)'
            context.lineWidth = 2.4
            roundedRectPath(-44, -40, 88, 18, 6)
            context.stroke()
            context.restore()

            context.fillStyle = 'rgba(255, 228, 120, 0.94)'
            fillRoundedRect(-7, -43 - lidLift, 14, 71 + lidLift, 4)
            context.fillStyle = 'rgba(255, 241, 174, 0.82)'
            fillRoundedRect(-43, -9, 86, 11, 3)

            context.save()
            context.globalAlpha = 0.82
            context.strokeStyle = '#ffffff'
            context.fillStyle = '#ffffff'
            context.lineWidth = 2.1
            context.lineCap = 'round'
            if (crate.scene === 'lodares') {
                context.beginPath()
                context.moveTo(-28, 20)
                context.lineTo(-28, 12)
                context.bezierCurveTo(-28, 1, -12, 1, -12, 12)
                context.lineTo(-12, 20)
                context.stroke()
            } else if (crate.scene === 'aguamarina') {
                ;[-1, 0, 1].forEach((wave) => {
                    context.beginPath()
                    context.arc(-20 + wave * 8, 13, 7, Math.PI * 1.08, Math.PI * 1.92)
                    context.stroke()
                })
            } else {
                context.beginPath()
                context.arc(-24, 14, 5, 0, Math.PI * 2)
                context.fill()
                ;[-31, -25, -18].forEach((x, index) => {
                    context.beginPath()
                    context.arc(x, 6 - Math.abs(index - 1) * 2, 2.5, 0, Math.PI * 2)
                    context.fill()
                })
            }
            context.restore()

            context.fillStyle = 'rgba(255, 255, 255, 0.94)'
            context.font = '900 8px system-ui, sans-serif'
            context.textAlign = 'right'
            context.textBaseline = 'middle'
            context.fillText(`${object.crateIndex + 1}/${ROUTE_CRATES.length}`, 34, 14)

            context.fillStyle = '#fff4b6'
            context.strokeStyle = 'rgba(117, 38, 72, 0.72)'
            context.lineWidth = 1.8
            context.beginPath()
            context.arc(0, 1, 9.5, 0, Math.PI * 2)
            context.fill()
            context.stroke()
            drawHeart(0, 2, 4.8, crate.accent, crate.dark)
            context.restore()
        }

        function drawImageCover(image, x, y, width, height) {
            const imageRatio = image.naturalWidth / Math.max(1, image.naturalHeight)
            const frameRatio = width / Math.max(1, height)
            let sourceX = 0
            let sourceY = 0
            let sourceWidth = image.naturalWidth
            let sourceHeight = image.naturalHeight
            if (imageRatio > frameRatio) {
                sourceWidth = image.naturalHeight * frameRatio
                sourceX = (image.naturalWidth - sourceWidth) * 0.5
            } else {
                sourceHeight = image.naturalWidth / frameRatio
                sourceY = (image.naturalHeight - sourceHeight) * 0.5
            }
            context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
        }

        function drawPhotographicCollectible(kind, object, time) {
            const image = objectImages[`collectible-${kind}`]
            if (!isImageReady(image)) return false

            const isHeart = kind === 'heart'
            const pulse = 1 + Math.sin(time * (isHeart ? 4.4 : 5.6) + object.spin) * 0.035
            const flip = isHeart
                ? 0.34 + Math.abs(Math.cos(object.spin + time * 0.82)) * 0.66
                : 1
            const width = isHeart ? 46 : 62
            const height = isHeart ? 47 : 72
            const centerY = isHeart ? -17 : -28

            drawObjectShadow(isHeart ? 23 : 29, 0.15, 9)
            const aura = context.createRadialGradient(0, centerY, 2, 0, centerY, isHeart ? 31 : 43)
            aura.addColorStop(0, isHeart ? 'rgba(255, 231, 241, 0.88)' : 'rgba(234, 255, 251, 0.94)')
            aura.addColorStop(0.45, isHeart ? 'rgba(246, 77, 138, 0.25)' : 'rgba(62, 219, 208, 0.3)')
            aura.addColorStop(1, 'rgba(255, 255, 255, 0)')
            context.fillStyle = aura
            context.beginPath()
            context.arc(0, centerY, isHeart ? 31 : 43, 0, Math.PI * 2)
            context.fill()

            context.save()
            context.translate(0, centerY)
            context.scale(flip * pulse, pulse)
            if (!state.reducedMotion && !isHeart) context.rotate(Math.sin(time * 1.7 + object.spin) * 0.025)
            context.drawImage(image, -width / 2, -height / 2, width, height)
            context.restore()
            return true
        }

        function drawPowerCollectible(object, time) {
            const powerType = object.powerType || 'shield'
            if (powerType === 'shield') {
                if (!drawPhotographicCollectible('shield', object, time)) drawCareShield(object, time)
                return
            }

            const pulse = 1 + Math.sin(time * 5.4 + object.spin) * 0.045
            drawObjectShadow(30, 0.16, 9)
            context.save()
            context.scale(pulse, pulse)

            if (powerType === 'flight') {
                const aura = context.createRadialGradient(0, -29, 3, 0, -29, 58)
                aura.addColorStop(0, 'rgba(248, 254, 255, 0.99)')
                aura.addColorStop(0.42, 'rgba(102, 213, 255, 0.42)')
                aura.addColorStop(0.75, 'rgba(255, 130, 179, 0.2)')
                aura.addColorStop(1, 'rgba(90, 201, 239, 0)')
                context.fillStyle = aura
                context.beginPath()
                context.arc(0, -29, 58, 0, Math.PI * 2)
                context.fill()
                drawWingedHeart(0, -29, 1, time)
                context.fillStyle = '#e9fbff'
                context.strokeStyle = 'rgba(255, 255, 255, 0.96)'
                context.lineWidth = 2
                context.beginPath()
                context.arc(25, -48, 10, 0, Math.PI * 2)
                context.fill()
                context.stroke()
                context.fillStyle = '#397c9d'
                context.font = '900 12px system-ui, sans-serif'
                context.textAlign = 'center'
                context.textBaseline = 'middle'
                context.fillText('↑', 25, -47.5)
            } else if (powerType === 'sneakers') {
                const aura = context.createRadialGradient(0, -28, 3, 0, -28, 52)
                aura.addColorStop(0, 'rgba(252, 247, 255, 0.98)')
                aura.addColorStop(0.42, 'rgba(178, 145, 255, 0.42)')
                aura.addColorStop(1, 'rgba(139, 104, 232, 0)')
                context.fillStyle = aura
                context.beginPath()
                context.arc(0, -28, 52, 0, Math.PI * 2)
                context.fill()
                context.save()
                context.translate(0, -27)
                if (!state.reducedMotion) context.rotate(Math.sin(time * 2.1) * 0.045)
                drawImpulseShoe(-12, -2, -0.13)
                drawImpulseShoe(12, 7, 0.12)
                context.fillStyle = '#fff0a8'
                context.strokeStyle = 'rgba(255, 255, 255, 0.95)'
                context.lineWidth = 2
                context.beginPath()
                context.arc(21, -21, 10, 0, Math.PI * 2)
                context.fill()
                context.stroke()
                context.fillStyle = '#633e9f'
                context.font = '900 14px system-ui, sans-serif'
                context.textAlign = 'center'
                context.textBaseline = 'middle'
                context.fillText('↟', 21, -20.5)
                context.restore()
            } else if (powerType === 'magnet') {
                const aura = context.createRadialGradient(0, -27, 2, 0, -27, 48)
                aura.addColorStop(0, 'rgba(255, 240, 247, 0.96)')
                aura.addColorStop(0.43, 'rgba(255, 103, 159, 0.34)')
                aura.addColorStop(1, 'rgba(255, 103, 159, 0)')
                context.fillStyle = aura
                context.beginPath()
                context.arc(0, -27, 48, 0, Math.PI * 2)
                context.fill()
                context.save()
                context.translate(0, -27)
                if (!state.reducedMotion) context.rotate(Math.sin(time * 1.7) * 0.045)
                const magnetGradient = context.createLinearGradient(-25, -30, 25, 28)
                magnetGradient.addColorStop(0, '#ff8db7')
                magnetGradient.addColorStop(0.48, '#c92f6b')
                magnetGradient.addColorStop(1, '#741b43')
                context.strokeStyle = magnetGradient
                context.lineWidth = 13
                context.lineCap = 'round'
                context.beginPath()
                context.arc(0, 0, 25, Math.PI * 0.04, Math.PI * 0.96)
                context.stroke()
                context.strokeStyle = '#fff1c2'
                context.lineWidth = 8
                context.beginPath()
                context.moveTo(-24, 2)
                context.lineTo(-20, 16)
                context.moveTo(24, 2)
                context.lineTo(20, 16)
                context.stroke()
                drawHeart(0, 4, 9, '#ff6f9f', '#8e2451')
                context.restore()
            } else {
                const aura = context.createRadialGradient(0, -27, 3, 0, -27, 49)
                aura.addColorStop(0, 'rgba(255, 251, 222, 0.98)')
                aura.addColorStop(0.46, 'rgba(255, 202, 67, 0.4)')
                aura.addColorStop(1, 'rgba(255, 202, 67, 0)')
                context.fillStyle = aura
                context.beginPath()
                context.arc(0, -27, 49, 0, Math.PI * 2)
                context.fill()
                context.save()
                context.translate(0, -27)
                if (!state.reducedMotion) context.rotate(Math.sin(time * 1.9) * 0.055)
                const medallion = context.createLinearGradient(-26, -26, 28, 30)
                medallion.addColorStop(0, '#fff6b9')
                medallion.addColorStop(0.46, '#ffd35f')
                medallion.addColorStop(1, '#d58b12')
                context.fillStyle = medallion
                context.strokeStyle = 'rgba(255, 255, 239, 0.96)'
                context.lineWidth = 3
                context.beginPath()
                context.arc(0, 0, 27, 0, Math.PI * 2)
                context.fill()
                context.stroke()
                context.strokeStyle = 'rgba(121, 67, 10, 0.36)'
                context.lineWidth = 2
                context.beginPath()
                context.arc(0, 0, 20, 0, Math.PI * 2)
                context.stroke()
                context.fillStyle = '#741b43'
                context.font = '900 20px system-ui, sans-serif'
                context.textAlign = 'center'
                context.textBaseline = 'middle'
                context.fillText('×2', 0, 1)
                context.restore()
            }
            context.restore()
        }

        function drawImpulseShoe(x, y, rotation) {
            context.save()
            context.translate(x, y)
            context.rotate(rotation)
            const shoeGradient = context.createLinearGradient(-16, -14, 18, 12)
            shoeGradient.addColorStop(0, '#e9ddff')
            shoeGradient.addColorStop(0.5, '#ad8df0')
            shoeGradient.addColorStop(1, '#6944ae')
            context.fillStyle = shoeGradient
            context.strokeStyle = 'rgba(255, 255, 255, 0.96)'
            context.lineWidth = 2
            context.beginPath()
            context.moveTo(-15, -11)
            context.quadraticCurveTo(-4, -15, 5, -8)
            context.lineTo(10, 0)
            context.quadraticCurveTo(20, 2, 19, 9)
            context.quadraticCurveTo(8, 14, -11, 9)
            context.quadraticCurveTo(-17, 2, -15, -11)
            context.closePath()
            context.fill()
            context.stroke()
            context.strokeStyle = '#fff1ad'
            context.lineWidth = 2.2
            context.lineCap = 'round'
            ;[-4, 1, 6].forEach((laceX) => {
                context.beginPath()
                context.moveTo(laceX - 4, -5)
                context.lineTo(laceX + 1, -1)
                context.stroke()
            })
            context.strokeStyle = 'rgba(71, 42, 118, 0.52)'
            context.lineWidth = 2
            context.beginPath()
            context.moveTo(-11, 8)
            context.quadraticCurveTo(4, 12, 16, 7)
            context.stroke()
            context.restore()
        }

        function drawWingedHeart(x, y, scale = 1, time = 0) {
            const flap = state.reducedMotion ? 0.08 : Math.sin(time * 5.6) * 0.12
            context.save()
            context.translate(x, y)
            context.scale(scale, scale)
            ;[-1, 1].forEach((side) => {
                context.save()
                context.scale(side, 1)
                context.rotate(flap * side)
                const wing = context.createLinearGradient(12, -22, 50, 18)
                wing.addColorStop(0, 'rgba(255, 255, 255, 0.98)')
                wing.addColorStop(0.56, 'rgba(181, 235, 255, 0.94)')
                wing.addColorStop(1, 'rgba(112, 204, 238, 0.78)')
                context.fillStyle = wing
                context.strokeStyle = 'rgba(255, 255, 255, 0.96)'
                context.lineWidth = 2
                context.beginPath()
                context.moveTo(9, -9)
                context.bezierCurveTo(24, -30, 48, -29, 51, -13)
                context.bezierCurveTo(39, -13, 28, -5, 18, 7)
                context.bezierCurveTo(30, 3, 40, 6, 43, 15)
                context.bezierCurveTo(27, 17, 14, 9, 8, 1)
                context.closePath()
                context.fill()
                context.stroke()
                context.strokeStyle = 'rgba(72, 151, 185, 0.42)'
                context.lineWidth = 1.4
                context.beginPath()
                context.moveTo(12, -5)
                context.quadraticCurveTo(28, -15, 45, -15)
                context.moveTo(14, 1)
                context.quadraticCurveTo(28, 7, 39, 11)
                context.stroke()
                context.restore()
            })
            drawHeart(0, 0, 24, '#ff7eae', '#a72b60')
            context.fillStyle = 'rgba(255, 255, 255, 0.8)'
            context.beginPath()
            context.ellipse(-5, -8, 4, 7, -0.52, 0, Math.PI * 2)
            context.fill()
            context.restore()
        }

        function drawObjectShadow(width, opacity = 0.26, y = 4) {
            const shadow = context.createRadialGradient(0, y, 2, 0, y, width)
            shadow.addColorStop(0, `rgba(21, 24, 27, ${opacity})`)
            shadow.addColorStop(0.62, `rgba(21, 24, 27, ${opacity * 0.58})`)
            shadow.addColorStop(1, 'rgba(21, 24, 27, 0)')
            context.fillStyle = shadow
            context.beginPath()
            context.ellipse(0, y, width, width * 0.22, 0, 0, Math.PI * 2)
            context.fill()
        }

        function drawGlassHeart(object, time) {
            const squeeze = 0.28 + Math.abs(Math.cos(object.spin + time * 0.82)) * 0.72
            const pulse = 1 + Math.sin(time * 4.4 + object.spin) * 0.035
            drawObjectShadow(23, 0.16, 10)

            context.save()
            context.scale(squeeze * pulse, pulse)
            const aura = context.createRadialGradient(0, -9, 2, 0, -9, 31)
            aura.addColorStop(0, 'rgba(255, 220, 234, 0.88)')
            aura.addColorStop(0.46, 'rgba(244, 92, 146, 0.24)')
            aura.addColorStop(1, 'rgba(244, 92, 146, 0)')
            context.fillStyle = aura
            context.beginPath()
            context.arc(0, -9, 31, 0, Math.PI * 2)
            context.fill()

            drawHeart(4, -4, 18, '#7c214f', '#4a1231')
            drawHeart(0, -9, 18, '#ff8cb4', '#b92965')
            context.strokeStyle = 'rgba(255, 245, 249, 0.8)'
            context.lineWidth = 1.8
            context.beginPath()
            context.arc(-5, -15, 5, 3.5, 5.45)
            context.stroke()
            context.fillStyle = 'rgba(255, 255, 255, 0.9)'
            context.beginPath()
            context.arc(-7, -18, 2, 0, Math.PI * 2)
            context.fill()
            context.restore()
        }

        function drawCareShield(object, time) {
            const pulse = 1 + Math.sin(time * 5.6 + object.spin) * 0.05
            context.scale(pulse, pulse)
            drawObjectShadow(28, 0.15, 8)

            const aura = context.createRadialGradient(0, -25, 1, 0, -25, 43)
            aura.addColorStop(0, 'rgba(231, 255, 249, 0.98)')
            aura.addColorStop(0.43, 'rgba(89, 229, 205, 0.42)')
            aura.addColorStop(1, 'rgba(48, 177, 168, 0)')
            context.fillStyle = aura
            context.beginPath()
            context.arc(0, -25, 43, 0, Math.PI * 2)
            context.fill()

            const glass = context.createLinearGradient(-24, -51, 25, 2)
            glass.addColorStop(0, 'rgba(235, 255, 251, 0.98)')
            glass.addColorStop(0.36, 'rgba(116, 230, 211, 0.88)')
            glass.addColorStop(1, 'rgba(29, 117, 119, 0.94)')
            context.fillStyle = glass
            context.beginPath()
            context.moveTo(0, -55)
            context.bezierCurveTo(17, -49, 27, -46, 28, -39)
            context.lineTo(23, -18)
            context.bezierCurveTo(18, -5, 7, 1, 0, 5)
            context.bezierCurveTo(-7, 1, -18, -5, -23, -18)
            context.lineTo(-28, -39)
            context.bezierCurveTo(-27, -46, -17, -49, 0, -55)
            context.closePath()
            context.fill()
            context.strokeStyle = 'rgba(255, 255, 255, 0.78)'
            context.lineWidth = 2
            context.stroke()

            context.fillStyle = '#f8fffb'
            fillRoundedRect(-4, -40, 8, 27, 2)
            fillRoundedRect(-14, -31, 28, 8, 2)
            drawHeart(15, -8, 7, '#ec6795', '#9f2859')
        }

        function drawSceneSolidObstacle(sceneKey, time) {
            if (sceneKey === 'lodares') drawLodaresPlanter(time)
            else if (sceneKey === 'aguamarina') drawBeachDeckChair(time)
            else drawHyperrealHospitalCart(time)
        }

        function drawSceneJumpObstacle(sceneKey, time) {
            if (sceneKey === 'lodares') drawLodaresPuddle(time)
            else if (sceneKey === 'aguamarina') drawTidePool(time)
            else drawHospitalSpill(time)
        }

        function drawSceneOverheadObstacle(sceneKey, time) {
            if (sceneKey === 'lodares') drawLodaresAwning(time)
            else if (sceneKey === 'aguamarina') drawBeachCanopy(time)
            else drawHospitalCurtain(time)
        }

        function drawLodaresPlanter(time) {
            drawObjectShadow(48, 0.28)
            const stone = context.createLinearGradient(-42, -57, 44, -4)
            stone.addColorStop(0, '#f1dfc3')
            stone.addColorStop(0.28, '#ad9072')
            stone.addColorStop(0.62, '#dbc5a4')
            stone.addColorStop(1, '#695347')
            context.fillStyle = stone
            fillRoundedRect(-42, -51, 84, 46, 7)
            context.fillStyle = '#725849'
            fillRoundedRect(-47, -57, 94, 10, 4)
            context.fillStyle = 'rgba(255, 245, 218, 0.46)'
            fillRoundedRect(-33, -43, 5, 29, 2)
            context.strokeStyle = 'rgba(76, 56, 48, 0.54)'
            context.lineWidth = 2
            context.strokeRect(-27, -39, 54, 23)

            const stems = [-30, -21, -13, -4, 6, 16, 27]
            stems.forEach((x, index) => {
                const sway = state.reducedMotion ? 0 : Math.sin(time * 1.5 + index) * 2
                context.strokeStyle = index % 2 ? '#3d683e' : '#577b48'
                context.lineWidth = 2.5
                context.beginPath()
                context.moveTo(x * 0.8, -54)
                context.quadraticCurveTo(x + sway, -76 - index % 3 * 5, x + sway * 1.2, -87 - index % 2 * 7)
                context.stroke()
                context.fillStyle = index % 3 === 0 ? '#d8537f' : index % 3 === 1 ? '#f4a0b8' : '#f6d9bd'
                for (let petal = 0; petal < 5; petal += 1) {
                    context.save()
                    context.translate(x + sway * 1.2, -89 - index % 2 * 7)
                    context.rotate(petal / 5 * Math.PI * 2)
                    context.beginPath()
                    context.ellipse(0, -5, 3.4, 6.5, 0, 0, Math.PI * 2)
                    context.fill()
                    context.restore()
                }
                context.fillStyle = '#f2c453'
                context.beginPath()
                context.arc(x + sway * 1.2, -89 - index % 2 * 7, 2.6, 0, Math.PI * 2)
                context.fill()
            })
        }

        function drawBeachDeckChair() {
            drawObjectShadow(49, 0.3)
            context.strokeStyle = '#6e422d'
            context.lineWidth = 7
            context.lineCap = 'round'
            context.beginPath()
            context.moveTo(-35, -3)
            context.lineTo(-20, -72)
            context.lineTo(36, -5)
            context.moveTo(30, -3)
            context.lineTo(12, -76)
            context.stroke()

            const fabric = context.createLinearGradient(-28, -69, 31, -8)
            fabric.addColorStop(0, '#f4e6cb')
            fabric.addColorStop(0.18, '#2f9ca0')
            fabric.addColorStop(0.39, '#f4e6cb')
            fabric.addColorStop(0.58, '#d75e78')
            fabric.addColorStop(0.8, '#f4e6cb')
            fabric.addColorStop(1, '#2f7f85')
            context.fillStyle = fabric
            context.beginPath()
            context.moveTo(-20, -68)
            context.lineTo(12, -72)
            context.lineTo(32, -10)
            context.lineTo(-8, -12)
            context.closePath()
            context.fill()
            context.strokeStyle = 'rgba(255, 255, 255, 0.5)'
            context.lineWidth = 1.5
            context.stroke()

            const seat = context.createLinearGradient(-13, -27, 42, -4)
            seat.addColorStop(0, '#2f8f94')
            seat.addColorStop(0.34, '#f5e7ca')
            seat.addColorStop(0.66, '#d45f7a')
            seat.addColorStop(1, '#f5e7ca')
            context.fillStyle = seat
            context.beginPath()
            context.moveTo(-8, -23)
            context.lineTo(28, -22)
            context.lineTo(45, -6)
            context.lineTo(-24, -6)
            context.closePath()
            context.fill()
            context.strokeStyle = '#68412f'
            context.lineWidth = 4
            context.beginPath()
            context.moveTo(-24, -6)
            context.lineTo(45, -6)
            context.moveTo(-8, -23)
            context.lineTo(28, -22)
            context.stroke()

            const bag = context.createLinearGradient(-53, -41, -17, -5)
            bag.addColorStop(0, '#e7b05f')
            bag.addColorStop(1, '#8d4f36')
            context.fillStyle = bag
            fillRoundedRect(-52, -36, 31, 29, 8)
            context.strokeStyle = '#6e3d2d'
            context.lineWidth = 3
            context.beginPath()
            context.arc(-36, -34, 10, Math.PI, Math.PI * 2)
            context.stroke()
        }

        function drawHyperrealHospitalCart() {
            drawObjectShadow(48, 0.32)
            const chrome = context.createLinearGradient(-46, 0, 47, 0)
            chrome.addColorStop(0, '#44565b')
            chrome.addColorStop(0.16, '#dbe8e7')
            chrome.addColorStop(0.42, '#748b8d')
            chrome.addColorStop(0.68, '#f7ffff')
            chrome.addColorStop(1, '#51666b')

            context.strokeStyle = chrome
            context.lineWidth = 5
            context.lineCap = 'round'
            context.beginPath()
            context.moveTo(-37, -66)
            context.lineTo(-37, -10)
            context.moveTo(37, -66)
            context.lineTo(37, -10)
            context.moveTo(-40, -62)
            context.lineTo(43, -62)
            context.moveTo(-40, -25)
            context.lineTo(40, -25)
            context.stroke()

            const tray = context.createLinearGradient(-42, -72, 43, -56)
            tray.addColorStop(0, '#6e8589')
            tray.addColorStop(0.3, '#f0f8f5')
            tray.addColorStop(0.57, '#9aadae')
            tray.addColorStop(1, '#455b60')
            context.fillStyle = tray
            fillRoundedRect(-44, -70, 88, 12, 5)
            fillRoundedRect(-42, -33, 84, 10, 4)

            context.fillStyle = '#253238'
            ;[-34, 34].forEach((x) => {
                context.beginPath()
                context.arc(x, -4, 8, 0, Math.PI * 2)
                context.fill()
                context.fillStyle = '#aebebd'
                context.beginPath()
                context.arc(x, -4, 3, 0, Math.PI * 2)
                context.fill()
                context.fillStyle = '#253238'
            })

            drawMedicalBottle(-22, -93, '#5baea6', 0.86)
            drawMedicalBottle(1, -88, '#e6acbf', 0.68)
            context.fillStyle = '#f8fbf7'
            fillRoundedRect(18, -90, 22, 21, 3)
            context.fillStyle = '#d9547e'
            fillRoundedRect(27, -86, 4, 13, 1)
            fillRoundedRect(22, -82, 14, 4, 1)

            context.strokeStyle = chrome
            context.lineWidth = 4
            context.beginPath()
            context.moveTo(37, -66)
            context.quadraticCurveTo(54, -82, 61, -73)
            context.stroke()
        }

        function drawMedicalBottle(x, y, color, scale = 1) {
            context.save()
            context.translate(x, y)
            context.scale(scale, scale)
            const bottle = context.createLinearGradient(-8, -18, 9, 8)
            bottle.addColorStop(0, 'rgba(255, 255, 255, 0.94)')
            bottle.addColorStop(0.42, color)
            bottle.addColorStop(1, 'rgba(44, 88, 91, 0.86)')
            context.fillStyle = bottle
            fillRoundedRect(-8, -18, 16, 25, 4)
            context.fillStyle = '#e9f2ed'
            fillRoundedRect(-5, -24, 10, 7, 2)
            context.fillStyle = 'rgba(255, 255, 255, 0.72)'
            fillRoundedRect(-5, -14, 3, 14, 2)
            context.restore()
        }

        function drawLodaresPuddle(time) {
            drawObjectShadow(45, 0.09, 1)
            const water = context.createRadialGradient(-9, -2, 3, 0, -2, 47)
            water.addColorStop(0, 'rgba(235, 240, 218, 0.82)')
            water.addColorStop(0.35, 'rgba(124, 158, 162, 0.78)')
            water.addColorStop(0.74, 'rgba(72, 91, 99, 0.6)')
            water.addColorStop(1, 'rgba(52, 44, 43, 0.08)')
            context.fillStyle = water
            context.beginPath()
            context.ellipse(0, -2, 49, 15, -0.06, 0, Math.PI * 2)
            context.fill()
            context.strokeStyle = 'rgba(255, 239, 194, 0.5)'
            context.lineWidth = 1.6
            context.beginPath()
            context.ellipse(-9 + Math.sin(time) * 2, -5, 19, 4, -0.05, 0.2, Math.PI * 1.75)
            context.stroke()
            context.fillStyle = '#8a5637'
            ;[[-31, -8], [22, 1], [8, -10]].forEach(([x, y], index) => {
                context.save()
                context.translate(x, y)
                context.rotate(index * 1.4)
                context.beginPath()
                context.ellipse(0, 0, 6, 2.5, 0, 0, Math.PI * 2)
                context.fill()
                context.restore()
            })
        }

        function drawTidePool(time) {
            const water = context.createRadialGradient(-5, -5, 1, 0, -1, 52)
            water.addColorStop(0, 'rgba(181, 252, 242, 0.96)')
            water.addColorStop(0.38, 'rgba(38, 177, 183, 0.88)')
            water.addColorStop(0.76, 'rgba(8, 103, 131, 0.72)')
            water.addColorStop(1, 'rgba(7, 69, 93, 0.12)')
            context.fillStyle = water
            context.beginPath()
            context.ellipse(0, -2, 53, 16, 0.03, 0, Math.PI * 2)
            context.fill()
            context.strokeStyle = `rgba(232, 255, 248, ${0.55 + Math.sin(time * 2.8) * 0.12})`
            context.lineWidth = 2
            context.beginPath()
            context.ellipse(-7, -5, 30, 7, 0.03, 0.15, Math.PI * 1.6)
            context.stroke()

            const rock = context.createLinearGradient(-48, -14, 50, 6)
            rock.addColorStop(0, '#c2936a')
            rock.addColorStop(0.55, '#7b5140')
            rock.addColorStop(1, '#402e2b')
            context.fillStyle = rock
            ;[[-43, -7, 12, 7], [42, -2, 14, 8], [27, -12, 9, 5]].forEach(([x, y, rx, ry]) => {
                context.beginPath()
                context.ellipse(x, y, rx, ry, -0.15, 0, Math.PI * 2)
                context.fill()
            })
            context.fillStyle = '#f3d0a3'
            context.beginPath()
            context.arc(-22, -7, 3.4, 0, Math.PI * 2)
            context.fill()
        }

        function drawHospitalSpill(time) {
            const water = context.createRadialGradient(-8, -3, 2, 0, 0, 46)
            water.addColorStop(0, 'rgba(196, 248, 237, 0.96)')
            water.addColorStop(0.48, 'rgba(67, 174, 173, 0.82)')
            water.addColorStop(1, 'rgba(43, 102, 116, 0.1)')
            context.fillStyle = water
            context.beginPath()
            context.ellipse(-9, -1, 45, 13, -0.04, 0, Math.PI * 2)
            context.fill()
            context.fillStyle = 'rgba(255, 255, 255, 0.65)'
            context.beginPath()
            context.ellipse(-19 + Math.sin(time) * 2, -6, 15, 2.7, -0.08, 0, Math.PI * 2)
            context.fill()

            const sign = context.createLinearGradient(14, -61, 57, -3)
            sign.addColorStop(0, '#ffe88a')
            sign.addColorStop(0.45, '#e9b72d')
            sign.addColorStop(1, '#987016')
            context.fillStyle = sign
            context.beginPath()
            context.moveTo(24, -7)
            context.lineTo(39, -60)
            context.lineTo(59, -7)
            context.closePath()
            context.fill()
            context.strokeStyle = '#6e541c'
            context.lineWidth = 2.5
            context.stroke()
            context.fillStyle = '#654a14'
            context.font = '900 18px sans-serif'
            context.textAlign = 'center'
            context.fillText('!', 42, -20)
        }

        function drawLodaresAwning() {
            drawObjectShadow(48, 0.18)
            const brass = context.createLinearGradient(-49, 0, 50, 0)
            brass.addColorStop(0, '#554022')
            brass.addColorStop(0.24, '#e1be68')
            brass.addColorStop(0.55, '#8f6b2c')
            brass.addColorStop(0.8, '#f5d88e')
            brass.addColorStop(1, '#5e461e')
            context.strokeStyle = brass
            context.lineWidth = 6
            context.lineCap = 'round'
            context.beginPath()
            context.moveTo(-46, 0)
            context.lineTo(-46, -168)
            context.moveTo(46, 0)
            context.lineTo(46, -168)
            context.stroke()

            context.save()
            context.translate(0, -90)
            const velvet = context.createLinearGradient(-43, -77, 43, -39)
            velvet.addColorStop(0, '#5a1436')
            velvet.addColorStop(0.28, '#b73766')
            velvet.addColorStop(0.55, '#711d43')
            velvet.addColorStop(0.82, '#cf4e79')
            velvet.addColorStop(1, '#4a102d')
            context.fillStyle = velvet
            context.beginPath()
            context.moveTo(-45, -78)
            context.quadraticCurveTo(-17, -67, 0, -72)
            context.quadraticCurveTo(21, -80, 45, -72)
            context.lineTo(42, -43)
            context.quadraticCurveTo(20, -49, 0, -40)
            context.quadraticCurveTo(-21, -34, -42, -47)
            context.closePath()
            context.fill()
            context.fillStyle = 'rgba(255, 225, 198, 0.45)'
            context.beginPath()
            context.moveTo(-36, -68)
            context.quadraticCurveTo(-7, -61, 31, -67)
            context.lineWidth = 2
            context.strokeStyle = 'rgba(255, 225, 198, 0.48)'
            context.stroke()
            context.restore()
        }

        function drawBeachCanopy(time) {
            drawObjectShadow(49, 0.2)
            const sway = state.reducedMotion ? 0 : Math.sin(time * 1.7) * 1.8
            const pole = context.createLinearGradient(130, 0, 146, 0)
            pole.addColorStop(0, '#5d3a28')
            pole.addColorStop(0.42, '#c69a65')
            pole.addColorStop(0.72, '#795039')
            pole.addColorStop(1, '#3e2b25')
            context.strokeStyle = pole
            context.lineWidth = 7
            context.lineCap = 'round'
            context.beginPath()
            context.moveTo(140, 0)
            context.lineTo(140, -91)
            context.quadraticCurveTo(125, -125, 32 + sway, -143)
            context.stroke()

            context.strokeStyle = 'rgba(255, 238, 199, 0.62)'
            context.lineWidth = 1.7
            context.beginPath()
            context.moveTo(136, -4)
            context.lineTo(136, -89)
            context.quadraticCurveTo(121, -120, 30 + sway, -139)
            context.stroke()

            context.save()
            context.translate(31 + sway, -139)
            context.scale(1, 0.5)
            const panels = ['#fff0ca', '#d9597b', '#f5e6c6', '#2e9ca0', '#f5e6c6', '#d9597b', '#fff0ca']
            for (let panel = 0; panel < 7; panel += 1) {
                const start = Math.PI + panel * Math.PI / 7
                const end = start + Math.PI / 7
                context.fillStyle = panels[panel]
                context.beginPath()
                context.moveTo(0, 0)
                context.arc(0, 0, 83, start, end)
                context.closePath()
                context.fill()
            }
            context.strokeStyle = 'rgba(84, 49, 35, 0.62)'
            context.lineWidth = 3
            context.beginPath()
            context.arc(0, 0, 83, Math.PI, Math.PI * 2)
            context.stroke()
            context.restore()

            ;[-66, -44, -22, 0, 22, 44, 66].forEach((x, index) => {
                context.fillStyle = panels[index]
                context.beginPath()
                context.arc(31 + sway + x, -138, 6.2, 0, Math.PI)
                context.fill()
            })

            const base = context.createRadialGradient(140, -2, 1, 140, -2, 18)
            base.addColorStop(0, '#f7ddad')
            base.addColorStop(0.62, '#b67a4d')
            base.addColorStop(1, 'rgba(89, 50, 35, 0)')
            context.fillStyle = base
            context.beginPath()
            context.ellipse(140, -2, 22, 7, 0, 0, Math.PI * 2)
            context.fill()
        }

        function drawHospitalCurtain() {
            drawObjectShadow(50, 0.22)
            const chrome = context.createLinearGradient(-52, 0, 53, 0)
            chrome.addColorStop(0, '#40575d')
            chrome.addColorStop(0.22, '#dbe7e5')
            chrome.addColorStop(0.53, '#788f92')
            chrome.addColorStop(0.78, '#f8ffff')
            chrome.addColorStop(1, '#4a6166')
            context.strokeStyle = chrome
            context.lineWidth = 6
            context.lineCap = 'round'
            context.beginPath()
            context.moveTo(-50, 0)
            context.lineTo(-50, -174)
            context.moveTo(50, 0)
            context.lineTo(50, -174)
            context.moveTo(-50, -172)
            context.lineTo(50, -172)
            context.stroke()
            context.save()
            context.translate(0, -90)
            const curtain = context.createLinearGradient(-47, -79, 47, -39)
            curtain.addColorStop(0, 'rgba(236, 252, 247, 0.98)')
            curtain.addColorStop(0.3, 'rgba(139, 203, 196, 0.95)')
            curtain.addColorStop(0.58, 'rgba(218, 244, 237, 0.98)')
            curtain.addColorStop(1, 'rgba(76, 153, 153, 0.96)')
            context.fillStyle = curtain
            context.beginPath()
            context.moveTo(-46, -80)
            for (let x = -46; x <= 46; x += 12) {
                context.quadraticCurveTo(x + 6, -72, x + 12, -80)
            }
            context.lineTo(46, -39)
            for (let x = 46; x >= -46; x -= 12) {
                context.quadraticCurveTo(x - 6, -31, x - 12, -39)
            }
            context.closePath()
            context.fill()
            context.fillStyle = 'rgba(255, 255, 255, 0.3)'
            for (let x = -38; x < 40; x += 18) fillRoundedRect(x, -73, 3, 30, 2)
            context.restore()
            context.fillStyle = '#f0f5ef'
            ;[-48, 48].forEach((x) => {
                context.beginPath()
                context.arc(x, 2, 6, 0, Math.PI * 2)
                context.fill()
                context.fillStyle = '#33464c'
                context.beginPath()
                context.arc(x, 2, 2.4, 0, Math.PI * 2)
                context.fill()
                context.fillStyle = '#f0f5ef'
            })
        }

        function drawBoostJumpTrail(laneX, runnerY, baseY, scale, time) {
            if (!state.boostJump || state.jumpElapsed < 0) return
            const jumpRatio = clamp(getJumpHeight() / Math.max(1, state.height * 0.21), 0, 1)
            const intensity = smootherstep(clamp(state.jumpElapsed / 0.16, 0, 1)) * (0.72 + jumpRatio * 0.28)
            const sway = state.reducedMotion ? 0 : Math.sin(time * 8.5) * 3.5 * scale

            context.save()
            context.globalCompositeOperation = 'screen'
            context.lineCap = 'round'
            const trailLength = (48 + jumpRatio * 58) * scale
            ;[-1, 0, 1].forEach((offset, index) => {
                const x = laneX + offset * 13 * scale + sway * (index - 1)
                const startY = runnerY - (22 + Math.abs(offset) * 5) * scale
                const endY = Math.min(baseY - 2, startY + trailLength)
                const trail = context.createLinearGradient(x, startY, x, endY)
                trail.addColorStop(0, `rgba(255, 250, 199, ${0.82 * intensity})`)
                trail.addColorStop(0.38, `rgba(255, 195, 91, ${0.55 * intensity})`)
                trail.addColorStop(1, 'rgba(77, 229, 205, 0)')
                context.strokeStyle = trail
                context.lineWidth = (offset === 0 ? 6 : 3.5) * scale
                context.beginPath()
                context.moveTo(x, startY)
                context.quadraticCurveTo(x - sway, (startY + endY) / 2, x + offset * 5 * scale, endY)
                context.stroke()
            })

            const flare = context.createRadialGradient(laneX, runnerY - 22 * scale, 1, laneX, runnerY - 22 * scale, 30 * scale)
            flare.addColorStop(0, `rgba(255, 255, 226, ${0.9 * intensity})`)
            flare.addColorStop(0.35, `rgba(255, 218, 113, ${0.46 * intensity})`)
            flare.addColorStop(1, 'rgba(86, 232, 207, 0)')
            context.fillStyle = flare
            context.beginPath()
            context.arc(laneX, runnerY - 22 * scale, 30 * scale, 0, Math.PI * 2)
            context.fill()
            context.restore()
        }

        function drawFlightRig(laneX, runnerY, baseY, scale, time) {
            if (state.flightBlend <= 0.015) return
            const lift = smootherstep(state.flightBlend)
            const pulse = state.reducedMotion ? 0.72 : 0.7 + Math.sin(time * 6.2) * 0.12
            const rigY = runnerY - 74 * scale

            context.save()
            context.globalCompositeOperation = 'screen'
            const verticalTravel = Math.max(0, baseY - runnerY)
            const trailLength = (46 + verticalTravel * 0.58) * lift
            ;[-1, 1].forEach((side) => {
                const trailX = laneX + side * 18 * scale
                const trail = context.createLinearGradient(trailX, runnerY - 8 * scale, trailX, runnerY + trailLength)
                trail.addColorStop(0, `rgba(226, 251, 255, ${0.72 * lift})`)
                trail.addColorStop(0.36, `rgba(112, 218, 255, ${0.42 * lift})`)
                trail.addColorStop(0.72, `rgba(255, 126, 179, ${0.23 * lift})`)
                trail.addColorStop(1, 'rgba(255, 255, 255, 0)')
                context.strokeStyle = trail
                context.lineWidth = 5 * scale
                context.lineCap = 'round'
                context.beginPath()
                context.moveTo(trailX, runnerY - 7 * scale)
                context.bezierCurveTo(
                    trailX + side * 7 * scale,
                    runnerY + trailLength * 0.3,
                    trailX - side * 6 * scale,
                    runnerY + trailLength * 0.72,
                    trailX + side * 3 * scale,
                    runnerY + trailLength
                )
                context.stroke()
            })

            const flightAura = context.createRadialGradient(laneX, rigY, 4, laneX, rigY, 92 * scale)
            flightAura.addColorStop(0, `rgba(244, 254, 255, ${0.22 * pulse * lift})`)
            flightAura.addColorStop(0.46, `rgba(105, 218, 255, ${0.16 * pulse * lift})`)
            flightAura.addColorStop(0.72, `rgba(255, 123, 176, ${0.1 * pulse * lift})`)
            flightAura.addColorStop(1, 'rgba(255, 255, 255, 0)')
            context.fillStyle = flightAura
            context.beginPath()
            context.arc(laneX, rigY, 92 * scale, 0, Math.PI * 2)
            context.fill()
            context.restore()

            context.save()
            context.globalAlpha = lift
            context.translate(laneX, rigY)
            context.scale(scale * (0.94 + pulse * 0.06), scale * (0.94 + pulse * 0.06))
            drawWingedHeart(0, 0, 1.2, time)
            context.restore()
        }

        function drawSofiaHero(time) {
            const width = state.width
            const height = state.height
            const compact = isCompactRunner()
            const baseY = compact ? getRoadGroundY() - height * 0.025 : height * 0.805
            const scale = compact
                ? clamp(Math.min(width / 480, height / 680), 0.76, 0.96)
                : clamp(Math.min(width / 430, height / 560), 0.82, 1.2)
            const laneX = width / 2 + state.lane * (compact ? getLaneSpread(1) : width * 0.225)
            const jumpHeight = getJumpHeight() + getFlightHeight()
            const slidePose = getSlidePose()
            const slideBlend = slidePose.amount
            const jumpPose = getJumpPose()
            const specialPose = getSpecialMotionPose()
            const sliding = slideBlend > 0.02
            const crashing = state.mode === 'crashing'
            const stumbleProgress = state.stumbleTimer > 0 && state.stumbleDuration > 0
                ? 1 - clamp(state.stumbleTimer / state.stumbleDuration, 0, 1)
                : 1
            const stumbleEnvelope = Math.pow(1 - stumbleProgress, 2)
            const stumble = state.stumbleTimer > 0
                ? state.stumbleDirection * Math.sin(stumbleProgress * Math.PI * 3.5) * 0.115 * stumbleEnvelope
                : 0
            const stumbleDrop = state.stumbleTimer > 0
                ? Math.sin(clamp(stumbleProgress * 1.45, 0, 1) * Math.PI) * 7 * stumbleEnvelope
                : 0
            const crashRotation = crashing ? mix(0, 0.82, specialPose.crash) : 0
            const laneChangeProgress = state.laneChangeTimer > 0
                ? 1 - clamp(state.laneChangeTimer / 0.38, 0, 1)
                : 1
            const laneChangeEnvelope = state.laneChangeTimer > 0 ? Math.sin(laneChangeProgress * Math.PI) : 0
            const steeringLean = clamp(
                -state.laneVelocity * 0.043 - state.laneChangeDirection * laneChangeEnvelope * 0.035,
                -0.16,
                0.16
            )
            const landingProgress = jumpPose.landing
            const celebrationHop = specialPose.celebration > 0
                ? Math.sin(specialPose.celebration * Math.PI) * height * 0.044
                : 0
            const lateralFootPlant = state.reducedMotion ? 0 : laneChangeEnvelope * 1.8
            const runnerY = baseY - jumpHeight - celebrationHop + landingProgress * 5 + stumbleDrop + lateralFootPlant
            const shadowScale = 1 - clamp((jumpHeight + celebrationHop) / (height * 0.2), 0, 0.58)
            const sceneKey = getSceneMix().current.key
            const airborneLean = -jumpPose.ascent * 0.032 + jumpPose.fall * 0.024

            context.save()
            context.globalAlpha = 0.34 * shadowScale
            const shadowRadius = compact ? 48 : 58
            const shadow = context.createRadialGradient(laneX, baseY + 4, 2, laneX, baseY + 4, shadowRadius * scale)
            shadow.addColorStop(0, 'rgba(24, 20, 25, 0.75)')
            shadow.addColorStop(0.55, 'rgba(24, 20, 25, 0.35)')
            shadow.addColorStop(1, 'rgba(24, 20, 25, 0)')
            context.fillStyle = shadow
            context.beginPath()
            context.ellipse(
                laneX,
                baseY + 4,
                shadowRadius * scale * (1 + slideBlend * 0.24),
                14 * scale * shadowScale * (1 - slideBlend * 0.12),
                0,
                0,
                Math.PI * 2
            )
            context.fill()
            context.restore()

            drawFlightRig(laneX, runnerY, baseY, scale, time)

            if (state.feverTimer > 0) {
                const feverPulse = state.reducedMotion ? 0.78 : 0.72 + Math.sin(time * 6.4) * 0.12
                const feverAura = context.createRadialGradient(
                    laneX,
                    runnerY - 76 * scale,
                    8,
                    laneX,
                    runnerY - 76 * scale,
                    118 * scale
                )
                feverAura.addColorStop(0, `rgba(255, 250, 201, ${0.15 + feverPulse * 0.08})`)
                feverAura.addColorStop(0.5, `rgba(255, 117, 170, ${0.12 + feverPulse * 0.08})`)
                feverAura.addColorStop(0.78, `rgba(91, 229, 207, ${0.11 + feverPulse * 0.05})`)
                feverAura.addColorStop(1, 'rgba(255, 255, 255, 0)')
                context.save()
                context.globalCompositeOperation = 'screen'
                context.fillStyle = feverAura
                context.beginPath()
                context.arc(laneX, runnerY - 76 * scale, 118 * scale, 0, Math.PI * 2)
                context.fill()
                const sparkCount = state.reducedMotion ? 4 : 7
                for (let spark = 0; spark < sparkCount; spark += 1) {
                    const angle = time * (state.reducedMotion ? 0 : 1.7) + spark * Math.PI * 2 / sparkCount
                    const orbitX = laneX + Math.cos(angle) * (60 + spark % 2 * 18) * scale
                    const orbitY = runnerY - (72 + Math.sin(angle) * 58) * scale
                    drawHeart(orbitX, orbitY, (3.2 + spark % 3) * scale, spark % 2 ? '#fff0a2' : '#ff82b0')
                }
                context.restore()
            }

            if (state.sneakersTimer > 0) {
                const sneakerPulse = state.reducedMotion ? 0.72 : 0.68 + Math.sin(time * 7.2) * 0.13
                context.save()
                context.globalCompositeOperation = 'screen'
                ;[-1, 1].forEach((side) => {
                    const shoeX = laneX + side * 14 * scale
                    const shoeY = runnerY - (3 + Math.abs(side) * 2) * scale
                    const shoeGlow = context.createRadialGradient(shoeX, shoeY, 2, shoeX, shoeY, 28 * scale)
                    shoeGlow.addColorStop(0, `rgba(255, 247, 181, ${0.78 * sneakerPulse})`)
                    shoeGlow.addColorStop(0.42, `rgba(184, 156, 255, ${0.5 * sneakerPulse})`)
                    shoeGlow.addColorStop(1, 'rgba(125, 95, 226, 0)')
                    context.fillStyle = shoeGlow
                    context.beginPath()
                    context.arc(shoeX, shoeY, 28 * scale, 0, Math.PI * 2)
                    context.fill()
                })
                if (!state.reducedMotion && state.jumpElapsed >= 0) {
                    context.strokeStyle = `rgba(226, 211, 255, ${0.52 + sneakerPulse * 0.24})`
                    context.lineWidth = Math.max(1.4, 2.2 * scale)
                    context.lineCap = 'round'
                    ;[-1, 1].forEach((side) => {
                        context.beginPath()
                        context.moveTo(laneX + side * 13 * scale, runnerY + 7 * scale)
                        context.lineTo(laneX + side * 18 * scale, runnerY + 35 * scale)
                        context.stroke()
                    })
                }
                context.restore()
            }

            if (state.airJumpPulseTimer > 0) {
                const airPulseProgress = 1 - state.airJumpPulseTimer / 0.38
                context.save()
                context.globalAlpha = 1 - airPulseProgress
                context.strokeStyle = '#e7dcff'
                context.lineWidth = Math.max(1.5, 3 * scale * (1 - airPulseProgress * 0.45))
                context.beginPath()
                context.ellipse(
                    laneX,
                    runnerY - 26 * scale,
                    mix(24, 76, airPulseProgress) * scale,
                    mix(9, 28, airPulseProgress) * scale,
                    0,
                    0,
                    Math.PI * 2
                )
                context.stroke()
                context.restore()
            }

            if (state.shieldTimer > 0) {
                const shieldPulse = 1 + Math.sin(time * 5) * 0.022
                const shieldRadiusX = compact ? 53 : 75
                const shieldRadiusY = compact ? 91 : 102
                const shieldGlow = compact ? 92 : 103
                const shield = context.createRadialGradient(laneX - 10 * scale, runnerY - 92 * scale, 5, laneX, runnerY - 86 * scale, shieldGlow * scale)
                shield.addColorStop(0, 'rgba(232, 255, 249, 0.02)')
                shield.addColorStop(0.7, 'rgba(113, 238, 218, 0.12)')
                shield.addColorStop(0.91, 'rgba(93, 221, 205, 0.42)')
                shield.addColorStop(1, 'rgba(239, 255, 251, 0.8)')
                context.save()
                context.translate(laneX, runnerY - 83 * scale)
                context.scale(shieldPulse, shieldPulse)
                context.fillStyle = shield
                context.beginPath()
                context.ellipse(0, 0, shieldRadiusX * scale, shieldRadiusY * scale, 0, 0, Math.PI * 2)
                context.fill()
                context.strokeStyle = 'rgba(218, 255, 246, 0.78)'
                context.lineWidth = Math.max(1, 2 * scale)
                context.beginPath()
                context.ellipse(0, 0, shieldRadiusX * scale, shieldRadiusY * scale, 0, 0, Math.PI * 2)
                context.stroke()
                context.restore()
            }

            if (state.magnetTimer > 0) {
                context.save()
                context.translate(laneX, runnerY - 78 * scale)
                for (let index = 0; index < 3; index += 1) {
                    const angle = time * 2.2 + index * Math.PI * 2 / 3
                    const orbitX = Math.cos(angle) * 58 * scale
                    const orbitY = Math.sin(angle) * 18 * scale
                    context.globalAlpha = 0.52 + (Math.sin(angle) + 1) * 0.18
                    drawHeart(orbitX, orbitY, 5.5 * scale, '#ff91b8', '#8f2452')
                }
                context.restore()
            }

            if (state.multiplierTimer > 0) {
                context.save()
                const glowPulse = 0.72 + Math.sin(time * 4.8) * 0.12
                context.strokeStyle = `rgba(255, 218, 105, ${glowPulse})`
                context.lineWidth = Math.max(1.5, 2.4 * scale)
                context.setLineDash([7 * scale, 8 * scale])
                context.beginPath()
                context.ellipse(laneX, runnerY - 72 * scale, 62 * scale, 96 * scale, 0, 0, Math.PI * 2)
                context.stroke()
                context.setLineDash([])
                context.translate(laneX + 48 * scale, runnerY - 146 * scale)
                context.fillStyle = '#ffd35f'
                context.strokeStyle = 'rgba(255, 255, 236, 0.95)'
                context.lineWidth = Math.max(1.5, 2 * scale)
                context.beginPath()
                context.arc(0, 0, 15 * scale, 0, Math.PI * 2)
                context.fill()
                context.stroke()
                context.fillStyle = '#741b43'
                context.font = `900 ${Math.round(10 * scale)}px system-ui, sans-serif`
                context.textAlign = 'center'
                context.textBaseline = 'middle'
                context.fillText('×2', 0, 0.5 * scale)
                context.restore()
            }

            drawBoostJumpTrail(laneX, runnerY, baseY, scale, time)

            context.save()
            context.translate(laneX, runnerY)
            context.scale(scale, scale)
            context.rotate(stumble + crashRotation + steeringLean + airborneLean)
            if (sliding) {
                const groundedSway = slidePose.motion * 1.8
                context.translate(groundedSway, 1.5 * slidePose.entry)
                context.rotate((-0.045 + slidePose.motion * 0.008) * slideBlend)
                context.scale(1 + 0.018 * slideBlend, 1 - 0.018 * slideBlend)
            } else {
                const launchCompression = jumpPose.takeoff * (1 - jumpPose.apex)
                const stretch = jumpPose.ascent * (1 - jumpPose.takeoff)
                context.translate(0, launchCompression * 3.5 + landingProgress * 5.5)
                context.scale(
                    1 + launchCompression * 0.035 - stretch * 0.018 + landingProgress * 0.055,
                    1 - launchCompression * 0.055 + stretch * 0.03 - landingProgress * 0.075
                )
            }
            if (isImageReady(sofiaSpriteImages.run)) {
                drawSofiaSpriteModel({
                    phase: state.runPhase,
                    slidePose,
                    jumpPose,
                    specialPose,
                    time
                })
            } else {
                drawSofiaModel({
                    phase: state.runPhase,
                    sliding,
                    slidePose,
                    jumpPose,
                    specialPose,
                    sceneKey,
                    time
                })
            }
            context.restore()
        }

        function drawSofiaSpriteModel({ phase, slidePose, jumpPose, specialPose, time }) {
            const runImage = sofiaSpriteImages.run
            const jumpImage = isImageReady(sofiaSpriteImages.jump) ? sofiaSpriteImages.jump : runImage
            const slideImage = isImageReady(sofiaSpriteImages.slide) ? sofiaSpriteImages.slide : runImage
            const crashCrouch = smootherstep(specialPose.crash) * 0.76
            const slideAmount = smootherstep(Math.max(slidePose.amount, crashCrouch))
            const airborneAmount = smootherstep(Math.max(jumpPose.amount, specialPose.celebration))
            const jumpAmount = airborneAmount * (1 - slideAmount)
            const runAmount = clamp(1 - slideAmount - jumpAmount, 0, 1)
            const stride = state.reducedMotion ? 0 : Math.sin(phase)
            const stepLift = state.reducedMotion ? 0 : Math.pow(Math.abs(Math.sin(phase * 2)), 1.4)
            const runMirror = state.reducedMotion || stride >= 0 ? 1 : -1
            const celebrationPulse = state.reducedMotion
                ? 0
                : Math.sin(time * 7.4) * specialPose.celebration

            context.save()
            context.translate(stride * 1.15 * runAmount, -stepLift * 2.15 * runAmount)
            context.rotate(stride * 0.018 * runAmount + celebrationPulse * 0.012)

            if (runAmount > 0.001) {
                drawSofiaSpriteImage(runImage, 214, runAmount, runMirror)
            }
            if (jumpAmount > 0.001) {
                const jumpStretch = 1 + jumpPose.ascent * 0.025 - jumpPose.fall * 0.012
                context.save()
                context.scale(1 / jumpStretch, jumpStretch)
                drawSofiaSpriteImage(jumpImage, 202, jumpAmount)
                context.restore()
            }
            if (slideAmount > 0.001) {
                const slideDrift = state.reducedMotion ? 0 : slidePose.motion * 1.4
                context.save()
                context.translate(slideDrift, 0)
                drawSofiaSpriteImage(slideImage, 128, slideAmount)
                context.restore()
            }
            context.restore()
        }

        function drawSofiaSpriteImage(image, height, alpha = 1, mirror = 1) {
            if (!isImageReady(image)) return
            const width = height * image.naturalWidth / Math.max(1, image.naturalHeight)
            context.save()
            context.globalAlpha *= alpha
            context.scale(mirror, 1)
            context.drawImage(image, -width / 2, -height, width, height)
            context.restore()
        }

        function drawSofiaModel({ phase, sliding, slidePose, jumpPose, specialPose, sceneKey, time }) {
            const airborne = jumpPose.airborne
            const inSpecialMotion = specialPose.celebration > 0 || specialPose.crash > 0
            const armStride = sliding || airborne || inSpecialMotion ? 0 : Math.sin(phase + Math.PI) * 12
            const bodyBob = state.reducedMotion || sliding || airborne || inSpecialMotion
                ? 0
                : (0.5 - Math.cos(phase * 2) * 0.5) * 2.7 * (1 - jumpPose.landing)
            const runSway = state.reducedMotion || sliding || airborne || inSpecialMotion ? 0 : Math.sin(phase) * 0.018
            const hairSwing = state.reducedMotion
                ? 0
                : Math.sin(phase * 0.74 + 0.8) * 4.2
                    + (jumpPose.ascent - jumpPose.fall) * 3
                    - slidePose.motion * 1.2
                    + specialPose.celebration * Math.sin(time * 9) * 2
            const tealLight = '#72d3c6'
            const tealMid = '#2fa49f'
            const tealDark = '#176a6d'
            const skinLight = '#f7cdb8'
            const skinMid = '#dfa991'
            const skinDark = '#a86e5f'
            const hairDark = '#2b1b18'
            const hairMid = '#58342b'
            const hairLight = '#9a6044'
            const rim = sceneKey === 'aguamarina' ? '#ffe2a0' : sceneKey === 'lodares' ? '#f5d7a4' : '#c8fff1'

            context.save()
            context.translate(0, -bodyBob)
            context.rotate(runSway)
            context.lineCap = 'round'
            context.lineJoin = 'round'

            const crouch = slidePose.amount
            const landingCrouch = jumpPose.landing * (1 - crouch)
            const hipY = mix(-62, -20, crouch) + landingCrouch * 5
            const shoulderY = mix(-114, -48, crouch) + landingCrouch * 6
            const headY = mix(-155, -88, crouch) + landingCrouch * 5

            const backHair = context.createLinearGradient(-27, -177, 31, -73)
            backHair.addColorStop(0, hairDark)
            backHair.addColorStop(0.46, hairMid)
            backHair.addColorStop(0.78, '#35211f')
            backHair.addColorStop(1, '#1b1517')
            context.fillStyle = backHair
            context.beginPath()
            context.moveTo(-23, headY - 7)
            context.bezierCurveTo(-34, headY + 8, -29 + hairSwing * 0.2, shoulderY + 12, -23 + hairSwing, hipY - 19)
            context.bezierCurveTo(-13 + hairSwing, hipY - 11, -4, shoulderY + 28, 0, shoulderY + 17)
            context.bezierCurveTo(7, shoulderY + 33, 19 + hairSwing * 0.7, hipY - 10, 26 + hairSwing, hipY - 20)
            context.bezierCurveTo(31 + hairSwing, shoulderY + 8, 34, headY + 8, 22, headY - 10)
            context.closePath()
            context.fill()

            const farLeg = getRunnerLegPoints(-1, phase, slidePose, jumpPose, specialPose, hipY)
            drawRunnerLimb(farLeg.points, 14, '#10585d', tealMid, 0.48)
            drawRunnerShoe(farLeg.foot.x, farLeg.foot.y, farLeg.foot.angle, 0.94, true)

            const farArm = getRunnerArmPoints(-1, armStride, slidePose, jumpPose, specialPose, shoulderY)
            drawRunnerLimb(farArm.upper, 12, tealDark, tealMid, 0.43)
            drawRunnerLimb(farArm.lower, 8.4, skinDark, skinMid, 0.46)
            drawRunnerHand(farArm.hand.x, farArm.hand.y, farArm.hand.angle, skinMid, skinLight)

            const nearLeg = getRunnerLegPoints(1, phase, slidePose, jumpPose, specialPose, hipY)
            drawRunnerLimb(nearLeg.points, 15, tealDark, tealLight, 0.52)
            drawRunnerShoe(nearLeg.foot.x, nearLeg.foot.y, nearLeg.foot.angle, 1, false)

            const torso = context.createLinearGradient(-24, shoulderY, 28, hipY)
            torso.addColorStop(0, tealLight)
            torso.addColorStop(0.24, '#43bbb1')
            torso.addColorStop(0.68, tealMid)
            torso.addColorStop(1, tealDark)
            context.fillStyle = torso
            const torsoHeight = hipY - shoulderY
            const torsoSideY = shoulderY + torsoHeight * 0.68
            const shoulderCurveY = shoulderY + Math.min(17, torsoHeight * 0.34)
            context.beginPath()
            context.moveTo(-20, shoulderY + 3)
            context.quadraticCurveTo(-27, shoulderCurveY, -22, torsoSideY)
            context.lineTo(-17, hipY + 3)
            context.quadraticCurveTo(0, hipY + 9, 18, hipY + 2)
            context.lineTo(23, torsoSideY)
            context.quadraticCurveTo(27, shoulderCurveY, 19, shoulderY + 3)
            context.quadraticCurveTo(0, shoulderY - 6, -20, shoulderY + 3)
            context.closePath()
            context.fill()

            context.strokeStyle = 'rgba(8, 74, 77, 0.46)'
            context.lineWidth = 1.5
            context.beginPath()
            context.moveTo(0, mix(shoulderY, hipY, 0.43))
            context.lineTo(0, hipY)
            context.moveTo(-18, hipY - 5)
            context.quadraticCurveTo(0, hipY + 1, 19, hipY - 5)
            context.stroke()

            context.fillStyle = '#f7ffff'
            const badgeY = mix(shoulderY, hipY, 0.48)
            fillRoundedRect(-17, badgeY, 18, 13, 2)
            context.fillStyle = '#d94e78'
            fillRoundedRect(-10, badgeY + 2, 4, 9, 1)
            fillRoundedRect(-13, badgeY + 5, 10, 4, 1)
            context.fillStyle = '#164f55'
            context.font = '800 4.7px sans-serif'
            context.textAlign = 'center'
            context.fillText('SOFÍA', -8, badgeY + 11.2)

            context.strokeStyle = 'rgba(255, 255, 255, 0.38)'
            context.lineWidth = 2.1
            context.beginPath()
            context.moveTo(-17, shoulderY + 8)
            context.quadraticCurveTo(-21, mix(shoulderY, hipY, 0.52), -13, hipY - 8)
            context.stroke()

            const nearArm = getRunnerArmPoints(1, armStride, slidePose, jumpPose, specialPose, shoulderY)
            drawRunnerLimb(nearArm.upper, 13, tealDark, tealLight, 0.5)
            drawRunnerLimb(nearArm.lower, 8.8, skinDark, skinLight, 0.54)
            drawRunnerHand(nearArm.hand.x, nearArm.hand.y, nearArm.hand.angle, skinMid, skinLight)

            const neckTop = headY + 19
            const neckBottom = shoulderY + 1
            const neck = context.createLinearGradient(-8, neckTop, 10, neckBottom)
            neck.addColorStop(0, skinDark)
            neck.addColorStop(0.42, skinMid)
            neck.addColorStop(1, skinLight)
            context.fillStyle = neck
            fillRoundedRect(-8, neckTop, 16, Math.max(14, neckBottom - neckTop), 7)

            context.fillStyle = '#176f72'
            context.beginPath()
            context.moveTo(-13, shoulderY - 1)
            context.lineTo(0, shoulderY + 13)
            context.lineTo(13, shoulderY - 1)
            context.lineTo(8, shoulderY - 4)
            context.lineTo(0, shoulderY + 5)
            context.lineTo(-8, shoulderY - 4)
            context.closePath()
            context.fill()

            drawSofiaFace({
                x: 0,
                y: headY,
                skinLight,
                skinMid,
                skinDark,
                hairDark,
                hairMid,
                hairLight,
                hairSwing,
                rim,
                celebration: specialPose.celebration,
                crash: specialPose.crash,
                time
            })

            context.strokeStyle = rim
            context.globalAlpha = 0.34
            context.lineWidth = 1.6
            context.beginPath()
            context.moveTo(-22, shoulderY + 7)
            context.quadraticCurveTo(-28, mix(shoulderY, hipY, 0.55), -18, hipY - 2)
            context.moveTo(-24, headY - 10)
            context.quadraticCurveTo(-31, headY + 8, -25 + hairSwing, hipY - 23)
            context.stroke()
            context.globalAlpha = 1
            context.restore()
        }

        function getRunningLegPose(side, phase, hipY) {
            const rawCycle = phase / (Math.PI * 2) + (side > 0 ? 0 : 0.5)
            const cycle = ((rawCycle % 1) + 1) % 1
            const effort = clamp((state.speed - INITIAL_SPEED) / Math.max(1, MAX_SPEED - INITIAL_SPEED), 0, 1)
            const travel = 16 + effort * 2.5
            let footTravel = 0
            let lift = 0
            let footAngle = side * 0.025

            if (cycle < 0.54) {
                const progress = smootherstep(cycle / 0.54)
                footTravel = mix(travel, -travel * 0.88, progress)
                footAngle += mix(-0.045, 0.075, progress)
            } else if (cycle < 0.67) {
                const progress = smootherstep((cycle - 0.54) / 0.13)
                footTravel = mix(-travel * 0.88, -travel * 0.48, progress)
                lift = mix(0, 8.5 + effort * 1.5, progress)
                footAngle += mix(0.075, 0.14, progress)
            } else if (cycle < 0.9) {
                const progress = smootherstep((cycle - 0.67) / 0.23)
                footTravel = mix(-travel * 0.48, travel * 0.72, progress)
                lift = 8.5 + Math.sin(progress * Math.PI) * (8 + effort * 2)
                footAngle += mix(0.14, -0.06, progress)
            } else {
                const progress = smootherstep((cycle - 0.9) / 0.1)
                footTravel = mix(travel * 0.72, travel, progress)
                lift = mix(8.5, 0, progress)
                footAngle += mix(-0.06, -0.045, progress)
            }

            const footX = side * 15 + footTravel
            const footY = -1 - lift
            const kneeLift = 5.5 + lift * 0.58
            const kneeX = side * 8 + footTravel * 0.46
            const kneeY = mix(hipY, footY, 0.49) - kneeLift
            const ankleX = mix(kneeX, footX, 0.78)
            const ankleY = mix(kneeY, footY, 0.8) - lift * 0.07

            return legPose(
                side * 7,
                hipY,
                kneeX,
                kneeY,
                ankleX,
                ankleY,
                footX,
                footY,
                footX + side * 2.5,
                footY,
                footAngle
            )
        }

        function getRunnerLegPoints(side, phase, slidePose, jumpPose, specialPose, hipY) {
            const runningPose = getRunningLegPose(side, phase, hipY)

            if (specialPose.crash > 0.001) {
                const crashPose = side > 0
                    ? legPose(7, hipY, 25, -34, 42, -14, 57, -7, 62, -5, 0.22)
                    : legPose(-7, hipY, -17, -38, -31, -22, -42, -16, -47, -14, -0.2)
                return interpolateLegPose(runningPose, crashPose, specialPose.crash)
            }

            if (specialPose.celebration > 0.001) {
                const celebrationPose = side > 0
                    ? legPose(7, hipY, 11, -35, 14, -12, 17, -2, 20, -1, 0.03)
                    : legPose(-7, hipY, -19, -43, -29, -31, -24, -24, -27, -22, -0.14)
                return interpolateLegPose(runningPose, celebrationPose, specialPose.celebration)
            }

            if (slidePose.amount > 0.001) {
                const slideFrames = side > 0
                    ? [
                        { at: 0, pose: legPose(7, hipY, 16, -15, 34, -6, 50, -2, 56, -1, 0.05) },
                        { at: 0.28, pose: legPose(7, hipY, 18, -10, 38, -4, 57, -1.5, 63, -0.5, 0.035) },
                        { at: 0.62, pose: legPose(7, hipY, 20, -9, 42, -3, 61, -1, 67, 0, 0.02) },
                        { at: 0.82, pose: legPose(7, hipY, 18, -11, 36, -5, 54, -2, 60, -1, 0.04) },
                        { at: 1, pose: legPose(7, hipY, 14, -18, 25, -8, 39, -3, 45, -1, 0.06) }
                    ]
                    : [
                        { at: 0, pose: legPose(-7, hipY, -16, -13, -4, -5, -8, -2, -11, -1, -0.04) },
                        { at: 0.28, pose: legPose(-7, hipY, -17, -10, -4, -4, -7, -1.5, -10, -0.5, -0.03) },
                        { at: 0.62, pose: legPose(-7, hipY, -16, -9, -3, -3, -6, -1, -9, 0, -0.025) },
                        { at: 0.82, pose: legPose(-7, hipY, -15, -11, -4, -5, -8, -2, -11, -1, -0.035) },
                        { at: 1, pose: legPose(-7, hipY, -12, -18, -8, -8, -13, -3, -17, -1, -0.045) }
                    ]
                const target = sampleMotionFrames(slideFrames, slidePose.progress, interpolateLegPose)
                return interpolateLegPose(runningPose, target, slidePose.amount)
            }

            if (jumpPose.amount > 0.001) {
                const jumpFrames = side > 0
                    ? [
                        { at: 0, pose: legPose(7, hipY, 14, -34, 10, -11, 18, -3, 22, -1, 0.04) },
                        { at: 0.22, pose: legPose(7, hipY, 25, -45, 20, -25, 29, -18, 33, -16, 0.14) },
                        { at: 0.5, pose: legPose(7, hipY, 25, -44, 8, -24, 16, -17, 20, -15, 0.14) },
                        { at: 0.78, pose: legPose(7, hipY, 15, -34, 14, -12, 20, -6, 24, -4, 0.07) },
                        { at: 1, pose: legPose(7, hipY, 17, -28, 12, -6, 18, -2, 22, -1, 0.035) }
                    ]
                    : [
                        { at: 0, pose: legPose(-7, hipY, -13, -33, -18, -12, -22, -4, -26, -2, -0.04) },
                        { at: 0.22, pose: legPose(-7, hipY, -15, -36, -20, -15, -25, -9, -29, -7, -0.08) },
                        { at: 0.5, pose: legPose(-7, hipY, -14, -35, -19, -14, -25, -8, -29, -6, -0.07) },
                        { at: 0.78, pose: legPose(-7, hipY, -15, -32, -20, -10, -24, -4, -28, -2, -0.07) },
                        { at: 1, pose: legPose(-7, hipY, -18, -28, -14, -6, -20, -2, -24, -1, -0.035) }
                    ]
                const target = sampleMotionFrames(jumpFrames, jumpPose.phase, interpolateLegPose)
                return interpolateLegPose(runningPose, target, smootherstep(jumpPose.amount))
            }

            return runningPose
        }

        function getRunnerArmPoints(side, armStride, slidePose, jumpPose, specialPose, shoulderY) {
            const motion = side > 0 ? armStride : -armStride
            const lift = clamp(motion / 11, -1, 1)
            const runningPose = armPose(
                side * 19,
                shoulderY + 9,
                side * 25 + motion,
                shoulderY + 23 - lift * 4,
                side * 22 + motion * 0.82,
                shoulderY + 35 - lift * 7,
                side * 18 + motion * 0.62,
                shoulderY + 42 - lift * 10,
                side * 17 + motion * 0.6,
                shoulderY + 45 - lift * 10,
                motion * 0.025
            )

            if (specialPose.crash > 0.001) {
                const crashPose = side > 0
                    ? armPose(19, shoulderY + 9, 39, -104, 52, -91, 61, -83, 64, -80, 0.26)
                    : armPose(-19, shoulderY + 9, -42, -111, -57, -101, -66, -94, -69, -91, -0.28)
                return interpolateArmPose(runningPose, crashPose, specialPose.crash)
            }

            if (specialPose.celebration > 0.001) {
                const celebrationPose = side > 0
                    ? armPose(19, shoulderY + 9, 31, -128, 42, -151, 48, -160, 50, -164, 0.14)
                    : armPose(-19, shoulderY + 9, -31, -128, -42, -151, -48, -160, -50, -164, -0.14)
                return interpolateArmPose(runningPose, celebrationPose, specialPose.celebration)
            }

            if (slidePose.amount > 0.001) {
                const slideFrames = side > 0
                    ? [
                        { at: 0, pose: armPose(19, shoulderY + 9, 31, shoulderY + 17, 41, shoulderY + 25, 49, shoulderY + 31, 52, shoulderY + 34, 0.12) },
                        { at: 0.34, pose: armPose(19, shoulderY + 9, 35, shoulderY + 16, 46, shoulderY + 24, 55, shoulderY + 31, 58, shoulderY + 34, 0.17) },
                        { at: 0.68, pose: armPose(19, shoulderY + 9, 38, shoulderY + 15, 49, shoulderY + 22, 57, shoulderY + 29, 60, shoulderY + 32, 0.18) },
                        { at: 1, pose: armPose(19, shoulderY + 9, 28, shoulderY + 20, 29, shoulderY + 32, 23, shoulderY + 42, 21, shoulderY + 45, 0.08) }
                    ]
                    : [
                        { at: 0, pose: armPose(-19, shoulderY + 9, -25, shoulderY + 15, -17, shoulderY + 23, -7, shoulderY + 29, -4, shoulderY + 32, -0.08) },
                        { at: 0.34, pose: armPose(-19, shoulderY + 9, -26, shoulderY + 14, -17, shoulderY + 22, -6, shoulderY + 28, -3, shoulderY + 31, -0.1) },
                        { at: 0.68, pose: armPose(-19, shoulderY + 9, -27, shoulderY + 13, -18, shoulderY + 21, -7, shoulderY + 27, -4, shoulderY + 30, -0.11) },
                        { at: 1, pose: armPose(-19, shoulderY + 9, -25, shoulderY + 19, -20, shoulderY + 31, -14, shoulderY + 40, -12, shoulderY + 43, -0.06) }
                    ]
                const target = sampleMotionFrames(slideFrames, slidePose.progress, interpolateArmPose)
                return interpolateArmPose(runningPose, target, slidePose.amount)
            }

            if (jumpPose.amount > 0.001) {
                const jumpFrames = side > 0
                    ? [
                        { at: 0, pose: armPose(19, shoulderY + 9, 26, -94, 22, -80, 18, -69, 17, -66, -0.04) },
                        { at: 0.22, pose: armPose(19, shoulderY + 9, 31, -105, 36, -118, 42, -126, 44, -129, 0.15) },
                        { at: 0.5, pose: armPose(19, shoulderY + 9, 30, -91, 24, -78, 18, -70, 16, -67, 0.02) },
                        { at: 0.78, pose: armPose(19, shoulderY + 9, 29, -91, 25, -77, 19, -69, 17, -66, 0.03) },
                        { at: 1, pose: armPose(19, shoulderY + 9, 25, -88, 20, -75, 16, -68, 15, -65, -0.02) }
                    ]
                    : [
                        { at: 0, pose: armPose(-19, shoulderY + 9, -27, -92, -30, -78, -23, -69, -21, -66, 0.04) },
                        { at: 0.22, pose: armPose(-19, shoulderY + 9, -31, -89, -37, -76, -42, -70, -44, -67, -0.15) },
                        { at: 0.5, pose: armPose(-19, shoulderY + 9, -31, -108, -35, -121, -39, -128, -41, -131, -0.16) },
                        { at: 0.78, pose: armPose(-19, shoulderY + 9, -31, -103, -34, -116, -38, -124, -40, -127, -0.15) },
                        { at: 1, pose: armPose(-19, shoulderY + 9, -26, -91, -23, -77, -18, -69, -17, -66, 0.02) }
                    ]
                const target = sampleMotionFrames(jumpFrames, jumpPose.phase, interpolateArmPose)
                return interpolateArmPose(runningPose, target, smootherstep(jumpPose.amount))
            }

            return runningPose
        }

        function legPose(hipX, hipY, kneeX, kneeY, ankleX, ankleY, toeX, toeY, footX, footY, angle) {
            return {
                points: [
                    { x: hipX, y: hipY },
                    { x: kneeX, y: kneeY },
                    { x: ankleX, y: ankleY },
                    { x: toeX, y: toeY }
                ],
                foot: { x: footX, y: footY, angle }
            }
        }

        function armPose(shoulderX, shoulderY, elbowX, elbowY, wristX, wristY, handX, handY, palmX, palmY, angle) {
            return {
                upper: [
                    { x: shoulderX, y: shoulderY },
                    { x: elbowX, y: elbowY },
                    { x: wristX, y: wristY }
                ],
                lower: [
                    { x: wristX, y: wristY },
                    { x: handX, y: handY }
                ],
                hand: { x: palmX, y: palmY, angle }
            }
        }

        function sampleMotionFrames(frames, progress, interpolator) {
            const amount = clamp(progress, 0, 1)
            for (let index = 0; index < frames.length - 1; index += 1) {
                const current = frames[index]
                const next = frames[index + 1]
                if (amount > next.at) continue
                const localProgress = smootherstep((amount - current.at) / Math.max(0.001, next.at - current.at))
                return interpolator(current.pose, next.pose, localProgress)
            }
            return frames[frames.length - 1].pose
        }

        function interpolatePoint(from, to, amount) {
            return { x: mix(from.x, to.x, amount), y: mix(from.y, to.y, amount) }
        }

        function interpolateLegPose(from, to, amount) {
            return {
                points: from.points.map((point, index) => interpolatePoint(point, to.points[index], amount)),
                foot: {
                    ...interpolatePoint(from.foot, to.foot, amount),
                    angle: mix(from.foot.angle, to.foot.angle, amount)
                }
            }
        }

        function interpolateArmPose(from, to, amount) {
            return {
                upper: from.upper.map((point, index) => interpolatePoint(point, to.upper[index], amount)),
                lower: from.lower.map((point, index) => interpolatePoint(point, to.lower[index], amount)),
                hand: {
                    ...interpolatePoint(from.hand, to.hand, amount),
                    angle: mix(from.hand.angle, to.hand.angle, amount)
                }
            }
        }

        function drawRunnerLimb(points, width, darkColor, lightColor, highlightOpacity) {
            context.strokeStyle = darkColor
            context.lineWidth = width
            context.beginPath()
            context.moveTo(points[0].x, points[0].y)
            for (let index = 1; index < points.length; index += 1) {
                const previous = points[index - 1]
                const point = points[index]
                const midX = (previous.x + point.x) / 2
                const midY = (previous.y + point.y) / 2
                context.quadraticCurveTo(previous.x, previous.y, midX, midY)
                if (index === points.length - 1) context.lineTo(point.x, point.y)
            }
            context.stroke()

            context.save()
            context.globalAlpha *= highlightOpacity
            context.strokeStyle = lightColor
            context.lineWidth = Math.max(1.4, width * 0.34)
            context.translate(-width * 0.12, -width * 0.08)
            context.beginPath()
            context.moveTo(points[0].x, points[0].y)
            for (let index = 1; index < points.length; index += 1) {
                const previous = points[index - 1]
                const point = points[index]
                const midX = (previous.x + point.x) / 2
                const midY = (previous.y + point.y) / 2
                context.quadraticCurveTo(previous.x, previous.y, midX, midY)
                if (index === points.length - 1) context.lineTo(point.x, point.y)
            }
            context.stroke()
            context.restore()
        }

        function drawRunnerShoe(x, y, angle, scale, isFar) {
            context.save()
            context.translate(x, y)
            context.rotate(angle)
            context.scale(scale, scale)
            const shoe = context.createLinearGradient(-13, -7, 15, 5)
            shoe.addColorStop(0, isFar ? '#aeb9b8' : '#f8faf6')
            shoe.addColorStop(0.48, '#ffffff')
            shoe.addColorStop(1, '#7e8b8d')
            context.fillStyle = shoe
            context.beginPath()
            context.moveTo(-9, -7)
            context.quadraticCurveTo(2, -9, 14, -2)
            context.quadraticCurveTo(18, 3, 10, 6)
            context.lineTo(-11, 5)
            context.quadraticCurveTo(-16, 0, -9, -7)
            context.closePath()
            context.fill()
            context.strokeStyle = '#5b686d'
            context.lineWidth = 1.4
            context.stroke()
            context.strokeStyle = 'rgba(72, 86, 90, 0.54)'
            context.lineWidth = 1
            context.beginPath()
            context.moveTo(-4, -4)
            context.lineTo(7, 0)
            context.moveTo(-3, 0)
            context.lineTo(8, 3)
            context.stroke()
            context.restore()
        }

        function drawRunnerHand(x, y, angle, darkColor, lightColor) {
            context.save()
            context.translate(x, y)
            context.rotate(angle)
            const hand = context.createRadialGradient(-2, -3, 1, 0, 0, 8)
            hand.addColorStop(0, lightColor)
            hand.addColorStop(1, darkColor)
            context.fillStyle = hand
            context.beginPath()
            context.ellipse(0, 0, 6.1, 8.2, -0.18, 0, Math.PI * 2)
            context.fill()
            context.strokeStyle = 'rgba(124, 75, 65, 0.42)'
            context.lineWidth = 0.8
            for (let finger = -2; finger <= 2; finger += 2) {
                context.beginPath()
                context.moveTo(finger, -2)
                context.lineTo(finger * 1.2, 4)
                context.stroke()
            }
            context.restore()
        }

        function drawSofiaFace({ x, y, skinLight, skinMid, skinDark, hairDark, hairMid, hairLight, hairSwing, rim, celebration = 0, crash = 0, time = 0 }) {
            const blinkPhase = (time + 1.7) % 4.6
            const blink = state.reducedMotion || blinkPhase > 0.16
                ? 0
                : Math.sin(blinkPhase / 0.16 * Math.PI)

            context.save()
            context.translate(x, y)
            context.scale(0.86, 0.86)

            context.fillStyle = skinMid
            context.beginPath()
            context.ellipse(-19, 1, 4.8, 8, -0.1, 0, Math.PI * 2)
            context.ellipse(19, 1, 4.8, 8, 0.1, 0, Math.PI * 2)
            context.fill()

            const face = context.createRadialGradient(-7, -10, 2, 1, 1, 28)
            face.addColorStop(0, '#ffe0c8')
            face.addColorStop(0.42, skinLight)
            face.addColorStop(0.76, skinMid)
            face.addColorStop(1, skinDark)
            context.fillStyle = face
            context.beginPath()
            context.moveTo(0, -27)
            context.bezierCurveTo(-18, -27, -23, -15, -21, 2)
            context.bezierCurveTo(-19, 18, -8, 27, 0, 29)
            context.bezierCurveTo(9, 26, 20, 17, 21, 1)
            context.bezierCurveTo(23, -15, 17, -27, 0, -27)
            context.closePath()
            context.fill()

            context.fillStyle = 'rgba(255, 206, 191, 0.28)'
            context.beginPath()
            context.ellipse(-12, 8, 6, 3.5, -0.1, 0, Math.PI * 2)
            context.ellipse(12, 8, 6, 3.5, 0.1, 0, Math.PI * 2)
            context.fill()

            drawSofiaEye(-8.2, -2.5, -0.05, blink)
            drawSofiaEye(8.2, -2.5, 0.05, blink)

            context.strokeStyle = '#51342f'
            context.lineWidth = 2.15
            context.lineCap = 'round'
            context.beginPath()
            context.moveTo(-14, -10)
            context.quadraticCurveTo(-8, -14, -2.5, -10.5)
            context.moveTo(2.5, -10.5)
            context.quadraticCurveTo(8, -14, 14, -10)
            context.stroke()

            const nose = context.createLinearGradient(-2, -5, 4, 12)
            nose.addColorStop(0, 'rgba(255, 232, 216, 0.78)')
            nose.addColorStop(1, 'rgba(140, 82, 71, 0.55)')
            context.strokeStyle = nose
            context.lineWidth = 1.35
            context.beginPath()
            context.moveTo(0, -2)
            context.quadraticCurveTo(-1.5, 6, -3.5, 10)
            context.quadraticCurveTo(0, 12.4, 4, 10.2)
            context.stroke()
            context.fillStyle = 'rgba(112, 62, 58, 0.48)'
            context.beginPath()
            context.ellipse(-2.8, 10.4, 1.3, 0.7, 0, 0, Math.PI * 2)
            context.ellipse(3.2, 10.3, 1.3, 0.7, 0, 0, Math.PI * 2)
            context.fill()

            const lips = context.createLinearGradient(0, 14, 0, 23)
            lips.addColorStop(0, '#b65f69')
            lips.addColorStop(0.48, '#d9868b')
            lips.addColorStop(1, '#9e4f5b')
            context.fillStyle = lips
            const mouthCornerY = 17 - celebration * 2.6 + crash * 1.4
            const mouthBottomY = 22.4 + celebration * 1.4 - crash * 0.8
            context.beginPath()
            context.moveTo(-9.5, mouthCornerY)
            context.bezierCurveTo(-5, 14.5, -1.5, 15.4, 0, 17)
            context.bezierCurveTo(2.5, 14.9, 6.3, 15.1, 10, mouthCornerY)
            context.bezierCurveTo(6.4, mouthBottomY, -5.7, mouthBottomY, -9.5, mouthCornerY)
            context.closePath()
            context.fill()
            context.strokeStyle = 'rgba(105, 50, 56, 0.58)'
            context.lineWidth = 0.8
            context.beginPath()
            context.moveTo(-8, mouthCornerY + 0.6)
            context.quadraticCurveTo(0, 19.1 + celebration * 1.2, 8.5, mouthCornerY + 0.5)
            context.stroke()

            const hair = context.createLinearGradient(-25, -31, 24, 25)
            hair.addColorStop(0, hairDark)
            hair.addColorStop(0.36, hairMid)
            hair.addColorStop(0.66, hairDark)
            hair.addColorStop(1, '#1b1416')
            context.fillStyle = hair
            context.beginPath()
            context.moveTo(0, -34)
            context.bezierCurveTo(-18, -35, -27, -25, -25, -7)
            context.bezierCurveTo(-24, 4, -24 + hairSwing * 0.2, 17, -20 + hairSwing, 34)
            context.bezierCurveTo(-13 + hairSwing, 29, -15, 5, -13, -16)
            context.bezierCurveTo(-8, -23, -4, -27, 0, -30)
            context.closePath()
            context.fill()
            context.beginPath()
            context.moveTo(0, -34)
            context.bezierCurveTo(18, -35, 27, -25, 25, -7)
            context.bezierCurveTo(24, 6, 25 + hairSwing * 0.2, 18, 20 + hairSwing, 34)
            context.bezierCurveTo(13 + hairSwing, 28, 15, 5, 13, -16)
            context.bezierCurveTo(8, -23, 4, -27, 0, -30)
            context.closePath()
            context.fill()

            context.strokeStyle = hairLight
            context.globalAlpha = 0.62
            context.lineWidth = 1.35
            ;[-1, 1].forEach((side) => {
                for (let strand = 0; strand < 4; strand += 1) {
                    const startX = side * (4 + strand * 3.6)
                    context.beginPath()
                    context.moveTo(startX, -29 + strand)
                    context.bezierCurveTo(side * (18 + strand), -10, side * (14 + strand) + hairSwing * 0.4, 17, side * (18 + strand) + hairSwing, 31)
                    context.stroke()
                }
            })
            context.globalAlpha = 1

            context.strokeStyle = '#342224'
            context.lineWidth = 2.2
            context.beginPath()
            context.arc(-7, -27, 8, 3.45, 5.95)
            context.arc(8, -27, 8, 3.45, 5.95)
            context.moveTo(0, -28)
            context.lineTo(1, -28)
            context.stroke()
            context.strokeStyle = 'rgba(255, 220, 190, 0.72)'
            context.lineWidth = 0.7
            context.beginPath()
            context.arc(-7, -27.8, 5.2, 3.7, 5.6)
            context.stroke()

            context.strokeStyle = rim
            context.globalAlpha = 0.5
            context.lineWidth = 1.4
            context.beginPath()
            context.arc(-1, 0, 23, Math.PI * 0.57, Math.PI * 1.52)
            context.stroke()
            context.restore()
        }

        function drawSofiaEye(x, y, rotation, blink = 0) {
            context.save()
            context.translate(x, y)
            context.rotate(rotation)
            context.scale(0.84, 0.84 * (1 - blink * 0.88))
            context.fillStyle = '#fff9ef'
            context.beginPath()
            context.moveTo(-5.7, 0)
            context.quadraticCurveTo(0, -4.2, 5.8, 0)
            context.quadraticCurveTo(0, 3.2, -5.7, 0)
            context.closePath()
            context.fill()

            const iris = context.createRadialGradient(-0.6, -0.8, 0.4, 0, 0, 3.2)
            iris.addColorStop(0, '#d9c48b')
            iris.addColorStop(0.42, '#7d875b')
            iris.addColorStop(1, '#35463d')
            context.fillStyle = iris
            context.beginPath()
            context.arc(0, 0, 3.15, 0, Math.PI * 2)
            context.fill()
            context.fillStyle = '#18191a'
            context.beginPath()
            context.arc(0.2, 0.2, 1.7, 0, Math.PI * 2)
            context.fill()
            context.fillStyle = 'rgba(255,255,255,0.96)'
            context.beginPath()
            context.arc(-0.8, -1, 0.9, 0, Math.PI * 2)
            context.fill()

            context.strokeStyle = '#332326'
            context.lineWidth = 1.35
            context.beginPath()
            context.moveTo(-5.7, 0)
            context.quadraticCurveTo(0, -4.2, 5.8, 0)
            context.stroke()
            context.lineWidth = 0.7
            for (let lash = -4; lash <= 4; lash += 2) {
                context.beginPath()
                context.moveTo(lash, -1.7 - Math.abs(lash) * 0.14)
                context.lineTo(lash * 1.08, -3.5 - Math.abs(lash) * 0.14)
                context.stroke()
            }
            context.restore()
        }

        function drawCinematicAtmosphere(time) {
            const width = state.width
            const height = state.height

            if (state.flightBlend > 0.02) {
                const lift = smootherstep(state.flightBlend)
                context.save()
                context.globalCompositeOperation = 'screen'
                const skyGlow = context.createLinearGradient(0, height * 0.1, 0, height)
                skyGlow.addColorStop(0, `rgba(151, 230, 255, ${0.09 * lift})`)
                skyGlow.addColorStop(0.46, 'rgba(255, 255, 255, 0)')
                skyGlow.addColorStop(1, `rgba(255, 133, 181, ${0.045 * lift})`)
                context.fillStyle = skyGlow
                context.fillRect(0, 0, width, height)
                if (!state.reducedMotion) {
                    context.strokeStyle = `rgba(229, 251, 255, ${0.16 * lift})`
                    context.lineWidth = 1.4
                    for (let streak = 0; streak < 18; streak += 1) {
                        const phase = (time * 0.92 + streak * 0.119) % 1
                        const side = streak % 2 ? 1 : -1
                        const x = width * (0.5 + side * (0.18 + (streak % 6) * 0.065))
                        const y = height * (0.17 + phase * 0.72)
                        context.beginPath()
                        context.moveTo(x, y)
                        context.lineTo(x + side * (12 + phase * 25), y + 18 + phase * 24)
                        context.stroke()
                    }
                }
                context.restore()
            }

            if (state.feverTimer > 0) {
                const ending = clamp(state.feverTimer / 0.8, 0, 1)
                const pulse = state.reducedMotion ? 0.5 : 0.5 + Math.sin(time * 5.6) * 0.5
                context.save()
                context.globalCompositeOperation = 'screen'
                const feverVignette = context.createRadialGradient(
                    width * 0.5,
                    height * 0.58,
                    Math.min(width, height) * 0.18,
                    width * 0.5,
                    height * 0.58,
                    Math.max(width, height) * 0.74
                )
                feverVignette.addColorStop(0, 'rgba(255, 255, 255, 0)')
                feverVignette.addColorStop(0.68, `rgba(255, 224, 128, ${(0.035 + pulse * 0.025) * ending})`)
                feverVignette.addColorStop(1, `rgba(255, 93, 158, ${(0.095 + pulse * 0.035) * ending})`)
                context.fillStyle = feverVignette
                context.fillRect(0, 0, width, height)
                if (!state.reducedMotion) {
                    context.strokeStyle = `rgba(255, 244, 190, ${0.12 * ending})`
                    context.lineWidth = 1.5
                    for (let ray = 0; ray < 12; ray += 1) {
                        const phase = (time * 0.72 + ray * 0.137) % 1
                        const y = height * (0.24 + phase * 0.65)
                        const side = ray % 2 ? 1 : -1
                        const x = width * (0.5 + side * (0.25 + phase * 0.3))
                        context.beginPath()
                        context.moveTo(x, y)
                        context.lineTo(x + side * (18 + phase * 30), y + 8)
                        context.stroke()
                    }
                }
                context.restore()
            }

            if (state.mode === 'playing' && state.speed > 22 && !state.reducedMotion) {
                const strength = clamp((state.speed - 22) / Math.max(1, MAX_SPEED - 22), 0, 1)
                context.save()
                context.strokeStyle = `rgba(255, 255, 255, ${0.04 + strength * 0.06})`
                context.lineWidth = 1
                for (let line = 0; line < 16; line += 1) {
                    const side = line % 2 ? 1 : -1
                    const seed = (line * 73.17) % 100
                    const y = height * (0.19 + (seed / 100) * 0.67)
                    const x = width / 2 + side * width * (0.3 + (line % 5) * 0.055)
                    context.beginPath()
                    context.moveTo(x, y)
                    context.lineTo(x + side * (9 + strength * 19), y + 4 + strength * 7)
                    context.stroke()
                }
                context.restore()
            }

            context.save()
            context.globalAlpha = 0.045
            context.fillStyle = '#ffffff'
            const grainFrame = Math.floor(time * 8)
            for (let grain = 0; grain < 42; grain += 1) {
                const x = (grain * 83 + grainFrame * 29) % Math.max(1, width)
                const y = (grain * 137 + grainFrame * 17) % Math.max(1, height)
                context.fillRect(x, y, 1, 1)
            }
            context.restore()
        }

        function fillRoundedRect(x, y, width, height, radius) {
            roundedRectPath(x, y, width, height, radius)
            context.fill()
        }

        function roundedRectPath(x, y, width, height, radius) {
            const safeRadius = Math.min(Math.abs(width) / 2, Math.abs(height) / 2, radius)
            context.beginPath()
            context.moveTo(x + safeRadius, y)
            context.lineTo(x + width - safeRadius, y)
            context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
            context.lineTo(x + width, y + height - safeRadius)
            context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
            context.lineTo(x + safeRadius, y + height)
            context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
            context.lineTo(x, y + safeRadius)
            context.quadraticCurveTo(x, y, x + safeRadius, y)
            context.closePath()
        }

        function drawHeart(x, y, size, color, darkColor = null) {
            context.save()
            context.translate(x, y)
            context.scale(size / 16, size / 16)
            if (darkColor) {
                const gradient = context.createLinearGradient(-12, -12, 12, 14)
                gradient.addColorStop(0, color)
                gradient.addColorStop(1, darkColor)
                context.fillStyle = gradient
            } else {
                context.fillStyle = color
            }
            context.beginPath()
            context.moveTo(0, 13)
            context.bezierCurveTo(-2, 9, -14, 3, -14, -5)
            context.bezierCurveTo(-14, -13, -4, -16, 0, -9)
            context.bezierCurveTo(4, -16, 14, -13, 14, -5)
            context.bezierCurveTo(14, 3, 2, 9, 0, 13)
            context.closePath()
            context.fill()
            context.restore()
        }

        function updateMovementAudio(delta) {
            state.footstepTimer -= delta
            const grounded = state.jumpElapsed < 0 && state.slideTimer <= 0 && state.landingTimer <= 0 && !isFlightActive()
            const footstepIndex = Math.floor(state.runPhase / Math.PI)
            if (grounded && footstepIndex !== state.lastFootstepIndex && state.footstepTimer <= 0) {
                state.footstepSide = footstepIndex % 2 === 0 ? -1 : 1
                playSound('step')
                if (!state.reducedMotion && state.speed > 24) spawnMovementDust(1)
                state.footstepTimer = clamp(0.34 - state.speed * 0.0045, 0.18, 0.25)
            }
            state.lastFootstepIndex = footstepIndex

            if (state.shieldTimer > 0) {
                state.shieldChimeTimer -= delta
                if (state.shieldChimeTimer <= 0) {
                    state.shieldChimeTimer = 2.15
                    playSound('shieldPulse')
                }
            } else {
                state.shieldChimeTimer = 0
            }
        }

        function unlockAudio() {
            if (state.audioContext) {
                if (state.audioContext.state === 'suspended') state.audioContext.resume().catch(() => {})
                return
            }
            const AudioContextClass = window.AudioContext || window.webkitAudioContext
            if (!AudioContextClass) return
            try {
                const audio = new AudioContextClass()
                const compressor = audio.createDynamicsCompressor()
                const sfxBus = audio.createGain()
                compressor.threshold.value = -18
                compressor.knee.value = 14
                compressor.ratio.value = 4
                compressor.attack.value = 0.004
                compressor.release.value = 0.18
                sfxBus.gain.value = state.muted ? 0 : 0.82
                sfxBus.connect(compressor)
                compressor.connect(audio.destination)
                const noiseBuffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.36), audio.sampleRate)
                const noiseChannel = noiseBuffer.getChannelData(0)
                for (let index = 0; index < noiseChannel.length; index += 1) {
                    noiseChannel[index] = Math.random() * 2 - 1
                }
                state.audioContext = audio
                state.audioCompressor = compressor
                state.sfxBus = sfxBus
                state.noiseBuffer = noiseBuffer
                if (audio.state === 'suspended') audio.resume().catch(() => {})
            } catch {
                state.audioContext = null
                state.audioCompressor = null
                state.sfxBus = null
                state.noiseBuffer = null
            }
        }

        function updateAudioControls() {
            const label = state.muted ? 'Activar música y sonidos del juego' : 'Silenciar música y sonidos del juego'
            elements.muteButton.textContent = state.muted ? '×' : '♫'
            elements.muteButton.setAttribute('aria-label', label)
            elements.muteButton.setAttribute('aria-pressed', String(state.muted))
            elements.muteButton.title = label
            root.dataset.audio = state.muted ? 'off' : 'on'
            if (miaBarkAudio) miaBarkAudio.muted = state.muted
        }

        function toggleMute() {
            state.muted = !state.muted
            writeStorage(SOUND_MUTED_KEY, String(state.muted))
            updateAudioControls()

            if (state.muted) {
                pauseGameMusic()
                miaBarkAudio?.pause()
                if (state.sfxBus && state.audioContext) {
                    state.sfxBus.gain.setTargetAtTime(0.0001, state.audioContext.currentTime, 0.015)
                }
                return
            }

            unlockAudio()
            if (state.sfxBus && state.audioContext) {
                state.sfxBus.gain.cancelScheduledValues(state.audioContext.currentTime)
                state.sfxBus.gain.setTargetAtTime(0.82, state.audioContext.currentTime, 0.02)
            }
            syncGameMusic()
            playSound('resume')
        }

        function isMusicMode(mode = state.mode) {
            return ['tutorial', 'countdown', 'playing', 'crashing', 'celebrating', 'gameover'].includes(mode)
        }

        function startGameMusic() {
            const music = state.gameMusic
            if (!music || state.muted || !state.active) return
            music.loop = true
            music.preload = 'auto'
            music.volume = clamp(state.musicVolume || 0.025, 0, 0.18)
            if (music.paused) music.play().catch(() => {})
        }

        function pauseGameMusic() {
            if (!state.gameMusic || state.gameMusic.paused) return
            state.gameMusic.pause()
        }

        function syncGameMusic() {
            if (!state.active || state.muted || !isMusicMode()) {
                pauseGameMusic()
                return
            }
            startGameMusic()
        }

        function duckMusic(amount = 0.45, duration = 0.25) {
            state.musicDuck = Math.max(state.musicDuck, amount)
            state.musicDuckTimer = Math.max(state.musicDuckTimer, duration)
        }

        function updateAudioMix(delta) {
            if (state.musicDuckTimer > 0) {
                state.musicDuckTimer = Math.max(0, state.musicDuckTimer - delta)
            } else {
                state.musicDuck = Math.max(0, state.musicDuck - delta * 2.7)
            }

            const modeVolumes = {
                tutorial: 0.075,
                countdown: 0.105,
                playing: 0.135,
                crashing: 0.055,
                celebrating: 0.12,
                gameover: 0.07
            }
            const comboLift = state.mode === 'playing' ? Math.min(0.022, (getComboMultiplier() - 1) * 0.007) : 0
            const baseVolume = modeVolumes[state.mode] || 0
            const targetVolume = state.muted ? 0 : (baseVolume + comboLift) * (1 - state.musicDuck * 0.68)
            const smoothing = 1 - Math.exp(-delta * (targetVolume > state.musicVolume ? 2.6 : 8.5))
            state.musicVolume = mix(state.musicVolume, targetVolume, smoothing)

            if (state.gameMusic && !state.gameMusic.paused) {
                state.gameMusic.volume = clamp(state.musicVolume, 0, 0.18)
            }
        }

        function playMiaBark() {
            if (state.muted) return
            duckMusic(0.82, 1.18)
            if (!miaBarkAudio) {
                root.dataset.miaBark = 'fallback'
                playSound('miaBarkFallback')
                return
            }

            miaBarkAudio.pause()
            miaBarkAudio.currentTime = 0
            miaBarkAudio.muted = false
            miaBarkAudio.volume = 0.86
            const playback = miaBarkAudio.play()
            if (playback && typeof playback.then === 'function') {
                playback.then(() => {
                    root.dataset.miaBark = 'played'
                }).catch(() => {
                    root.dataset.miaBark = 'fallback'
                    playSound('miaBarkFallback')
                })
            } else {
                root.dataset.miaBark = 'played'
            }
        }

        function playSound(name) {
            if (state.muted) return
            unlockAudio()
            if (!state.audioContext || !state.sfxBus) return

            const playerPan = clamp(state.lane * 0.42, -0.55, 0.55)
            const sceneKey = getSceneMix().current.key
            if (name === 'coin') {
                const scale = [0, 2, 4, 7, 9]
                const frequency = 659 * Math.pow(2, scale[(state.coins - 1) % scale.length] / 12)
                playTone(frequency, 0.09, 'sine', frequency * 1.08, 0, 0.047, playerPan)
                playTone(frequency * 1.5, 0.11, 'triangle', frequency * 1.58, 0.035, 0.024, playerPan)
            } else if (name === 'heartMilestone') {
                duckMusic(0.24, 0.34)
                ;[659, 784, 988, 1319].forEach((frequency, index) => {
                    playTone(frequency, 0.16, index % 2 ? 'triangle' : 'sine', frequency * 1.04, index * 0.055, 0.045, playerPan)
                })
            } else if (name === 'miaBarkFallback') {
                duckMusic(0.7, 0.9)
                ;[0, 0.39].forEach((delay, index) => {
                    playNoise(0.13, 0.047, { frequency: 430 + index * 70, type: 'bandpass', pan: playerPan, delay })
                    playTone(265 + index * 18, 0.15, 'sawtooth', 145 + index * 12, delay, 0.034, playerPan)
                })
            } else if (name === 'jump') {
                playTone(245, 0.2, 'triangle', 650, 0, 0.044, playerPan)
                playNoise(0.12, 0.014, { frequency: 1250, type: 'highpass', pan: playerPan })
            } else if (name === 'sneakerJump') {
                playTone(280, 0.22, 'triangle', 760, 0, 0.043, playerPan)
                playNoise(0.14, 0.016, { frequency: 1550, type: 'highpass', pan: playerPan })
                playTone(988, 0.12, 'sine', 1319, 0.055, 0.018, playerPan)
            } else if (name === 'airJump') {
                duckMusic(0.12, 0.2)
                playNoise(0.2, 0.02, { frequency: 1900, type: 'highpass', pan: playerPan })
                playTone(392, 0.2, 'triangle', 988, 0, 0.04, playerPan)
                playTone(1047, 0.16, 'sine', 1568, 0.07, 0.026, playerPan)
            } else if (name === 'land') {
                const landSurface = sceneKey === 'aguamarina'
                    ? { frequency: 145, type: 'lowpass', tone: 76 }
                    : sceneKey === 'hospital'
                        ? { frequency: 720, type: 'bandpass', tone: 128 }
                        : { frequency: 390, type: 'bandpass', tone: 108 }
                playNoise(0.085, 0.027, { frequency: landSurface.frequency, type: landSurface.type, pan: playerPan })
                playTone(landSurface.tone, 0.075, 'sine', landSurface.tone * 0.68, 0, 0.018, playerPan)
            } else if (name === 'fastFall') {
                playNoise(0.18, 0.022, { frequency: 1050, type: 'highpass', pan: playerPan })
                playTone(420, 0.16, 'triangle', 155, 0, 0.026, playerPan)
            } else if (name === 'landingRoll') {
                const rollFrequency = sceneKey === 'aguamarina' ? 260 : sceneKey === 'hospital' ? 920 : 560
                playNoise(0.24, 0.026, { frequency: rollFrequency, type: 'bandpass', pan: playerPan })
                playTone(170, 0.16, 'sine', 98, 0, 0.022, playerPan)
            } else if (name === 'slide') {
                const slideFrequency = sceneKey === 'aguamarina' ? 230 : sceneKey === 'hospital' ? 1120 : 720
                playNoise(sceneKey === 'aguamarina' ? 0.26 : 0.2, 0.026, { frequency: slideFrequency, type: 'bandpass', pan: playerPan })
                playTone(230, 0.15, 'sine', 125, 0, 0.026, playerPan)
            } else if (name === 'moveLeft' || name === 'moveRight') {
                const pan = name === 'moveLeft' ? -0.62 : 0.62
                playNoise(0.075, 0.018, { frequency: 1150, type: 'bandpass', pan })
                playTone(190, 0.055, 'sine', 260, 0, 0.017, pan)
            } else if (name === 'step') {
                const pan = state.footstepSide * 0.16
                const surface = sceneKey === 'aguamarina'
                    ? { frequency: 135, type: 'lowpass', tone: 68, duration: 0.06 }
                    : sceneKey === 'hospital'
                        ? { frequency: 860, type: 'bandpass', tone: 118, duration: 0.038 }
                        : { frequency: 470, type: 'bandpass', tone: 94, duration: 0.045 }
                playNoise(surface.duration, 0.011, { frequency: surface.frequency, type: surface.type, pan })
                playTone(surface.tone + Math.random() * 8, surface.duration, 'sine', surface.tone * 0.72, 0, 0.008, pan)
            } else if (name === 'warning') {
                playTone(740, 0.055, 'square', 680, 0, 0.014)
                playTone(740, 0.055, 'square', 680, 0.09, 0.012)
            } else if (name === 'oncoming') {
                const warningPan = playerPan * -0.6
                playNoise(0.28, 0.014, { frequency: 420, type: 'bandpass', pan: warningPan })
                playTone(294, 0.11, 'square', 262, 0, 0.024, warningPan)
                playTone(392, 0.12, 'square', 349, 0.15, 0.022, warningPan)
            } else if (name === 'clear') {
                playNoise(0.1, 0.014, { frequency: 1450, type: 'highpass', pan: playerPan })
                playTone(392, 0.09, 'triangle', 540, 0, 0.025, playerPan)
            } else if (name === 'movingClear') {
                playNoise(0.22, 0.022, { frequency: 1750, type: 'highpass', pan: playerPan })
                playTone(392, 0.14, 'triangle', 659, 0, 0.032, playerPan)
                playTone(784, 0.15, 'sine', 1047, 0.065, 0.026, playerPan)
            } else if (name === 'perfect') {
                playTone(523, 0.11, 'triangle', 659, 0, 0.034, playerPan)
                playTone(784, 0.13, 'sine', 988, 0.065, 0.029, playerPan)
            } else if (name === 'combo') {
                duckMusic(0.16, 0.22)
                ;[523, 659, 784].forEach((frequency, index) => playTone(frequency, 0.11, 'sine', frequency * 1.04, index * 0.045, 0.034))
            } else if (name === 'memory') {
                duckMusic(0.46, 0.58)
                playNoise(0.045, 0.025, { frequency: 1950, type: 'bandpass', pan: playerPan })
                ;[523, 659, 784, 1047].forEach((frequency, index) => {
                    playTone(frequency, 0.2, index % 2 ? 'triangle' : 'sine', frequency * 1.035, 0.04 + index * 0.065, 0.042, playerPan)
                })
                playTone(1568, 0.24, 'sine', 1760, 0.3, 0.024, playerPan)
            } else if (name === 'letter') {
                duckMusic(0.28, 0.34)
                const letterStep = Math.max(0, state.lettersCollected - 1)
                const letterRoots = [523, 587, 659, 784, 880]
                const rootFrequency = letterRoots[letterStep % letterRoots.length]
                playNoise(0.055, 0.014, { frequency: 2200, type: 'highpass', pan: playerPan })
                playTone(rootFrequency, 0.15, 'triangle', rootFrequency * 1.08, 0, 0.04, playerPan)
                playTone(rootFrequency * 1.5, 0.18, 'sine', rootFrequency * 1.58, 0.065, 0.032, playerPan)
                playTone(rootFrequency * 2, 0.2, 'sine', rootFrequency * 2.08, 0.13, 0.021, playerPan)
            } else if (name === 'wordComplete') {
                duckMusic(0.66, 0.88)
                playNoise(0.19, 0.018, { frequency: 2400, type: 'highpass', pan: playerPan })
                ;[523, 659, 784, 1047, 1319, 1568].forEach((frequency, index) => {
                    playTone(frequency, 0.24, index % 2 ? 'sine' : 'triangle', frequency * 1.045, index * 0.065, 0.046, playerPan)
                })
                playTone(2093, 0.3, 'sine', 2349, 0.38, 0.026, playerPan)
            } else if (name === 'crate') {
                duckMusic(0.42, 0.52)
                const crateRoot = [392, 440, 523][Math.max(0, state.cratesOpened - 1) % 3]
                playNoise(0.12, 0.022, { frequency: 1850, type: 'highpass', pan: playerPan })
                playTone(crateRoot, 0.14, 'triangle', crateRoot * 1.12, 0, 0.042, playerPan)
                playTone(crateRoot * 1.5, 0.18, 'sine', crateRoot * 1.62, 0.07, 0.038, playerPan)
                playTone(crateRoot * 2, 0.22, 'sine', crateRoot * 2.12, 0.15, 0.027, playerPan)
            } else if (name === 'crateComplete') {
                duckMusic(0.7, 0.92)
                playNoise(0.22, 0.022, { frequency: 2450, type: 'highpass', pan: playerPan })
                ;[392, 523, 659, 784, 1047, 1319, 1568].forEach((frequency, index) => {
                    playTone(frequency, 0.25, index % 2 ? 'triangle' : 'sine', frequency * 1.055, index * 0.058, 0.045, playerPan)
                })
                playTone(2093, 0.32, 'sine', 2349, 0.42, 0.028, playerPan)
            } else if (name === 'fever') {
                duckMusic(0.56, 0.74)
                playNoise(0.24, 0.02, { frequency: 2200, type: 'highpass' })
                ;[392, 523, 659, 784, 1047, 1319].forEach((frequency, index) => {
                    playTone(frequency, 0.22, index % 2 ? 'triangle' : 'sine', frequency * 1.08, index * 0.052, 0.04)
                })
            } else if (name === 'impact') {
                duckMusic(0.9, 0.62)
                playNoise(0.18, 0.082, { frequency: 520, type: 'lowpass' })
                playTone(115, 0.25, 'sawtooth', 52, 0, 0.052)
            } else if (name === 'shieldHit') {
                duckMusic(0.7, 0.46)
                playTone(330, 0.12, 'triangle', 720, 0, 0.043)
                playTone(860, 0.18, 'sine', 390, 0.065, 0.034)
                playNoise(0.14, 0.025, { frequency: 1850, type: 'highpass' })
            } else if (name === 'shieldPulse') {
                playTone(740, 0.12, 'sine', 860, 0, 0.012, playerPan)
                playTone(1110, 0.14, 'sine', 1240, 0.045, 0.008, playerPan)
            } else if (name === 'power') {
                duckMusic(0.32, 0.42)
                ;[440, 554, 660, 880].forEach((frequency, index) => playTone(frequency, 0.14, 'sine', frequency * 1.05, index * 0.06, 0.04, playerPan))
            } else if (name === 'powerMagnet') {
                duckMusic(0.3, 0.4)
                playTone(330, 0.22, 'triangle', 880, 0, 0.04, playerPan)
                playTone(659, 0.18, 'sine', 988, 0.07, 0.035, playerPan)
                playTone(988, 0.16, 'sine', 1319, 0.14, 0.028, playerPan)
            } else if (name === 'powerMultiplier') {
                duckMusic(0.34, 0.44)
                ;[523, 659, 784, 1047].forEach((frequency, index) => {
                    playTone(frequency, 0.16, index % 2 ? 'triangle' : 'sine', frequency * 1.08, index * 0.05, 0.04, playerPan)
                })
                playTone(1568, 0.2, 'sine', 1760, 0.2, 0.027, playerPan)
            } else if (name === 'powerSneakers') {
                duckMusic(0.38, 0.5)
                playNoise(0.22, 0.02, { frequency: 1800, type: 'highpass', pan: playerPan })
                ;[392, 587, 784, 1175].forEach((frequency, index) => {
                    playTone(frequency, 0.18, index % 2 ? 'triangle' : 'sine', frequency * 1.08, index * 0.055, 0.04, playerPan)
                })
            } else if (name === 'powerFlight') {
                duckMusic(0.48, 0.62)
                playNoise(0.36, 0.028, { frequency: 2100, type: 'highpass', pan: playerPan })
                ;[392, 523, 659, 988, 1319].forEach((frequency, index) => {
                    playTone(frequency, 0.22, index % 2 ? 'triangle' : 'sine', frequency * 1.09, index * 0.065, 0.038, playerPan)
                })
            } else if (name === 'flightGlide') {
                playNoise(0.34, 0.012, { frequency: 1650, type: 'highpass', pan: playerPan })
                playTone(784, 0.2, 'sine', 1047, 0.04, 0.014, playerPan)
            } else if (name === 'flightEnd') {
                playNoise(0.24, 0.018, { frequency: 980, type: 'bandpass', pan: playerPan })
                playTone(659, 0.24, 'triangle', 330, 0, 0.028, playerPan)
            } else if (name === 'boost') {
                duckMusic(0.26, 0.4)
                playNoise(0.28, 0.026, { frequency: 1650, type: 'highpass', pan: playerPan })
                playTone(220, 0.28, 'triangle', 880, 0, 0.046, playerPan)
                playTone(659, 0.2, 'sine', 1319, 0.09, 0.032, playerPan)
            } else if (name === 'mission') {
                duckMusic(0.48, 0.62)
                ;[523, 659, 784, 1047].forEach((frequency, index) => {
                    playTone(frequency, 0.18, index % 2 ? 'triangle' : 'sine', frequency * 1.04, index * 0.065, 0.042)
                })
                playTone(1568, 0.22, 'sine', 1760, 0.25, 0.025)
            } else if (name === 'resume') {
                playTone(392, 0.09, 'triangle', 523, 0, 0.025)
                playTone(659, 0.11, 'sine', 720, 0.055, 0.021)
            } else if (name === 'countdown') {
                playTone(330, 0.085, 'sine', 300, 0, 0.032)
            } else if (name === 'go') {
                duckMusic(0.18, 0.25)
                playTone(523, 0.12, 'triangle', 784, 0, 0.045)
                playTone(784, 0.16, 'sine', 1047, 0.06, 0.04)
            } else if (name === 'scene') {
                duckMusic(0.4, 0.52)
                const sceneThemes = [[392, 523, 659], [440, 587, 740], [349, 523, 698]]
                const notes = sceneThemes[state.sceneIndex] || sceneThemes[0]
                notes.forEach((frequency, index) => playTone(frequency, 0.19, 'sine', frequency * 1.07, index * 0.08, 0.038))
            } else if (name === 'record') {
                duckMusic(0.55, 0.7)
                ;[523, 659, 784, 1047].forEach((frequency, index) => playTone(frequency, 0.2, 'sine', frequency * 1.03, index * 0.085, 0.045))
            } else if (name === 'finish') {
                duckMusic(0.72, 0.85)
                ;[392, 523, 659, 784, 1047].forEach((frequency, index) => {
                    playTone(frequency, 0.24, index % 2 ? 'sine' : 'triangle', frequency * 1.04, index * 0.072, 0.05)
                })
            } else if (name === 'end') {
                duckMusic(0.65, 0.65)
                playTone(440, 0.18, 'triangle', 392, 0, 0.034)
                playTone(330, 0.24, 'triangle', 294, 0.11, 0.031)
            }
        }

        function connectSfxNode(node, pan = 0) {
            const audio = state.audioContext
            const destination = state.sfxBus
            if (!audio || !destination) return
            if (typeof audio.createStereoPanner === 'function') {
                const panner = audio.createStereoPanner()
                panner.pan.value = clamp(pan, -1, 1)
                node.connect(panner)
                panner.connect(destination)
                return
            }
            node.connect(destination)
        }

        function playTone(frequency, duration, type, endFrequency, delay = 0, volume = 0.055, pan = 0) {
            const audio = state.audioContext
            if (!audio || !state.sfxBus || state.muted) return
            const start = audio.currentTime + delay
            const oscillator = audio.createOscillator()
            const gain = audio.createGain()
            oscillator.type = type
            oscillator.frequency.setValueAtTime(Math.max(30, frequency), start)
            oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency || frequency), start + duration)
            gain.gain.setValueAtTime(0.0001, start)
            gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.014, duration * 0.25))
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
            oscillator.connect(gain)
            connectSfxNode(gain, pan)
            oscillator.start(start)
            oscillator.stop(start + duration + 0.025)
        }

        function playNoise(duration, volume, { frequency = 900, type = 'bandpass', pan = 0, delay = 0 } = {}) {
            const audio = state.audioContext
            if (!audio || !state.sfxBus || !state.noiseBuffer || state.muted) return
            const start = audio.currentTime + delay
            const source = audio.createBufferSource()
            const filter = audio.createBiquadFilter()
            const gain = audio.createGain()
            source.buffer = state.noiseBuffer
            filter.type = type
            filter.frequency.value = frequency
            filter.Q.value = type === 'bandpass' ? 0.8 : 0.45
            gain.gain.setValueAtTime(0.0001, start)
            gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.01, duration * 0.2))
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
            source.connect(filter)
            filter.connect(gain)
            connectSfxNode(gain, pan)
            const maxOffset = Math.max(0, (state.noiseBuffer?.duration || duration) - duration)
            source.start(start, Math.random() * maxOffset)
            source.stop(start + duration + 0.01)
        }

        function pulseHaptics(pattern) {
            if (state.reducedMotion || typeof navigator.vibrate !== 'function') return
            navigator.vibrate(pattern)
        }

        function formatScore(value) {
            return new Intl.NumberFormat('es-ES').format(Math.max(0, Math.floor(value)))
        }

        function formatHistoryDetails(entry) {
            const details = []
            if (entry.timestamp) {
                details.push(new Intl.DateTimeFormat('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                }).format(new Date(entry.timestamp)))
            } else {
                details.push('Récord anterior')
            }
            if (Number.isFinite(entry.distance)) details.push(`${entry.distance} m`)
            if (Number.isFinite(entry.coins)) details.push(`${entry.coins} corazones`)
            return details.join(' · ')
        }

        function readScoreHistory(fallbackBest) {
            const legacyEntry = fallbackBest > 0
                ? [{ score: fallbackBest, distance: null, coins: null, completed: null, timestamp: null }]
                : []
            try {
                const stored = JSON.parse(window.localStorage.getItem(SCORE_HISTORY_KEY) || '[]')
                if (!Array.isArray(stored)) return legacyEntry
                const history = stored
                    .filter((entry) => entry && Number.isFinite(Number(entry.score)) && Number(entry.score) > 0)
                    .map((entry) => ({
                        score: Math.floor(Number(entry.score)),
                        distance: entry.distance !== null && entry.distance !== undefined && entry.distance !== '' && Number.isFinite(Number(entry.distance))
                            ? Math.max(0, Math.floor(Number(entry.distance)))
                            : null,
                        coins: entry.coins !== null && entry.coins !== undefined && entry.coins !== '' && Number.isFinite(Number(entry.coins))
                            ? Math.max(0, Math.floor(Number(entry.coins)))
                            : null,
                        completed: typeof entry.completed === 'boolean' ? entry.completed : null,
                        timestamp: Number.isFinite(Number(entry.timestamp)) && Number(entry.timestamp) > 0 && Number(entry.timestamp) <= 8640000000000000
                            ? Number(entry.timestamp)
                            : null
                    }))
                    .sort((left, right) => right.score - left.score || (right.timestamp || 0) - (left.timestamp || 0))
                    .slice(0, SCORE_HISTORY_LIMIT)
                return history.length ? history : legacyEntry
            } catch {
                return legacyEntry
            }
        }

        function recordScoreHistory(entry) {
            if (!entry || !Number.isFinite(entry.score) || entry.score <= 0) return
            state.scoreHistory = [...state.scoreHistory, entry]
                .sort((left, right) => right.score - left.score || (right.timestamp || 0) - (left.timestamp || 0))
                .slice(0, SCORE_HISTORY_LIMIT)
            writeStorage(SCORE_HISTORY_KEY, JSON.stringify(state.scoreHistory))
            renderScoreHistory()
        }

        function readStoredNumber(key) {
            try {
                const value = Number(window.localStorage.getItem(key))
                return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
            } catch {
                return 0
            }
        }

        function readStoredBoolean(key) {
            try {
                return window.localStorage.getItem(key) === 'true'
            } catch {
                return false
            }
        }

        function writeStorage(key, value) {
            try {
                window.localStorage.setItem(key, value)
            } catch {
                // La partida sigue funcionando aunque el navegador bloquee el almacenamiento.
            }
        }
    }
})()
