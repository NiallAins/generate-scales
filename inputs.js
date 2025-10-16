const Inputs = {
    EL_INP_BASEF: document.getElementById('EL_INP_BASEF'),
    EL_INP_INTER: document.getElementById('EL_INP_INTER'),
    EL_INP_SCALE: document.getElementById('EL_INP_SCALE'),
    EL_INP_START: document.getElementById('EL_INP_START'),
    EL_INP_QUANT: document.getElementById('EL_INP_QUANT'),
    EL_TXT_BASEF: document.getElementById('EL_TXT_BASEF'),
    EL_TXT_INTER: document.getElementById('EL_TXT_INTER'),
    EL_TXT_SCALE: document.getElementById('EL_TXT_SCALE'),
    EL_TXT_START: document.getElementById('EL_TXT_START'),
    EL_TXT_QUANT: document.getElementById('EL_TXT_QUANT'),

    prevScale: INIT_SCALE,

    init() {
        // Apply range parameters
        this.EL_INP_BASEF.min  = BASEF_RANGE_MIN;
        this.EL_INP_BASEF.max  = BASEF_RANGE_MAX;
        this.EL_INP_INTER.min  = INTER_RANGE_MIN;
        this.EL_INP_INTER.max  = INTER_RANGE_MAX;
        this.EL_INP_INTER.step = INTER_RANGE_STEP;
        this.EL_INP_SCALE.min  = SCALE_RANGE_MIN;

        // Apply default values
        this.EL_INP_BASEF.value = INIT_BASEF;
        this.EL_INP_INTER.value = INIT_INTER;
        this.EL_INP_SCALE.value = INIT_SCALE;
        this.EL_INP_START.value = INIT_START;
        this.EL_INP_QUANT.value = INIT_QUANT;
        this.scaleRatio = INIT_SCALE / this._getOctaveLength(INIT_INTER);

        // Apply input listeners
        this.EL_INP_BASEF.oninput = () => this._update('basef');
        this.EL_INP_INTER.oninput = () => this._update('inter');
        this.EL_INP_SCALE.oninput = () => this._update('scale');
        this.EL_INP_START.oninput = () => this._update('start');
        this.EL_INP_QUANT.oninput = () => this._update('quant');

        // Position for mobile
        if (WIDTH.isSmallViewport) {
            console.log('hey');
            this.EL_INP_INTER.setAttribute('arc', INP_ARC_SMALL_VIEWPORT);
            this.EL_INP_INTER.setAttribute('angle', 0);
            this.EL_INP_START.setAttribute('arc', INP_ARC_SMALL_VIEWPORT);
            this.EL_INP_START.setAttribute('angle', 0);
        }

        this._update();
    },

    _update(type) {
        // Get values
        const
            BASEF_VALUE = this._getInputValue(this.EL_INP_BASEF),
            INTER_VALUE = this._getInputValue(this.EL_INP_INTER),
            CHROM_VALUE = this._getOctaveLength(INTER_VALUE);
        this.EL_INP_SCALE.max = CHROM_VALUE;
        if (type === 'inter') {
            this.EL_INP_SCALE.value = Math.min(this.prevScale, CHROM_VALUE);
            this.EL_INP_START.value = 0;
        }
        const SCALE_VALUE = this._getInputValue(this.EL_INP_SCALE);
        if (type === 'scale') {
            this.prevScale = SCALE_VALUE;
        }
        this.EL_INP_START.max = SCALE_VALUE - 1;
        const
            START_VALUE = this._getInputValue(this.EL_INP_START),
            QUANT_VALUE = this._getInputValue(this.EL_INP_QUANT);

        // Set labels
        this.EL_TXT_BASEF.innerText = BASEF_VALUE;
        this.EL_TXT_INTER.innerHTML = INTER_VALUE;
        this.EL_TXT_SCALE.innerText = SCALE_VALUE;
        this.EL_TXT_START.innerHTML =
            (START_VALUE + 1) +
            (
                  START_VALUE === 0 || START_VALUE === 20 ? '<sup>st</sup>'
                : START_VALUE === 1 || START_VALUE === 21 ? '<sup>nd</sup>'
                : START_VALUE === 2 || START_VALUE === 22 ? '<sup>rd</sup>'
                : '<sup>th</sup>'
            );
        this.EL_TXT_QUANT.innerHTML =
            (CHROM_VALUE < 10 ? '&numsp;' : '') +
            CHROM_VALUE.toString();

        // Set arc inputs' radius
        const RAD = Math.floor(
            Math.min(
                WIDTH.page,
                window.innerWidth
            ) * 0.242
        );
        this.EL_INP_INTER.setAttribute('radius', RAD);
        this.EL_INP_START.setAttribute('radius', RAD);

        // Update page
        Main.updateValues(
            BASEF_VALUE,
            INTER_VALUE,
            CHROM_VALUE,
            SCALE_VALUE,
            START_VALUE,
            QUANT_VALUE
        );
    },

    _getOctaveLength(interval) {
        if (interval % 1 === 0) {
            return 1;
        } else if (interval < 1.03 || interval > 1.95) {
            return CHROM_RANGE_MAX;
        }
        
        let
            min = Infinity,
            minI = 0;
        for (let i = 3; i <= CHROM_RANGE_MAX; i++) {
            let err = Math.log2(Math.pow(interval, i)) % 1;
            err = Math.min(err, 1 - err);
            if (err < min) {
                min = err;
                minI = i;
            }
        }
        
        return minI;
    },

    _getInputValue(input) {
        return input.type === 'checkbox' ? input.checked : parseFloat(input.value);
    }
}