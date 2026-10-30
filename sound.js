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

    playNote(freq) {
        Tone.play({
            note: freq,
            sustain: TIMING.noteSustain
        });
    },

    playScale() {
        [ this.notesScale, this.notesChrom ].forEach((s, si) => {
            for (let i = 0; i < s.length; i++) {
                setTimeout(
                    () => {
                        Tone.play({
                            note: s[i],
                            sustain:  si
                                ? (i === s.length - 1 ? TIMING.noteSustain : TIMING.noteSustainChrom)
                                : 0
                        });
                    },
                    si
                        ? (this.notesScale.length * TIMING.noteSustainScale) + (i * TIMING.noteSustainChrom)
                        : i * TIMING.noteSustainScale
                );
            }
        });
    }
}