namespace SH1106 {
    const ADDRESS = 0x3C

    function command(value: number): void {
        pins.i2cWriteBuffer(
            ADDRESS,
            pins.createBufferFromArray([0x00, value])
        )
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

    function setPosition(page: number, column: number): void {
        command(0xB0 + page)
        command(0x02 + (column & 0x0F))
        command(0x10 + ((column >> 4) & 0x0F))
    }

    function writeData(data: number[]): void {
        let buffer = pins.createBuffer(data.length + 1)
        buffer[0] = 0x40

        for (let i = 0; i < data.length; i++) {
            buffer[i + 1] = data[i]
        }

        pins.i2cWriteBuffer(ADDRESS, buffer)
    }

    function glyph(character: string): number[] {
        if (character == "H") {
            return [0x7F, 0x08, 0x08, 0x08, 0x7F]
        }

        if (character == "e") {
            return [0x38, 0x54, 0x54, 0x54, 0x18]
        }

        if (character == "l") {
            return [0x00, 0x41, 0x7F, 0x40, 0x00]
        }

        if (character == "o") {
            return [0x38, 0x44, 0x44, 0x44, 0x38]
        }

        if (character == "W") {
            return [0x7F, 0x20, 0x18, 0x20, 0x7F]
        }

        if (character == "r") {
            return [0x7C, 0x08, 0x04, 0x04, 0x08]
        }

        if (character == "d") {
            return [0x38, 0x44, 0x44, 0x48, 0x7F]
        }

        return [0x00, 0x00, 0x00, 0x00, 0x00]
    }

    function drawCharacter(character: string, column: number): void {
        setPosition(3, column)
        writeData(glyph(character))
        writeData([0x00])
    }

    function drawHelloWorld(): void {
        let text = "Hello World"
        let column = 25

        for (let i = 0; i < text.length; i++) {
            drawCharacter(text.charAt(i), column)
            column += 6
        }
    }

    //% block="initialize SH1106 OLED"
    export function initialize(): void {
        initDisplay()
        clear()
    }

    //% block="clear SH1106 OLED"
    export function clear(): void {
        for (let page = 0; page < 8; page++) {
            setPosition(page, 0)

            for (let chunk = 0; chunk < 8; chunk++) {
                let data: number[] = []

                for (let i = 0; i < 16; i++) {
                    data.push(0)
                }

                writeData(data)
            }
        }
    }

    //% block="show Hello World on SH1106 OLED"
    export function showHelloWorld(): void {
        initDisplay()
        clear()
        drawHelloWorld()
    }
}