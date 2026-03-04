import pandas as pd
import numpy as np

# reproducibility
rng = np.random.default_rng(42)

# number of synthetic events
N = 5000


def make_ohe(base, size=N):
    r = rng.integers(1, 6, size)
    d = {}
    for k in range(1, 6):
        d[f"{base}_{k}"] = (r == k).astype(int)
    return d, r


# domains in the university
domains = rng.choice(
    ["Tech", "Law", "Design", "Music", "Business"],
    p=[0.30, 0.18, 0.17, 0.15, 0.20],
    size=N
)

# event types
event_types = rng.choice(
    ["Workshop", "Guest_Lecture", "Career_Talk"],
    p=[0.45, 0.35, 0.20],
    size=N
)

# speaker types
speaker_types = rng.choice(
    ["Industry", "Faculty", "Alumni"],
    p=[0.45, 0.40, 0.15],
    size=N
)

# duration in hours
duration_hours = rng.choice([1, 1.5, 2, 2.5], p=[0.35, 0.30, 0.25, 0.10], size=N)

# day and time
day_type = rng.choice(["Weekday", "Weekend"], p=[0.72, 0.28], size=N)
time_slot = rng.choice(["Morning", "Afternoon", "Evening"], p=[0.25, 0.40, 0.35], size=N)

# promotion and incentives
promotion_days = rng.integers(1, 15, N)
certificate_flag = rng.choice([0, 1], p=[0.6, 0.4], size=N)

# interactivity (continuous 0–1)
interactivity_level = rng.uniform(0, 1, N)


# Likert-based engagement frictions
relevance_ohe, relevance_raw = make_ohe("Relevance_Friction")
schedule_ohe, schedule_raw = make_ohe("Schedule_Friction")
fatigue_ohe, fatigue_raw = make_ohe("Fatigue_Friction")
promotion_ohe, promotion_raw = make_ohe("Promotion_Friction")
social_ohe, social_raw = make_ohe("Social_Friction")
format_ohe, format_raw = make_ohe("Format_Friction")


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

# attach OHE blocks
for block in [relevance_ohe, schedule_ohe, fatigue_ohe,
              promotion_ohe, social_ohe, format_ohe]:
    for k, v in block.items():
        df[k] = v


# base attendance
base_attendance = rng.integers(70, 115, N)
score = base_attendance.astype(float)


def scale(raw, wt):
    return (raw - 1) / 4 * wt


# random friction weights (instead of fixed constants)
relevance_weight = rng.integers(24, 32)
schedule_weight = rng.integers(22, 30)
fatigue_weight = rng.integers(18, 26)
promotion_weight = rng.integers(14, 22)
social_weight = rng.integers(8, 16)
format_weight = rng.integers(10, 18)


# penalties (from survey frictions)
score -= scale(relevance_raw, relevance_weight)
score -= scale(schedule_raw, schedule_weight)
score -= scale(fatigue_raw, fatigue_weight)
score -= scale(promotion_raw, promotion_weight)
score -= scale(social_raw, social_weight)
score -= scale(format_raw, format_weight)


# randomized bonuses
certificate_bonus = rng.integers(18, 26)
interactivity_bonus = rng.integers(28, 36)
promotion_bonus = rng.integers(10, 18)

score += certificate_flag * certificate_bonus
score += interactivity_level * interactivity_bonus
score += (promotion_days > 7).astype(int) * promotion_bonus


# interaction effects
interaction_weight = rng.uniform(1.0, 1.5)
score += interactivity_level * promotion_days * interaction_weight


# contextual effects
weekday_evening_penalty = rng.integers(12, 20)
industry_speaker_bonus = rng.integers(8, 15)

score -= ((day_type == "Weekday") & (time_slot == "Evening")).astype(int) * weekday_evening_penalty
score += ((speaker_types == "Industry")).astype(int) * industry_speaker_bonus


# domain popularity boost
domain_boost = rng.integers(6, 12)
score += ((domains == "Tech") | (domains == "Business")).astype(int) * domain_boost


# noise (human uncertainty)
score += rng.normal(0, 6, N)


# final attendance
df["Expected_Attendance"] = np.clip(score.astype(int), 10, None)


# normalize attendance to derive engagement level
z = (df["Expected_Attendance"] - df["Expected_Attendance"].min()) / (
    df["Expected_Attendance"].max() - df["Expected_Attendance"].min()
)

df["Engagement_Level"] = np.where(
    z < 0.33, "Low",
    np.where(z < 0.66, "Medium", "High")
)


df.to_csv("Campus_Event_Engagement_Synthetic.csv", index=False)

print("Dataset generated successfully.")
