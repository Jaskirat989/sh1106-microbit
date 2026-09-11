namespace SH1106 {

    const ADDRESS = 0x3C
    const WIDTH = 128
    const HEIGHT = 64
    const OFFSET = 2

    let screen = pins.createBuffer(1024)
    let ready = false

    function command(value: number): void {
        pins.i2cWriteBuffer(
            ADDRESS,
            pins.createBufferFromArray([0x00, value])
        )
    }

    function data(values: number[]): void {
        let b = pins.createBuffer(values.length + 1)
        b[0] = 0x40

        for (let i = 0; i < values.length; i++) {
            b[i + 1] = values[i]
        }

        pins.i2cWriteBuffer(ADDRESS, b)
    }

    function position(page: number, column: number): void {
        let c = column + OFFSET

        command(0xB0 + page)
        command(c & 0x0F)
        command(0x10 + ((c >> 4) & 0x0F))
    }

    function initDisplay(): void {
        command(0xAE)
        command(0xD5)
        command(0x80)
        command(0xA8)
        command(0x3F)
        command(0xD3)
        command(0x00)
        command(0x40)
        command(0xAD)
        command(0x8B)
        command(0xA1)
        command(0xC8)
        command(0xDA)
        command(0x12)
        command(0x81)
        command(0x7F)
        command(0xD9)
        command(0xF1)
        command(0xDB)
        command(0x40)
        command(0xA4)
        command(0xA6)
        command(0xAF)
    }

    function pixel(x: number, y: number, on: boolean): void {
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT)
            return

        let index = x + ((y >> 3) * WIDTH)
        let mask = 1 << (y & 7)

        if (on) {
            screen[index] = screen[index] | mask
        } else {
            screen[index] = screen[index] & (255 ^ mask)
        }
    }

    function updateDisplay(): void {
        for (let page = 0; page < 8; page++) {
            position(page, 0)

            for (let chunk = 0; chunk < 8; chunk++) {
                let values: number[] = []

                for (let x = 0; x < 16; x++) {
                    values.push(screen[page * 128 + chunk * 16 + x])
                }

                data(values)
            }
        }
    }

    //% block="initialize SH1106 OLED"
    export function initialize(): void {
        initDisplay()

        for (let i = 0; i < 1024; i++) {
            screen[i] = 0
        }

        ready = true
        updateDisplay()
    }

    //% block="clear SH1106 OLED"
    export function clear(): void {
        for (let i = 0; i < 1024; i++) {
            screen[i] = 0
        }

        if (ready)
            updateDisplay()
    }

    //% block="update SH1106 OLED"
    export function update(): void {
        updateDisplay()
    }

    //% block="draw pixel x %x y %y"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    export function drawPixel(x: number, y: number): void {
        pixel(x, y, true)
    }

    //% block="draw line x1 %x1 y1 %y1 x2 %x2 y2 %y2"
    export function drawLine(
        x1: number, y1: number,
        x2: number, y2: number
    ): void {

        let dx = Math.abs(x2 - x1)
        let sx = x1 < x2 ? 1 : -1
        let dy = -Math.abs(y2 - y1)
        let sy = y1 < y2 ? 1 : -1
        let error = dx + dy

        while (true) {
            pixel(x1, y1, true)

            if (x1 == x2 && y1 == y2)
                break

            let e2 = 2 * error

            if (e2 >= dy) {
                error += dy
                x1 += sx
            }

            if (e2 <= dx) {
                error += dx
                y1 += sy
            }
        }
    }

    //% block="draw rectangle x %x y %y width %width height %height"
    export function drawRectangle(
        x: number,
        y: number,
        width: number,
        height: number
    ): void {

        drawLine(x, y, x + width - 1, y)
        drawLine(x, y, x, y + height - 1)
        drawLine(x + width - 1, y,
            x + width - 1, y + height - 1)
        drawLine(x, y + height - 1,
            x + width - 1, y + height - 1)
    }

    //% block="fill rectangle x %x y %y width %width height %height"
    export function fillRectangle(
        x: number,
        y: number,
        width: number,
        height: number
    ): void {

        for (let yy = y; yy < y + height; yy++) {
            for (let xx = x; xx < x + width; xx++) {
                pixel(xx, yy, true)
            }
        }
    }

    function glyph(c: string): number[] {

        if (c == "H" || c == "h")
            return [0x7F, 0x08, 0x08, 0x08, 0x7F]

        if (c == "e" || c == "E")
            return [0x38, 0x54, 0x54, 0x54, 0x18]

        if (c == "l" || c == "L")
            return [0x00, 0x41, 0x7F, 0x40, 0x00]

        if (c == "o" || c == "O")
            return [0x38, 0x44, 0x44, 0x44, 0x38]

        if (c == "W")
            return [0x7F, 0x20, 0x18, 0x20, 0x7F]

        if (c == "r")
            return [0x7C, 0x08, 0x04, 0x04, 0x08]

        if (c == "d" || c == "D")
            return [0x38, 0x44, 0x44, 0x48, 0x7F]

        if (c == " ")
            return [0, 0, 0, 0, 0]

        return [0, 0, 0, 0, 0]
    }

    //% block="show text %text at x %x y %y"
    export function showText(
        text: string,
        x: number,
        y: number
    ): void {

        for (let i = 0; i < text.length; i++) {

            let g = glyph(text.charAt(i))

            for (let col = 0; col < 5; col++) {
                let bits = g[col]

                for (let row = 0; row < 7; row++) {
                    if ((bits & (1 << row)) != 0) {
                        pixel(
                            x + i * 6 + col,
                            y + row,
                            true
                        )
                    }
                }
            }
        }

        updateDisplay()
    }
}