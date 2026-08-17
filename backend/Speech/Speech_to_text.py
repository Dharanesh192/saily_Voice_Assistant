import sounddevice as sd
import numpy as np
from scipy.io.wavfile import write
from faster_whisper import WhisperModel
from backend.Decision.predict import predict_command
import time

SAMPLE_RATE = 16000
CHANNELS = 1

SILENCE_DURATION = 2
BLOCK_DURATION = 0.1
THRESHOLD = 0.01

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
# Record dynamically
# -----------------------------

def record_audio():

    print("\nListening...")

    audio_data = []
    silence_start = None
    speech_started = False

    block_size = int(SAMPLE_RATE * BLOCK_DURATION)

    with sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=CHANNELS,
        dtype="float32"
    ) as stream:

        while True:

            audio, overflowed = stream.read(block_size)

            # Calculate volume
            volume = np.sqrt(np.mean(audio ** 2))

            audio_data.append(audio.copy())

            # User is speaking
            if volume > THRESHOLD:

                speech_started = True
                silence_start = None

                print("Speaking...", end="\r")

            # User is silent
            else:

                if speech_started:

                    if silence_start is None:
                        silence_start = time.time()

                    silence_time = time.time() - silence_start

                    print(
                        f"Silence: {silence_time:.1f}s",
                        end="\r"
                    )

                    if silence_time >= SILENCE_DURATION:
                        break

    print("\nRecording finished.")

    audio_data = np.concatenate(audio_data)

    write(
        AUDIO_FILE,
        SAMPLE_RATE,
        (audio_data * 32767).astype(np.int16)
    )

    return AUDIO_FILE


# -----------------------------
# Speech to Text
# -----------------------------

audio_file = record_audio()

print("\nTranscribing...")

segments, info = model.transcribe(
    audio_file,
    language="en",
    beam_size=5,
    vad_filter=True
)

text = " ".join(
    segment.text.strip()
    for segment in segments
)

print("\nDetected language:", info.language)
print("Probability:", info.language_probability)

print("\nYou said:")
print(text,"\n")

predict_command(text)
