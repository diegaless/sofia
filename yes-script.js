if (document.readyState === 'complete') {
    initPage()
} else {
    window.addEventListener('load', initPage, { once: true })
}

function initPage() {
    const music = document.getElementById('bg-music')
    const musicToggle = document.getElementById('music-toggle')

    if (!music || !musicToggle) {
        return
    }

    const state = {
        musicPlaying: false,
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    musicToggle.addEventListener('click', () => toggleMusic(state, music, musicToggle))

    initializeMusic(state, music, musicToggle)
    initWalkingDog()

    if (!state.prefersReducedMotion) {
        launchConfetti()
    }
}

function initWalkingDog() {
    const track = document.querySelector('.walking-dog-track')
    const dog = document.querySelector('.walking-dog')
    const photo = document.querySelector('.ojitos-photo')

    if (!track || !dog || !photo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return
    }

    const state = {
        activeAnimation: null,
        currentPoint: null,
        currentAngle: 0,
        layoutVersion: 0,
        dogWidth: 160,
        dogHeight: 72
    }

    const randomBetween = (min, max) => min + Math.random() * Math.max(0, max - min)
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

    const fitDogToSidePassage = () => {
        dog.style.width = ''
        const baseWidth = parseFloat(getComputedStyle(dog).width) || 160
        const photoRect = photo.getBoundingClientRect()
        const horizontalPassage = Math.max(photoRect.left, window.innerWidth - photoRect.right)
        const verticalPassage = Math.max(photoRect.top, window.innerHeight - photoRect.bottom)
        const aspectRatio = (dog.naturalWidth || 580) / (dog.naturalHeight || 260)
        const diagonalFactor = Math.sqrt(1 + 1 / (aspectRatio ** 2)) / 2
        const limitingPassage = Math.min(horizontalPassage, verticalPassage)
        const maximumRadius = Math.max(30, (limitingPassage - 18) / 2)
        const passageWidth = Math.max(48, (maximumRadius - 4) / diagonalFactor)

        state.dogWidth = Math.min(baseWidth, passageWidth)
        state.dogHeight = state.dogWidth / aspectRatio
        dog.style.width = `${state.dogWidth}px`
    }

    const getMetrics = () => {
        const photoRect = photo.getBoundingClientRect()
        const radius = Math.hypot(state.dogWidth, state.dogHeight) / 2 + 4
        const bounds = {
            minX: radius,
            maxX: window.innerWidth - radius,
            minY: radius,
            maxY: window.innerHeight - radius
        }
        const obstacle = {
            left: photoRect.left - radius - 6,
            right: photoRect.right + radius + 6,
            top: photoRect.top - radius - 6,
            bottom: photoRect.bottom + radius + 6
        }
        return { bounds, obstacle, radius }
    }

    const pointInsideObstacle = (point, obstacle) => (
        point.x > obstacle.left && point.x < obstacle.right &&
        point.y > obstacle.top && point.y < obstacle.bottom
    )

    const pointInsideBounds = (point, bounds) => (
        point.x >= bounds.minX && point.x <= bounds.maxX &&
        point.y >= bounds.minY && point.y <= bounds.maxY
    )

    const segmentIsSafe = (start, end, metrics) => {
        const distance = Math.hypot(end.x - start.x, end.y - start.y)
        const steps = Math.max(2, Math.ceil(distance / 7))
        for (let step = 0; step <= steps; step += 1) {
            const progress = step / steps
            const point = {
                x: start.x + (end.x - start.x) * progress,
                y: start.y + (end.y - start.y) * progress
            }
            if (!pointInsideBounds(point, metrics.bounds) || pointInsideObstacle(point, metrics.obstacle)) {
                return false
            }
        }
        return true
    }

    const planRoute = (start, target, metrics) => {
        const { bounds, obstacle } = metrics
        const padding = 3
        const rawNodes = [
            start,
            target,
            { x: obstacle.left - padding, y: obstacle.top - padding },
            { x: obstacle.right + padding, y: obstacle.top - padding },
            { x: obstacle.right + padding, y: obstacle.bottom + padding },
            { x: obstacle.left - padding, y: obstacle.bottom + padding },
            { x: bounds.minX, y: bounds.minY },
            { x: bounds.maxX, y: bounds.minY },
            { x: bounds.maxX, y: bounds.maxY },
            { x: bounds.minX, y: bounds.maxY }
        ]
        const nodes = rawNodes.map((point) => ({
            x: clamp(point.x, bounds.minX, bounds.maxX),
            y: clamp(point.y, bounds.minY, bounds.maxY)
        })).filter((point) => !pointInsideObstacle(point, obstacle))

        const startIndex = 0
        const targetIndex = 1
        if (!nodes[startIndex] || !nodes[targetIndex]) {
            return null
        }

        const distances = Array(nodes.length).fill(Infinity)
        const previous = Array(nodes.length).fill(-1)
        const visited = Array(nodes.length).fill(false)
        distances[startIndex] = 0

        for (let iteration = 0; iteration < nodes.length; iteration += 1) {
            let current = -1
            for (let index = 0; index < nodes.length; index += 1) {
                if (!visited[index] && (current === -1 || distances[index] < distances[current])) {
                    current = index
                }
            }
            if (current === -1 || distances[current] === Infinity) break
            if (current === targetIndex) break
            visited[current] = true

            for (let next = 0; next < nodes.length; next += 1) {
                if (next === current || visited[next] || !segmentIsSafe(nodes[current], nodes[next], metrics)) continue
                const distance = Math.hypot(nodes[next].x - nodes[current].x, nodes[next].y - nodes[current].y)
                if (distances[current] + distance < distances[next]) {
                    distances[next] = distances[current] + distance
                    previous[next] = current
                }
            }
        }

        if (distances[targetIndex] === Infinity) return null
        const route = []
        for (let index = targetIndex; index !== -1; index = previous[index]) {
            route.unshift(nodes[index])
        }
        return route
    }

    const getFreeZones = ({ bounds, obstacle }) => [
        {
            name: 'left',
            left: bounds.minX,
            right: Math.min(bounds.maxX, obstacle.left - 2),
            top: bounds.minY,
            bottom: bounds.maxY
        },
        {
            name: 'right',
            left: Math.max(bounds.minX, obstacle.right + 2),
            right: bounds.maxX,
            top: bounds.minY,
            bottom: bounds.maxY
        },
        {
            name: 'top',
            left: Math.max(bounds.minX, obstacle.left),
            right: Math.min(bounds.maxX, obstacle.right),
            top: bounds.minY,
            bottom: Math.min(bounds.maxY, obstacle.top - 2)
        },
        {
            name: 'bottom',
            left: Math.max(bounds.minX, obstacle.left),
            right: Math.min(bounds.maxX, obstacle.right),
            top: Math.max(bounds.minY, obstacle.bottom + 2),
            bottom: bounds.maxY
        }
    ].filter((zone) => zone.right - zone.left > 4 && zone.bottom - zone.top > 4)

    const zoneForPoint = (point, zones) => zones.find((zone) => (
        point.x >= zone.left && point.x <= zone.right &&
        point.y >= zone.top && point.y <= zone.bottom
    ))

    const randomFreePoint = (metrics, origin = null) => {
        const minimumDistance = Math.min(180, Math.max(window.innerWidth, window.innerHeight) / 4)
        const zones = getFreeZones(metrics)
        const originZone = origin ? zoneForPoint(origin, zones) : null
        const destinationZones = originZone && zones.length > 1
            ? zones.filter((zone) => zone !== originZone)
            : zones

        for (let attempt = 0; attempt < 160; attempt += 1) {
            const zone = destinationZones[Math.floor(Math.random() * destinationZones.length)]
            const point = {
                x: zone ? randomBetween(zone.left, zone.right) : randomBetween(metrics.bounds.minX, metrics.bounds.maxX),
                y: zone ? randomBetween(zone.top, zone.bottom) : randomBetween(metrics.bounds.minY, metrics.bounds.maxY)
            }
            if (pointInsideObstacle(point, metrics.obstacle)) continue
            if (origin && Math.hypot(point.x - origin.x, point.y - origin.y) < minimumDistance) continue
            return point
        }
        return { x: metrics.bounds.minX, y: metrics.bounds.maxY }
    }

    const transformFor = (point, angle) => {
        const x = point.x - state.dogWidth / 2
        const y = point.y - state.dogHeight / 2
        return `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg)`
    }

    const runAnimation = async (keyframes, options) => {
        state.activeAnimation = dog.animate(keyframes, { ...options, fill: 'forwards' })
        try {
            await state.activeAnimation.finished
            return true
        } catch {
            return false
        } finally {
            state.activeAnimation = null
        }
    }

    const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration))

    const walkSegment = async (target) => {
        const start = state.currentPoint
        const heading = Math.atan2(target.y - start.y, target.x - start.x) * 180 / Math.PI
        const angleDelta = ((heading - state.currentAngle + 540) % 360) - 180
        const nextAngle = state.currentAngle + angleDelta
        const startTransform = transformFor(start, state.currentAngle)
        const turnedTransform = transformFor(start, nextAngle)
        const targetTransform = transformFor(target, nextAngle)

        if (Math.abs(angleDelta) > 1) {
            const turned = await runAnimation(
                [{ transform: startTransform }, { transform: turnedTransform }],
                { duration: clamp(Math.abs(angleDelta) * 5, 180, 850), easing: 'ease-in-out' }
            )
            if (!turned) return false
        }

        const distance = Math.hypot(target.x - start.x, target.y - start.y)
        const completed = await runAnimation(
            [{ transform: turnedTransform }, { transform: targetTransform }],
            { duration: Math.max(450, distance / 78 * 1000), easing: 'linear' }
        )
        if (!completed) return false

        dog.style.transform = targetTransform
        state.currentPoint = target
        state.currentAngle = nextAngle
        return true
    }

    const roam = async () => {
        fitDogToSidePassage()
        let metrics = getMetrics()
        state.currentPoint = randomFreePoint(metrics)
        state.currentAngle = Math.random() * 360
        dog.style.transform = transformFor(state.currentPoint, state.currentAngle)
        dog.style.opacity = '1'

        while (dog.isConnected) {
            metrics = getMetrics()
            const version = state.layoutVersion
            let route = null
            for (let attempt = 0; attempt < 24 && !route; attempt += 1) {
                const target = randomFreePoint(metrics, state.currentPoint)
                route = planRoute(state.currentPoint, target, metrics)
            }
            for (let attempt = 0; attempt < 24 && !route; attempt += 1) {
                const fallbackTarget = randomFreePoint(metrics)
                route = planRoute(state.currentPoint, fallbackTarget, metrics)
            }

            if (!route) {
                await wait(250)
                continue
            }

            for (const point of route.slice(1)) {
                if (version !== state.layoutVersion || !await walkSegment(point)) break
            }
            await wait(120 + Math.random() * 300)
        }
    }

    const resetLayout = () => {
        state.layoutVersion += 1
        state.activeAnimation?.cancel()
        fitDogToSidePassage()
    }

    window.addEventListener('resize', resetLayout, { passive: true })

    if (!dog.complete) {
        dog.addEventListener('load', roam, { once: true })
    } else {
        roam()
    }
}

function initializeMusic(state, music, musicToggle) {
    music.autoplay = true
    music.defaultMuted = false
    music.muted = false
    music.volume = 0.3

    music.play().then(() => {
        state.musicPlaying = true
        updateMusicToggle(musicToggle, true)
    }).catch(() => {
        state.musicPlaying = true
        updateMusicToggle(musicToggle, true)
    })
}

function updateMusicToggle(musicToggle, isPlaying) {
    musicToggle.textContent = isPlaying ? '🔊' : '🔇'
    musicToggle.setAttribute('aria-label', isPlaying ? 'Silenciar música' : 'Activar música')
    musicToggle.setAttribute('aria-pressed', String(isPlaying))
    musicToggle.title = isPlaying ? 'Silenciar música' : 'Activar música'
}

function toggleMusic(state, music, musicToggle) {
    if (state.musicPlaying) {
        music.pause()
        state.musicPlaying = false
        updateMusicToggle(musicToggle, false)
        return
    }

    music.play().then(() => {
        state.musicPlaying = true
        updateMusicToggle(musicToggle, true)
    }).catch(() => {})
}

function launchConfetti() {
    if (typeof confetti !== 'function') {
        return
    }

    const colors = ['#ff69b4', '#ff1493', '#ff85a2', '#ffb3c1', '#ff0000', '#ff6347', '#fff', '#ffdf00']
    const duration = 6000
    const end = Date.now() + duration

    confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.3 },
        colors
    })

    const interval = setInterval(() => {
        if (Date.now() > end) {
            clearInterval(interval)
            return
        }

        confetti({
            particleCount: 40,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors
        })

        confetti({
            particleCount: 40,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors
        })
    }, 300)
}
