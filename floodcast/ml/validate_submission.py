"""predictions.csv validator — Brief §5 rejection rules, enforced exactly.
Usage: python validate_submission.py [predictions.csv] [test.csv]
Exit code 0 = valid, 1 = invalid (with reasons)."""
import sys
import pandas as pd


def validate(pred_path: str, test_path: str | None = None):
    errors, warnings = [], []
    try:
        raw = open(pred_path, "rb").read()
        raw.decode("utf-8")
    except Exception as e:
        return [f"File is not valid UTF-8 CSV: {e}"], warnings, None
    try:
        pred = pd.read_csv(pred_path, dtype={"station_id": str})
    except Exception as e:
        return [f"Cannot parse CSV: {e}"], warnings, None

    if list(pred.columns) != ["station_id", "date", "discharge_cfs"]:
        errors.append(f"Columns must be exactly [station_id, date, discharge_cfs] "
                      f"in this order; got {list(pred.columns)}")
        return errors, warnings, pred
    pred["station_id"] = pred["station_id"].astype(str).str.zfill(8)
    if pred["discharge_cfs"].isna().any():
        errors.append(f"{int(pred['discharge_cfs'].isna().sum())} blank/NaN predictions")
    if (pred["discharge_cfs"] < 0).any():
        errors.append(f"{int((pred['discharge_cfs'] < 0).sum())} negative predictions")
    if pred.duplicated(["station_id", "date"]).any():
        errors.append("Duplicate station_id+date rows found")
    try:
        pd.to_datetime(pred["date"])
    except Exception:
        errors.append("Unparseable dates in `date` column")

    if test_path:
        test = pd.read_csv(test_path, dtype={"station_id": str})
        test["station_id"] = test["station_id"].astype(str).str.zfill(8)
        if len(pred) != len(test):
            errors.append(f"Row count {len(pred)} != test.csv rows {len(test)}")
        pk = set(zip(pred.station_id, pred.date.astype(str)))
        tk = set(zip(test.station_id, test.date.astype(str)))
        if tk - pk:
            errors.append(f"{len(tk - pk)} station/date pairs from test.csv missing")
        if pk - tk:
            errors.append(f"{len(pk - tk)} station/date pairs not present in test.csv")
    if (pred["discharge_cfs"] == 0).mean() > 0.5:
        warnings.append(">50% zero predictions — did the model actually run?")
    return errors, warnings, pred


if __name__ == "__main__":
    p = sys.argv[1] if len(sys.argv) > 1 else "floodcast/outputs/predictions.csv"
    t = sys.argv[2] if len(sys.argv) > 2 else None
    errs, warns, df = validate(p, t)
    for w in warns:
        print(f"⚠ {w}")
    if errs:
        print("❌ INVALID predictions.csv:")
        [print(f"  - {e}") for e in errs]
        sys.exit(1)
    print(f"✅ VALID: {len(df)} rows, columns OK, non-negative, UTF-8 ({p})")
