const ChartCirc = {
    CTX: null,
    CAN_R: 0,
    R: 0,

    targetAngs: [],
    currentAngs: [],
    targetModeAng: null,
    currentModeAng: null,
    chromLength: 0,
    
    animationFrame: 0,
    animatonTime: 0,

    init() {
        this.CAN_R = Math.min(
            WIDTH.page * (WIDTH.isSmallViewport ? 0.5 : 0.25),
            WIDTH.pageMax * 0.25
        );
        this.R = this.CAN_R - (WIDTH.canPad * 2);

        const
            CAN = document.createElement('canvas'),
            Q = 4;

        CAN.width = this.CAN_R * 2 * Q
        CAN.height = (this.CAN_R + 5) * 2 * Q;
        CAN.style.maxWidth = CAN.style.maxHeight = (this.CAN_R * 2) + 'px';
        document.getElementById('EL_CHART_CIRC').appendChild(CAN);

        this.CTX = CAN.getContext('2d');
        this.CTX.scale(Q, Q);
        this.CTX.translate(this.CAN_R, this.CAN_R + 10);
        this.CTX.font = FONT.chartLabel;
        this.CTX.textAlign = 'center';
        this.CTX.textBaseline = 'middle';
        this.CTX.lineCap = 'round';
        this.CTX.lineJoin = 'round';
    },

    render(notes, scale, chromLength, mode) {
        this.chromLength = chromLength;

        const BASE_FREQ = notes
            .map(n => n.freq)
            .sort((a, b) => a - b)[0];
        this.targetAngs = notes
            .map(n => this._toLogNote(n.freq, BASE_FREQ))
            .map(n => (n - BASE_FREQ) / BASE_FREQ)
            .map(n => (PI2 * n) - PIH);
        this.currentAngs = this.targetAngs.map(
            (t, i) => this._toRelativeAng(this.currentAngs[i], t)
        );

        const MODE_RATIO = this._toLogNote(scale[mode].freq, scale[0].freq) / scale[0].freq;
        this.targetModeAng = (1 - MODE_RATIO) * PI2;
        this.currentModeAng = this._toRelativeAng(this.currentModeAng, this.targetModeAng);
        cancelAnimationFrame(this.animationFrame);
        this.animatonTime = new Date().valueOf() - TIMING.tdt;
        this._animate(notes);
    },

    _animate(notes) {
        const
            T = new Date().valueOf(),
            EASE = TIMING.animationEase * (TIMING.tdt / (T - this.animatonTime)),
            MODE_ANG = this.currentModeAng + ((this.targetModeAng - this.currentModeAng) / EASE),
            ANGS_ABS = this.targetAngs.map((t, i) => this.currentAngs[i] + ((t - this.currentAngs[i]) / EASE)),
            ANGS = ANGS_ABS
                .slice(0, this.chromLength)
                .map(a => a + MODE_ANG),
            ANGS_SORT = ANGS
                .filter((_, i) => !notes[i].flat)
                .sort((a, b) => a - b);

        this.animatonTime = T;
        this.currentAngs = ANGS_ABS;
        this.currentModeAng = MODE_ANG;        

        const
            C = this.CTX,
            CIRC_R = WIDTH.chartCirc_circRad * this.R,
            TEXT_R = CIRC_R + WIDTH.chartCirc_textR;

        C.clearRect(
            this.CAN_R * -1, this.CAN_R * -1,
            this.CAN_R *  2, this.CAN_R *  2,
        );

        // Circumference
        C.beginPath();
            C.arc(0, 0, CIRC_R, 0, PI2);
        C.strokeStyle = COLOR.flat;
        C.lineWidth = WIDTH.chartCirc_flatStroke;
        C.stroke();

        // Flat lines
        const FLAT_RAD = CIRC_R - WIDTH.chartCirc_flatStroke;
        C.beginPath();
            [
                ...ANGS.slice(ANGS_SORT.length - 1),
                ANGS[0]
            ]
                .forEach(a => C.lineTo(
                    Math.cos(a) * FLAT_RAD,
                    Math.sin(a) * FLAT_RAD
                ));
        C.lineWidth = WIDTH.chartCirc_flatStroke
        C.strokeStyle = COLOR.flat;
        C.stroke();

        // Scale lines
        let pt = [
            Math.cos(ANGS[ANGS_SORT.length - 1]) * CIRC_R,
            Math.sin(ANGS[ANGS_SORT.length - 1]) * CIRC_R
        ];
        ANGS
            .slice(0, ANGS_SORT.length)
            .map(n => n)
            .reverse()
            .forEach((a, i, aArr) => {
                C.beginPath();
                    C.moveTo(...pt);
                    pt = [
                        Math.cos(a) * CIRC_R,
                        Math.sin(a) * CIRC_R
                    ];
                    C.lineTo(...pt);
                const LAST = i === aArr.length - 1;
                if (LAST) {
                    C.lineWidth = WIDTH.chartCirc_scaleStroke * 4;
                    C.strokeStyle = COLOR.bg;
                    C.stroke();
                }
                C.lineWidth = WIDTH.chartCirc_scaleStroke * (LAST ? 1.5 : 1);
                C.strokeStyle =getColor(aArr.length - i - 1, ANGS_SORT.length);
                C.stroke();
            });

        // Scale shape
        const SHAPE_R = CIRC_R + WIDTH.chartCirc_scaleStroke;
        C.beginPath();
            ANGS_SORT.forEach((a, ai) => {
                C.lineTo(
                    Math.cos(a) * SHAPE_R,
                    Math.sin(a) * SHAPE_R
                );
            });
        C.lineWidth = WIDTH.chartCirc_shapeStroke;
        C.strokeStyle = COLOR.axis;
        C.closePath();
        C.stroke();

        // Points
        ANGS.forEach((a, i) => {
            if (!notes[i].flat) {
                C.beginPath();
                    C.arc(
                        Math.cos(a) * CIRC_R,
                        Math.sin(a) * CIRC_R,
                        i === 0 ? WIDTH.ptRadStart : WIDTH.ptRad,
                        0, PI2
                    );
                C.fillStyle = getColor(i, ANGS_SORT.length + 1, true);
                C.fill();
            }
            C.fillStyle = notes[i].flat ? COLOR.text_l : COLOR.text;
            C.fillText(
                notes[i].labelNote,
                Math.cos(a) * TEXT_R,
                (Math.sin(a) * TEXT_R) - (WIDTH.chartFont * 0.5) 
            );
            C.fillText(
                notes[i].labelFreq,
                Math.cos(a) * TEXT_R,
                (Math.sin(a) * TEXT_R) + (WIDTH.chartFont * 0.5) 
            );
        });

        // Mode caret
        C.fillStyle = COLOR.axis;
        C.beginPath();
            const CARET_Y = (this.R * -1) - 28;
            C.moveTo(0, CARET_Y);
            C.lineTo(WIDTH.caret, CARET_Y - (WIDTH.caret * 1.5));
            C.lineTo(-WIDTH.caret, CARET_Y - (WIDTH.caret * 1.5));
        C.fill();

        if (
            Math.abs(this.currentModeAng - this.targetModeAng) > 0.001 ||
            this.targetAngs.some((n, i) => Math.abs(n - this.currentAngs[i]) > 0.001)
        ) {
            this.animationFrame = requestAnimationFrame(() => this._animate(notes));
        }
    },

    _toLogNote(n, base) {
        return base + (base * Math.log2(n / base));
    },

    _toRelativeAng(ang, targetAng) {
        ang = (ang == null ? targetAng : ang);
        const D_ANG = (targetAng - ang) % PI2;
        return targetAng - (
            D_ANG > PI
                ? D_ANG - PI2
            : D_ANG < -PI
                ? D_ANG + PI2
                : D_ANG
        );
    }
};