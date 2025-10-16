const Notes = {
    generate(base, interval, chromLength, scaleLength, mode, quantise) {
        // Generate notes
        let allNotes = [];
        for (let i = 0; i <= CHROM_RANGE_MAX; i++) {
            allNotes.push(i ? allNotes[i - 1] * interval : base);
        }

        // Normalise to octave
        allNotes = allNotes.map(n => {
            while (n >= allNotes[0] * 2) {
                n *= 0.5;
            }
            return n;
        });

        // Apply quantisation
        if (quantise) {
            const
                QUANT_INTER = Math.pow(2, 1 / chromLength),
                QUANT_NOTES = new Array(chromLength).fill(base);
            for (let i = 1; i < QUANT_NOTES.length; i++) {
                QUANT_NOTES[i] = QUANT_NOTES[i - 1] * QUANT_INTER;
            }
            allNotes = allNotes.map(n => {
                let
                    minD = Infinity,
                    minI = 0;
                QUANT_NOTES.forEach((qn, qi) => {
                    const DIFF = Math.abs(qn - n);
                    if (DIFF < minD) {
                        minD = DIFF;
                        minI = qi;
                    }
                });
                return QUANT_NOTES[minI];
            });
        }

        // Add labels
        allNotes = this._applyLabels(allNotes, scaleLength, chromLength);

        let
            chrom = allNotes.slice(0, chromLength),
            scale = chrom.slice(0, scaleLength),
            scaleSort = scale
                .map(n => n)
                .sort((a, b) => a.freq - b.freq);

        // Apply mode
        const OFFSET_FREQ = scaleSort[mode].freq;
        let
            chromMode = chrom.map(n => ({
                ...n,
                freq: n.freq < OFFSET_FREQ ? n.freq * 2 : n.freq
            })),
            scaleMode = chromMode.slice(0, scaleLength),
            chromModeSort = chromMode
                .map(n => n)
                .sort((a, b) => a.freq - b.freq),
            scaleModeSort = scaleMode
                .map(n => n)
                .sort((a, b) => a.freq - b.freq);

        chromMode = chromMode
            .slice(0, mode)
            .concat(
                chromMode.slice(mode)
            );
        scaleMode = scaleMode
            .slice(0, mode)
            .concat(
                scaleMode.slice(mode)
            );

        return {
            allNotes,
            scaleMode,
            scaleSort,
            scaleModeSort,
            chromModeSort
        };
    },

    _applyLabels(notes, scaleLength, chromLength) {
        const INIT_NOTES = notes.map(n => n);

        let
            l = 0,
            s = 0;
            labels = notes
                .slice(0, chromLength)
                .map((n, i) => i < scaleLength ? [true, n] : [false, n])
                .sort((a, b) => a[1] - b[1])
                .map(n => {
                    if (n[0]) {
                        l += 1;
                        s = 0;
                        n[0] = String.fromCharCode(((l + 4) % scaleLength) + 65);
                    } else {
                        s += 1;
                        n[0] =
                            String.fromCharCode(((l + 4) % scaleLength) + 65) +
                            (new Array(s).fill('#').join(''));
                    }
                    return n;
                });
        labels.push(labels[0]);

        // Convert some sharps to flats, if too many
        for (let i = 1; i < labels.length; i++) {
            if (labels[i][0].length === 1 && labels[i - 1][0].length > 2) {
                const INTER = Math.floor((labels[i - 1][0].length - 1) * 0.5);
                for (let j = 1; j <= INTER; j++) {
                    labels[i - j][0] = labels[i][0][0] + (new Array(j).fill('b').join(''));
                }
            }
        }

        labels.pop();

        // Apply superscript notation if too many sharps
        if (labels.some(l => l[0].length > 4)) {
            labels = labels.map(l => [
                l[0].length > 2
                    ?
                        l[0].substring(0, 2) +
                        (l[0].length - 1)
                            .toString()
                            .split('')
                            .map(n => ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'][parseInt(n)])
                            .join('')
                    : l[0],
                l[1]
            ])
        }

        return INIT_NOTES.map((n, i) => {
            const LABEL = labels.find(l => l[1] === n);
            return {
                freq: n,
                flat: i >= scaleLength,
                labelFreq: Math.round(n) + TEXT.hzSuffix,
                labelNote: LABEL ? LABEL[0] : ''
            }
        });
    }
}