/**
 * Shared display utilities for consistency across the dashboard pages.
 * These functions match the behavior of the homepage results-display component exactly.
 */

/** Cap displayed confidence at 99 — purely visual, backend value unchanged. */
export function capDisplayConfidence(raw: number): number {
    return Math.min(Math.round(raw), 99);
}

/** Map a displayed confidence value to a human label. */
export function confidenceLevelLabel(pct: number): { label: string; color: string } {
    if (pct >= 99) return { label: "Exceptional", color: "text-emerald-600 dark:text-emerald-400" };
    if (pct >= 95) return { label: "Very High", color: "text-green-600 dark:text-green-400" };
    if (pct >= 90) return { label: "High", color: "text-green-500 dark:text-green-300" };
    if (pct >= 70) return { label: "Moderate", color: "text-yellow-600 dark:text-yellow-400" };
    return { label: "Low", color: "text-red-500 dark:text-red-400" };
}

/** Standardized verdict extraction */
export function getStandardizedVerdict(rawVerdict: string | undefined): "REAL" | "FAKE" | "NEEDS VERIFICATION" {
    const v = (rawVerdict || "").toUpperCase();
    if (["REAL", "TRUE", "MOSTLY TRUE", "VERIFIED"].includes(v)) return "REAL";
    if (["FAKE", "FALSE", "MISLEADING", "PANTS ON FIRE"].includes(v)) return "FAKE";
    return "NEEDS VERIFICATION";
}

/** Hostname → friendly display label (domain-keyed). */
const SOURCE_LABEL_MAP: Record<string, string> = {
    // Google infrastructure
    "vertexaisearch.cloud.google.com": "Google Search",
    "googleapis.com": "Google APIs",
    "google.com": "Google",
    "googleblog.com": "Google Blog",
    // Encyclopaedias / fact-checkers
    "wikipedia.org": "Wikipedia",
    "britannica.com": "Britannica",
    "snopes.com": "Snopes",
    "politifact.com": "PolitiFact",
    "factcheck.org": "FactCheck.org",
    "fullfact.org": "Full Fact",
    "africacheck.org": "Africa Check",
    // Major international news
    "theguardian.com": "The Guardian",
    "bbc.com": "BBC News",
    "bbc.co.uk": "BBC News",
    "reuters.com": "Reuters",
    "apnews.com": "AP News",
    "nytimes.com": "New York Times",
    "washingtonpost.com": "Washington Post",
    "aljazeera.com": "Al Jazeera",
    "bloomberg.com": "Bloomberg",
    "forbes.com": "Forbes",
    "cnn.com": "CNN",
    "foxnews.com": "Fox News",
    "abc.net.au": "ABC News",
    "abc.com": "ABC News",
    "nbcnews.com": "NBC News",
    "cbsnews.com": "CBS News",
    "msnbc.com": "MSNBC",
    "npr.org": "NPR",
    "vox.com": "Vox",
    "theatlantic.com": "The Atlantic",
    "economist.com": "The Economist",
    "ft.com": "Financial Times",
    "wsj.com": "Wall Street Journal",
    "usatoday.com": "USA Today",
    "latimes.com": "Los Angeles Times",
    "time.com": "TIME",
    "newsweek.com": "Newsweek",
    "vice.com": "VICE",
    "buzzfeed.com": "BuzzFeed News",
    "buzzfeednews.com": "BuzzFeed News",
    // Indian news
    "timesofindia.indiatimes.com": "Times of India",
    "hindustantimes.com": "Hindustan Times",
    "ndtv.com": "NDTV",
    "thehindu.com": "The Hindu",
    "indianexpress.com": "Indian Express",
    "indiatoday.in": "India Today",
    "pib.gov.in": "Press Information Bureau",
    "ani.in": "ANI",
    "theprint.in": "The Print",
    "thewire.in": "The Wire",
    // Science / space
    "nasa.gov": "NASA",
    "esa.int": "ESA",
    "space.com": "Space.com",
    "nature.com": "Nature",
    "science.org": "Science",
    "sciencedaily.com": "Science Daily",
    "newscientist.com": "New Scientist",
    "scientificamerican.com": "Scientific American",
    "nationalgeographic.com": "National Geographic",
    "smithsonianmag.com": "Smithsonian",
    "livescience.com": "Live Science",
    "phys.org": "Phys.org",
    "isls.org": "ISLS",
    "ncse.ngo": "National Center for Science Education",
    "noaa.gov": "NOAA",
    "unimelb.edu.au": "University of Melbourne",
    // Health
    "who.int": "WHO",
    "cdc.gov": "CDC",
    "nih.gov": "NIH",
    "mayoclinic.org": "Mayo Clinic",
    "webmd.com": "WebMD",
    "healthline.com": "Healthline",
    "medicalnewstoday.com": "Medical News Today",
    // Tech
    "cnet.com": "CNET",
    "techcrunch.com": "TechCrunch",
    "theverge.com": "The Verge",
    "arstechnica.com": "Ars Technica",
    "wired.com": "Wired",
    "zdnet.com": "ZDNet",
    "engadget.com": "Engadget",
    "gizmodo.com": "Gizmodo",
    "hothardware.com": "HotHardware",
    "tomshardware.com": "Tom's Hardware",
    "anandtech.com": "AnandTech",
    "digitimes.com": "DigiTimes",
    "venturebeat.com": "VentureBeat",
    "9to5mac.com": "9to5Mac",
    "macrumors.com": "MacRumors",
    "appleinsider.com": "AppleInsider",
    "androidauthority.com": "Android Authority",
    "xda-developers.com": "XDA Developers",
    "mentalfloss.com": "Mental Floss",
    // UN / international bodies
    "un.org": "United Nations",
    "imf.org": "IMF",
    "worldbank.org": "World Bank",
    "olympic.org": "IOC",
    "olympics.com": "Olympics.com",
    // Misc
    "reddit.com": "Reddit",
    "twitter.com": "Twitter / X",
    "x.com": "Twitter / X",
    "youtube.com": "YouTube",
    "medium.com": "Medium",
    "substack.com": "Substack",
    "archive.org": "Internet Archive",
    "wolframalpha.com": "Wolfram Alpha",
};

const ACRONYM_FORMAT_MAP: Record<string, string> = {
    nasa: "NASA",
    esa: "ESA",
    nih: "NIH",
    cdc: "CDC",
    noaa: "NOAA",
    isls: "ISLS",
    ncse: "NCSE",
    ndtv: "NDTV",
    cnn: "CNN",
    bbc: "BBC",
    abc: "ABC",
    nbc: "NBC",
    cbs: "CBS",
    pbs: "PBS",
    npr: "NPR",
    ani: "ANI",
    cnet: "CNET",
    zdnet: "ZDNet",
    bfi: "BFI",
    imdb: "IMDb",
    who: "WHO",
    imf: "IMF",
    ioc: "IOC",
    un: "UN",
    eu: "EU",
    nato: "NATO",
    fbi: "FBI",
    cia: "CIA",
    nsa: "NSA",
    // Branded names with non-standard capitalisation
    mentalfloss: "Mental Floss",
    hothardware: "HotHardware",
    anandtech: "AnandTech",
    techcrunch: "TechCrunch",
    venturebeat: "VentureBeat",
    macrumors: "MacRumors",
    appleinsider: "AppleInsider",
    androidauthority: "Android Authority",
    sciencedaily: "Science Daily",
    newscientist: "New Scientist",
    scientificamerican: "Scientific American",
    nationalgeographic: "National Geographic",
    smithsonianmag: "Smithsonian",
    livescience: "Live Science",
    healthline: "Healthline",
    webmd: "WebMD",
    wolframalpha: "Wolfram Alpha",
    phys: "Phys.org",
    arxiv: "arXiv",
};

export function getFriendlySourceName(url: string): string {
    if (!url) return "N/A";
    try {
        const hostname = new URL(url).hostname.replace(/^www\./, "");
        // 1. Try the full hostname map first
        for (const [key, label] of Object.entries(SOURCE_LABEL_MAP)) {
            if (hostname === key || hostname.endsWith("." + key)) return label;
        }
        // 2. Extract the base domain word (e.g. 'cnet' from 'cnet.com')
        const parts = hostname.split(".");
        const base = parts.length >= 2 ? parts[parts.length - 2] : hostname;
        // 3. Check acronym / brand map (case-insensitive)
        const formatted = ACRONYM_FORMAT_MAP[base.toLowerCase()];
        if (formatted) return formatted;
        // 4. Final fallback: title-case
        return base.charAt(0).toUpperCase() + base.slice(1);
    } catch {
        return url;
    }
}
