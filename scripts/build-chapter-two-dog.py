#!/usr/bin/env python3
"""Build the chapter-two lying-dachshund loop from the transparent sprite sheet."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, features


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "imagegen-sources" / "mia-tumbada-spritesheet-v2-alpha.png"
OUTPUT = ROOT / "assets" / "mia-tumbada-restregandose.webp"
POSTER = ROOT / "assets" / "mia-tumbada-reposo.png"

SOURCE_SIZE = (1536, 1024)
CANVAS_SIZE = (420, 260)

# The generated subjects extend slightly across the nominal 384 px cell edges.
# These cuts use the fully transparent gaps between dogs, so no tail or muzzle is clipped.
ROW_CUTS = (
    (0, 412, 766, 1136, 1536),
    (0, 397, 760, 1136, 1536),
)

# A tiny two-step forepaw movement precedes the full shoulder rub. Longer holds on
# frames 1 and 8 make the loop feel like a pet settling down instead of a metronome.
SEQUENCE = (0, 1, 0, 1, 2, 3, 4, 5, 6, 7, 0)
DURATIONS_MS = (660, 155, 165, 145, 170, 190, 250, 190, 170, 160, 940)


def extract_frames(sheet: Image.Image) -> list[Image.Image]:
    frames: list[Image.Image] = []
    row_height = sheet.height // 2

    for index in range(8):
        row, column = divmod(index, 4)
        left = ROW_CUTS[row][column]
        right = ROW_CUTS[row][column + 1]
        top = row * row_height
        cell = sheet.crop((left, top, right, top + row_height))
        bounds = cell.getchannel("A").getbbox()
        if bounds is None:
            raise RuntimeError(f"Frame {index + 1} has no visible subject")

        subject = cell.crop(bounds)
        if subject.width > CANVAS_SIZE[0] - 20 or subject.height > CANVAS_SIZE[1] - 20:
            raise RuntimeError(
                f"Frame {index + 1} does not fit the normalized canvas: {subject.size}"
            )

        canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
        x = (CANVAS_SIZE[0] - subject.width) // 2
        y = (CANVAS_SIZE[1] - subject.height) // 2
        canvas.alpha_composite(subject, (x, y))
        frames.append(canvas)

    return frames


def validate_frames(frames: list[Image.Image]) -> None:
    if len(frames) != 8:
        raise RuntimeError(f"Expected 8 frames, got {len(frames)}")

    coverages = []
    for index, frame in enumerate(frames, start=1):
        alpha = frame.getchannel("A")
        bounds = alpha.getbbox()
        if bounds is None:
            raise RuntimeError(f"Frame {index} is fully transparent")
        if alpha.getpixel((0, 0)) or alpha.getpixel((frame.width - 1, frame.height - 1)):
            raise RuntimeError(f"Frame {index} touches a canvas corner")
        coverages.append(sum(1 for value in alpha.getdata() if value > 12))

    smallest = min(coverages)
    largest = max(coverages)
    if smallest / largest < 0.82:
        raise RuntimeError(f"Subject coverage varies too much: {smallest}–{largest} pixels")


def main() -> None:
    if not features.check("webp"):
        raise RuntimeError("This Pillow build does not support WebP")

    sheet = Image.open(SOURCE).convert("RGBA")
    if sheet.size != SOURCE_SIZE:
        raise RuntimeError(f"Unexpected sprite-sheet size: {sheet.size}; expected {SOURCE_SIZE}")

    frames = extract_frames(sheet)
    validate_frames(frames)

    POSTER.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(POSTER, optimize=True)

    animation_frames = [frames[index] for index in SEQUENCE]
    animation_frames[0].save(
        OUTPUT,
        save_all=True,
        append_images=animation_frames[1:],
        duration=list(DURATIONS_MS),
        loop=0,
        lossless=True,
        quality=92,
        method=6,
        minimize_size=True,
        exact=True,
    )

    print(f"Wrote {OUTPUT.relative_to(ROOT)} ({len(animation_frames)} frames)")
    print(f"Wrote {POSTER.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
