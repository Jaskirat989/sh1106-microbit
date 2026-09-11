/**
 * SH1106 OLED graphics extension for micro:bit
 * 128x64 I2C display
 */

namespace SH1106 {

    const ADDRESS = 0x3C
    const WIDTH = 128
    const HEIGHT = 64

    // ------------------------------------------------------------
    // LOW LEVEL I2C
    // ------------------------------------------------------------

    function command(value: number): void {
        pins.i2cWriteBuffer(
            ADDRESS,
            pins.createBufferFromArray([0x00, value])
        )
    }

    function writeData(data: number[]): void {
        let buffer = pins.createBuffer(data.length + 1)
        buffer[0] = 0x40

        for (let i = 0; i < data.length; i++) {
            buffer[i + 1] = data[i]
        }

        pins.i2cWriteBuffer(ADDRESS, buffer)
    }

    function setPosition(page: number, column: number): void {
        command(0xB0 + page)
        command(0x02 + (column & 0x0F))
        command(0x10 + ((column >> 4) & 0x0F))
    }

    // ------------------------------------------------------------
    // INITIALIZATION
    // ------------------------------------------------------------

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

    // ------------------------------------------------------------
    // FRAME BUFFER
    // ------------------------------------------------------------

    let buffer = pins.createBuffer(1024)
    let initialized = false

    function setPixelInternal(x: number, y: number, on: boolean): void {
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
            return
        }

        let index = x + ((y >> 3) * WIDTH)
        let mask = 1 << (y & 7)

        if (on) {
            buffer[index] = buffer[index] | mask
        } else {
            buffer[index] = buffer[index] & (~mask)
        }
    }

    function getPixel(x: number, y: number): boolean {
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
            return false
        }

        let index = x + ((y >> 3) * WIDTH)
        let mask = 1 << (y & 7)

        return (buffer[index] & mask) != 0
    }

    function sendBuffer(): void {
        for (let page = 0; page < 8; page++) {

            setPosition(page, 0)

            for (let chunk = 0; chunk < 8; chunk++) {

                let data: number[] = []

                for (let x = 0; x < 16; x++) {
                    data.push(buffer[page * WIDTH + chunk * 16 + x])
                }

                writeData(data)
            }
        }
    }

    // ------------------------------------------------------------
    // INITIALIZE
    // ------------------------------------------------------------

    /**
     * Initialize the SH1106 OLED.
     */
    //% block="initialize SH1106 OLED"
    //% weight=100
    export function initialize(): void {
        initDisplay()
        clear()
        initialized = true
    }

    // ------------------------------------------------------------
    // CLEAR
    // ------------------------------------------------------------

    /**
     * Clear the screen.
     */
    //% block="clear SH1106 OLED"
    //% weight=95
    export function clear(): void {

        for (let i = 0; i < 1024; i++) {
            buffer[i] = 0
        }

        if (initialized) {
            sendBuffer()
        }
    }

    // ------------------------------------------------------------
    // SHOW / UPDATE
    // ------------------------------------------------------------

    /**
     * Send the current graphics buffer to the OLED.
     */
    //% block="update SH1106 OLED"
    //% weight=90
    export function update(): void {
        sendBuffer()
    }

    // ------------------------------------------------------------
    // PIXEL
    // ------------------------------------------------------------

    /**
     * Draw one pixel.
     */
    //% block="draw pixel x %x y %y"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=85
    export function drawPixel(x: number, y: number): void {
        setPixelInternal(x, y, true)
    }

    /**
     * Erase one pixel.
     */
    //% block="erase pixel x %x y %y"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=84
    export function erasePixel(x: number, y: number): void {
        setPixelInternal(x, y, false)
    }

    // ------------------------------------------------------------
    // LINE
    // ------------------------------------------------------------

    /**
     * Draw a line.
     */
    //% block="draw line from x1 %x1 y1 %y1 to x2 %x2 y2 %y2"
    //% weight=80
    export function drawLine(
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ): void {

        let dx = Math.abs(x2 - x1)
        let sx = x1 < x2 ? 1 : -1

        let dy = -Math.abs(y2 - y1)
        let sy = y1 < y2 ? 1 : -1

        let err = dx + dy

        while (true) {

            setPixelInternal(x1, y1, true)

            if (x1 == x2 && y1 == y2) {
                break
            }

            let e2 = 2 * err

            if (e2 >= dy) {
                err += dy
                x1 += sx
            }

            if (e2 <= dx) {
                err += dx
                y1 += sy
            }
        }
    }

    // ------------------------------------------------------------
    // RECTANGLE
    // ------------------------------------------------------------

    /**
     * Draw an outline rectangle.
     */
    //% block="draw rectangle x %x y %y width %width height %height"
    //% weight=75
    export function drawRectangle(
        x: number,
        y: number,
        width: number,
        height: number
    ): void {

        drawLine(x, y, x + width - 1, y)
        drawLine(x, y, x, y + height - 1)
        drawLine(x + width - 1, y, x + width - 1, y + height - 1)
        drawLine(x, y + height - 1, x + width - 1, y + height - 1)
    }

    // ------------------------------------------------------------
    // FILLED RECTANGLE
    // ------------------------------------------------------------

    /**
     * Draw a filled rectangle.
     */
    //% block="fill rectangle x %x y %y width %width height %height"
    //% weight=70
    export function fillRectangle(
        x: number,
        y: number,
        width: number,
        height: number
    ): void {

        for (let yy = y; yy < y + height; yy++) {
            for (let xx = x; xx < x + width; xx++) {
                setPixelInternal(xx, yy, true)
            }
        }
    }

    // ------------------------------------------------------------
    // TEXT FONT
    // ------------------------------------------------------------

    function glyph(character: string): number[] {

        if (character == "A")
            return [0x7E, 0x11, 0x11, 0x11, 0x7E]

        if (character == "B")
            return [0x7F, 0x49, 0x49, 0x49, 0x36]

        if (character == "C")
            return [0x3E, 0x41, 0x41, 0x41, 0x22]

        if (character == "D")
            return [0x7F, 0x41, 0x41, 0x22, 0x1C]

        if (character == "E")
            return [0x7F, 0x49, 0x49, 0x49, 0x41]

        if (character == "F")
            return [0x7F, 0x09, 0x09, 0x09, 0x01]

        if (character == "G")
            return [0x3E, 0x41, 0x49, 0x49, 0x7A]

        if (character == "H")
            return [0x7F, 0x08, 0x08, 0x08, 0x7F]

        if (character == "I")
            return [0x00, 0x41, 0x7F, 0x41, 0x00]

        if (character == "J")
            return [0x20, 0x40, 0x41, 0x3F, 0x01]

        if (character == "K")
            return [0x7F, 0x08, 0x14, 0x22, 0x41]

        if (character == "L")
            return [0x7F, 0x40, 0x40, 0x40, 0x40]

        if (character == "M")
            return [0x7F, 0x02, 0x0C, 0x02, 0x7F]

        if (character == "N")
            return [0x7F, 0x04, 0x08, 0x10, 0x7F]

        if (character == "O")
            return [0x3E, 0x41, 0x41, 0x41, 0x3E]

        if (character == "P")
            return [0x7F, 0x09, 0x09, 0x09, 0x06]

        if (character == "Q")
            return [0x3E, 0x41, 0x51, 0x21, 0x5E]

        if (character == "R")
            return [0x7F, 0x09, 0x19, 0x29, 0x46]

        if (character == "S")
            return [0x46, 0x49, 0x49, 0x49, 0x31]

        if (character == "T")
            return [0x01, 0x01, 0x7F, 0x01, 0x01]

        if (character == "U")
            return [0x3F, 0x40, 0x40, 0x40, 0x3F]

        if (character == "V")
            return [0x1F, 0x20, 0x40, 0x20, 0x1F]

        if (character == "W")
            return [0x7F, 0x20, 0x18, 0x20, 0x7F]

        if (character == "X")
            return [0x63, 0x14, 0x08, 0x14, 0x63]

        if (character == "Y")
            return [0x03, 0x04, 0x78, 0x04, 0x03]

        if (character == "Z")
            return [0x61, 0x51, 0x49, 0x45, 0x43]

        if (character == "a")
            return [0x20, 0x54, 0x54, 0x54, 0x78]

        if (character == "e")
            return [0x38, 0x54, 0x54, 0x54, 0x18]

        if (character == "l")
            return [0x00, 0x41, 0x7F, 0x40, 0x00]

        if (character == "o")
            return [0x38, 0x44, 0x44, 0x44, 0x38]

        if (character == "r")
            return [0x7C, 0x08, 0x04, 0x04, 0x08]

        if (character == "d")
            return [0x38, 0x44, 0x44, 0x48, 0x7F]

        if (character == " ")
            return [0x00, 0x00, 0x00, 0x00, 0x00]

        return [0, 0, 0, 0, 0]
    }

    // ------------------------------------------------------------
    // TEXT
    // ------------------------------------------------------------

    /**
     * Draw text using the built-in 5x7 font.
     */
    //% block="show text %text at x %x y %y"
    //% weight=60
    export function showText(
        text: string,
        x: number,
        y: number
    ): void {

        for (let i = 0; i < text.length; i++) {

            let character = text.charAt(i)
            let data = glyph(character)

            for (let column = 0; column < 5; column++) {

                let columnData = data[column]

                for (let bit = 0; bit < 7; bit++) {

                    if ((columnData & (1 << bit)) != 0) {
                        setPixelInternal(
                            x + i * 6 + column,
                            y + bit,
                            true
                        )
                    }
                }
            }
        }
    }
}