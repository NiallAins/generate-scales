(function() {
    class InputRangeArc {

        //
        // Public static readonly properties
        //

        static INPUTS = [];


        //
        // Private static readonly properties
        //

        static _CLASS_NAME = 'input-range-arc';
        static _COLOR_PARTS = {
            els:    ['track', 'fill', 'thumb'],
            types:  ['', 'border'],
            states: ['', 'hover', 'focus', 'active']
        };
        static _COLOR_DEFAULTS = {
            [this._getColorVarName(0, 0, 0)]: '#efefef',
            [this._getColorVarName(0, 0, 1)]: '#e8e8e8',
            [this._getColorVarName(0, 1, 0)]: '#b2b2b2',
            [this._getColorVarName(0, 1, 1)]: '#b0b0b0',
            [this._getColorVarName(1, 0, 0)]: '#0275ff',
            [this._getColorVarName(1, 0, 1)]: '#075fc7',
            outline: '#075fc7'
        };


        //
        // Private readonly properties
        //

        _ID;
        _INP;
        _SVG;
        _WIDTH = {
            track: 5,
            border: 1,
            thumb: 8,
            outline: 2,
            outlineOffset: 0
        };


        //
        // Public properties
        //

        mouseDrag = false;


        //
        // Private properties
        //

        _arc = Q2;
        _angle = Q2;
        _reverse = false;
        _min = 0;
        _max = 100;
        _step = 1;
        _ang0x = 0;
        _ang0y = 0;
        _ang1x = 0;
        _ang1y = 0;
        _pad = 0;
        _centerX = 0;
        _centerY = 0;


        //
        // Constructor
        //

        constructor(inp) {
            this._ID =
                inp.id ||
                (InputRangeArc._CLASS_NAME + '_' + Math.random().toString().substring(2));

            // DOM creation
            this._INP = inp;
            const CONTAINER = document.createElement('label');
            CONTAINER.classList.add(InputRangeArc._CLASS_NAME);
            CONTAINER.setAttribute('for', this._ID);
            inp.parentNode.insertBefore(CONTAINER, inp);

            inp.setAttribute('id', this._ID);
            inp.parentNode.removeChild(inp);
            CONTAINER.appendChild(inp);
            
            this._SVG = document.createElement('div');
            CONTAINER.appendChild(this._SVG);

            // Event listeners
            this._INP.addEventListener('input', () => this.updateValue());

            const ATTRS = [
                'arc', 'angle',
                'step', 'min', 'max', 'reverse'
            ];
            new MutationObserver(mArr => ATTRS
                    .filter(a => mArr.find(m => m.attributeName === a))
                    .forEach(a => this[a] = inp.getAttribute(a))
                )
                .observe(inp, { attributes: true })

            // Init
            InputRangeArc.INPUTS.push(this);
            ATTRS.forEach(a => this[a] = inp.getAttribute(a));
            this._updateCanvas();
        }


        //
        // Private static methods
        //

        static _getCssVar(style, name) {
            let value = style.getPropertyValue(name);
            const UNIT = (value.match(/[A-Za-z]+/) || [''])[0].toLowerCase();
            value = parseFloat(value);

            return Math.round(
                value *
                (UNIT === 'rem' || UNIT === 'em' ? 16 : UNIT === 'pt' ? 1.333 : 1)
            );
        }

        static _getColorVarName(el, type, state, wrap = false) {
            return (
                (wrap ? 'var(' : '') +
                '--' +
                [
                    typeof el === 'number' ? this._COLOR_PARTS.els[el] : el,
                    typeof type === 'number' ? this._COLOR_PARTS.types[type] : type,
                    typeof state === 'number' ? this._COLOR_PARTS.states[state] : state
                ].filter(s => s).join('-') +
                '-color' +
                (wrap ? ')' : '')
            );
        }


        //
        // Public static methods
        //

        static addGlobalStyles() {
            const STYLE = document.createElement('style');
            STYLE.innerHTML += `
                .${ this._CLASS_NAME } {
                    position: relative;
                    display: inline-block;
                    ${
                        this._COLOR_PARTS.els.reduce((str0, el, ei, eArr) => str0 +
                            this._COLOR_PARTS.types.reduce((str1, type, ti, tArr) => str1 +
                                this._COLOR_PARTS.states.reduce((str2, state, si, sArr) => str2 + `
                                    ${ this._getColorVarName(el, type, state) }: ${
                                        this._COLOR_DEFAULTS[this._getColorVarName(el, type, state)] || 
                                        this._getColorVarName(
                                            si === 0 && ti === 0 && ei === 2 ? eArr[ei - 1] : el,
                                            si === 0 ? tArr[ti - 1] : type,
                                            sArr[si - 1],
                                            true
                                        )
                                    };`
                                , '')
                            , '')
                        , '')
                    }
                    ${ this._getColorVarName('outline') }: ${ this._COLOR_DEFAULTS.outline };
                }

                .${ this._CLASS_NAME } input {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 1px;
                    height: 1px;
                    margin: 0;
                    opacity: 0;
                }

                .${ this._CLASS_NAME } svg {
                    box-sizing: border-box;
                    width: 100%;
                    overflow: visible;
                }

                .${ this._CLASS_NAME }__outline {
                    stroke: #00000000;
                }

                .${ this._CLASS_NAME } input:focus-visible + div .${ this._CLASS_NAME }__outline {
                    stroke: var(${ this._getColorVarName('outline') });
                }
                ${
                    this._COLOR_PARTS.els.reduce((str0, el, ei) => str0 +
                        this._COLOR_PARTS.types.reduce((str1, type) => str1 +
                            this._COLOR_PARTS.states.reduce((str2, state, si) => str2 + `
                                .${
                                    si ? `${ this._CLASS_NAME }__click-region:${ state } .` : ''
                                }${ this._CLASS_NAME }__${ el }${ type ? '-' : '' }${ type } {
                                    stroke: ${ this._getColorVarName(el, type, state, true) }
                                }`, '')
                        , '')
                    , '')
                }
            `.replace(/ {16}/g, '');
            document.head.prepend(STYLE);
        }

        static replaceRangeInputs() {
            Array
                .from(document.querySelectorAll(`
                    input[type=range][angle],
                    input[type=range][arc]
                `))
                .forEach(inp => new InputRangeArc(inp));
        }


        //
        // Setters
        //

        set min(value) {
            value = parseFloat(value);
            if (value !== this._min && (value || value === 0)) {
                this._min = value;
                this.updateValue();
            }
        }

        set max(value) {
            value = Math.max(parseFloat(value), this._min);
            if (value !== this._max && (value || value === 0)) {
                this._max = value;
                this.updateValue();
            }
        }

        set step(value) {
            value = parseFloat(value);
            if (value !== this._step && (value || value === 0)) {
                this._step = value;
                this.updateValue();
            }
        }

        set reverse(value) {
            value = !!value && value !== 'false';
            if (value !== this._reverse) {
                this._reverse = value;
                this.updateValue();
            }
        }

        set arc(value) {
            value = parseFloat(value) * DEG_TO_RAD;
            if (value < 0) {
                value = Q4 - value;
            }
            value = Math.min(Q4 * 0.9875, Math.max(0.125, value));
            if (value !== this._arc && (value || value === 0)) {
                this._angle = ((
                    this._angle +
                    ((this._arc - value) * 0.5)
                ) + Q4) % Q4;
                this._arc = value;
                this._updateCanvas();
            }
        }

        set angle(value) {
            value = ((
                (parseFloat(value) * DEG_TO_RAD) -
                Q1 -
                (this._arc * 0.5)
            ) + Q4) % Q4;
            
            if (value !== this._angle && (value || value === 0)) {
                this._angle = value;
                this._updateCanvas();
            }
        }


        //
        // Private methods
        //

        _updateCanvas() {
            const
                VARS = getComputedStyle(this._INP),
                W_TRACK           = InputRangeArc._getCssVar(VARS, '--track-width'   ),
                W_BORDER          = InputRangeArc._getCssVar(VARS, '--border-width'  ) * 0.5,
                W_THUMB           = InputRangeArc._getCssVar(VARS, '--thumb-width'   ) * 0.5,
                W_OUTLINE         = InputRangeArc._getCssVar(VARS, '--outline-width' ),
                W_OUTLINE_OFFSET  = InputRangeArc._getCssVar(VARS, '--outline-offset');

            this._WIDTH.track          = W_TRACK          || W_TRACK          === 0 ? W_TRACK          : this._WIDTH.track;
            this._WIDTH.border         = W_BORDER         || W_BORDER         === 0 ? W_BORDER         : this._WIDTH.border;
            this._WIDTH.thumb          = W_THUMB          || W_THUMB          === 0 ? W_THUMB          : this._WIDTH.thumb;
            this._WIDTH.outline        = W_OUTLINE        || W_OUTLINE        === 0 ? W_OUTLINE        : this._WIDTH.outline;
            this._WIDTH.outlineOffset  = W_OUTLINE_OFFSET || W_OUTLINE_OFFSET === 0 ? W_OUTLINE_OFFSET : this._WIDTH.outlineOffset;

            const
                ANG_1 = this._angle + this._arc,
                ANG_0_X = Math.cos(this._angle),
                ANG_0_Y = Math.sin(this._angle),
                ANG_1_X = Math.cos(ANG_1),
                ANG_1_Y = Math.sin(ANG_1),
                ANG_MIN_X = Math.min(ANG_0_X, ANG_1_X),
                ANG_MAX_X = Math.max(ANG_0_X, ANG_1_X),
                ANG_MIN_Y = Math.min(ANG_0_Y, ANG_1_Y),
                ANG_MAX_Y = Math.max(ANG_0_Y, ANG_1_Y),
                MIN_X = ((this._angle < Q2 && ANG_1 > Q2) || (ANG_1 > Q2 + Q4) ? -1 : ANG_MIN_X),
                MAX_X = ((this._angle < Q4 && ANG_1 > Q4) || (ANG_1 > Q4 + Q4) ?  1 : ANG_MAX_X),
                MIN_Y = ((this._angle < Q3 && ANG_1 > Q3) || (ANG_1 > Q3 + Q4) ? -1 : ANG_MIN_Y),
                MAX_Y = ((this._angle < Q1 && ANG_1 > Q1) || (ANG_1 > Q1 + Q4) ?  1 : ANG_MAX_Y),
                WIDTH = MAX_X - MIN_X,
                HEIGHT = MAX_Y - MIN_Y;

            this._pad = this._WIDTH.thumb + this._WIDTH.outline + this._WIDTH.outlineOffset;
            this._centerX = MIN_X / WIDTH;
            this._centerY = MIN_Y / HEIGHT;
            this._ang0x = ANG_0_X;
            this._ang0y = ANG_0_Y;
            this._ang1x = ANG_1_X;
            this._ang1y = ANG_1_Y;

            this._SVG.innerHTML = `
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    style="padding: ${ this._pad }px"
                    viewBox="${ MIN_X } ${ MIN_Y } ${ WIDTH } ${ HEIGHT }"
                >
                    <g class="${ InputRangeArc._CLASS_NAME }__click-region">
                        <g style="cursor: pointer">
                            ${
                                this._renderArc(
                                    this._arc,
                                    'track',
                                    false,
                                    true
                                )
                            }
                        </g>
                        <g style="pointer-events: none"></g>
                    </g>
                </svg>
            `;

            const MOUSE_GROUP = this._SVG.children[0].children[0];
            MOUSE_GROUP.addEventListener('mousedown', e => {
                this.mouseDrag = true;
                this.onMouseMove(e);
            });
            MOUSE_GROUP.addEventListener('mouseup', e => {
                this.mouseDrag = false;
            });

            this.updateValue();
        }
        

        _renderArc(ang, className, reverse = false, addClickRegion = false) {
            const
                X0 = reverse ? this._ang1x : this._ang0x,
                Y0 = reverse ? this._ang1y : this._ang0y,
                X1 = Math.cos(this._angle + ang),
                Y1 = Math.sin(this._angle + ang);

            let svg = '';

            for (let i = 0; i < 2; i++) {
                svg += `<path
                    class="${ InputRangeArc._CLASS_NAME }__${ className + (i ? '' : '-border') }"
                    d="
                        M ${ X0 } ${ Y0 }
                        A 1 1 0
                        ${ ang > Q2 ? 1 : 0 } ${ reverse ? 0 : 1 }
                        ${ X1 } ${ Y1 }
                    "
                    stroke-width="${ this._WIDTH.track + (i ? 0 : this._WIDTH.border * 2) }"
                    stroke-linecap="round"
                    fill="none"
                    vector-effect="non-scaling-stroke"
                />`;
            }

            if (addClickRegion) {
                const
                    REGION_W = Math.max(
                        this._WIDTH.thumb * 2,
                        this._WIDTH.track + (this._WIDTH.border * 2)
                    ),
                    OUTLINE_W =
                        REGION_W +
                        (this._WIDTH.outlineOffset * 2);

                // Focus outline
                svg += `
                    <defs>
                        <mask id="${ this._ID }__outline">
                            <rect
                                x="-1.25"
                                y="-1.25"
                                width="2.5"
                                height="2.5"
                                fill="white"
                            />
                            <path
                                d="
                                    M ${ X0 } ${ Y0 }
                                    A 1 1 0
                                    ${ ang > Q2 ? 1 : 0 } 1
                                    ${ X1 } ${ Y1 }
                                "
                                stroke-width="${ OUTLINE_W }"
                                stroke-linejoin="round"
                                stroke-linecap="round"
                                stroke="black"
                                fill="none"
                                vector-effect="non-scaling-stroke"
                            />
                        </mask>
                    </defs>
                    <path
                        class="${ InputRangeArc._CLASS_NAME }__outline"
                        style="pointer-events: none"
                        d="
                            M ${ X0 } ${ Y0 }
                            A 1 1 0
                            ${ ang > Q2 ? 1 : 0 } 1
                            ${ X1 } ${ Y1 }
                        "
                        stroke-width="${ OUTLINE_W + (this._WIDTH.outline * 2) }"
                        stroke-linejoin="round"
                        stroke-linecap="round"
                        fill="none"
                        vector-effect="non-scaling-stroke"
                        mask="url(#${ this._ID }__outline)"
                    />
                `;

                // Click region
                svg += `<path
                    d="
                        M ${ X0 } ${ Y0 }
                        A 1 1 0
                        ${ ang > Q2 ? 1 : 0 } 1
                        ${ X1 } ${ Y1 }
                    "
                    stroke-width="${ REGION_W }"
                    stroke="#ffffff00"
                    stroke-linecap="round"
                    fill="none"
                    vector-effect="non-scaling-stroke"
                />`;
            }

            return svg;
        }


        //
        // Public methods
        //

        onMouseMove(mouseEvent) {
            const BOX = this._SVG.getBoundingClientRect();

            let angValue =
                this._angle -
                Math.atan2(
                    mouseEvent.clientY - BOX.top  - this._pad + (this._centerY * (BOX.height - (this._pad * 2))),
                    mouseEvent.clientX - BOX.left - this._pad + (this._centerX * (BOX.width  - (this._pad * 2)))
                );
            angValue = Q4 - ((angValue + Q4) % Q4);
            angValue =
                  angValue > (this._arc + Q4) *  0.5 ? 0
                : angValue > this._arc               ? this._arc
                : angValue < (Q4 - this._arc) * -0.5 ? this._arc
                : angValue < 0                       ? 0
                : angValue;

            const
                VALUE_ABS = ((angValue / this._arc) * (this._max - this._min)),
                VALUE = Math.max(this._min, Math.min(this._max,
                    this._min + (Math.round(VALUE_ABS / this._step) * this._step)
                )),
                PREV_VALUE = parseFloat(this._INP.value),
                NEXT_VALUE = this._reverse ? this._max - (VALUE - this._min) : VALUE;

            if (NEXT_VALUE !== PREV_VALUE) {
                this._INP.value = NEXT_VALUE;
                this._INP.dispatchEvent(new Event('input'));
            }
        }

        updateValue() {
            const
                VALUE_ABS = parseFloat(this._INP.value),
                VALUE = this._reverse ? this._max - (VALUE_ABS - this._min) : VALUE_ABS,
                ANG = this._arc * ((VALUE - this._min) / (this._max - this._min)),
                ANG_V_X = Math.cos(this._angle + ANG),
                ANG_V_Y = Math.sin(this._angle + ANG),
                EL_SVG = this._SVG.children[0].children[0];

            EL_SVG.children[EL_SVG.children.length - 1].innerHTML =
                this._renderArc(
                    ANG,
                    'fill',
                    this._reverse
                ) +
                `<path
                    class="${ InputRangeArc._CLASS_NAME }__thumb"
                    d="
                        M ${ ANG_V_X } ${ ANG_V_Y }
                        L ${ ANG_V_X } ${ ANG_V_Y }
                    "
                    stroke-width="${ this._WIDTH.thumb * 2 }"
                    stroke-linecap="round"
                    vector-effect="non-scaling-stroke"
                />`;
        }
    }


    //
    // Helper values
    //

    const
        Q1 = Math.PI * 0.5,
        Q2 = Math.PI * 1,
        Q3 = Math.PI * 1.5,
        Q4 = Math.PI * 2,
        DEG_TO_RAD = Math.PI / 180;


    //
    // Page event listeners
    //

    window.addEventListener('load', () => {
        InputRangeArc.addGlobalStyles();
        InputRangeArc.replaceRangeInputs();
    });
    document.body.addEventListener('mouseup', () => {
        InputRangeArc.INPUTS.forEach(inp => inp.mouseDrag = false);
    });
    document.body.addEventListener('mouseleave', () => {
        InputRangeArc.INPUTS.forEach(inp => inp.mouseDrag = false);
    });
    document.body.addEventListener('mousemove', e => {
        InputRangeArc.INPUTS
            .filter(inp => inp.mouseDrag)
            .forEach(inp => inp.onMouseMove(e));
    });
})();