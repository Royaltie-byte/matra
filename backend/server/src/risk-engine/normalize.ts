// text normalization function through stripping punctuation, lower-casing, whitespace removal

export const normalizeText = (rawText: string): string => {
    return rawText
        .toLowerCase()
        .replace(/['’]/g, "")      // drop apostrophes entirely: "can't" -> "cant" (not "can t")
        .replace(/[^\w\s]/g, " ")  // replace remaining punctuation with a space
        .replace(/\s+/g, " ")
        .trim();
};