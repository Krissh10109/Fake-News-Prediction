"""
Shared Configuration for Fake News Detection Backend
=====================================================
Single source of truth for all shared constants.
Prevents duplication across app.py, model.py, train_model.py, and test files.
"""

# --- API Configuration ---
MODEL_VERSION = "1.0"
DATASET_NAME = "Kaggle Fake News Dataset"
MIN_TEXT_LENGTH = 20

# --- Confidence Thresholds (FROZEN FOR ACADEMIC STABILITY) ---
# High threshold: Requires strong confidence to label as REAL/FAKE
# Low threshold: Below this, route to NEEDS VERIFICATION for safety
CONFIDENCE_THRESHOLD_HIGH = 0.72
CONFIDENCE_THRESHOLD_LOW = 0.58

# --- Extreme Claim Keywords ---
# Claims containing these words trigger mandatory verification
EXTREME_CLAIM_KEYWORDS = [
    "dead", "died", "death", "killed", "murder", "assassinated",
    "arrested", "arrest", "prison", "jail",
    "war", "invasion", "attack", "bombing", "missile",
    "pandemic", "outbreak", "epidemic", "disaster",
    "coup", "revolution", "martial law",
    "bankruptcy", "collapse", "crash", "scandal"
]

# --- Trusted News Sources ---
TRUSTED_SOURCES = [
    "bbc.com", "bbc.co.uk", "reuters.com", "apnews.com",
    "npr.org", "theguardian.com", "nytimes.com",
    "thehindu.com", "ndtv.com", "indianexpress.com",
    "gov", "edu", "who.int", "un.org"
]

# --- Stopwords ---
# Common English words removed during text preprocessing.
# Must be consistent across training and inference.
STOPWORDS = {
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
    'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
    'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
    'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
    'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
    'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to',
    'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can',
    'will', 'just', 'don', 'should', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y',
    'ain', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn',
    'ma', 'mightn', 'mustn', 'needn', 'shan', 'shouldn', 'wasn', 'weren',
    'won', 'wouldn', 'said', 'says', 'would', 'could', 'also', 'one', 'two'
}
