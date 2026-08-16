import sounddevice as sd
from scipy.io.wavfile import write
from faster_whisper import WhisperModel
from backend.Decision.predict import predict_command

# -----------------------------
# Settings
# -----------------------------

SAMPLE_RATE = 16000
RECORD_SECONDS = 8
AUDIO_FILE = "recorded_audio.wav"

# -----------------------------
# Load Whisper
# -----------------------------

print("Loading Whisper model...")

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)

print("Whisper loaded.")

# -----------------------------
# Record microphone
# -----------------------------

print(f"\nSpeak for {RECORD_SECONDS} seconds...")

audio = sd.rec(
    int(RECORD_SECONDS * SAMPLE_RATE),
    samplerate=SAMPLE_RATE,
    channels=1,
    dtype="int16"
)

sd.wait()

print("Recording finished.")

# Save recording
write(
    AUDIO_FILE,
    SAMPLE_RATE,
    audio
)

print("Audio saved.")

# -----------------------------
# Speech-to-text
# -----------------------------

print("\nTranscribing...")

segments, info = model.transcribe(
    AUDIO_FILE,
    beam_size=5
)

print("\nDetected language:", info.language)

print("\nYou said:")

text = ""

for segment in segments:
    text += segment.text

print(text)

if info.language == "en":
    predict_command(text)
else:
    print("Please speak in English.")