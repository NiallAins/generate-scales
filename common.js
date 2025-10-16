const
    PI = Math.PI,
    PI2 = PI * 2,
    PIH = PI * 0.5;

const TEXT = {
    standardPitch: 'Standard Pitch A',
    hzSuffix: ' Hz'
};;

const
    _CSS_VARS = getComputedStyle(document.body),
    _REM_BASE = parseInt(_CSS_VARS.getPropertyValue('--w-rem-base')),
    _PAGE_PAD = _cssVarToNum('w-page-pad');

const WIDTH = {
    isSmallViewport: window.innerWidth < _cssVarToNum('w-page--sm'),

    page: Math.min(
        window.innerWidth - (_PAGE_PAD * 2),
        _cssVarToNum('w-page')
    ),
    pageMax: _cssVarToNum('w-page'),
    canPad: 16,
    ptRad: 7,
    ptRadStart: 10,
    chartFont: _cssVarToNum('f-size--sm'),

    chartLine_height: 200,
    chartLine_textY: 20,
    chartLine_tickHeight: 5,
    chartLine_axisStroke: 3,
    chartLine_arcStroke: 2,
    chartLine_arcHeightMin: 0.1,

    chartCirc_scaleStroke: 4,
    chartCirc_shapeStroke: 1,
    chartCirc_flatStroke: 3,
    chartCirc_circRad: 0.9,
    chartCirc_textR: 30,

    caret: 8,
    caretY: -34
};

const TIMING = {
    tdt: 16.66,
    animationFade: _cssVarToNum('t-fade', false),
    animationEase: 14,
    noteSustain: 600,
    noteSustainScale: 400,
    noteSustainChrom: 120
};

const COLOR = {
    axis:   _cssVar('c-text'),
    text:   _cssVar('c-text'),
    text_l: _cssVar('c-text--l'),
    bg:     _cssVar('c-bg'),
    flat: '#f0f0f0',
};

const
    FONT_FAMILY = 'Helvetica',
    FONT = {
        chartLabel: WIDTH.chartFont + 'px ' + FONT_FAMILY
    };

const
    INIT_BASEF = 348,
    INIT_INTER = 1.5,
    INIT_SCALE = 7,
    INIT_START = 2,
    INIT_QUANT = false,
    CHROM_RANGE_MAX  = 26,
    BASEF_RANGE_MIN  = 100,
    BASEF_RANGE_MAX  = 700,
    INTER_RANGE_MIN  = 1.03,
    INTER_RANGE_MAX  = 1.95,
    INTER_RANGE_STEP = 0.01,
    SCALE_RANGE_MIN  = 1,
    INP_ARC_SMALL_VIEWPORT = 40;

const
    STANDARD_A = 440,
    D_FREQ = WIDTH.isSmallViewport ? 100 : 50;

function _cssVarToNum(name, isRem = true) {
    return parseFloat(_CSS_VARS.getPropertyValue('--' + name)) * (isRem ? _REM_BASE : 1);
}

function _cssVar(name) {
    return _CSS_VARS.getPropertyValue('--' + name);
}

function getColor(i, length, opaque = false, light = false) {
    return `hsl(${
        Math.floor(
            120 +
            (
                340 *
                ((i % length)  / length)
            )
        )
    }deg, 100%, ${ light ? 85 : 50 }%, ${ opaque ? 1 : 0.7 })`;
}
