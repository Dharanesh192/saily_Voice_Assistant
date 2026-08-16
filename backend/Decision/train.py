import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report


DATASET = "saily_nn_dataset_v7.csv"
MODEL_PATH = "backend/Decision/saily_model.pkl"


# -----------------------------
# Load dataset
# -----------------------------

df = pd.read_csv(DATASET)

X = df["sentence"].astype(str)
y = df["keyword"].astype(str)


# -----------------------------
# Split dataset
# -----------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# -----------------------------
# TF-IDF + Neural Network
# -----------------------------

model = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 3),
            max_features=10000,
            sublinear_tf=True
        )
    ),

    (
        "nn",
        MLPClassifier(
            hidden_layer_sizes=(64, 32),
            activation="relu",
            solver="adam",
            max_iter=1000,
            random_state=42,
            early_stopping=False
        )
    )
])


# -----------------------------
# Train
# -----------------------------

print("Training Saily NN...")

model.fit(X_train, y_train)


# -----------------------------
# Test
# -----------------------------

predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print()
print("Accuracy:", accuracy)
print()
print(classification_report(y_test, predictions))


# -----------------------------
# Save
# -----------------------------

joblib.dump(model, MODEL_PATH)

print()
print("Model saved to:")
print(MODEL_PATH)