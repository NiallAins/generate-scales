const ChartLine = {
    CTX: null,
    CAN_W: 0,
    CAN_H: 0,
    W: 0,
    H: 0,

    targetNotes: [],
    currentNotes: [],
    targetModeX: -1,
    currentModeX: -1,
    scaleLength: 0,

    animationFrame: 0,
    animatonTime: 0,

    init() {
        const
            CAN = document.createElement('canvas'),
            W = WIDTH.page,
            H = WIDTH.chartLine_height,
            Q = 4;

        this.CAN_W = W;
        this.CAN_H = H;
        this.W = W - (WIDTH.canPad * 2);
        this.H = H - (WIDTH.canPad * 2);

        CAN.width = W * Q;
        CAN.height = H * Q;
        CAN.style.maxWidth = W + 'px';
        CAN.style.maxHeight = H + 'px';
        document.getElementById('EL_CHART_LINE').appendChild(CAN);

        this.CTX = CAN.getContext('2d');
        this.CTX.scale(Q, Q);
        this.CTX.font = FONT.chartLabel;
        this.CTX.textAlign = 'center';
        this.CTX.textBaseline = 'middle';
    },

    render(notes, scaleLength, mode) {
        this.targetNotes = notes;
        this.scaleLength = scaleLength;
        const MODE_FREQ = notes
            .slice(0, scaleLength)
            .sort((a, b) => a.freq - b.freq)[mode]
            .freq;
        this.targetModeX = Math.round((MODE_FREQ - notes[0].freq) * (this.W / notes[0].freq));
        cancelAnimationFrame(this.animationFrame);
        this.animatonTime = new Date().valueOf() - TIMING.tdt;
        this._animate();
    },

    _animate() {
        const
            T = new Date().valueOf(),
            EASE = TIMING.animationEase * (TIMING.tdt / (T - this.animatonTime));
        let
            notes = this.targetNotes.map((n, i) => {
                if (i < this.currentNotes.length) {
                    return {
                        ...n,
                        freq: this.currentNotes[i].freq + ((n.freq - this.currentNotes[i].freq) / EASE)
                    };
                } else {
                    return n;
                }
            }),
            modeX = this.currentModeX === -1
                ? this.targetModeX
                : this.currentModeX + ((this.targetModeX - this.currentModeX) / EASE);

        this.animatonTime = T;
        this.currentNotes = notes.map(n => n);
        this.currentModeX = modeX;

        notes = notes.slice(0, this.scaleLength);
        notes.push({
           ...notes[0],
           freq: notes[0].freq * 2,
           labelFreq: (notes[0].freq * 2) + TEXT.hzSuffix
        });

        const C = this.CTX;
        
        const
            FREQS = notes.map(n => n.freq),
            NOTE_MIN = Math.min(...FREQS),
            NOTES_RANGE = Math.max(...FREQS) - NOTE_MIN,
            NOTES_X = FREQS
                .map(n => (n - NOTE_MIN) * (this.W / NOTES_RANGE))
                .map(n => Math.round(n));

        C.save();

        C.clearRect(0, 0, this.CAN_W, this.CAN_H);
        C.translate(
            WIDTH.canPad,
            WIDTH.canPad + (this.H * 0.5)
        );

        // Arcs
        for (let i = NOTES_X.length - 3; i >= 0; i--) {
            C.save();
                C.beginPath();
                    const
                        X0 = NOTES_X[i],
                        OVERSHOOT = NOTES_X[i + 1] < X0,
                        X1 =
                            NOTES_X[i + 1] +
                            (OVERSHOOT ? this.W * ((1 + notes.length) / notes.length) : 0),
                        R = (X1 - X0) * 0.5,
                        MIN_H = WIDTH.chartLine_arcHeightMin * this.H,
                        H = MIN_H + (((this.H * 0.5) - MIN_H) * (1 - (i / notes.length)));
                    C.ellipse(
                        X0 + R, 0,
                        R, H, 0,
                        i % 2 ? 0 : PI,
                        i % 2 ? PI : 0
                    );
                    if (OVERSHOOT) {
                        C.moveTo(NOTES_X[i + 1] - (2 * R), 0);
                        C.ellipse(
                            NOTES_X[i + 1] - R, 0,
                            R, H, 0,
                            i % 2 ? PI : 0,
                            i % 2 ? 0 : PI,
                            true
                        );
                    }
                if (i === 0) {
                    C.strokeStyle = COLOR.bg;
                    C.lineWidth = WIDTH.chartLine_arcStroke * 4;
                    C.stroke();
                }
                C.strokeStyle = getColor(i, notes.length);
                C.lineWidth = WIDTH.chartLine_arcStroke * (i ? 1 : 2);
                C.stroke();
            C.restore();
        }

        // Y axis
        C.beginPath();
            C.moveTo(WIDTH.chartLine_axisStroke * -0.5, 0);
            C.lineTo(this.W + (WIDTH.chartLine_axisStroke * 0.5), 0);
        C.lineWidth = WIDTH.axis;
        C.strokeStyle = COLOR.axis;
        C.stroke();

        // Mode caret
        C.fillStyle = COLOR.axis;
        C.beginPath();
            C.moveTo(modeX, WIDTH.caretY);
            C.lineTo(modeX + WIDTH.caret, WIDTH.caretY - (WIDTH.caret * 1.5));
            C.lineTo(modeX - WIDTH.caret, WIDTH.caretY - (WIDTH.caret * 1.5));
        C.fill();

        // Labels
        C.fillStyle = COLOR.text;
        NOTES_X.forEach((x, i) => {
            C.fillText(
                notes[i].labelNote,
                x, WIDTH.chartLine_textY * -1
            );
        });

        const
            HZS = [],
            NOTE_MAX = Math.max(...FREQS),
            HZ_SKIP = Math.round(STANDARD_A / D_FREQ) * D_FREQ;  
        let hz = Math.ceil(NOTE_MIN / D_FREQ) * D_FREQ;
        while (hz < NOTE_MAX) {
            if (hz !== HZ_SKIP) {
                HZS.push(hz);
            }
            hz += D_FREQ;
        }
        C.fillStyle = COLOR.text;
        C.lineWidth = WIDTH.axisStroke;
        C.strokeStyle = COLOR.axis;
        C.beginPath();
            // Frequncy labels
            HZS
                .map(h => [
                    h + TEXT.hzSuffix,
                    (h - NOTE_MIN) * (this.W / NOTES_RANGE)
                ])
                .forEach(h => {
                    C.moveTo(h[1], 0);
                    C.lineTo(h[1], WIDTH.chartLine_tickHeight);
                    C.fillText(
                        h[0],
                        h[1], WIDTH.chartLine_textY
                    );
                });

            // Standard A label
            if (NOTE_MIN > 225 && NOTE_MIN < 420) {
                const STANDARD_A_X = (STANDARD_A - NOTE_MIN) * (this.W / NOTES_RANGE);
                C.moveTo(STANDARD_A_X, 0);
                C.lineTo(STANDARD_A_X, WIDTH.chartLine_tickHeight);
                C.fillText(
                    STANDARD_A + TEXT.hzSuffix,
                    STANDARD_A_X, WIDTH.chartLine_textY
                );
                C.fillText(
                    TEXT.standardPitch,
                    STANDARD_A_X, WIDTH.chartLine_textY + WIDTH.chartFont
                );
            }
        C.stroke();

        // Points
        for (let i = 0; i < NOTES_X.length; i++) {
            C.save();
                C.beginPath();
                    C.arc(
                        NOTES_X[i], 0,
                        i === 0 || i === NOTES_X.length - 1
                            ? WIDTH.ptRadStart
                            : WIDTH.ptRad,
                        0, PI2
                    );
                C.fillStyle = getColor(i % (notes.length - 1), notes.length, true)
                C.fill();
            C.restore();
        }

        C.restore();

        if (
            Math.abs(this.targetModeX - this.currentModeX) > 1 ||
            this.targetNotes.some((n, i) => Math.abs(n.freq - this.currentNotes[i].freq) > 1)
        ) {
            this.animationFrame = requestAnimationFrame(() => this._animate());
        }
    }
};