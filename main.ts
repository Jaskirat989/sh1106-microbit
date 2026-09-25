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

    function setPixelInternal(
        x: number,
        y: number,
        on: boolean
    ): void {

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

    function getPixel(
        x: number,
        y: number
    ): boolean {

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

            let pageBuffer = pins.createBuffer(WIDTH + 1)

            pageBuffer[0] = 0x40

            for (let x = 0; x < WIDTH; x++) {
                pageBuffer[x + 1] =
                    buffer[page * WIDTH + x]
            }

            pins.i2cWriteBuffer(
                ADDRESS,
                pageBuffer
            )
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
    export function drawPixel(
        x: number,
        y: number
    ): void {

        setPixelInternal(
            x,
            y,
            true
        )
    }

    /**
     * Erase one pixel.
     */
    //% block="erase pixel x %x y %y"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=84
    export function erasePixel(
        x: number,
        y: number
    ): void {

        setPixelInternal(
            x,
            y,
            false
        )
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

            setPixelInternal(
                x1,
                y1,
                true
            )

            if (
                x1 == x2 &&
                y1 == y2
            ) {
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

        if (width <= 0 || height <= 0) {
            return
        }

        drawLine(
            x,
            y,
            x + width - 1,
            y
        )

        drawLine(
            x,
            y,
            x,
            y + height - 1
        )

        drawLine(
            x + width - 1,
            y,
            x + width - 1,
            y + height - 1
        )

        drawLine(
            x,
            y + height - 1,
            x + width - 1,
            y + height - 1
        )
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

        if (width <= 0 || height <= 0) {
            return
        }

        for (
            let yy = y;
            yy < y + height;
            yy++
        ) {

            for (
                let xx = x;
                xx < x + width;
                xx++
            ) {

                setPixelInternal(
                    xx,
                    yy,
                    true
                )
            }
        }
    }

    // ------------------------------------------------------------
    // CIRCLE
    // ------------------------------------------------------------

    /**
     * Draw an outline circle.
     */
    //% block="draw circle center x %x center y %y radius %radius"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% radius.min=1 radius.max=63
    //% weight=68
    export function drawCircle(
        x: number,
        y: number,
        radius: number
    ): void {

        if (radius < 1) {
            return
        }

        let px = radius
        let py = 0
        let decision = 1 - radius

        while (px >= py) {

            setPixelInternal(x + px, y + py, true)
            setPixelInternal(x + py, y + px, true)
            setPixelInternal(x - py, y + px, true)
            setPixelInternal(x - px, y + py, true)
            setPixelInternal(x - px, y - py, true)
            setPixelInternal(x - py, y - px, true)
            setPixelInternal(x + py, y - px, true)
            setPixelInternal(x + px, y - py, true)

            py++

            if (decision <= 0) {

                decision =
                    decision +
                    2 * py +
                    1

            } else {

                px--

                decision =
                    decision +
                    2 * (py - px) +
                    1
            }
        }
    }

    // ------------------------------------------------------------
    // FILLED CIRCLE
    // ------------------------------------------------------------

    /**
     * Draw a filled circle.
     */
    //% block="fill circle center x %x center y %y radius %radius"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% radius.min=1 radius.max=63
    //% weight=67
    export function fillCircle(
        x: number,
        y: number,
        radius: number
    ): void {

        if (radius < 1) {
            return
        }

        for (
            let yy = -radius;
            yy <= radius;
            yy++
        ) {

            let inside =
                radius * radius -
                yy * yy

            let xx =
                Math.sqrt(inside)

            drawLine(
                x - xx,
                y + yy,
                x + xx,
                y + yy
            )
        }
    }

    // ------------------------------------------------------------
    // TRIANGLE
    // ------------------------------------------------------------

    /**
     * Draw a triangle.
     */
    //% block="draw triangle x1 %x1 y1 %y1 x2 %x2 y2 %y2 x3 %x3 y3 %y3"
    //% weight=66
    export function drawTriangle(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number
    ): void {

        drawLine(x1, y1, x2, y2)
        drawLine(x2, y2, x3, y3)
        drawLine(x3, y3, x1, y1)
    }

    // ------------------------------------------------------------
    // FILLED TRIANGLE
    // ------------------------------------------------------------

    /**
     * Draw a filled triangle.
     */
    //% block="fill triangle x1 %x1 y1 %y1 x2 %x2 y2 %y2 x3 %x3 y3 %y3"
    //% weight=65
    export function fillTriangle(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number
    ): void {

        let minY = Math.min(
            y1,
            Math.min(y2, y3)
        )

        let maxY = Math.max(
            y1,
            Math.max(y2, y3)
        )

        for (
            let y = minY;
            y <= maxY;
            y++
        ) {

            let intersections: number[] = []

            if (
                (y1 <= y && y < y2) ||
                (y2 <= y && y < y1)
            ) {

                let x =
                    x1 +
                    (y - y1) *
                    (x2 - x1) /
                    (y2 - y1)

                intersections.push(x)
            }

            if (
                (y2 <= y && y < y3) ||
                (y3 <= y && y < y2)
            ) {

                let x =
                    x2 +
                    (y - y2) *
                    (x3 - x2) /
                    (y3 - y2)

                intersections.push(x)
            }

            if (
                (y3 <= y && y < y1) ||
                (y1 <= y && y < y3)
            ) {

                let x =
                    x3 +
                    (y - y3) *
                    (x1 - x3) /
                    (y1 - y3)

                intersections.push(x)
            }

            if (intersections.length >= 2) {

                let left =
                    Math.min(
                        intersections[0],
                        intersections[1]
                    )

                let right =
                    Math.max(
                        intersections[0],
                        intersections[1]
                    )

                drawLine(
                    left,
                    y,
                    right,
                    y
                )
            }
        }
    }

    // ------------------------------------------------------------
    // TEXT FONT
    // ------------------------------------------------------------

    function glyph(character: string): number[] {

        // ---------------- Uppercase A-Z ----------------

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

        // ---------------- Lowercase a-z ----------------

        if (character == "a")
            return [0x20, 0x54, 0x54, 0x54, 0x78]

        if (character == "b")
            return [0x7F, 0x48, 0x44, 0x44, 0x38]

        if (character == "c")
            return [0x38, 0x44, 0x44, 0x44, 0x20]

        if (character == "d")
            return [0x38, 0x44, 0x44, 0x48, 0x7F]

        if (character == "e")
            return [0x38, 0x54, 0x54, 0x54, 0x18]

        if (character == "f")
            return [0x08, 0x7E, 0x09, 0x01, 0x02]

        if (character == "g")
            return [0x0C, 0x52, 0x52, 0x52, 0x3E]

        if (character == "h")
            return [0x7F, 0x08, 0x04, 0x04, 0x78]

        if (character == "i")
            return [0x00, 0x44, 0x7D, 0x40, 0x00]

        if (character == "j")
            return [0x20, 0x40, 0x44, 0x3D, 0x00]

        if (character == "k")
            return [0x7F, 0x10, 0x28, 0x44, 0x00]

        if (character == "l")
            return [0x00, 0x41, 0x7F, 0x40, 0x00]

        if (character == "m")
            return [0x7C, 0x04, 0x18, 0x04, 0x78]

        if (character == "n")
            return [0x7C, 0x08, 0x04, 0x04, 0x78]

        if (character == "o")
            return [0x38, 0x44, 0x44, 0x44, 0x38]

        if (character == "p")
            return [0x7F, 0x09, 0x09, 0x09, 0x06]

        if (character == "q")
            return [0x06, 0x09, 0x09, 0x08, 0x7F]

        if (character == "r")
            return [0x7C, 0x08, 0x04, 0x04, 0x08]

        if (character == "s")
            return [0x48, 0x54, 0x54, 0x54, 0x24]

        if (character == "t")
            return [0x04, 0x3F, 0x44, 0x40, 0x20]

        if (character == "u")
            return [0x3C, 0x40, 0x40, 0x20, 0x7C]

        if (character == "v")
            return [0x1C, 0x20, 0x40, 0x20, 0x1C]

        if (character == "w")
            return [0x3C, 0x40, 0x30, 0x40, 0x3C]

        if (character == "x")
            return [0x44, 0x28, 0x10, 0x28, 0x44]

        if (character == "y")
            return [0x0C, 0x50, 0x50, 0x50, 0x3C]

        if (character == "z")
            return [0x44, 0x64, 0x54, 0x4C, 0x44]

        // ---------------- Digits 0-9 ----------------

        if (character == "0")
            return [0x3E, 0x51, 0x49, 0x45, 0x3E]

        if (character == "1")
            return [0x00, 0x42, 0x7F, 0x40, 0x00]

        if (character == "2")
            return [0x42, 0x61, 0x51, 0x49, 0x46]

        if (character == "3")
            return [0x21, 0x41, 0x45, 0x4B, 0x31]

        if (character == "4")
            return [0x18, 0x14, 0x12, 0x7F, 0x10]

        if (character == "5")
            return [0x27, 0x45, 0x45, 0x45, 0x39]

        if (character == "6")
            return [0x3C, 0x4A, 0x49, 0x49, 0x30]

        if (character == "7")
            return [0x01, 0x71, 0x09, 0x05, 0x03]

        if (character == "8")
            return [0x36, 0x49, 0x49, 0x49, 0x36]

        if (character == "9")
            return [0x06, 0x49, 0x49, 0x29, 0x1E]

        // ---------------- Punctuation ----------------

        if (character == " ")
            return [0x00, 0x00, 0x00, 0x00, 0x00]

        if (character == ".")
            return [0x00, 0x60, 0x60, 0x00, 0x00]

        if (character == ",")
            return [0x00, 0x80, 0x60, 0x00, 0x00]

        if (character == "!")
            return [0x00, 0x00, 0x5F, 0x00, 0x00]

        if (character == "?")
            return [0x02, 0x01, 0x51, 0x09, 0x06]

        if (character == ":")
            return [0x00, 0x36, 0x36, 0x00, 0x00]

        if (character == "-")
            return [0x08, 0x08, 0x08, 0x08, 0x08]

        if (character == "_")
            return [0x40, 0x40, 0x40, 0x40, 0x40]

        if (character == "/")
            return [0x20, 0x10, 0x08, 0x04, 0x02]

        if (character == "%")
            return [0x23, 0x13, 0x08, 0x64, 0x62]

        if (character == "@")
            return [0x3E, 0x41, 0x5D, 0x55, 0x1E]

        if (character == "#")
            return [0x14, 0x7F, 0x14, 0x7F, 0x14]

        if (character == "$")
            return [0x24, 0x2A, 0x7F, 0x2A, 0x12]

        if (character == "^")
            return [0x04, 0x02, 0x01, 0x02, 0x04]

        if (character == "&")
            return [0x36, 0x49, 0x56, 0x20, 0x50]

        if (character == "*")
            return [0x14, 0x08, 0x3E, 0x08, 0x14]

        if (character == "(")
            return [0x00, 0x1C, 0x22, 0x41, 0x00]

        if (character == ")")
            return [0x00, 0x41, 0x22, 0x1C, 0x00]

        if (character == "+")
            return [0x08, 0x08, 0x3E, 0x08, 0x08]

        if (character == "=")
            return [0x14, 0x14, 0x14, 0x14, 0x14]

        if (character == "~")
            return [0x02, 0x01, 0x02, 0x04, 0x02]

        return [
            0x7F,
            0x41,
            0x41,
            0x41,
            0x7F
        ]
    }

    // ------------------------------------------------------------
    // ORIGINAL BUILT-IN ICONS
    // ------------------------------------------------------------

    /**
     * Built-in 8x8 icons.
     */
    export enum Icons {

        //% block="heart"
        Heart,

        //% block="small heart"
        SmallHeart,

        //% block="happy"
        Happy,

        //% block="sad"
        Sad,

        //% block="yes"
        Yes,

        //% block="no"
        No,

        //% block="arrow up"
        ArrowUp,

        //% block="arrow down"
        ArrowDown,

        //% block="target"
        Target,

        //% block="square"
        Square
    }

    function iconBitmap(
        icon: Icons
    ): number[] {

        if (icon == Icons.Heart)
            return [
                0b01100110,
                0b11111111,
                0b11111111,
                0b11111111,
                0b01111110,
                0b00111100,
                0b00011000,
                0b00000000
            ]

        if (icon == Icons.SmallHeart)
            return [
                0b00000000,
                0b01100110,
                0b11111111,
                0b11111111,
                0b01111110,
                0b00111100,
                0b00011000,
                0b00000000
            ]

        if (icon == Icons.Happy)
            return [
                0b00111100,
                0b01000010,
                0b10100101,
                0b10000001,
                0b10100101,
                0b10011001,
                0b01000010,
                0b00111100
            ]

        if (icon == Icons.Sad)
            return [
                0b00111100,
                0b01000010,
                0b10100101,
                0b10000001,
                0b10011001,
                0b10100101,
                0b01000010,
                0b00111100
            ]

        if (icon == Icons.Yes)
            return [
                0b00000000,
                0b00000001,
                0b00000010,
                0b00000100,
                0b10001000,
                0b01010000,
                0b00100000,
                0b00000000
            ]

        if (icon == Icons.No)
            return [
                0b10000001,
                0b01000010,
                0b00100100,
                0b00011000,
                0b00011000,
                0b00100100,
                0b01000010,
                0b10000001
            ]

        if (icon == Icons.ArrowUp)
            return [
                0b00011000,
                0b00111100,
                0b01111110,
                0b11011011,
                0b00011000,
                0b00011000,
                0b00011000,
                0b00011000
            ]

        if (icon == Icons.ArrowDown)
            return [
                0b00011000,
                0b00011000,
                0b00011000,
                0b00011000,
                0b11011011,
                0b01111110,
                0b00111100,
                0b00011000
            ]

        if (icon == Icons.Target)
            return [
                0b00111100,
                0b01000010,
                0b10011001,
                0b10100101,
                0b10100101,
                0b10011001,
                0b01000010,
                0b00111100
            ]

        return [
            0b11111111,
            0b10000001,
            0b10000001,
            0b10000001,
            0b10000001,
            0b10000001,
            0b10000001,
            0b11111111
        ]
    }

    /**
     * Draw a built-in 8x8 icon.
     */
    //% block="show icon %icon at x %x y %y"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=60
    export function showIcon(
        icon: Icons,
        x: number,
        y: number
    ): void {

        let bitmap =
            iconBitmap(icon)

        for (
            let row = 0;
            row < 8;
            row++
        ) {

            let rowData =
                bitmap[row]

            for (
                let col = 0;
                col < 8;
                col++
            ) {

                if (
                    (rowData &
                        (0x80 >> col)) != 0
                ) {

                    setPixelInternal(
                        x + col,
                        y + row,
                        true
                    )
                }
            }
        }
    }

    // ------------------------------------------------------------
    // TEXT
    // ------------------------------------------------------------

    /**
     * Draw text using the built-in 5x7 font.
     */
    //% block="show text %text at x %x y %y"
    //% weight=55
    export function showText(
        text: string,
        x: number,
        y: number
    ): void {

        for (
            let i = 0;
            i < text.length;
            i++
        ) {

            let character =
                text.charAt(i)

            let data =
                glyph(character)

            for (
                let column = 0;
                column < 5;
                column++
            ) {

                let columnData =
                    data[column]

                for (
                    let bit = 0;
                    bit < 7;
                    bit++
                ) {

                    if (
                        (columnData &
                            (1 << bit)) != 0
                    ) {

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

    // ------------------------------------------------------------
    // ANIMATION SYSTEM
    // ------------------------------------------------------------

    const MAX_FRAMES = 4

    let animationFrames: Buffer[] = []

    let animationRunning = false

    let animationDelay = 200

    let animationFrameNumber = 0

    // ------------------------------------------------------------
    // CLEAR ANIMATION FRAMES
    // ------------------------------------------------------------

    /**
     * Delete all saved animation frames.
     */
    //% block="clear animation frames"
    //% weight=50
    export function clearAnimationFrames(): void {

        animationFrames = []

        animationFrameNumber = 0
    }

    // ------------------------------------------------------------
    // SAVE ANIMATION FRAME
    // ------------------------------------------------------------

    /**
     * Save the current screen buffer as a frame.
     */
    //% block="animation frame"
    //% weight=49
    export function animationFrame(): void {

        if (
            animationFrames.length >=
            MAX_FRAMES
        ) {
            return
        }

        let frame =
            pins.createBuffer(1024)

        for (
            let i = 0;
            i < 1024;
            i++
        ) {

            frame[i] =
                buffer[i]
        }

        animationFrames.push(frame)
    }

    // ------------------------------------------------------------
    // SHOW CURRENT FRAME
    // ------------------------------------------------------------

    /**
     * Show the current animation frame.
     */
    //% block="show frame"
    //% weight=48
    export function showFrame(): void {

        if (
            animationFrameNumber < 0 ||
            animationFrameNumber >=
            animationFrames.length
        ) {
            return
        }

        let frame =
            animationFrames[
                animationFrameNumber
            ]

        for (
            let i = 0;
            i < 1024;
            i++
        ) {

            buffer[i] =
                frame[i]
        }

        sendBuffer()
    }

    // ------------------------------------------------------------
    // ANIMATION DELAY
    // ------------------------------------------------------------

    /**
     * Set the delay between animation frames.
     */
    //% block="animation delay %milliseconds ms"
    //% milliseconds.min=20 milliseconds.max=5000
    //% weight=47
    export function animationDelayMs(
        milliseconds: number
    ): void {

        if (milliseconds < 20) {
            milliseconds = 20
        }

        if (milliseconds > 5000) {
            milliseconds = 5000
        }

        animationDelay =
            milliseconds
    }

    // ------------------------------------------------------------
    // START ANIMATION
    // ------------------------------------------------------------

    /**
     * Start playing the saved animation.
     */
    //% block="start animation"
    //% weight=46
    export function startAnimation(): void {

        if (animationRunning) {
            return
        }

        if (animationFrames.length == 0) {
            return
        }

        animationRunning = true

        control.inBackground(() => {

            while (animationRunning) {

                if (
                    animationFrames.length == 0
                ) {

                    animationRunning =
                        false

                    break
                }

                if (
                    animationFrameNumber >=
                    animationFrames.length
                ) {

                    animationFrameNumber = 0
                }

                let frame =
                    animationFrames[
                        animationFrameNumber
                    ]

                for (
                    let i = 0;
                    i < 1024;
                    i++
                ) {

                    buffer[i] =
                        frame[i]
                }

                sendBuffer()

                animationFrameNumber++

                if (
                    animationFrameNumber >=
                    animationFrames.length
                ) {

                    animationFrameNumber = 0
                }

                basic.pause(
                    animationDelay
                )
            }
        })
    }

    // ------------------------------------------------------------
    // STOP ANIMATION
    // ------------------------------------------------------------

    /**
     * Stop animation playback.
     */
    //% block="stop animation"
    //% weight=45
    export function stopAnimation(): void {

        animationRunning = false
    }

    // ============================================================
    // SCALED ICONS
    // ============================================================

    export enum IconSize {

        //% block="tiny 8x8"
        Tiny = 8,

        //% block="small 16x16"
        Small = 16,

        //% block="medium 24x24"
        Medium = 24,

        //% block="large 32x32"
        Large = 32
    }

    // ------------------------------------------------------------
    // ICON PATTERN DRAWING
    // ------------------------------------------------------------

    function drawIconPixel(
        x: number,
        y: number,
        scale: number
    ): void {

        for (let yy = 0; yy < scale; yy++) {

            for (let xx = 0; xx < scale; xx++) {

                setPixelInternal(
                    x + xx,
                    y + yy,
                    true
                )
            }
        }
    }

    function drawIconPattern(
        pattern: string[],
        x: number,
        y: number,
        scale: number
    ): void {

        for (
            let row = 0;
            row < pattern.length;
            row++
        ) {

            let line =
                pattern[row]

            for (
                let col = 0;
                col < line.length;
                col++
            ) {

                if (
                    line.charAt(col) == "#"
                ) {

                    drawIconPixel(
                        x + col * scale,
                        y + row * scale,
                        scale
                    )
                }
            }
        }
    }

    // ------------------------------------------------------------
    // ICON PATTERNS
    // ------------------------------------------------------------

    const HAPPY_ICON = [
        "  ####  ",
        " #    # ",
        "#      #",
        "# #  # #",
        "#      #",
        "# #  # #",
        " # #### ",
        "  ####  "
    ]

    const SAD_ICON = [
        "  ####  ",
        " #    # ",
        "#      #",
        "# #  # #",
        "#      #",
        "# #### #",
        " #    # ",
        "  ####  "
    ]

    const ANGRY_ICON = [
        "  ####  ",
        " #    # ",
        "#      #",
        "##    ##",
        "# #  # #",
        "#      #",
        " # ## # ",
        "  ####  "
    ]

    const NO_ICON = [
        "##    ##",
        "###  ###",
        " #######",
        "  ##### ",
        "  ##### ",
        " #######",
        "###  ###",
        "##    ##"
    ]

    const YES_ICON = [
        "       #",
        "      ##",
        "     ## ",
        "    ##  ",
        "#  ##   ",
        "###     ",
        " ##     ",
        "  #     "
    ]

    const HEART_ICON = [
        " ##  ## ",
        "########",
        "########",
        " ########",
        "  ######",
        "   #### ",
        "    ##  ",
        "        "
    ]

    const THERMOMETER_ICON = [
        "   ##   ",
        "   ##   ",
        "   ##   ",
        "   ##   ",
        "   ##   ",
        "  ####  ",
        " ###### ",
        "  ####  "
    ]

    const SNOWFLAKE_ICON = [
        "#   #   ",
        " # #    ",
        "  ###   ",
        "########",
        "  ###   ",
        " # #    ",
        "#   #   "
    ]

    const CLOUD_ICON = [
        "         ",
        "   ###   ",
        "  #####  ",
        " ########",
        "#########",
        " ########",
        "         "
    ]

    // ------------------------------------------------------------
    // SHOW SCALED ICON
    // ------------------------------------------------------------

    /**
     * Show one of the larger built-in icons.
     */
    //% block="show scaled icon %icon at x %x y %y size %size"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=20
    export function showScaledIcon(
        icon: number,
        x: number,
        y: number,
        size: IconSize
    ): void {

        let pattern: string[] = []

        if (icon == 0) {
            pattern = HAPPY_ICON
        } else if (icon == 1) {
            pattern = SAD_ICON
        } else if (icon == 2) {
            pattern = ANGRY_ICON
        } else if (icon == 3) {
            pattern = NO_ICON
        } else if (icon == 4) {
            pattern = YES_ICON
        } else if (icon == 5) {
            pattern = HEART_ICON
        } else if (icon == 6) {
            pattern = THERMOMETER_ICON
        } else if (icon == 7) {
            pattern = SNOWFLAKE_ICON
        } else if (icon == 8) {
            pattern = CLOUD_ICON
        } else {
            return
        }

        let scale = 1

        if (size == IconSize.Tiny) {
            scale = 1
        } else if (size == IconSize.Small) {
            scale = 2
        } else if (size == IconSize.Medium) {
            scale = 3
        } else {
            scale = 4
        }

        drawIconPattern(
            pattern,
            x,
            y,
            scale
        )

        sendBuffer()
    }

    // ------------------------------------------------------------
    // SIMPLE SCALED ICON BLOCKS
    // ------------------------------------------------------------

    //% block="happy icon at x %x y %y size %size"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=19
    export function happyIcon(
        x: number,
        y: number,
        size: IconSize
    ): void {

        showScaledIcon(
            0,
            x,
            y,
            size
        )
    }

    //% block="sad icon at x %x y %y size %size"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=18
    export function sadIcon(
        x: number,
        y: number,
        size: IconSize
    ): void {

        showScaledIcon(
            1,
            x,
            y,
            size
        )
    }

    //% block="angry icon at x %x y %y size %size"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=17
    export function angryIcon(
        x: number,
        y: number,
        size: IconSize
    ): void {

        showScaledIcon(
            2,
            x,
            y,
            size
        )
    }

    //% block="NO icon at x %x y %y size %size"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=16
    export function noIcon(
        x: number,
        y: number,
        size: IconSize
    ): void {

        showScaledIcon(
            3,
            x,
            y,
            size
        )
    }

    //% block="YES icon at x %x y %y size %size"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=15
    export function yesIcon(
        x: number,
        y: number,
        size: IconSize
    ): void {

        showScaledIcon(
            4,
            x,
            y,
            size
        )
    }

    //% block="heart icon at x %x y %y size %size"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=14
    export function heartIcon(
        x: number,
        y: number,
        size: IconSize
    ): void {

        showScaledIcon(
            5,
            x,
            y,
            size
        )
    }

    //% block="thermometer icon at x %x y %y size %size"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=13
    export function thermometerIcon(
        x: number,
        y: number,
        size: IconSize
    ): void {

        showScaledIcon(
            6,
            x,
            y,
            size
        )
    }

    //% block="snowflake icon at x %x y %y size %size"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=12
    export function snowflakeIcon(
        x: number,
        y: number,
        size: IconSize
    ): void {

        showScaledIcon(
            7,
            x,
            y,
            size
        )
    }

    //% block="cloud icon at x %x y %y size %size"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=11
    export function cloudIcon(
        x: number,
        y: number,
        size: IconSize
    ): void {

        showScaledIcon(
            8,
            x,
            y,
            size
        )
    }

    // ============================================================
    // RAINFALL
    // ============================================================

    //% block="show rainfall"
    //% weight=4
    export function showRainfall(): void {

        clear()

        drawIconPattern(
            CLOUD_ICON,
            55,
            0,
            2
        )

        for (
            let x = 10;
            x < 125;
            x += 18
        ) {

            let y =
                Math.randomRange(
                    20,
                    55
                )

            drawLine(
                x,
                y,
                x - 1,
                y + 5
            )
        }

        sendBuffer()
    }

    // ============================================================
    // SNOWFALL
    // ============================================================

    //% block="show snowfall"
    //% weight=3
    export function showSnowfall(): void {

        clear()

        for (
            let i = 0;
            i < 14;
            i++
        ) {

            let x =
                Math.randomRange(
                    2,
                    125
                )

            let y =
                Math.randomRange(
                    2,
                    61
                )

            drawPixel(
                x,
                y
            )
        }

        sendBuffer()
    }

    // ============================================================
    // ANGRY MAN
    // ============================================================

    //% block="show angry man"
    //% weight=2
    export function showAngryMan(): void {

        clear()

        // head
        drawRectangle(
            48,
            15,
            30,
            25
        )

        // angry eyes
        drawLine(
            53,
            21,
            61,
            25
        )

        drawLine(
            69,
            25,
            77,
            21
        )

        // angry mouth
        drawLine(
            57,
            33,
            69,
            33
        )

        drawLine(
            69,
            33,
            73,
            30
        )

        // nose
        drawLine(
            64,
            25,
            64,
            30
        )

        // body
        drawRectangle(
            54,
            40,
            18,
            18
        )

        // air from nose
        drawLine(
            78,
            27,
            86,
            27
        )

        drawLine(
            86,
            27,
            91,
            24
        )

        sendBuffer()
    }

    // ============================================================
    // BIG HEART
    // ============================================================

    //% block="show big heart"
    //% weight=1
    export function showBigHeart(): void {

        clear()

        drawIconPattern(
            HEART_ICON,
            48,
            20,
            4
        )

        sendBuffer()
    }
}
# ------------------------------------------------------------
# FIX FILLED CIRCLE
# ------------------------------------------------------------

old_circle = '''    export function fillCircle(
        x: number,
        y: number,
        radius: number
    ): void {

        if (radius < 1) {
            return
        }

        for (
            let yy = -radius;
            yy <= radius;
            yy++
        ) {
            let inside =
                radius * radius -
                yy * yy

            let xx =
                Math.sqrt(inside)

            drawLine(
                x - xx,
                y + yy,
                x + xx,
                y + yy
            )
        }
    }'''

new_circle = '''    export function fillCircle(
        x: number,
        y: number,
        radius: number
    ): void {

        if (radius < 1) {
            return
        }

        for (let yy = -radius; yy <= radius; yy++) {

            let inside =
                radius * radius -
                yy * yy

            let span =
                Math.floor(Math.sqrt(inside))

            for (let xx = -span; xx <= span; xx++) {
                setPixelInternal(
                    x + xx,
                    y + yy,
                    true
                )
            }
        }
    }'''

if old_circle in text:
    text = text.replace(old_circle, new_circle)
else:
    print("WARNING: old fillCircle code was not found.")

# ------------------------------------------------------------
# FIX FILLED TRIANGLE
# ------------------------------------------------------------

start = text.find("    export function fillTriangle(")

if start != -1:
    end = text.find("\n    // ------------------------------------------------------------", start)

    if end != -1:
        old_triangle = text[start:end]

        new_triangle = '''    export function fillTriangle(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number
    ): void {

        let minX = Math.min(x1, Math.min(x2, x3))
        let maxX = Math.max(x1, Math.max(x2, x3))
        let minY = Math.min(y1, Math.min(y2, y3))
        let maxY = Math.max(y1, Math.max(y2, y3))

        let area =
            (x2 - x1) * (y3 - y1) -
            (y2 - y1) * (x3 - x1)

        if (area == 0) {
            return
        }

        for (let y = minY; y <= maxY; y++) {

            for (let x = minX; x <= maxX; x++) {

                let a =
                    (x2 - x1) * (y - y1) -
                    (y2 - y1) * (x - x1)

                let b =
                    (x3 - x2) * (y - y2) -
                    (y3 - y2) * (x - x2)

                let c =
                    (x1 - x3) * (y - y3) -
                    (y1 - y3) * (x - x3)

                if (
                    (a >= 0 && b >= 0 && c >= 0) ||
                    (a <= 0 && b <= 0 && c <= 0)
                ) {
                    setPixelInternal(
                        x,
                        y,
                        true
                    )
                }
            }
        }
    }'''

        text = text[:start] + new_triangle + text[end:]
    else:
        print("WARNING: could not find end of fillTriangle.")

# ------------------------------------------------------------
# NEW FEATURES
# Insert immediately before final namespace closing brace.
# ------------------------------------------------------------

features = r'''

    // ============================================================
    // OLED POWER / DISPLAY CONTROL
    // ============================================================

    /**
     * Turn the OLED on.
     */
    //% block="OLED on"
    //% weight=100
    export function on(): void {
        command(0xAF)
    }

    /**
     * Turn the OLED off.
     */
    //% block="OLED off"
    //% weight=99
    export function off(): void {
        command(0xAE)
    }

    /**
     * Force the current framebuffer onto the OLED.
     */
    //% block="draw OLED"
    //% weight=98
    export function draw(): void {
        sendBuffer()
    }

    /**
     * Invert the OLED display.
     */
    //% block="invert OLED %d"
    //% d.defl=true
    //% weight=97
    export function invert(d: boolean = true): void {
        if (d) {
            command(0xA7)
        } else {
            command(0xA6)
        }
    }

    /**
     * Flip the OLED display 180 degrees.
     */
    //% block="flip mode %d"
    //% d.defl=true
    //% weight=96
    export function flipMode(d: boolean = true): void {
        if (d) {
            command(0xA0)
            command(0xC0)
        } else {
            command(0xA1)
            command(0xC8)
        }

        sendBuffer()
    }

    // ============================================================
    // NUMBER
    // ============================================================

    /**
     * Show a number at a position.
     */
    //% block="show number x %x y %y number %num"
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    //% weight=94
    export function showNumber(
        x: number,
        y: number,
        num: number
    ): void {

        showText(
            num.toString(),
            x,
            y
        )
    }

    // ============================================================
    // ZOOM
    // ============================================================

    /**
     * Double the current framebuffer.
     */
    //% block="zoom OLED %d"
    //% d.defl=true
    //% weight=93
    export function zoom(d: boolean = true): void {

        if (!d) {
            return
        }

        let oldBuffer = pins.createBuffer(1024)

        for (let i = 0; i < 1024; i++) {
            oldBuffer[i] = buffer[i]
        }

        for (let i = 0; i < 1024; i++) {
            buffer[i] = 0
        }

        for (let y = 0; y < 32; y++) {

            for (let x = 0; x < 64; x++) {

                let oldX = x
                let oldY = y

                let index =
                    oldX +
                    ((oldY >> 3) * WIDTH)

                let mask =
                    1 << (oldY & 7)

                if ((oldBuffer[index] & mask) != 0) {

                    let newX = x * 2
                    let newY = y * 2

                    setPixelInternal(
                        newX,
                        newY,
                        true
                    )

                    setPixelInternal(
                        newX + 1,
                        newY,
                        true
                    )

                    setPixelInternal(
                        newX,
                        newY + 1,
                        true
                    )

                    setPixelInternal(
                        newX + 1,
                        newY + 1,
                        true
                    )
                }
            }
        }

        sendBuffer()
    }

    // ============================================================
    // BORDER
    // ============================================================

    /**
     * Add or remove a border around the OLED.
     */
    //% block="borders %d"
    //% d.defl=true
    //% weight=92
    export function borders(d: boolean = true): void {

        if (d) {
            drawRectangle(
                0,
                0,
                128,
                64
            )
        } else {
            for (let x = 0; x < 128; x++) {
                setPixelInternal(x, 0, false)
                setPixelInternal(x, 63, false)
            }

            for (let y = 0; y < 64; y++) {
                setPixelInternal(0, y, false)
                setPixelInternal(127, y, false)
            }
        }

        sendBuffer()
    }

    // ============================================================
    // LOADING BAR
    // ============================================================

    /**
     * Show a 0-100 percent loading bar.
     */
    //% block="loading bar %percent percent"
    //% percent.min=0 percent.max=100 percent.defl=50
    //% weight=91
    export function loadingBar(
        percent: number
    ): void {

        if (percent < 0) {
            percent = 0
        }

        if (percent > 100) {
            percent = 100
        }

        let barX = 8
        let barY = 28
        let barWidth = 112
        let barHeight = 12

        drawRectangle(
            barX,
            barY,
            barWidth,
            barHeight
        )

        let insideWidth =
            barWidth - 4

        let filled =
            Math.floor(
                insideWidth * percent / 100
            )

        if (filled > 0) {
            fillRectangle(
                barX + 2,
                barY + 2,
                filled,
                barHeight - 4
            )
        }

        showText(
            percent.toString() + "%",
            52,
            10
        )

        sendBuffer()
    }

    // ============================================================
    // SCROLLING
    // ============================================================

    /**
     * Scroll the framebuffer upward.
     */
    //% block="scroll up"
    //% weight=90
    export function scrollUp(): void {

        for (let y = 0; y < 63; y++) {
            for (let x = 0; x < 128; x++) {
                setPixelInternal(
                    x,
                    y,
                    getPixel(x, y + 1)
                )
            }
        }

        for (let x = 0; x < 128; x++) {
            setPixelInternal(
                x,
                63,
                false
            )
        }

        sendBuffer()
    }

    /**
     * Scroll the framebuffer downward.
     */
    //% block="scroll down"
    //% weight=89
    export function scrollDown(): void {

        for (let y = 63; y > 0; y--) {
            for (let x = 0; x < 128; x++) {
                setPixelInternal(
                    x,
                    y,
                    getPixel(x, y - 1)
                )
            }
        }

        for (let x = 0; x < 128; x++) {
            setPixelInternal(
                x,
                0,
                false
            )
        }

        sendBuffer()
    }

    /**
     * Scroll the framebuffer left.
     */
    //% block="scroll left"
    //% weight=88
    export function scrollLeft(): void {

        for (let y = 0; y < 64; y++) {

            for (let x = 0; x < 127; x++) {
                setPixelInternal(
                    x,
                    y,
                    getPixel(x + 1, y)
                )
            }

            setPixelInternal(
                127,
                y,
                false
            )
        }

        sendBuffer()
    }

    /**
     * Scroll the framebuffer right.
     */
    //% block="scroll right"
    //% weight=87
    export function scrollRight(): void {

        for (let y = 0; y < 64; y++) {

            for (let x = 127; x > 0; x--) {
                setPixelInternal(
                    x,
                    y,
                    getPixel(x - 1, y)
                )
            }

            setPixelInternal(
                0,
                y,
                false
            )
        }

        sendBuffer()
    }

    // ============================================================
    // BUILT-IN ANIMATIONS
    // ============================================================

    /**
     * Play a smoke animation.
     */
    //% block="smoke animation"
    //% weight=40
    export function smokeAnimation(): void {

        for (let frame = 0; frame < 4; frame++) {

            clear()

            if (frame == 0) {
                fillCircle(62, 42, 4)
            }

            if (frame == 1) {
                fillCircle(62, 34, 5)
                drawPixel(68, 29)
            }

            if (frame == 2) {
                fillCircle(58, 25, 5)
                fillCircle(68, 20, 3)
            }

            if (frame == 3) {
                fillCircle(52, 16, 4)
                fillCircle(65, 9, 3)
            }

            sendBuffer()
            basic.pause(120)
        }
    }

    /**
     * Play a beating heart animation.
     */
    //% block="heart beating animation"
    //% weight=39
    export function heartBeatingAnimation(): void {

        clear()
        showScaledIcon(
            5,
            40,
            16,
            IconSize.Large
        )
        sendBuffer()
        basic.pause(180)

        clear()
        showScaledIcon(
            5,
            32,
            8,
            IconSize.Large
        )
        sendBuffer()
        basic.pause(180)

        clear()
        showScaledIcon(
            5,
            40,
            16,
            IconSize.Large
        )
        sendBuffer()
    }

    /**
     * Play an angry animation.
     */
    //% block="angry animation"
    //% weight=38
    export function angryAnimation(): void {

        clear()
        angryIcon(
            52,
            20,
            IconSize.Medium
        )
        basic.pause(150)

        clear()
        drawLine(40, 18, 48, 14)
        drawLine(80, 14, 88, 18)
        angryIcon(
            52,
            20,
            IconSize.Medium
        )
        basic.pause(150)

        clear()
        drawLine(36, 20, 48, 14)
        drawLine(80, 14, 92, 20)
        angryIcon(
            52,
            20,
            IconSize.Medium
        )
        sendBuffer()
    }

    /**
     * Play a sleeping animation.
     */
    //% block="sleeping animation"
    //% weight=37
    export function sleepingAnimation(): void {

        clear()
        showText("Z", 92, 12)
        showText("z", 104, 4)
        showText("z", 112, 0)
        sendBuffer()
        basic.pause(350)

        clear()
        showText("Z", 96, 8)
        showText("z", 108, 0)
        sendBuffer()
        basic.pause(350)

        clear()
        showText("Z", 100, 4)
        sendBuffer()
    }

    /**
     * Play a rain animation.
     */
    //% block="rain animation"
    //% weight=36
    export function rainAnimation(): void {

        for (let frame = 0; frame < 4; frame++) {

            clear()

            drawIconPattern(
                CLOUD_ICON,
                52,
                2,
                2
            )

            for (let x = 8; x < 125; x += 18) {
                let y = 25 + ((x + frame * 6) % 30)

                drawLine(
                    x,
                    y,
                    x - 1,
                    y + 5
                )
            }

            sendBuffer()
            basic.pause(120)
        }
    }

    /**
     * Play a snowfall animation.
     */
    //% block="snow animation"
    //% weight=35
    export function snowAnimation(): void {

        for (let frame = 0; frame < 5; frame++) {

            clear()

            for (let i = 0; i < 16; i++) {

                let x =
                    (i * 17 + frame * 3) % 126

                let y =
                    (i * 11 + frame * 5) % 62

                drawPixel(
                    x,
                    y
                )
            }

            sendBuffer()
            basic.pause(130)
        }
    }

    /**
     * Play an explosion animation.
     */
    //% block="explosion animation"
    //% weight=34
    export function explosionAnimation(): void {

        clear()
        fillCircle(64, 32, 3)
        sendBuffer()
        basic.pause(100)

        clear()
        drawCircle(64, 32, 8)
        drawLine(64, 18, 64, 10)
        drawLine(64, 46, 64, 54)
        drawLine(50, 32, 42, 32)
        drawLine(78, 32, 86, 32)
        sendBuffer()
        basic.pause(100)

        clear()
        drawCircle(64, 32, 15)
        drawLine(64, 8, 64, 2)
        drawLine(64, 56, 64, 62)
        drawLine(40, 32, 32, 32)
        drawLine(88, 32, 96, 32)
        drawLine(48, 16, 42, 10)
        drawLine(80, 16, 86, 10)
        drawLine(48, 48, 42, 54)
        drawLine(80, 48, 86, 54)
        sendBuffer()
    }

    /**
     * Play a fire animation.
     */
    //% block="fire animation"
    //% weight=33
    export function fireAnimation(): void {

        for (let frame = 0; frame < 4; frame++) {

            clear()

            fillCircle(
                64,
                48,
                12
            )

            drawTriangle(
                52,
                48,
                64,
                12 - frame * 2,
                76,
                48
            )

            if (frame % 2 == 0) {
                fillCircle(64, 42, 6)
            } else {
                fillCircle(60, 40, 5)
            }

            sendBuffer()
            basic.pause(120)
        }
    }

    /**
     * Play a moving arrow animation.
     */
    //% block="moving arrow animation"
    //% weight=32
    export function movingArrowAnimation(): void {

        for (let x = 8; x <= 104; x += 16) {

            clear()

            drawLine(
                x,
                32,
                x + 20,
                32
            )

            drawLine(
                x + 20,
                32,
                x + 12,
                24
            )

            drawLine(
                x + 20,
                32,
                x + 12,
                40
            )

            sendBuffer()
            basic.pause(100)
        }
    }
'''

# Insert before the final namespace closing brace.
last = text.rfind("\n}")
if last == -1:
    raise SystemExit("Could not find final namespace closing brace.")

# Avoid accidental duplicate installation.
if "export function smokeAnimation()" in text:
    print("New features already appear to be installed. No changes made.")
else:
    text = text[:last] + features + text[last:]
    p.write_text(text, encoding="utf-8")
    print("BIG UPGRADE INSTALLED.")
    print("main.ts updated successfully.")
