const UNDEFINED_CODE_POINTS = new Set([
    0xff_fe, 0xff_ff, 0x1_ff_fe, 0x1_ff_ff, 0x2_ff_fe, 0x2_ff_ff, 0x3_ff_fe, 0x3_ff_ff, 0x4_ff_fe, 0x4_ff_ff, 0x5_ff_fe,
    0x5_ff_ff, 0x6_ff_fe, 0x6_ff_ff, 0x7_ff_fe, 0x7_ff_ff, 0x8_ff_fe, 0x8_ff_ff, 0x9_ff_fe, 0x9_ff_ff, 0xa_ff_fe,
    0xa_ff_ff, 0xb_ff_fe, 0xb_ff_ff, 0xc_ff_fe, 0xc_ff_ff, 0xd_ff_fe, 0xd_ff_ff, 0xe_ff_fe, 0xe_ff_ff, 0xf_ff_fe,
    0xf_ff_ff, 0x10_ff_fe, 0x10_ff_ff,
]);

export const REPLACEMENT_CHARACTER = '\uFFFD';

export const CODE_POINTS = {
    EOF: -1,
    NULL: 0x00,
    TABULATION: 0x09,
    CARRIAGE_RETURN: 0x0d,
    LINE_FEED: 0x0a,
    FORM_FEED: 0x0c,
    SPACE: 0x20,
    EXCLAMATION_MARK: 0x21,
    QUOTATION_MARK: 0x22,
    NUMBER_SIGN: 0x23,
    AMPERSAND: 0x26,
    APOSTROPHE: 0x27,
    HYPHEN_MINUS: 0x2d,
    SOLIDUS: 0x2f,
    DIGIT_0: 0x30,
    DIGIT_9: 0x39,
    SEMICOLON: 0x3b,
    LESS_THAN_SIGN: 0x3c,
    EQUALS_SIGN: 0x3d,
    GREATER_THAN_SIGN: 0x3e,
    QUESTION_MARK: 0x3f,
    LATIN_CAPITAL_A: 0x41,
    LATIN_CAPITAL_F: 0x46,
    LATIN_CAPITAL_X: 0x58,
    LATIN_CAPITAL_Z: 0x5a,
    RIGHT_SQUARE_BRACKET: 0x5d,
    GRAVE_ACCENT: 0x60,
    LATIN_SMALL_A: 0x61,
    LATIN_SMALL_F: 0x66,
    LATIN_SMALL_X: 0x78,
    LATIN_SMALL_Z: 0x7a,
    REPLACEMENT_CHARACTER: 0xff_fd,
};

export const CODE_POINT_SEQUENCES = {
    DASH_DASH_STRING: [0x2d, 0x2d], //--
    DOCTYPE_STRING: [0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45], //DOCTYPE
    CDATA_START_STRING: [0x5b, 0x43, 0x44, 0x41, 0x54, 0x41, 0x5b], //[CDATA[
    SCRIPT_STRING: [0x73, 0x63, 0x72, 0x69, 0x70, 0x74], //script
    PUBLIC_STRING: [0x50, 0x55, 0x42, 0x4c, 0x49, 0x43], //PUBLIC
    SYSTEM_STRING: [0x53, 0x59, 0x53, 0x54, 0x45, 0x4d], //SYSTEM
};

//Surrogates
export function isSurrogate(cp) {
    return cp >= 0xd8_00 && cp <= 0xdf_ff;
}

export function isSurrogatePair(cp) {
    return cp >= 0xdc_00 && cp <= 0xdf_ff;
}

export function getSurrogatePairCodePoint(cp1, cp2) {
    return (cp1 - 0xd8_00) * 0x4_00 + 0x24_00 + cp2;
}

//NOTE: excluding NULL and ASCII whitespace
export function isControlCodePoint(cp) {
    return (
        (cp !== 0x20 && cp !== 0x0a && cp !== 0x0d && cp !== 0x09 && cp !== 0x0c && cp >= 0x01 && cp <= 0x1f) ||
        (cp >= 0x7f && cp <= 0x9f)
    );
}

export function isUndefinedCodePoint(cp) {
    return (cp >= 0xfd_d0 && cp <= 0xfd_ef) || UNDEFINED_CODE_POINTS.has(cp);
}
