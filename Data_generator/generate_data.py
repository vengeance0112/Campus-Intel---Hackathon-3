import pandas as pd
import numpy as np

# -----------------------------
# Reproducibility
# -----------------------------
rng = np.random.default_rng(42)

# -----------------------------
# Configuration
# -----------------------------
N = 10000

CONFIG = {
    "base_attendance": (70, 115),
    "relevance_penalty": (24, 32),
    "schedule_penalty": (22, 28),
    "fatigue_penalty": (18, 26),
    "promotion_penalty": (14, 22),
    "social_penalty": (8, 16),
    "format_penalty": (12, 20),

    "certificate_bonus": (18, 26),
    "interactivity_bonus": (26, 38),
    "promotion_bonus": (10, 18),

    "weekday_evening_penalty": (12, 18),
    "industry_bonus": (8, 16),
    "popular_domain_bonus": (5, 12),

    "interaction_strength": (1.0, 1.5),
    "noise_std": (4, 8)
}

# -----------------------------
# Helper function
# -----------------------------
def make_ohe(base, size=N):
    r = rng.integers(1, 6, size)
    d = {}
    for k in range(1, 6):
        d[f"{base}_{k}"] = (r == k).astype(int)
    return d, r

# -----------------------------
# Event Attributes
# -----------------------------
domains = rng.choice(
    ["Tech", "Law", "Design", "Music", "Business"],
    p=[0.30, 0.18, 0.17, 0.15, 0.20],
    size=N
)

event_types = rng.choice(
    ["Workshop", "Guest_Lecture", "Career_Talk"],
    p=[0.45, 0.35, 0.20],
    size=N
)

speaker_types = rng.choice(
    ["Industry", "Faculty", "Alumni"],
    p=[0.45, 0.40, 0.15],
    size=N
)

duration_hours = rng.choice(
    [1, 1.5, 2, 2.5],
    p=[0.35, 0.30, 0.25, 0.10],
    size=N
)

day_type = rng.choice(
    ["Weekday", "Weekend"],
    p=[0.72, 0.28],
    size=N
)

time_slot = rng.choice(
    ["Morning", "Afternoon", "Evening"],
    p=[0.25, 0.40, 0.35],
    size=N
)

promotion_days = rng.integers(1, 15, N)

certificate_flag = rng.choice(
    [0, 1],
    p=[0.6, 0.4],
    size=N
)

interactivity_level = rng.uniform(0, 1, N)

# -----------------------------
# Friction Variables
# -----------------------------
relevance_ohe, relevance_raw = make_ohe("Relevance_Friction")
schedule_ohe, schedule_raw = make_ohe("Schedule_Friction")
fatigue_ohe, fatigue_raw = make_ohe("Fatigue_Friction")
promotion_ohe, promotion_raw = make_ohe("Promotion_Friction")
social_ohe, social_raw = make_ohe("Social_Friction")
format_ohe, format_raw = make_ohe("Format_Friction")

# -----------------------------
# Build dataframe
# -----------------------------
df = pd.DataFrame({
    "Domain": domains,
    "Event_Type": event_types,
    "Speaker_Type": speaker_types,
    "Duration_Hours": duration_hours,
    "Day_Type": day_type,
    "Time_Slot": time_slot,
    "Promotion_Days": promotion_days,
    "Certificate_Flag": certificate_flag,
    "Interactivity_Level": interactivity_level
})

# Attach OHE blocks
for block in [
    relevance_ohe,
    schedule_ohe,
    fatigue_ohe,
    promotion_ohe,
    social_ohe,
    format_ohe
]:
    for k, v in block.items():
        df[k] = v

# -----------------------------
# Attendance Score Calculation
# -----------------------------
base_attendance = rng.integers(*CONFIG["base_attendance"], N)
score = base_attendance.astype(float)

def scale(raw, wt):
    return (raw - 1) / 4 * wt

# Dynamic penalty weights
relevance_w = rng.integers(*CONFIG["relevance_penalty"])
schedule_w = rng.integers(*CONFIG["schedule_penalty"])
fatigue_w = rng.integers(*CONFIG["fatigue_penalty"])
promotion_w = rng.integers(*CONFIG["promotion_penalty"])
social_w = rng.integers(*CONFIG["social_penalty"])
format_w = rng.integers(*CONFIG["format_penalty"])

# Apply friction penalties
score -= scale(relevance_raw, relevance_w)
score -= scale(schedule_raw, schedule_w)
score -= scale(fatigue_raw, fatigue_w)
score -= scale(promotion_raw, promotion_w)
score -= scale(social_raw, social_w)
score -= scale(format_raw, format_w)

# Bonuses
certificate_bonus = rng.integers(*CONFIG["certificate_bonus"])
interactivity_bonus = rng.integers(*CONFIG["interactivity_bonus"])
promotion_bonus = rng.integers(*CONFIG["promotion_bonus"])

score += certificate_flag * certificate_bonus
score += interactivity_level * interactivity_bonus
score += (promotion_days > 7).astype(int) * promotion_bonus

# Interaction effects
interaction_strength = rng.uniform(*CONFIG["interaction_strength"])
score += interactivity_level * promotion_days * interaction_strength

# Contextual effects
weekday_evening_penalty = rng.integers(*CONFIG["weekday_evening_penalty"])
industry_bonus = rng.integers(*CONFIG["industry_bonus"])
popular_domain_bonus = rng.integers(*CONFIG["popular_domain_bonus"])

score -= ((day_type == "Weekday") & (time_slot == "Evening")).astype(int) * weekday_evening_penalty
score += (speaker_types == "Industry").astype(int) * industry_bonus
score += ((domains == "Tech") | (domains == "Business")).astype(int) * popular_domain_bonus

# Noise
noise_std = rng.uniform(*CONFIG["noise_std"])
score += rng.normal(0, noise_std, N)

# -----------------------------
# Final Attendance
# -----------------------------
df["Expected_Attendance"] = np.clip(score.astype(int), 10, None)

# Engagement category
z = (df["Expected_Attendance"] - df["Expected_Attendance"].min()) / (
    df["Expected_Attendance"].max() - df["Expected_Attendance"].min()
)

df["Engagement_Level"] = np.where(
    z < 0.33,
    "Low",
    np.where(z < 0.66, "Medium", "High")
)

# -----------------------------
# Export Dataset
# -----------------------------
df.to_csv("Campus_Event_Engagement_Synthetic.csv", index=False)

print("Dataset generated successfully.")
print(f"Rows generated: {len(df)}")