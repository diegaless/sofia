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
    const dogLayers = [...document.querySelectorAll('.walking-dog-layer')]
    const primaryDogImage = dogLayers[0]
    const photo = document.querySelector('.ojitos-photo')

    if (!track || !dog || dogLayers.length < 2 || !photo || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return
    }

    const state = {
        activeAnimation: null,
        currentPoint: null,
        currentAngle: 0,
        layoutVersion: 0,
        dogWidth: 160,
        dogHeight: 72,
        footprintDistance: 0,
        footprintSide: -1,
        activeFootprints: [],
        nextLickAt: 0,
        easterEggActive: false,
        easterEggTapCount: 0,
        easterEggTapTimer: null,
        pausedTapAnimation: null,
        resumeMobileRoute: false
    }
    const dogMouthForwardRatio = 274 / 580
    const dogVisualsReady = Promise.all(dogLayers.map((image) => (
        typeof image.decode === 'function'
            ? image.decode().catch(() => undefined)
            : Promise.resolve()
    )))

    const randomBetween = (min, max) => min + Math.random() * Math.max(0, max - min)
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
    const scheduleNextLick = (first = false) => {
        state.nextLickAt = performance.now() + randomBetween(first ? 8000 : 18000, first ? 14000 : 30000)
    }
    const usesMobileRoute = () => (
        window.innerWidth <= 700 && window.innerHeight >= window.innerWidth
    )
    const setDogVisual = (visual) => {
        if (dog.dataset.visual === visual) return

        const currentLayer = dogLayers.find((layer) => layer.classList.contains('is-active'))
        const nextLayer = dogLayers.find((layer) => layer.dataset.visual === visual)
        if (!nextLayer) return

        nextLayer.classList.add('is-active')
        currentLayer?.classList.remove('is-active')
        dog.dataset.visual = visual
    }

    scheduleNextLick(true)

    const fitDogToSidePassage = () => {
        dog.style.width = ''
        const baseWidth = parseFloat(getComputedStyle(dog).width) || 160
        const photoRect = photo.getBoundingClientRect()
        const aspectRatio = (primaryDogImage.naturalWidth || 580) / (primaryDogImage.naturalHeight || 260)

        if (usesMobileRoute()) {
            const sidePassage = Math.max(photoRect.left, window.innerWidth - photoRect.right)
            const orientedPassageWidth = Math.max(38, (sidePassage - 3) * aspectRatio)
            state.dogWidth = Math.min(baseWidth, orientedPassageWidth)
            state.dogHeight = state.dogWidth / aspectRatio
            dog.style.width = `${state.dogWidth}px`
            return
        }

        const horizontalPassage = Math.max(photoRect.left, window.innerWidth - photoRect.right)
        const verticalPassage = Math.max(photoRect.top, window.innerHeight - photoRect.bottom)
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

    const removeFootprint = (footprint) => {
        footprint.remove()
        state.activeFootprints = state.activeFootprints.filter((item) => item !== footprint)
    }

    const leaveFootprint = (point, angle, side, easterEgg = false) => {
        const radians = angle * Math.PI / 180
        const sideOffset = clamp(state.dogHeight * 0.22, 3, 7)
        const backOffset = clamp(state.dogWidth * 0.16, 7, 20)
        const footprint = document.createElement('span')
        const x = point.x - Math.cos(radians) * backOffset - Math.sin(radians) * sideOffset * side
        const y = point.y - Math.sin(radians) * backOffset + Math.cos(radians) * sideOffset * side

        footprint.className = easterEgg ? 'dog-footprint easter-egg-footprint' : 'dog-footprint'
        footprint.style.left = `${x}px`
        footprint.style.top = `${y}px`
        footprint.style.setProperty('--footprint-angle', `${angle + 90}deg`)
        if (!easterEgg) {
            footprint.addEventListener('animationend', () => removeFootprint(footprint), { once: true })
        }
        track.insertBefore(footprint, dog)
        state.activeFootprints.push(footprint)

        const footprintLimit = state.easterEggActive ? 140 : 25
        while (state.activeFootprints.length > footprintLimit) {
            removeFootprint(state.activeFootprints[0])
        }
    }

    const scheduleFootprints = (start, target, angle, duration, options = {}) => {
        const distance = Math.hypot(target.x - start.x, target.y - start.y)
        const spacing = options.spacing || (usesMobileRoute() ? 24 : 31)
        const timers = []
        let nextDistance = spacing - state.footprintDistance

        while (nextDistance <= distance) {
            const progress = nextDistance / distance
            const side = state.footprintSide
            const point = {
                x: start.x + (target.x - start.x) * progress,
                y: start.y + (target.y - start.y) * progress
            }
            const timer = setTimeout(
                () => leaveFootprint(point, angle, side, Boolean(options.easterEgg)),
                duration * progress
            )
            timers.push(timer)
            state.footprintSide *= -1
            nextDistance += spacing
        }

        state.footprintDistance = (state.footprintDistance + distance) % spacing
        return timers
    }

    const cancelFootprintTimers = (timers) => timers.forEach((timer) => clearTimeout(timer))

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

    const walkBackward = async (target) => {
        setDogVisual('walk')
        const start = state.currentPoint
        const angle = state.currentAngle
        const distance = Math.hypot(target.x - start.x, target.y - start.y)
        const duration = Math.max(380, distance / 55 * 1000)
        const footprintTimers = scheduleFootprints(start, target, angle, duration)
        const completed = await runAnimation(
            [
                { transform: transformFor(start, angle) },
                { transform: transformFor(target, angle) }
            ],
            { duration, easing: 'ease-in-out' }
        )
        if (!completed) {
            cancelFootprintTimers(footprintTimers)
            return false
        }

        dog.style.transform = transformFor(target, angle)
        state.currentPoint = target
        return true
    }

    const lickPhoto = async (point, angle) => {
        const radians = angle * Math.PI / 180
        const angleDelta = ((angle - state.currentAngle + 540) % 360) - 180
        const facingAngle = state.currentAngle + angleDelta
        const facingTransform = transformFor(point, facingAngle)

        if (Math.abs(angleDelta) > 1) {
            const turned = await runAnimation(
                [{ transform: transformFor(point, state.currentAngle) }, { transform: facingTransform }],
                { duration: clamp(Math.abs(angleDelta) * 5, 180, 780), easing: 'ease-in-out' }
            )
            if (!turned) return false
        }

        setDogVisual('lick')
        const forwardDistance = clamp(state.dogWidth * 0.03, 2, 5)
        const tongue = document.createElement('span')
        const forwardPoint = {
            x: point.x + Math.cos(radians) * forwardDistance,
            y: point.y + Math.sin(radians) * forwardDistance
        }

        tongue.className = 'dog-tongue-extension'
        tongue.style.width = `${clamp(state.dogWidth * 0.18, 8, 16)}px`
        dog.appendChild(tongue)

        const licked = await runAnimation(
            [
                { transform: facingTransform, offset: 0 },
                { transform: transformFor(forwardPoint, facingAngle), offset: 0.16 },
                { transform: facingTransform, offset: 0.32 },
                { transform: transformFor(forwardPoint, facingAngle), offset: 0.5 },
                { transform: facingTransform, offset: 0.66 },
                { transform: transformFor(forwardPoint, facingAngle), offset: 0.84 },
                { transform: facingTransform, offset: 1 }
            ],
            { duration: 1500, easing: 'ease-in-out' }
        )
        tongue.remove()
        if (!licked) {
            setDogVisual('walk')
            return false
        }

        setDogVisual('idle')
        dog.style.transform = facingTransform
        state.currentPoint = point
        state.currentAngle = facingAngle
        scheduleNextLick()
        return true
    }

    const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration))

    const pauseAndWag = async (duration = 850) => {
        setDogVisual('idle')
        await wait(duration)
        return dog.isConnected
    }

    const captureCurrentPose = () => {
        const rect = dog.getBoundingClientRect()
        const transform = getComputedStyle(dog).transform
        let angle = state.currentAngle

        if (transform && transform !== 'none') {
            try {
                const matrix = new DOMMatrixReadOnly(transform)
                angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI
            } catch {
                // Keep the last known angle on browsers without DOMMatrixReadOnly.
            }
        }

        return {
            point: {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            },
            angle
        }
    }

    const buildHeartPath = () => {
        const horizontalMargin = Math.max(44, state.dogWidth * 0.72)
        const drawingHeight = Math.min(window.innerHeight * 0.46, 360)
        const scale = Math.min(
            10,
            (window.innerWidth - horizontalMargin * 2) / 32,
            (drawingHeight - 20) / 29
        )
        const centerX = window.innerWidth / 2
        const centerY = clamp(
            window.innerHeight * 0.34,
            18 + scale * 12,
            window.innerHeight * 0.58 - scale * 17
        )
        const points = []
        const steps = 40

        for (let step = 0; step <= steps; step += 1) {
            const angle = step / steps * Math.PI * 2
            const x = 16 * Math.sin(angle) ** 3
            const y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) -
                2 * Math.cos(3 * angle) - Math.cos(4 * angle)
            points.push({
                x: centerX + x * scale,
                y: centerY - y * scale
            })
        }
        return points
    }

    const showEasterEggBackdrop = () => {
        const backdrop = document.createElement('div')
        backdrop.className = 'easter-egg-backdrop'
        document.body.appendChild(backdrop)
        track.classList.add('easter-egg-mode')
        requestAnimationFrame(() => backdrop.classList.add('is-visible'))
        return backdrop
    }

    const hideEasterEggBackdrop = async (backdrop) => {
        backdrop.classList.remove('is-visible')
        await wait(300)
        backdrop.remove()
        track.classList.remove('easter-egg-mode')
    }

    const showEasterEggMessage = async () => {
        const message = document.createElement('div')
        message.className = 'easter-egg-message'
        message.setAttribute('role', 'status')
        message.textContent = 'Te elegiría en todas mis vidas, ratita 💗'
        document.body.appendChild(message)
        requestAnimationFrame(() => message.classList.add('is-visible'))
        await wait(4200)
        message.classList.remove('is-visible')
        await wait(350)
        message.remove()
    }

    const fadeEasterEggFootprints = async () => {
        const footprints = state.activeFootprints.filter((footprint) => (
            footprint.classList.contains('easter-egg-footprint')
        ))
        footprints.forEach((footprint) => footprint.classList.add('is-fading'))
        await wait(1450)
        footprints.forEach(removeFootprint)
    }

    const addLinePoints = (points, start, end, spacing = 12) => {
        const distance = Math.hypot(end.x - start.x, end.y - start.y)
        const steps = Math.max(1, Math.ceil(distance / spacing))
        for (let step = 1; step <= steps; step += 1) {
            const progress = step / steps
            points.push({
                x: start.x + (end.x - start.x) * progress,
                y: start.y + (end.y - start.y) * progress
            })
        }
    }

    const addCurvePoints = (points, start, control, end, spacing = 7) => {
        const approximateLength = Math.hypot(control.x - start.x, control.y - start.y) +
            Math.hypot(end.x - control.x, end.y - control.y)
        const steps = Math.max(4, Math.ceil(approximateLength / spacing))
        for (let step = 1; step <= steps; step += 1) {
            const progress = step / steps
            const inverse = 1 - progress
            points.push({
                x: inverse ** 2 * start.x + 2 * inverse * progress * control.x + progress ** 2 * end.x,
                y: inverse ** 2 * start.y + 2 * inverse * progress * control.y + progress ** 2 * end.y
            })
        }
    }

    const buildMobileLoop = () => {
        const photoRect = photo.getBoundingClientRect()
        const halfHeight = state.dogHeight / 2
        const leftX = clamp(
            photoRect.left / 2,
            halfHeight + 1,
            Math.max(halfHeight + 1, photoRect.left - halfHeight - 1)
        )
        const rightX = clamp(
            photoRect.right + (window.innerWidth - photoRect.right) / 2,
            Math.min(window.innerWidth - halfHeight - 1, photoRect.right + halfHeight + 1),
            window.innerWidth - halfHeight - 1
        )
        const radius = Math.min(
            34,
            state.dogWidth * 0.72,
            (rightX - leftX) / 4,
            Math.max(18, photoRect.top / 3),
            Math.max(18, (window.innerHeight - photoRect.bottom) / 3)
        )
        const cornerClearance = 15
        const topY = Math.max(halfHeight + 2, photoRect.top - radius - halfHeight - cornerClearance)
        const bottomY = Math.min(
            window.innerHeight - halfHeight - 2,
            photoRect.bottom + radius + halfHeight + cornerClearance
        )
        const points = []
        const topLeft = { x: leftX + radius, y: topY }
        const topRight = { x: rightX - radius, y: topY }
        const rightTop = { x: rightX, y: topY + radius }
        const rightBottom = { x: rightX, y: bottomY - radius }
        const bottomRight = { x: rightX - radius, y: bottomY }
        const bottomLeft = { x: leftX + radius, y: bottomY }
        const leftBottom = { x: leftX, y: bottomY - radius }
        const leftTop = { x: leftX, y: topY + radius }

        points.push(topLeft)
        addLinePoints(points, topLeft, topRight)
        addCurvePoints(points, topRight, { x: rightX, y: topY }, rightTop)
        addLinePoints(points, rightTop, rightBottom)
        addCurvePoints(points, rightBottom, { x: rightX, y: bottomY }, bottomRight)
        addLinePoints(points, bottomRight, bottomLeft)
        addCurvePoints(points, bottomLeft, { x: leftX, y: bottomY }, leftBottom)
        addLinePoints(points, leftBottom, leftTop)
        addCurvePoints(points, leftTop, { x: leftX, y: topY }, topLeft)
        points.pop()
        return points
    }

    const walkMobileStep = async (target, speed = 68) => {
        setDogVisual('walk')
        const start = state.currentPoint
        const heading = Math.atan2(target.y - start.y, target.x - start.x) * 180 / Math.PI
        const angleDelta = ((heading - state.currentAngle + 540) % 360) - 180
        const nextAngle = state.currentAngle + angleDelta
        const distance = Math.hypot(target.x - start.x, target.y - start.y)
        const duration = Math.max(90, distance / speed * 1000)
        const footprintTimers = scheduleFootprints(start, target, nextAngle, duration)
        const completed = await runAnimation(
            [
                { transform: transformFor(start, state.currentAngle) },
                { transform: transformFor(target, nextAngle) }
            ],
            { duration, easing: 'linear' }
        )
        if (!completed) {
            cancelFootprintTimers(footprintTimers)
            return false
        }

        dog.style.transform = transformFor(target, nextAngle)
        state.currentPoint = target
        state.currentAngle = nextAngle
        return true
    }

    const walkEasterEggStep = async (target, speed = 90, drawsHeart = false, leavesFootprints = true) => {
        setDogVisual('walk')
        const start = state.currentPoint
        const distance = Math.hypot(target.x - start.x, target.y - start.y)
        if (distance < 0.5) return true

        const heading = Math.atan2(target.y - start.y, target.x - start.x) * 180 / Math.PI
        const angleDelta = ((heading - state.currentAngle + 540) % 360) - 180
        const nextAngle = state.currentAngle + angleDelta
        const duration = Math.max(75, distance / speed * 1000)
        const footprintTimers = leavesFootprints
            ? scheduleFootprints(start, target, nextAngle, duration, {
                spacing: drawsHeart ? 10 : (usesMobileRoute() ? 22 : 28),
                easterEgg: drawsHeart
            })
            : []
        const completed = await runAnimation(
            [
                { transform: transformFor(start, state.currentAngle) },
                { transform: transformFor(target, nextAngle) }
            ],
            { duration, easing: 'linear' }
        )
        if (!completed) {
            cancelFootprintTimers(footprintTimers)
            return false
        }

        dog.style.transform = transformFor(target, nextAngle)
        state.currentPoint = target
        state.currentAngle = nextAngle
        return true
    }

    const getMobileLickSpot = (routePoint) => {
        if (performance.now() < state.nextLickAt) return null

        const photoRect = photo.getBoundingClientRect()
        const edgeInset = state.dogHeight + 4
        if (routePoint.x < photoRect.left + edgeInset || routePoint.x > photoRect.right - edgeInset) {
            return null
        }

        if (routePoint.y < photoRect.top) {
            const safetyDistance = clamp(state.dogWidth * 0.03, 2, 5) + 2
            return {
                point: { x: routePoint.x, y: photoRect.top - state.dogWidth * dogMouthForwardRatio - safetyDistance },
                angle: 90
            }
        }
        if (routePoint.y > photoRect.bottom) {
            const safetyDistance = clamp(state.dogWidth * 0.03, 2, 5) + 2
            return {
                point: { x: routePoint.x, y: photoRect.bottom + state.dogWidth * dogMouthForwardRatio + safetyDistance },
                angle: -90
            }
        }
        return null
    }

    const roamMobile = async () => {
        while (dog.isConnected && usesMobileRoute()) {
            if (state.easterEggActive) {
                await wait(100)
                continue
            }

            fitDogToSidePassage()
            const points = buildMobileLoop()
            const version = state.layoutVersion
            const direction = Math.random() < 0.5 ? 1 : -1
            let index

            if (state.resumeMobileRoute && state.currentPoint) {
                index = points.reduce((closestIndex, point, pointIndex) => {
                    const closestDistance = Math.hypot(
                        points[closestIndex].x - state.currentPoint.x,
                        points[closestIndex].y - state.currentPoint.y
                    )
                    const distance = Math.hypot(point.x - state.currentPoint.x, point.y - state.currentPoint.y)
                    return distance < closestDistance ? pointIndex : closestIndex
                }, 0)
                const resumeDistance = Math.hypot(
                    points[index].x - state.currentPoint.x,
                    points[index].y - state.currentPoint.y
                )
                if (resumeDistance > 1) {
                    const resumeRoute = planRoute(state.currentPoint, points[index], getMetrics())
                    if (!resumeRoute) {
                        await wait(120)
                        continue
                    }
                    for (const point of resumeRoute.slice(1)) {
                        if (state.easterEggActive || version !== state.layoutVersion || !await walkEasterEggStep(point, 120)) break
                    }
                }
                state.resumeMobileRoute = false
                if (state.easterEggActive || version !== state.layoutVersion) continue
            } else {
                index = Math.floor(Math.random() * points.length)
                const nextIndex = (index + direction + points.length) % points.length
                state.currentPoint = points[index]
                state.currentAngle = Math.atan2(
                    points[nextIndex].y - points[index].y,
                    points[nextIndex].x - points[index].x
                ) * 180 / Math.PI
                dog.style.transform = transformFor(state.currentPoint, state.currentAngle)
            }
            dog.style.opacity = '1'

            while (
                dog.isConnected &&
                version === state.layoutVersion &&
                usesMobileRoute() &&
                !state.easterEggActive
            ) {
                index = (index + direction + points.length) % points.length
                const routePoint = points[index]
                if (!await walkMobileStep(routePoint)) break

                const lickSpot = getMobileLickSpot(routePoint)
                if (lickSpot) {
                    if (!await pauseAndWag()) break
                    if (!await walkMobileStep(lickSpot.point, 42)) break
                    if (!await lickPhoto(lickSpot.point, lickSpot.angle)) break
                    if (!await walkBackward(routePoint)) break
                }
            }
        }
    }

    const walkSegment = async (target, speed = 78) => {
        const start = state.currentPoint
        const heading = Math.atan2(target.y - start.y, target.x - start.x) * 180 / Math.PI
        const angleDelta = ((heading - state.currentAngle + 540) % 360) - 180
        const nextAngle = state.currentAngle + angleDelta
        const startTransform = transformFor(start, state.currentAngle)
        const targetTransform = transformFor(target, nextAngle)
        setDogVisual('walk')
        const distance = Math.hypot(target.x - start.x, target.y - start.y)
        const baseDuration = Math.max(450, distance / speed * 1000)
        const turnDuration = Math.abs(angleDelta) > 1
            ? clamp(Math.abs(angleDelta) * 4.2, 180, 720)
            : 0
        const duration = Math.max(baseDuration, turnDuration / 0.45)
        const turnProgress = turnDuration > 0
            ? clamp(turnDuration / duration, 0.04, 0.45)
            : 0
        const turnPoint = {
            x: start.x + (target.x - start.x) * turnProgress,
            y: start.y + (target.y - start.y) * turnProgress
        }
        const keyframes = turnDuration > 0
            ? [
                { transform: startTransform, offset: 0, easing: 'ease-in-out' },
                { transform: transformFor(turnPoint, nextAngle), offset: turnProgress, easing: 'linear' },
                { transform: targetTransform, offset: 1 }
            ]
            : [
                { transform: startTransform },
                { transform: targetTransform }
            ]
        const footprintTimers = scheduleFootprints(start, target, nextAngle, duration)
        const completed = await runAnimation(
            keyframes,
            { duration, easing: 'linear' }
        )
        if (!completed) {
            cancelFootprintTimers(footprintTimers)
            return false
        }

        dog.style.transform = targetTransform
        state.currentPoint = target
        state.currentAngle = nextAngle
        return true
    }

    const pointFitsFacing = (point, angle) => {
        const vertical = Math.abs(Math.sin(angle * Math.PI / 180)) > 0.5
        const halfWidth = (vertical ? state.dogHeight : state.dogWidth) / 2
        const halfHeight = (vertical ? state.dogWidth : state.dogHeight) / 2
        return (
            point.x - halfWidth >= 1 && point.x + halfWidth <= window.innerWidth - 1 &&
            point.y - halfHeight >= 1 && point.y + halfHeight <= window.innerHeight - 1
        )
    }

    const visitPhotoForLick = async (metrics, version) => {
        const photoRect = photo.getBoundingClientRect()
        const centerX = photoRect.left + photoRect.width / 2
        const centerY = photoRect.top + photoRect.height / 2
        const safetyDistance = clamp(state.dogWidth * 0.03, 2, 5) + 2
        const approachDistance = state.dogWidth * dogMouthForwardRatio + safetyDistance
        const candidates = [
            {
                safe: { x: metrics.obstacle.left - 3, y: centerY },
                lick: { x: photoRect.left - approachDistance, y: centerY },
                angle: 0
            },
            {
                safe: { x: metrics.obstacle.right + 3, y: centerY },
                lick: { x: photoRect.right + approachDistance, y: centerY },
                angle: 180
            },
            {
                safe: { x: centerX, y: metrics.obstacle.top - 3 },
                lick: { x: centerX, y: photoRect.top - approachDistance },
                angle: 90
            },
            {
                safe: { x: centerX, y: metrics.obstacle.bottom + 3 },
                lick: { x: centerX, y: photoRect.bottom + approachDistance },
                angle: -90
            }
        ].filter((candidate) => (
            pointInsideBounds(candidate.safe, metrics.bounds) &&
            pointFitsFacing(candidate.lick, candidate.angle)
        )).sort(() => Math.random() - 0.5)

        for (const candidate of candidates) {
            const route = planRoute(state.currentPoint, candidate.safe, metrics)
            if (!route) continue

            let reachedPhoto = true
            for (const point of route.slice(1)) {
                if (version !== state.layoutVersion || !await walkSegment(point)) {
                    reachedPhoto = false
                    break
                }
            }
            if (!reachedPhoto || version !== state.layoutVersion) return false
            if (!await pauseAndWag()) return false
            if (!await walkSegment(candidate.lick, 46)) return false
            if (!await lickPhoto(candidate.lick, candidate.angle)) return false
            if (!await walkBackward(candidate.safe)) return false
            return true
        }

        scheduleNextLick()
        return false
    }

    const triggerEasterEgg = async () => {
        if (state.easterEggActive) return

        state.easterEggActive = true
        state.easterEggTapCount = 0
        clearTimeout(state.easterEggTapTimer)
        state.easterEggTapTimer = null

        const pose = captureCurrentPose()
        state.layoutVersion += 1
        state.activeAnimation?.cancel()
        state.pausedTapAnimation = null
        await wait(60)

        state.currentPoint = pose.point
        state.currentAngle = pose.angle
        state.footprintDistance = 0
        dog.style.transform = transformFor(state.currentPoint, state.currentAngle)
        dog.style.opacity = '1'
        state.activeFootprints.filter((footprint) => (
            !footprint.classList.contains('easter-egg-footprint')
        )).forEach(removeFootprint)
        const backdrop = showEasterEggBackdrop()

        try {
            const heartPath = buildHeartPath()
            if (heartPath.length) {
                await walkEasterEggStep(heartPath[0], 165, false, false)
                state.footprintDistance = 0
                for (const point of heartPath.slice(1)) {
                    if (!await walkEasterEggStep(point, 88, true)) break
                }
            }

            setDogVisual('idle')
            await showEasterEggMessage()
            const footprintFade = fadeEasterEggFootprints()
            let exitPoint
            if (usesMobileRoute()) {
                const mobilePoints = buildMobileLoop()
                exitPoint = mobilePoints.reduce((closest, point) => (
                    Math.hypot(point.x - state.currentPoint.x, point.y - state.currentPoint.y) <
                    Math.hypot(closest.x - state.currentPoint.x, closest.y - state.currentPoint.y)
                        ? point
                        : closest
                ), mobilePoints[0])
            } else {
                exitPoint = randomFreePoint(getMetrics(), state.currentPoint)
            }
            await walkEasterEggStep(exitPoint, 165, false, false)
            await footprintFade
            setDogVisual('idle')
        } finally {
            await hideEasterEggBackdrop(backdrop)
            state.activeFootprints.filter((footprint) => (
                footprint.classList.contains('easter-egg-footprint')
            )).forEach(removeFootprint)
            scheduleNextLick()
            state.resumeMobileRoute = usesMobileRoute()
            state.easterEggActive = false
        }
    }

    const resetEasterEggTaps = () => {
        state.easterEggTapCount = 0
        state.easterEggTapTimer = null
        if (
            state.pausedTapAnimation &&
            state.pausedTapAnimation === state.activeAnimation &&
            state.pausedTapAnimation.playState === 'paused'
        ) {
            state.pausedTapAnimation.play()
        }
        state.pausedTapAnimation = null
    }

    const handleDogTap = (event) => {
        event.preventDefault()
        if (state.easterEggActive) return

        if (state.easterEggTapCount === 0 && state.activeAnimation) {
            state.pausedTapAnimation = state.activeAnimation
            state.pausedTapAnimation.pause()
        }

        state.easterEggTapCount += 1
        clearTimeout(state.easterEggTapTimer)

        if (state.easterEggTapCount >= 5) {
            void triggerEasterEgg()
            return
        }

        state.easterEggTapTimer = setTimeout(resetEasterEggTaps, 2600)
    }

    const roam = async () => {
        fitDogToSidePassage()

        if (usesMobileRoute()) {
            await roamMobile()
            return
        }

        let metrics = getMetrics()
        state.currentPoint = randomFreePoint(metrics)
        state.currentAngle = Math.random() * 360
        dog.style.transform = transformFor(state.currentPoint, state.currentAngle)
        dog.style.opacity = '1'

        while (dog.isConnected) {
            if (state.easterEggActive) {
                await wait(100)
                continue
            }

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
            if (version === state.layoutVersion && performance.now() >= state.nextLickAt) {
                await visitPhotoForLick(metrics, version)
            }
            if (state.easterEggActive) continue
            setDogVisual('idle')
            await wait(120 + Math.random() * 300)
            setDogVisual('walk')
        }
    }

    const resetLayout = () => {
        state.layoutVersion += 1
        state.activeAnimation?.cancel()
        fitDogToSidePassage()
    }

    window.addEventListener('resize', resetLayout, { passive: true })
    dog.addEventListener('pointerdown', handleDogTap)

    const startRoaming = async () => {
        await Promise.race([dogVisualsReady, wait(900)])
        roam()
    }

    if (!primaryDogImage.complete) {
        primaryDogImage.addEventListener('load', startRoaming, { once: true })
    } else {
        startRoaming()
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
