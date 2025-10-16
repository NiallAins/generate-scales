const Main = {
    init() {
        ChartLine.init();
        ChartCirc.init();
        Keys.init();
        Inputs.init();
    },

    updateValues(basef, inter, chrom, scale, start, quant) {
        const NOTES = Notes.generate(
            basef,
            inter,
            chrom,
            scale,
            start,
            quant
        );

        ChartLine.render(
            NOTES.allNotes,
            scale,
            start
        );
        ChartCirc.render(
            NOTES.allNotes,
            NOTES.scaleSort,
            chrom,
            start
        );
        Keys.render(
            NOTES.chromModeSort,
            NOTES.scaleMode
        );
        Sound.updateNotes(
            NOTES.scaleModeSort,
            NOTES.chromModeSort
        );
    }
};

Main.init();