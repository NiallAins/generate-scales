const Sound = {
    CTX: new AudioContext(),
    notesScale: [],
    notesChrom: [],
    activeNotes: [],
    queuedNotes: [],

    updateNotes(scale, chrom) {
        this.notesScale = scale.map(n => n.freq);
        this.notesChrom = chrom.map(n => n.freq);
        this.notesScale.push(this.notesScale[0] * 2);
        this.notesChrom.push(this.notesChrom[0] * 2);
    },

    playNote() {
        this._stop();
        this._playNote(...arguments);
    },

    _playNote(freq, duration = TIMING.noteSustain, delay = 0) {
        const
            OSC = this.CTX.createOscillator(),
            GAIN = this.CTX.createGain(),
            NOTE = [OSC, GAIN];
        OSC.type = 'sine';
        OSC.frequency.value = freq * 0.5;
        OSC.connect(GAIN);
        GAIN.connect(this.CTX.destination);

        this.queuedNotes.push(
            setTimeout(
                () => {
                    OSC.start(this.CTX.currentTime);
                    this.activeNotes.push(NOTE);
                    this.activeNotes.forEach(n => n[1].gain.value = 1 / this.activeNotes.length);
                },
                delay
            )
        );
        setTimeout(
            () => {
                const NI = this.activeNotes.indexOf(NOTE);
                if (NI !== -1) {
                    this.activeNotes[NI][0].stop();
                    this.activeNotes.splice(1, NI);
                }
            },
            delay + duration
        );
        for (let i = 0; i < 10; i++) {
            setTimeout(
                () => GAIN.gain.value *= 0.8,
                delay + duration - (i * 15)
            )
        }
    },


    playScale() {
        this._stop();
        [ this.notesScale, this.notesChrom ].forEach((s, si) => {
            for (let i = 0; i < s.length; i++) {
                this._playNote(
                    s[i],
                    si
                        ? (i === s.length - 1 ? TIMING.noteSustain : TIMING.noteSustainChrom)
                        : TIMING.noteSustainScale,
                    si
                        ? (this.notesScale.length * TIMING.noteSustainScale) + (i * TIMING.noteSustainChrom)
                        : i * TIMING.noteSustainScale
                );
            };
        });
    },

    _stop() {
        this.activeNotes.forEach(n => n[0].stop());
        this.queuedNotes.forEach(i => clearTimeout(i));
        this.activeNotes = [];
        this.queuedNotes = [];
    }
}