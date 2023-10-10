export enum iconColors {
    LIGHT = '#fff',
    DARK = '#444',
    BLUE = '#3076DE',
    YELLOW = '#E9A83D',
}

export enum iconPaths {
    CLASSIC = 'M2.5 1C1.67157 1 1 1.67157 1 2.5V13.5C1 14.3284 1.67157 15 2.5 15H13.5C14.3284 15 15 14.3284 15 13.5V2.5C15 1.67157 14.3284 1 13.5 1H2.5ZM8 6C8 7.10457 7.10457 8 6 8C4.89543 8 4 7.10457 4 6C4 4.89543 4.89543 4 6 4C7.10457 4 8 4.89543 8 6Z',
    MODERN = 'M7 9H11.5V4.5H7V9ZM2.5 15C2.0875 15 1.73437 14.8531 1.44062 14.5594C1.14687 14.2656 1 13.9125 1 13.5V2.5C1 2.0875 1.14687 1.73438 1.44062 1.44063C1.73437 1.14688 2.0875 1 2.5 1H13.5C13.9125 1 14.2656 1.14688 14.5594 1.44063C14.8531 1.73438 15 2.0875 15 2.5V13.5C15 13.9125 14.8531 14.2656 14.5594 14.5594C14.2656 14.8531 13.9125 15 13.5 15H2.5ZM2.5 13.5H13.5V2.5H2.5V13.5Z',
    GEOMETRIC = 'M1 1.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-5ZM9 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-5ZM15.103 6.263a.5.5 0 0 1-.44.737H9.337a.5.5 0 0 1-.44-.737l2.663-4.945a.5.5 0 0 1 .88 0l2.663 4.945ZM7.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z',
}

export function getIcon(name: ExtentieOptions['iconStyle'], color: iconColors, size: number): ImageData {
    // convert name to key of iconPath
    const key = name.toUpperCase().replace(/-/g, '_');
    const d = iconPaths[key as keyof typeof iconPaths];

    const offscreen = new OffscreenCanvas(size, size);
    const ctx = offscreen.getContext('2d');
    if (!ctx) return new ImageData(size, size);

    ctx.scale(size / 16, size / 16);
    const path = new Path2D(d);
    ctx.fillStyle = color;
    ctx.fill(path);

    //return imageData of canvas
    return ctx.getImageData(0, 0, size, size, { colorSpace: 'display-p3' });
}

export function getIconDictionary(name: ExtentieOptions['iconStyle'] = 'classic', color: iconColors = iconColors.DARK, sizes: number[] = [16, 24, 32]): Record<string, ImageData> {
    const iconDictionary: Record<string, ImageData> = {};
    for (const size of sizes) {
        iconDictionary[size.toString()] = getIcon(name, color, size);
    }
    return iconDictionary;
}