#!/usr/bin/env python3
"""Create lightweight looping GIFs from the ImageGen source artwork."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageStat


ROOT = Path(__file__).resolve().parents[1]
SIZE = 420
FRAME_COUNT = 10
IMAGE_SETS = (
    (ROOT / "assets" / "imagegen-sources", ROOT / "assets" / "gifs-imagegen"),
    (ROOT / "assets" / "imagegen-realista-sources", ROOT / "assets" / "gifs-imagegen-realista"),
)


def motion_for(stage: int, frame: int) -> tuple[float, float, int, int]:
    phase = (frame / FRAME_COUNT) * math.tau
    wave = math.sin(phase)

    if stage == 0:
        return 1.0 + 0.008 * (wave + 1) / 2, 0, 0, round(-2 * wave)
    if stage == 1:
        return 1.006, 1.4 * wave, 0, round(-2 * math.cos(phase))
    if stage == 2:
        return 1.0 + 0.012 * (wave + 1) / 2, 0, 0, round(-4 * abs(wave))
    if stage == 3:
        return 1.004, 0.35 * wave, 0, round(2 * (wave + 1) / 2)
    if stage == 4:
        return 1.006, 0.45 * wave, round(wave), round(1.5 * math.cos(phase))
    if stage == 5:
        return 1.008, 0.6 * wave, round(1.5 * wave), round(2 * math.cos(phase))
    if stage == 6:
        return 1.012, 0.8 * wave, round(2.5 * wave), round(2 * math.cos(phase))
    return 1.025, -0.8 * wave, round(7 * wave), round(-5 * abs(math.sin(phase)))


def transform(image: Image.Image, zoom: float, angle: float, dx: int, dy: int) -> Image.Image:
    sample_size = max(4, SIZE // 40)
    corner_samples = Image.new("RGB", (sample_size * 4, sample_size))
    corner_samples.paste(image.crop((0, 0, sample_size, sample_size)), (0, 0))
    corner_samples.paste(image.crop((SIZE - sample_size, 0, SIZE, sample_size)), (sample_size, 0))
    corner_samples.paste(image.crop((0, SIZE - sample_size, sample_size, SIZE)), (sample_size * 2, 0))
    corner_samples.paste(
        image.crop((SIZE - sample_size, SIZE - sample_size, SIZE, SIZE)),
        (sample_size * 3, 0),
    )
    background = tuple(round(value) for value in ImageStat.Stat(corner_samples).mean)

    rotation_margin = math.ceil(SIZE * abs(math.sin(math.radians(angle))) / 2)
    motion_margin = max(abs(dx), abs(dy))
    required_margin = rotation_margin + motion_margin + 3
    scaled_size = max(round(SIZE * zoom), SIZE + required_margin * 2)
    scaled = image.resize((scaled_size, scaled_size), Image.Resampling.LANCZOS)

    if angle:
        scaled = scaled.rotate(
            angle,
            resample=Image.Resampling.BICUBIC,
            expand=False,
            fillcolor=background,
        )

    left = (scaled_size - SIZE) // 2 - dx
    top = (scaled_size - SIZE) // 2 - dy
    frame = scaled.crop((left, top, left + SIZE, top + SIZE))
    return frame


def build_gif(source: Path, destination: Path, stage: int) -> None:
    base = Image.open(source).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    rgb_frames = [transform(base, *motion_for(stage, frame)) for frame in range(FRAME_COUNT)]

    palette = rgb_frames[0].quantize(colors=128, method=Image.Quantize.MEDIANCUT)
    frames = [palette, *[frame.quantize(palette=palette) for frame in rgb_frames[1:]]]
    frames[0].save(
        destination,
        save_all=True,
        append_images=frames[1:],
        duration=110,
        loop=0,
        optimize=False,
        disposal=1,
    )


def main() -> None:
    for source_dir, output_dir in IMAGE_SETS:
        if not source_dir.exists():
            continue
        output_dir.mkdir(parents=True, exist_ok=True)
        for stage, source in enumerate(sorted(source_dir.glob("stage-*.png"))):
            build_gif(source, output_dir / f"{source.stem}.gif", stage)


if __name__ == "__main__":
    main()
