const Keys = {
    EL_KEYS: document.getElementById('EL_KEYS'),
    shortcuts: [],

    init() {
        window.addEventListener(
            'keydown',
            event => {
                const SC = this.shortcuts.find(s => s.code === event.code);
                if (!event.repeat && SC) {
                    Sound.playNote(SC.freq);
                    const
                        KEY = this.EL_KEYS.querySelector('.keys__key--' + SC.code),
                        CLASS = 'keys__key--active';
                    KEY.classList.add(CLASS);
                    setTimeout(
                        () => KEY.classList.remove(CLASS),
                        TIMING.noteSustain - TIMING.animationFade
                    );
                }
            }
        );
    },

    render(notes, mode) {
        const SCALE_LENGTH = notes.length;
        notes = [
            ...notes,
            {
                ...notes[0],
                freq: notes[0].freq * 2
            }
        ];

        this.shortcuts = this._generateShortcuts(notes);

        const WIDTH = 100 / notes.filter(n => !n.flat).length;
        let flatX = -0.5;

        this.EL_KEYS.innerHTML = notes
            .reduce((htm, n, i, nArr) => {
                flatX += n.flat ? 0 : 1;
                return htm + `
                    ${ n.flat && (i === 0 || !nArr[i - 1].flat) ? `
                        <div
                            class="keys__flat-container"
                            style="
                                left: ${ flatX * WIDTH }%;
                                width: ${ WIDTH }%;
                            "
                        >
                    ` : '' }
                    <button
                        class="
                            keys__key
                            ${ n.flat ? 'keys__key--flat' : '' }
                            keys__key--${ this.shortcuts[i]?.code || 'none' }
                        "
                        onclick="Sound.playNote(${ n.freq })"
                        ${ n.flat ? '' : `style="
                            --c-hover: ${ getColor(
                                mode.findIndex(s =>s.freq === nArr[i % SCALE_LENGTH].freq),
                                mode.length + 1,
                                false,
                                true
                            ) };
                            width: ${ WIDTH }%;
                        "` }
                    >
                        <span class="keys__key-label">
                            <span class="keys__key-label--shortcut">
                                ${ this.shortcuts[i]?.label || '' }
                            </span>
                            <span class="keys__key-label--note">
                                ${ n.flat ? '' : n.labelNote }
                            </span>
                        </span>
                    </button>
                    ${ n.flat && (i === nArr.length - 1 || !nArr[i + 1].flat) ? `
                        </div>
                    ` : '' }
                `;
            }, '');
    },

    toggleShortcuts() {
        this.EL_KEYS.classList.toggle('keys--shortcuts');
    },

    _generateShortcuts(notes) {
        const
            FLAT_COUNT = notes.filter(n => n.flat).length,
            SCALE_COUNT = notes.length - FLAT_COUNT,
            KEYS = [
                '234567890',
                'QWERTYUIOP1',
                'ASDFGHJKL',
                'ZXCVBNM'
            ];

        // Top two rows for flat and sharps, no overlapping
        let
            ni = 0,
            i = -1,
            shortcuts = [];
        for (let r = 0; r < 2; r++) {
            for (; ni < notes.length; ni++) {
                i += !notes[ni].flat || notes[ni - 1].flat ? 1 : 0;
                const KEY = notes[ni].flat ? KEYS[r][i] : KEYS[r + 1][i];
                if (!KEY) {
                    break;
                }
                shortcuts.push({
                    code: (KEY.match(/[0-9]/) ? 'Digit' : 'Key') + KEY,
                    label: KEY,
                    freq: notes[ni].freq
                });
            }
        }
        if (ni === notes.length) {
            return shortcuts;
        }

        // Overlapping required
        let
            scaleKeys = [],
            flatKeys = [],
            flatStart;

        // Find rows for scale keys
        if (SCALE_COUNT < KEYS[1].length && FLAT_COUNT < KEYS[0].length) {
            flatStart = 0;
            scaleKeys = KEYS[1];
        } else if (SCALE_COUNT < KEYS[2].length && FLAT_COUNT < KEYS[0].length + KEYS[1].length) {
            flatStart = 1;
            scaleKeys = KEYS[2];
        } else if (SCALE_COUNT < KEYS[3].length) {
            flatStart = 2;
            scaleKeys = KEYS[3];
        } else if (SCALE_COUNT < KEYS[2].length + KEYS[3].length) {
            flatStart = 1;
            for (let k = 0; k < KEYS[2].length; k++) {
                scaleKeys.push(
                    ...[
                        KEYS[2][k],
                        KEYS[3][k]
                    ].filter(k => k)
                );
            }
        } else {
            flatStart = 0;
            for (let k = 0; k < KEYS[1].length; k++) {
                scaleKeys.push(
                    ...[
                        KEYS[1][k],
                        KEYS[2][k],
                        KEYS[3][k],
                    ].filter(k => k)
                );
            }
        }

        // Find rows for flat keys
        if (FLAT_COUNT < KEYS[flatStart].length) {
            flatKeys = KEYS[flatStart]
        } else if (flatStart > 0 && FLAT_COUNT < KEYS[flatStart - 1].length + KEYS[flatStart].length) {
            for (let k = 0; k < Math.max(KEYS[flatStart].length, KEYS[flatStart - 1].length); k++) {
                flatKeys.push(
                    ...[
                        KEYS[flatStart][k],
                        KEYS[flatStart - 1][k]
                    ].filter(k => k)
                );
            }
        } else {
            for (let k = 0; k < KEYS[1].length; k++) {
                flatKeys.push(
                    ...[
                        KEYS[1][k],
                        KEYS[2][k],
                        KEYS[0][k],
                    ].filter(k => k)
                );
            }
        }

        // Apply keys
        let
            fi = 0,
            si = 0;
        return notes.map(n => {
            const KEY = n.flat ? flatKeys[fi] : scaleKeys[si];
            n.flat ? fi += 1 : si += 1;
            return {
                code: (KEY.match(/[0-9]/) ? 'Digit' : 'Key') + KEY,
                label: KEY,
                freq: n.freq
            };
        })
    }
}